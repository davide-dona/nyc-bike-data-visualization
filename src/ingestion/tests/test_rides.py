from datetime import datetime, timedelta

import polars as pl

from src.ingestion.sources.rides import _clean_rides_data


def _ride(ride_id: str, duration_minutes: int, end_lng: float) -> dict:
    started_at = datetime(2025, 2, 1, 8, 0)
    return {
        "ride_id": ride_id,
        "rideable_type": "classic_bike",
        "started_at": started_at.strftime("%Y-%m-%d %H:%M:%S"),
        "ended_at": (started_at + timedelta(minutes=duration_minutes)).strftime("%Y-%m-%d %H:%M:%S"),
        "start_station_name": "Start",
        "start_station_id": "start",
        "end_station_name": "End",
        "end_station_id": f"end-{ride_id}",
        "start_lat": 40.75,
        "start_lng": -73.99,
        "end_lat": 40.75,
        "end_lng": end_lng,
        "member_casual": "member",
    }


def test_clean_rides_removes_independent_upper_tail_outliers():
    normal = [_ride(str(index), 10 + index, -73.989 + index * 0.001) for index in range(30)]
    duration_outlier = _ride("duration-outlier", 24 * 60, -73.98)
    distance_outlier = _ride("distance-outlier", 20, 0.0)

    cleaned = _clean_rides_data(pl.DataFrame([*normal, duration_outlier, distance_outlier]))

    assert cleaned.height == len(normal)
    assert set(cleaned["ride_id"]) == {str(index) for index in range(30)}


def test_clean_rides_keeps_values_when_a_metric_has_zero_variance():
    rides = [_ride(str(index), 15, -73.98) for index in range(3)]

    cleaned = _clean_rides_data(pl.DataFrame(rides))

    assert cleaned.height == 3
