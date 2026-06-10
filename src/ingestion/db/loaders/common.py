"""Shared helpers for the per-table DB loaders."""
import logging

import polars as pl
from psycopg2.extras import execute_values

log = logging.getLogger(__name__)

def build_activity(rides: pl.DataFrame, group_cols: list[str]) -> pl.DataFrame:
    """Outer-join outgoing/incoming counts on `group_cols + station_id`."""
    outgoing = (
        rides.group_by([*group_cols, "start_station_id"])
        .agg(pl.len().alias("outgoing_rides"))
        .rename({"start_station_id": "station_id"})
    )
    incoming = (
        rides.group_by([*group_cols, "end_station_id"])
        .agg(pl.len().alias("incoming_rides"))
        .rename({"end_station_id": "station_id"})
    )
    return (
        outgoing.join(incoming, on=[*group_cols, "station_id"], how="full", coalesce=True)
        .with_columns([
            pl.col("outgoing_rides").fill_null(0),
            pl.col("incoming_rides").fill_null(0),
        ])
    )

def insert_rows(conn, table: str, columns: list[str], conflict_cols: list[str], rows: list[tuple]) -> None:
    """Batch-insert `rows` into `table`, skipping rows that hit the conflict key.

    Table and column names come from in-repo loader specs, never from user input,
    so interpolating them into the statement is safe.
    """
    with conn.cursor() as cur:
        execute_values(
            cur,
            f"""
            INSERT INTO {table} ({", ".join(columns)})
            VALUES %s
            ON CONFLICT ({", ".join(conflict_cols)}) DO NOTHING
            """,
            rows,
        )
    log.info(f"[DB-LOAD: {table}] Inserted {len(rows)} rows")
