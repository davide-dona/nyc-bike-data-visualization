from itertools import product

from src.backend.db import fetch_rows, get_conn
from src.backend.models.params import DateRange, RideFilters
from src.backend.models.ride_stats import GroupedStats, Stats, StatsGroupBy, WeatherVariable

from src.backend.services.sql.query_builder import Filters, SpineQueryBuilder

# Time dimensions selected by each group_by option. Every dimension exists in the
# hours spine, so the spine can be built generically.
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
    date_range: DateRange,
    filters: RideFilters,
    group_by: StatsGroupBy = StatsGroupBy.NONE,
    weather_var: WeatherVariable | None = None,
) -> Stats | list[GroupedStats]:
    """Fetch aggregated stats for rides in the given date range, optionally grouped by time dimensions and/or weather.

    The query follows the shared spine pattern at hour grain: a calendar-generated
    hours CTE is labelled with the requested dimensions, per-hour ride aggregates
    are LEFT JOINed to it (so hours without rides still count with zero totals),
    and the final SELECT groups by the dimensions — which lets it also compute the
    per-hour std aggregates behind the *_std fields.
    """
    spine_start, spine_end = date_range.bounds()
    dims = _GROUP_DIMS[group_by]

    f = Filters()
    f.add("sh.date >= %s", spine_start)
    f.add("sh.date < %s", spine_end)
    if filters.user_type is not None:
        f.add("sh.user_type = %s", filters.user_type.value)
    if filters.bike_type is not None:
        f.add("sh.bike_type = %s", filters.bike_type.value)

    # The spine always keeps (date, hour) so per-hour ride facts can be joined back;
    # dims that coincide with the join columns must not be selected twice.
    spine_cols = ["h.date", "h.hour"] + [f"h.{d}" for d in dims if d not in ("date", "hour")]
    if weather_var is not None:
        # Weather buckets need the weather table: each spine hour is labelled with
        # its weather bucket. Ride facts in hours without weather data find no
        # spine row, so they are excluded just as before.
        expr, weather_name, src_col = _WEATHER_EXPRS[weather_var]
        spine_cols.append(f"{expr} AS {weather_name}")
        spine_from = (
            "FROM hours h JOIN weather_hourly w ON w.date = h.date AND w.hour = h.hour "
            f"WHERE {src_col} IS NOT NULL"
        )
        out_dims = dims + [weather_name]
    else:
        spine_from = "FROM hours h"
        out_dims = list(dims)

    out_select = ", ".join(f"s.{d}" for d in out_dims)
    group_order = f"GROUP BY {out_select} ORDER BY {out_select}" if out_dims else ""

    # The std fields measure hour-to-hour spread: rides_per_hour_std over all spine
    # hours (zero-ride hours included, matching the rides-per-hour mean), and
    # average_speed_kmh_std over the unweighted per-hour mean speeds — a slightly
    # different center than the duration-weighted average_speed_kmh. STDDEV_SAMP
    # is NULL for fewer than two contributing hours.
    q = SpineQueryBuilder(spine_start, spine_end)
    q.add_cte("spine", f"SELECT {', '.join(spine_cols)} {spine_from}")
    q.add_cte("rides", f"""
            SELECT sh.date, sh.hour,
                   SUM(sh.total_rides) AS total_rides,
                   SUM(sh.total_duration_seconds) AS total_duration_seconds,
                   SUM(sh.total_distance_km) AS total_distance_km
            FROM stats_hourly sh
            WHERE {f.where_sql}
            GROUP BY sh.date, sh.hour
        """, f.params)
    q.final(f"""
        SELECT {", ".join(filter(None, [out_select,
                                        "SUM(COALESCE(r.total_rides, 0)) AS total_rides",
                                        "SUM(COALESCE(r.total_duration_seconds, 0)) AS total_duration_seconds",
                                        "SUM(COALESCE(r.total_distance_km, 0)) AS total_distance_km",
                                        "COUNT(*) AS hours_count",
                                        "COUNT(*) FILTER (WHERE r.total_duration_seconds > 0) AS hours_with_rides",
                                        "STDDEV_SAMP(COALESCE(r.total_rides, 0))::float8 AS rides_per_hour_std",
                                        "STDDEV_SAMP(CASE WHEN r.total_duration_seconds > 0"
                                        " THEN r.total_distance_km / (r.total_duration_seconds / 3600.0)"
                                        " END)::float8 AS average_speed_kmh_std"]))}
        FROM spine s
        LEFT JOIN rides r ON r.date = s.date AND r.hour = s.hour
        {group_order}
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
    rides_std   = r.get("rides_per_hour_std")
    speed_std   = r.get("average_speed_kmh_std")
    return dict(
        total_rides=total_rides,
        hours_count=hours_count,
        hours_with_rides=int(r.get("hours_with_rides") or 0),
        average_duration_seconds=total_dur / total_rides if total_rides else 0.0,
        average_distance_km=total_dist / total_rides if total_rides else 0.0,
        total_duration_seconds=total_dur,
        total_distance_km=total_dist,
        average_speed_kmh=(total_dist / (total_dur / 3600)) if total_dur > 0 else 0.0,
        rides_per_hour_std=float(rides_std) if rides_std is not None else None,
        average_speed_kmh_std=float(speed_std) if speed_std is not None else None,
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
        total_rides=0, hours_count=0, hours_with_rides=0,
        average_duration_seconds=0.0, average_distance_km=0.0,
        total_duration_seconds=0.0, total_distance_km=0.0,
        average_speed_kmh=0.0,
        rides_per_hour_std=None, average_speed_kmh_std=None,
    )
