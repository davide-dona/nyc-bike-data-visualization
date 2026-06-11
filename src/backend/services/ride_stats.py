from datetime import date
from itertools import product

from src.backend.db import fetch_rows, get_conn
from src.backend.models.ride import MemberCasual, RideableType
from src.backend.models.ride_stats import GroupedStats, Stats, StatsGroupBy, WeatherVariable

from src.backend.services.sql.query_builder import (
    Filters,
    SpineQueryBuilder,
    dims_join_condition,
    spine_cte_sql,
)
from src.backend.services.sql.spine import date_range_bounds

# Time dimensions selected by each group_by option. Every dimension exists both in
# the hours spine and in stats_hourly, so spine and facts can be built generically.
_GROUP_DIMS: dict[StatsGroupBy, list[str]] = {
    StatsGroupBy.NONE: [],
    StatsGroupBy.DATE: ["date"],
    StatsGroupBy.DAY_OF_WEEK: ["day_of_week"],
    StatsGroupBy.HOUR: ["hour"],
    StatsGroupBy.DAY_OF_WEEK_AND_HOUR: ["day_of_week", "hour"],
}

# Bucketing expression over the weather_hourly alias `w`, the output column name,
# and the source column whose NULLs exclude an hour from the spine and facts.
# Numeric bins are encoded as their lower edge: temperature in 2 °C steps,
# precipitation in dry/trace/light/moderate/heavy buckets (mm/h) since uniform
# bins would put nearly all hours in the dry bucket.
_WEATHER_EXPRS: dict[WeatherVariable, tuple[str, str, str]] = {
    WeatherVariable.WEATHER_CODE: ("w.weather_code", "weather_code", "w.weather_code"),
    WeatherVariable.TEMPERATURE: ("(floor(w.temperature_2m / 2)::int * 2)", "weather_bin", "w.temperature_2m"),
    WeatherVariable.PRECIPITATION: (
        "(CASE WHEN w.precipitation <= 0 THEN 0.0"
        " WHEN w.precipitation < 0.5 THEN 0.1"
        " WHEN w.precipitation < 2.5 THEN 0.5"
        " WHEN w.precipitation < 7.6 THEN 2.5"
        " ELSE 7.6 END)", "weather_bin", "w.precipitation"),
}

def get_stats_data(
    start_date: date,
    end_date: date,
    group_by: StatsGroupBy = StatsGroupBy.NONE,
    user_type: MemberCasual | None = None,
    bike_type: RideableType | None = None,
    weather_var: WeatherVariable | None = None,
) -> Stats | list[GroupedStats]:
    """Fetch aggregated stats for rides in the given date range, optionally grouped by time dimensions and/or weather.

    The query follows the shared spine pattern: a calendar-generated hours CTE is
    bucketed by the requested dimensions (yielding hours_count per bucket), ride
    aggregates are computed per bucket, and the two are LEFT JOINed so buckets
    without rides still appear with zero totals.
    """
    spine_start, spine_end = date_range_bounds(start_date, end_date)
    dims = _GROUP_DIMS[group_by]

    f = Filters()
    f.add("sh.date >= %s", spine_start)
    f.add("sh.date < %s", spine_end)
    if user_type is not None:
        f.add("sh.user_type = %s", user_type.value)
    if bike_type is not None:
        f.add("sh.bike_type = %s", bike_type.value)

    if weather_var is not None:
        # Weather buckets need the weather table: each spine hour is labelled with
        # its weather bucket, and rides are joined to weather the same way.
        expr, weather_name, src_col = _WEATHER_EXPRS[weather_var]
        weather_col = f"{expr} AS {weather_name}"
        spine_cols = [f"h.{d}" for d in dims] + [weather_col]
        spine_from = (
            "FROM hours h JOIN weather_hourly w ON w.date = h.date AND w.hour = h.hour "
            f"WHERE {src_col} IS NOT NULL"
        )
        fact_cols = [f"sh.{d}" for d in dims] + [weather_col]
        fact_join = "JOIN weather_hourly w ON w.date = sh.date AND w.hour = sh.hour"
        f.add(f"{src_col} IS NOT NULL")
    else:
        spine_cols = [f"h.{d}" for d in dims]
        spine_from = "FROM hours h"
        fact_cols = [f"sh.{d}" for d in dims]
        fact_join = ""

    # Columns may be plain ("h.hour") or aliased ("<expr> AS weather_bin"):
    # output names come from the alias when present, GROUP BY uses the bare expression.
    out_dims = [c.split(" AS ")[-1].split(".")[-1] for c in spine_cols]
    fact_group = f"GROUP BY {', '.join(c.split(' AS ')[0] for c in fact_cols)}" if fact_cols else ""
    out_select = ", ".join(f"s.{d}" for d in out_dims)
    order_by = f"ORDER BY {out_select}" if out_dims else ""

    q = SpineQueryBuilder(spine_start, spine_end)
    q.add_cte("spine", spine_cte_sql(spine_cols, spine_from))
    q.add_cte("rides", f"""
            SELECT {", ".join([*fact_cols,
                               "SUM(sh.total_rides) AS total_rides",
                               "SUM(sh.total_duration_seconds) AS total_duration_seconds",
                               "SUM(sh.total_distance_km) AS total_distance_km"])}
            FROM stats_hourly sh {fact_join}
            WHERE {f.where_sql}
            {fact_group}
        """, f.params)
    q.final(f"""
        SELECT {", ".join(filter(None, [out_select,
                                        "COALESCE(r.total_rides, 0) AS total_rides",
                                        "COALESCE(r.total_duration_seconds, 0) AS total_duration_seconds",
                                        "COALESCE(r.total_distance_km, 0) AS total_distance_km",
                                        "s.hours_count"]))}
        FROM spine s
        LEFT JOIN rides r ON {dims_join_condition(out_dims, "r", "s")}
        {order_by}
    """)
    sql, params = q.render()

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = fetch_rows(cur)

    if group_by == StatsGroupBy.NONE and weather_var is None:
        # Spine and rides each collapse to a single row, so exactly one row exists.
        return _to_stats(rows[0], int(rows[0]["hours_count"]))

    grouped = [_to_grouped_stats(r, int(r["hours_count"])) for r in rows]
    if weather_var is not None and group_by != StatsGroupBy.NONE:
        grouped = _fill_weather_gaps(grouped, group_by, _WEATHER_EXPRS[weather_var][1])
    return grouped

def _derive_stats(r: dict, hours_count: int) -> dict:
    """Totals and derived averages shared by Stats and GroupedStats."""
    total_rides = int(r.get("total_rides") or 0)
    total_dur   = float(r.get("total_duration_seconds") or 0.0)
    total_dist  = float(r.get("total_distance_km") or 0.0)
    return dict(
        total_rides=total_rides,
        hours_count=hours_count,
        average_duration_seconds=total_dur / total_rides if total_rides else 0.0,
        average_distance_km=total_dist / total_rides if total_rides else 0.0,
        total_duration_seconds=total_dur,
        total_distance_km=total_dist,
        average_speed_kmh=(total_dist / (total_dur / 3600)) if total_dur > 0 else 0.0,
    )

def _to_stats(r: dict, hours_count: int) -> Stats:
    return Stats(**_derive_stats(r, hours_count))

def _to_grouped_stats(r: dict, hours_count: int) -> GroupedStats:
    return GroupedStats(
        day_of_week=r.get("day_of_week"),
        hour=r.get("hour"),
        weather_code=r.get("weather_code"),
        weather_bin=r.get("weather_bin"),
        date=r.get("date"),
        **_derive_stats(r, hours_count),
    )

# Full value range of each fillable time dimension; dimensions without a fixed
# range (date) cannot be gap-filled.
_DIM_RANGES = {"day_of_week": range(7), "hour": range(24)}

def _fill_weather_gaps(rows: list[GroupedStats], group_by: StatsGroupBy, weather_attr: str) -> list[GroupedStats]:
    """Add zero-stats rows for (weather bucket, time bucket) combos absent from the result."""
    dims = _GROUP_DIMS[group_by]
    if not dims or any(d not in _DIM_RANGES for d in dims):
        return rows

    def key(r: GroupedStats) -> tuple:
        return (getattr(r, weather_attr), *(getattr(r, d) for d in dims))

    existing = {key(r): r for r in rows}
    result = [
        existing.get((wc, *tk))
        or GroupedStats(**{weather_attr: wc}, **dict(zip(dims, tk)), **_zero_stats())
        for wc in {getattr(r, weather_attr) for r in rows}
        for tk in product(*(_DIM_RANGES[d] for d in dims))
    ]
    return sorted(result, key=key)

def _zero_stats() -> dict:
    return dict(
        total_rides=0, hours_count=0,
        average_duration_seconds=0.0, average_distance_km=0.0,
        total_duration_seconds=0.0, total_distance_km=0.0,
        average_speed_kmh=0.0,
    )
