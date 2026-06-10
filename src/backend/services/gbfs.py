import time
from threading import Lock
import requests
from fastapi import HTTPException

from src.backend.models.station import StationInfo, Station
from src.backend.config import INFO_URL, STATUS_URL
from src.backend.config import TTL_SECONDS, GBFS_CLASSIC_BIKE_TYPE_ID, GBFS_EBIKE_TYPE_ID

_cache_lock = Lock()
# Serialises upstream fetches so concurrent cache misses don't all hit the GBFS API
_fetch_lock = Lock()
_cache: dict = {
    "timestamp": 0.0,
    "info": None,
    "status_map": None,
}

def _fetch_from_source() -> tuple[list, dict]:
    """
    Fetch station information and status directly from the GBFS source API.
    Returns:
        info:       List of all station information dicts (active or not).
        status_map: Dict mapping station_id to its status dict.
    """
    # Fetch the raw station information and status data from the GBFS feed with a timeout to prevent hanging.
    info = requests.get(INFO_URL, timeout=(3, 10)).json()["data"]["stations"]
    status = requests.get(STATUS_URL, timeout=(3, 10)).json()["data"]["stations"]

    # Map station_id -> status dict for quick lookup. No active-status filtering here:
    # static info must stay available for inactive stations (historical data lookups);
    # endpoints that only want active stations filter with is_station_active().
    status_map = {s["station_id"]: s for s in status}

    return info, status_map

def is_station_active(status: dict | None) -> bool:
    """Whether a station is currently installed, renting and returning.
    GBFS uses integer flags for these fields (1 = true, 0 = false)."""
    return (
        bool(status)
        and status.get("is_installed") == 1
        and status.get("is_renting") == 1
        and status.get("is_returning") == 1
    )

def _get_cached(force_refresh: bool) -> tuple[list, dict] | None:
    """Return the cached station data if still valid, else None."""
    with _cache_lock:
        if (
            not force_refresh
            and _cache["info"] is not None
            and _cache["status_map"] is not None
            and (time.monotonic() - _cache["timestamp"] < TTL_SECONDS)
        ):
            return _cache["info"], _cache["status_map"]
    return None

def fetch_station_data(force_refresh: bool = False) -> tuple[list, dict]:
    """
    Return merged station data with a 1-minute in-memory cache.
    Set force_refresh=True to bypass the cache and fetch fresh data.
    Falls back to stale cache if the upstream API is unavailable.
    """
    cached = _get_cached(force_refresh)
    if cached:
        return cached

    with _fetch_lock:
        # Another thread may have refreshed the cache while we waited for the lock
        cached = _get_cached(force_refresh)
        if cached:
            return cached

        try:
            info, status_map = _fetch_from_source()
        except Exception as e:
            # Fall back to stale cache if available
            with _cache_lock:
                if _cache["info"] is not None and _cache["status_map"] is not None:
                    return _cache["info"], _cache["status_map"]
            raise HTTPException(
                status_code=503,
                detail=f"Failed to fetch station data: {e}",
            )

        with _cache_lock:
            _cache["timestamp"] = time.monotonic()
            _cache["info"] = info
            _cache["status_map"] = status_map

    return info, status_map

def build_station_info(station_data: dict) -> StationInfo:
    """Build a StationInfo response model with static station information only."""
    return StationInfo(
        id=str(station_data["short_name"]),
        name=station_data["name"],
        lat=station_data["lat"],
        lon=station_data["lon"],
        capacity=station_data["capacity"],
    )

def find_station_by_id(station_data: list[dict], station_id: str) -> dict:
    """Find a station by its public short_name identifier."""
    for station in station_data:
        if station["short_name"] == station_id:
            return station

    raise HTTPException(status_code=404, detail="Station not found")

def merge_station(station_data: dict, station_status_data: dict) -> Station:
    """Build a Station response model from raw info + status data."""
    # Retrieve the status for this station, defaulting to empty dict if not found
    st = station_status_data.get(station_data["station_id"], {})
    vehicle_types = st.get("vehicle_types_available", [])
    
    """
    The GBFS feed provides a list of available vehicle types and their counts. It's not guaranteed that both classic bikes 
    and e-bikes will be present in the feed at all times, and that the order of vehicle types is consistent. 
    To handle this, we create a mapping of vehicle_type_id to count, 
    and then extract the counts for classic bikes (type_id "1") and e-bikes (type_id "2") safely.
    """
    counts_by_type = {
        vt.get("vehicle_type_id"): vt.get("count", 0)
        for vt in vehicle_types
    }

    return Station(
        # To have consistency with historical data, we use the short_name as the station_id
        id=str(station_data["short_name"]),
        name=station_data["name"],
        lat=station_data["lat"],
        lon=station_data["lon"],
        capacity=station_data["capacity"],
        num_bikes_available=st.get("num_bikes_available", 0),
        num_classic_bikes_available=counts_by_type.get(GBFS_CLASSIC_BIKE_TYPE_ID, 0),
        num_ebikes_available=counts_by_type.get(GBFS_EBIKE_TYPE_ID, 0),
        num_docks_available=st.get("num_docks_available", 0),
        num_bikes_disabled=st.get("num_bikes_disabled", 0),
    )