from src.backend.db import fetch_rows, get_conn
from src.backend.models.ride import MemberCasual, RideableType
from src.backend.models.station_stats.flow_counts import GroupedStationFlowCounts, StationFlowCounts
from src.backend.services.sql.spine import HOURS_CTE, month_range_bounds

def get_trips_between_stations_stats(
    start_year: int,
    start_month: int,
    end_year: int,
    end_month: int,
    user_type: MemberCasual | None = None,
    bike_type: RideableType | None = None,
    station_id: str | None = None,
    limit: int = 100,
) -> list[StationFlowCounts]:
    """Fetch aggregated counts of trips between station pairs in the given month range,
    following the shared spine pattern: a calendar hours CTE provides hours_count and
    the top pairs are selected in SQL."""
    spine_start, spine_end = month_range_bounds(start_year, start_month, end_year, end_month)

    filters = ["(fam.year, fam.month) >= (%s, %s)", "(fam.year, fam.month) <= (%s, %s)"]
    filter_params: list = [start_year, start_month, end_year, end_month]
    if station_id is not None:
        filters.append("(fam.station_a_id = %s OR fam.station_b_id = %s)")
        filter_params.extend([station_id, station_id])
    if user_type is not None:
        filters.append("fam.user_type = %s")
        filter_params.append(user_type.value)
    if bike_type is not None:
        filters.append("fam.bike_type = %s")
        filter_params.append(bike_type.value)

    sql = f"""
        WITH {HOURS_CTE},
        spine AS (
            SELECT COUNT(*) AS hours_count
            FROM hours
        )
        SELECT fam.station_a_id,
               sm_a.station_name AS station_a_name,
               sm_a.lat AS station_a_lat, sm_a.lon AS station_a_lon,
               fam.station_b_id,
               sm_b.station_name AS station_b_name,
               sm_b.lat AS station_b_lat, sm_b.lon AS station_b_lon,
               SUM(fam.a_to_b_count) AS a_to_b_count,
               SUM(fam.b_to_a_count) AS b_to_a_count,
               SUM(fam.a_to_b_count + fam.b_to_a_count) AS total_rides,
               s.hours_count
        FROM flow_activity_monthly fam
        JOIN station_metadata sm_a ON sm_a.station_id = fam.station_a_id
        JOIN station_metadata sm_b ON sm_b.station_id = fam.station_b_id
        CROSS JOIN spine s
        WHERE {" AND ".join(filters)}
        GROUP BY fam.station_a_id, fam.station_b_id,
                 sm_a.station_name, sm_a.lat, sm_a.lon,
                 sm_b.station_name, sm_b.lat, sm_b.lon,
                 s.hours_count
        ORDER BY total_rides DESC, fam.station_a_id, fam.station_b_id
        LIMIT %s
    """
    params = (spine_start, spine_end, *filter_params, limit)

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = fetch_rows(cur)

    return [
        StationFlowCounts(
            station_a_id=r["station_a_id"],
            station_a_name=r["station_a_name"],
            station_a_lat=r["station_a_lat"],
            station_a_lon=r["station_a_lon"],
            station_b_id=r["station_b_id"],
            station_b_name=r["station_b_name"],
            station_b_lat=r["station_b_lat"],
            station_b_lon=r["station_b_lon"],
            groups=[
                GroupedStationFlowCounts(
                    day_of_week=None,
                    hour=None,
                    a_to_b_count=int(r.get("a_to_b_count") or 0),
                    b_to_a_count=int(r.get("b_to_a_count") or 0),
                    total_rides=int(r.get("total_rides") or 0),
                    hours_count=int(r["hours_count"]),
                )
            ],
        )
        for r in rows
    ]
