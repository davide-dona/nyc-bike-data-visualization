"""Compute and cache pairwise station-to-station distances for ride enrichment."""
import logging
import math
from pathlib import Path

import polars as pl

from src.backend.services.gbfs import fetch_station_data
from src.ingestion.config import settings
from src.ingestion.cache import is_fresh

log = logging.getLogger(__name__)

def _distance_km(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    """Haversine great-circle distance in km, scaled by settings.street_circuity_factor."""
    # Convert lat/lon from degrees to radians for the trigonometric Haversine formula
    lat_a, lon_a, lat_b, lon_b = map(math.radians, [lat_a, lon_a, lat_b, lon_b])
    d_lon = lon_b - lon_a
    d_lat = lat_b - lat_a
    a = math.sin(d_lat / 2) ** 2 + math.cos(lat_a) * math.cos(lat_b) * math.sin(d_lon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    # Multiply by Earth's radius and the circuity factor to approximate real-world travel
    return settings.earth_radius_km * c * settings.street_circuity_factor

def compute_and_save_station_distances(force_download: bool = False) -> None:
    """Compute unique unordered station-pair distances and persist as parquet."""
    # If a fresh cache already exists, skip the recomputation
    if not force_download and is_fresh(Path(settings.station_distances_path)):
        log.info(f"[PROCESS] Station distances already exist at {settings.station_distances_path}, skipping")
        return

    # Pull the live GBFS feed; keep only the fields we need
    raw_stations = fetch_station_data()[0]
    stations = sorted(
        (
            {
                "id": s.get("short_name", ""),
                "lat": float(s.get("lat", 0)),
                "lon": float(s.get("lon", 0)),
            }
            for s in raw_stations
        ),
        key=lambda s: s["id"],
    )

    log.info(f"[PROCESS] Computing distances for {len(stations)} stations...")
    # Pair each station only with stations later in the sorted list to avoid
    # duplicate (A, B) / (B, A) entries and self-pairs
    pair_rows = [
        {
            "station_id_a": a["id"],
            "station_id_b": b["id"],
            "distance_km": _distance_km(a["lat"], a["lon"], b["lat"], b["lon"]),
        }
        for i, a in enumerate(stations)
        for b in stations[i + 1:]
    ]

    distances_df = pl.DataFrame(pair_rows)
    distances_df.write_parquet(
        settings.station_distances_path,
        row_group_size=100_000,
        statistics=True,
        compression=settings.parquet_compression,
    )
    log.info(f"[PROCESS] Wrote {distances_df.height} station distances -> {settings.station_distances_path}")

def enrich_with_distances(rides: pl.LazyFrame, distances: pl.LazyFrame) -> pl.LazyFrame:
    """Left-join `distances` onto `rides` on the unordered station-id pair."""
    # Normalise (start, end) into (min, max) so the join key matches the
    # canonical (a, b) order used when the distances table was written
    rides_norm = rides.with_columns([
        pl.min_horizontal("start_station_id", "end_station_id").alias("_station_min"),
        pl.max_horizontal("start_station_id", "end_station_id").alias("_station_max"),
    ])
    distances_sel = distances.select([
        pl.col("station_id_a").alias("_station_min"),
        pl.col("station_id_b").alias("_station_max"),
        "distance_km",
    ])
    return (
        rides_norm
        .join(distances_sel, on=["_station_min", "_station_max"], how="left")
        .drop(["_station_min", "_station_max"])
    )
