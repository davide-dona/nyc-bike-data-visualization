from src.backend.db import get_conn
from src.backend.models.ride import MemberCasual, RideableType
from src.backend.models.stats.station_ride_counts import GroupedStationRideCount, StationRideGroupBy, StationRideCounts
from src.backend.services.stats.utils import HOURS_CTE, fetch_rows, month_range_bounds

def get_station_ride_counts_stats(
    start_year: int,
    start_month: int,
    end_year: int,
    end_month: int,
    user_type: MemberCasual | None = None,
    bike_type: RideableType | None = None,
    station_id: str | None = None,
    day_of_week: int | None = None,
    group_by: StationRideGroupBy = StationRideGroupBy.NONE,
    limit: int = 100,
) -> list[StationRideCounts]:
    """Fetch per-station ride counts, following the shared spine pattern: a calendar
    hours CTE provides hours_count per bucket, ride aggregates are computed per
    station and bucket, and the top stations are selected in SQL."""
    spine_start, spine_end = month_range_bounds(start_year, start_month, end_year, end_month)

    # Pick the smallest pre-aggregated table that satisfies the query shape, the
    # time dimensions to bucket by, and whether the table has a day_of_week column.
    # Falls back to station_activity_hourly only when both day_of_week and hour are needed.
    if group_by == StationRideGroupBy.DAY_OF_WEEK_AND_HOUR:
        table, dims, has_dow_col = "station_activity_hourly", ["day_of_week", "hour"], True
    elif group_by == StationRideGroupBy.HOUR and day_of_week is not None:
        # Need to filter by dow AND group by hour — only the full table has both columns
        table, dims, has_dow_col = "station_activity_hourly", ["hour"], True
    elif group_by == StationRideGroupBy.HOUR:
        table, dims, has_dow_col = "station_activity_by_hour", ["hour"], False
    elif group_by == StationRideGroupBy.DAY_OF_WEEK:
        table, dims, has_dow_col = "station_activity_by_dow", ["day_of_week"], True
    elif day_of_week is not None:
        # NONE group_by with a dow filter: by_dow is small and has the column
        table, dims, has_dow_col = "station_activity_by_dow", [], True
    else:
        # NONE group_by, no dow filter: smallest possible table
        table, dims, has_dow_col = "station_activity_by_month", [], False

    # Fact-table filters, shared by the top-station selection and the bucketed select.
    filters = ["(sah.year, sah.month) >= (%s, %s)", "(sah.year, sah.month) <= (%s, %s)"]
    filter_params: list = [start_year, start_month, end_year, end_month]
    if station_id is not None:
        filters.append("sah.station_id = %s")
        filter_params.append(station_id)
    if user_type is not None:
        filters.append("sah.user_type = %s")
        filter_params.append(user_type.value)
    if bike_type is not None:
        filters.append("sah.bike_type = %s")
        filter_params.append(bike_type.value)
    if day_of_week is not None and has_dow_col:
        filters.append("sah.day_of_week = %s")
        filter_params.append(day_of_week)
    where = " AND ".join(filters)

    spine_where = "WHERE day_of_week = %s" if day_of_week is not None else ""
    spine_group = f"GROUP BY {', '.join(dims)}" if dims else ""
    spine_params: list = [spine_start, spine_end] + ([day_of_week] if day_of_week is not None else [])
    spine_join = (
        f"JOIN spine s ON {' AND '.join(f's.{d} = sah.{d}' for d in dims)}"
        if dims else "CROSS JOIN spine s"
    )
    dim_select = "".join(f", sah.{d}" for d in dims)

    sql = f"""
        WITH {HOURS_CTE},
        spine AS (
            SELECT {", ".join([*dims, "COUNT(*) AS hours_count"])}
            FROM hours
            {spine_where}
            {spine_group}
        ),
        top_stations AS (
            SELECT sah.station_id,
                   SUM(sah.outgoing_rides + sah.incoming_rides) AS station_total
            FROM {table} sah
            WHERE {where}
            GROUP BY sah.station_id
            ORDER BY station_total DESC
            LIMIT %s
        )
        SELECT sah.station_id, sm.station_name, sm.lat, sm.lon{dim_select},
               SUM(sah.outgoing_rides) AS outgoing_rides,
               SUM(sah.incoming_rides) AS incoming_rides,
               SUM(sah.outgoing_rides + sah.incoming_rides) AS total_rides,
               s.hours_count
        FROM {table} sah
        JOIN top_stations t ON t.station_id = sah.station_id
        JOIN station_metadata sm ON sm.station_id = sah.station_id
        {spine_join}
        WHERE {where}
        GROUP BY sah.station_id, sm.station_name, sm.lat, sm.lon, t.station_total{dim_select}, s.hours_count
        ORDER BY t.station_total DESC, sah.station_id{dim_select}
    """
    params = (*spine_params, *filter_params, limit, *filter_params)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = fetch_rows(cur)

    # Rows arrive ordered by station total; collect each station's buckets in order.
    stations: list[dict] = []
    by_station: dict[str, dict] = {}
    for r in rows:
        sid = r["station_id"]
        entry = by_station.get(sid)
        if entry is None:
            entry = {
                "station_id": sid,
                "station_name": r["station_name"],
                "lat": r["lat"],
                "lon": r["lon"],
                "groups": [],
            }
            by_station[sid] = entry
            stations.append(entry)
        entry["groups"].append(r)

    return [
        StationRideCounts(
            station_id=station["station_id"],
            station_name=station["station_name"],
            lat=station["lat"],
            lon=station["lon"],
            groups=[
                GroupedStationRideCount(
                    day_of_week=r.get("day_of_week"),
                    hour=r.get("hour"),
                    outgoing_rides=int(r.get("outgoing_rides") or 0),
                    incoming_rides=int(r.get("incoming_rides") or 0),
                    total_rides=int(r.get("total_rides") or 0),
                    hours_count=int(r.get("hours_count") or 0),
                )
                for r in _fill_station_groups(station["groups"], group_by)
            ],
        )
        for station in stations
    ]


def _fill_station_groups(groups: list[dict], group_by: StationRideGroupBy) -> list[dict]:
    if group_by == StationRideGroupBy.NONE:
        return groups

    if group_by == StationRideGroupBy.HOUR:
        all_keys = [(None, h) for h in range(24)]
        def row_key(r): return (None, r.get("hour"))
    elif group_by == StationRideGroupBy.DAY_OF_WEEK:
        all_keys = [(d, None) for d in range(7)]
        def row_key(r): return (r.get("day_of_week"), None)
    elif group_by == StationRideGroupBy.DAY_OF_WEEK_AND_HOUR:
        all_keys = [(d, h) for d in range(7) for h in range(24)]
        def row_key(r): return (r.get("day_of_week"), r.get("hour"))

    existing = {row_key(r): r for r in groups}
    result = []
    for dow, h in all_keys:
        k = (dow, h)
        result.append(existing.get(k) or {
            "day_of_week": dow, "hour": h,
            "outgoing_rides": 0, "incoming_rides": 0,
            "total_rides": 0, "hours_count": 0,
        })
    return result
