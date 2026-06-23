import polars as pl

from src.ingestion.db.loaders.common import insert_rows

def insert_stats_hourly(conn, rides: pl.DataFrame) -> None:
    """Insert per-hour ride counts, total duration, and total distance into stats_hourly."""
    agg = (
        rides
        .group_by(["date", "hour", "day_of_week", "member_casual", "rideable_type"])
        .agg([
            pl.len().alias("total_rides"),
            pl.col("trip_duration_seconds").sum().alias("total_duration_seconds"),
            pl.col("distance_km").sum().alias("total_distance_km"),
        ])
    )

    rows = [
        (
            r["date"], r["hour"], r["day_of_week"], r["member_casual"], r["rideable_type"],
            int(r["total_rides"]),
            float(r["total_duration_seconds"] or 0.0),
            float(r["total_distance_km"] or 0.0),
        )
        for r in agg.iter_rows(named=True)
    ]

    insert_rows(
        conn,
        "stats_hourly",
        columns=["date", "hour", "day_of_week", "user_type", "bike_type",
                 "total_rides", "total_duration_seconds", "total_distance_km"],
        conflict_cols=["date", "hour", "user_type", "bike_type"],
        rows=rows,
    )
