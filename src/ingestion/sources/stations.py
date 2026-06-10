"""Download GBFS station metadata and persist as parquet."""
import logging

import polars as pl

from src.ingestion.config import settings
from src.backend.services.gbfs import fetch_station_data
from src.ingestion.cache import is_fresh

log = logging.getLogger(__name__)

def download_station_metadata(force_download: bool = False) -> list[dict]:
    """Return station metadata from the GBFS feed, refreshing the parquet cache when stale."""
    if not force_download and is_fresh(settings.station_metadata_path):
        log.info(f"[DOWNLOAD] Station metadata already fresh at {settings.station_metadata_path}, skipping")
        return pl.read_parquet(settings.station_metadata_path).to_dicts()

    station_info, _ = fetch_station_data(force_refresh=True)

    df = pl.DataFrame([
        {
            "station_id": s["station_id"],
            "short_name": s["short_name"],
            "name": s["name"],
            "lat": float(s["lat"]),
            "lon": float(s["lon"]),
            "capacity": int(s["capacity"]),
        }
        for s in station_info
    ])
    df.write_parquet(
        settings.station_metadata_path,
        row_group_size=100_000,
        statistics=True,
        compression=settings.parquet_compression,
    )
    log.info(f"[PROCESS] Wrote {len(station_info)} stations -> {settings.station_metadata_path}")
    return station_info
