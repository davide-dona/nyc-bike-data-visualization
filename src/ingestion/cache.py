"""Shared file-cache utilities."""
from datetime import datetime, timezone
from pathlib import Path

from src.ingestion.config import settings

def is_fresh(file_path: Path) -> bool:
    """Return True if file_path exists and its mtime is within settings.max_cache_age_days."""
    if not file_path.exists():
        return False
    if file_path.is_dir() and not any(file_path.iterdir()):
        return False
    mtime = datetime.fromtimestamp(file_path.stat().st_mtime, tz=timezone.utc)
    return (datetime.now(timezone.utc) - mtime).days <= settings.max_cache_age_days
