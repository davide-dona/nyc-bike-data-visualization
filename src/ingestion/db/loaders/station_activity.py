"""Station activity loaders: full hourly granularity plus the three pre-aggregations
(by month, by hour-of-day, by day-of-week).

All four tables share the same shape — time dimensions, station_id, user/bike type,
outgoing/incoming counts — so each one is described by its time dimensions only and
built/inserted generically.
"""
import polars as pl

from src.ingestion.db.loaders.common import build_activity, insert_rows

_TIME_DIMS = {
    "station_activity_hourly":   ["year", "month", "day_of_week", "hour"],
    "station_activity_by_month": ["year", "month"],
    "station_activity_by_hour":  ["year", "month", "hour"],
    "station_activity_by_dow":   ["year", "month", "day_of_week"],
}

def _with_year_month(rides: pl.DataFrame) -> pl.DataFrame:
    return rides.with_columns([
        pl.col("date").dt.year().cast(pl.Int16).alias("year"),
        pl.col("date").dt.month().cast(pl.Int16).alias("month"),
    ])

def _insert_activity(conn, rides: pl.DataFrame, table: str) -> None:
    time_dims = _TIME_DIMS[table]
    activity = build_activity(rides, [*time_dims, "member_casual", "rideable_type"])
    rows = [
        (
            *(int(r[d]) for d in time_dims),
            r["station_id"], r["member_casual"], r["rideable_type"],
            int(r["outgoing_rides"]), int(r["incoming_rides"]),
        )
        for r in activity.iter_rows(named=True)
    ]
    columns = [*time_dims, "station_id", "user_type", "bike_type", "outgoing_rides", "incoming_rides"]
    insert_rows(conn, table, columns, conflict_cols=columns[:-2], rows=rows)

def insert_station_activity_hourly(conn, rides: pl.DataFrame) -> None:
    """Insert per-station outgoing/incoming ride counts grouped by (year, month, dow, hour, user, bike)."""
    _insert_activity(conn, _with_year_month(rides), "station_activity_hourly")

def insert_station_activity_preagg(conn, rides: pl.DataFrame) -> None:
    """Compute and insert all three station-activity pre-aggregations for one month."""
    rides = _with_year_month(rides)
    for table in ("station_activity_by_month", "station_activity_by_hour", "station_activity_by_dow"):
        _insert_activity(conn, rides, table)
