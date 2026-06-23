import requests

from test_helpers import BASE_URL, DEFAULT_TIMEOUT

DATE_PARAMS = {"start_date": "2026-01-02", "end_date": "2026-01-02"}
YM_PARAMS = {"start_year": 2026, "start_month": 1, "end_year": 2026, "end_month": 1}

def test_get_stats_no_filters():
    """Test that /stats/ returns expected fields with no filters."""
    response = requests.get(f"{BASE_URL}/stats/", params=DATE_PARAMS, timeout=DEFAULT_TIMEOUT)
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_rides"] == 2
    assert payload["hours_count"] == 24
    assert payload["hours_with_rides"] == 2
    assert payload["average_duration_seconds"] > 0
    assert payload["average_distance_km"] > 0
    assert payload["total_duration_seconds"] > 0
    assert payload["total_distance_km"] > 0
    # Per-hour ride counts are [1, 1] + [0] * 22 → sample std sqrt(11/138)
    assert abs(payload["rides_per_hour_std"] - (11 / 138) ** 0.5) < 1e-9
    assert payload["average_speed_kmh_std"] is not None
    assert payload["average_speed_kmh_std"] >= 0

def test_get_stats_user_type():
    """Test that /stats/ returns expected fields for a given user type."""
    response = requests.get(
        f"{BASE_URL}/stats/",
        params={**DATE_PARAMS, "user_type": "casual"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_rides"] == 0
    assert payload["hours_count"] == 24
    assert payload["hours_with_rides"] == 0
    assert payload["average_duration_seconds"] == 0
    assert payload["average_distance_km"] == 0
    assert payload["total_duration_seconds"] == 0
    assert payload["total_distance_km"] == 0
    assert payload["rides_per_hour_std"] == 0
    assert payload["average_speed_kmh_std"] is None


def test_get_stats_group_by_none_matches_default():
    """Test that group_by=none returns the same non-grouped stats shape."""
    response = requests.get(
        f"{BASE_URL}/stats/",
        params={**DATE_PARAMS, "group_by": "none"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, dict)
    assert payload["total_rides"] == 2
    assert payload["hours_count"] == 24


def test_get_stats_grouped_default_day_of_week():
    """Test that /stats/ supports group_by=day_of_week for the selected range."""
    response = requests.get(
        f"{BASE_URL}/stats/",
        params={**DATE_PARAMS, "group_by": "day_of_week"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()

    assert len(payload) == 1
    assert [row["day_of_week"] for row in payload] == [4]
    assert all(row["hour"] is None for row in payload)

    friday = next(row for row in payload if row["day_of_week"] == 4)
    assert friday["total_rides"] == 2
    assert friday["hours_count"] == 24


def test_get_stats_grouped_by_hour():
    """Test that /stats/ supports grouping by hour and returns 24 rows."""
    response = requests.get(
        f"{BASE_URL}/stats/",
        params={**DATE_PARAMS, "group_by": "hour"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()

    assert len(payload) == 24
    assert [row["hour"] for row in payload] == list(range(24))
    assert all(row["day_of_week"] is None for row in payload)
    assert all("weather_code" in row for row in payload)

    hour_5 = next(row for row in payload if row["hour"] == 5)
    hour_15 = next(row for row in payload if row["hour"] == 15)
    assert hour_5["total_rides"] == 1
    assert hour_15["total_rides"] == 1
    assert sum(row["total_rides"] for row in payload) == 2

    # Single-hour buckets have no sample std (STDDEV_SAMP needs n >= 2)
    assert all(row["rides_per_hour_std"] is None for row in payload)
    assert all(row["average_speed_kmh_std"] is None for row in payload)


def test_get_stats_grouped_by_weather():
    """Test that weather grouping uses hourly weather coverage for hours_count."""
    response = requests.get(
        f"{BASE_URL}/stats/stats_by_weather",
        params=DATE_PARAMS,
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()

    assert isinstance(payload, list)
    assert payload
    assert all("weather_code" in row for row in payload)
    assert all(row["weather_bin"] is None for row in payload)
    assert sum(row["hours_count"] for row in payload) == 24


def test_get_stats_by_weather_temperature_bins():
    """Test that variable=temperature buckets spine hours into 2°C bins."""
    response = requests.get(
        f"{BASE_URL}/stats/stats_by_weather",
        params={**DATE_PARAMS, "variable": "temperature"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()

    bins = {row["weather_bin"]: row for row in payload}
    # Seed temps -1.8..5.2 °C: 5 hours below 0°, 5 in [0,2), 8 in [2,4), 6 in [4,6)
    assert sorted(bins) == [-2.0, 0.0, 2.0, 4.0]
    assert [bins[b]["hours_count"] for b in sorted(bins)] == [5, 5, 8, 6]
    assert all(row["weather_code"] is None for row in payload)
    # Rides at hour 5 (1.3 °C → bin 0) and hour 15 (5.2 °C → bin 4)
    assert bins[0.0]["total_rides"] == 1
    assert bins[4.0]["total_rides"] == 1
    # Bin 0: per-hour counts [1, 0, 0, 0, 0] → sample std sqrt(0.2)
    assert bins[0.0]["hours_with_rides"] == 1
    assert abs(bins[0.0]["rides_per_hour_std"] - 0.2 ** 0.5) < 1e-9


def test_get_stats_by_weather_precipitation_bins():
    """Test that variable=precipitation buckets hours by rain intensity."""
    response = requests.get(
        f"{BASE_URL}/stats/stats_by_weather",
        params={**DATE_PARAMS, "variable": "precipitation"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()

    bins = {row["weather_bin"]: row for row in payload}
    # 23 dry hours plus the single 0.1 mm trace hour at 16:00
    assert sorted(bins) == [0.0, 0.1]
    assert bins[0.0]["hours_count"] == 23
    assert bins[0.0]["total_rides"] == 2
    assert bins[0.1]["hours_count"] == 1
    assert bins[0.1]["total_rides"] == 0


def test_get_stats_by_weather_temperature_user_filter():
    """Test that user_type filters compose with weather variable bucketing."""
    member = requests.get(
        f"{BASE_URL}/stats/stats_by_weather",
        params={**DATE_PARAMS, "variable": "temperature", "user_type": "member"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert member.status_code == 200
    assert sum(row["total_rides"] for row in member.json()) == 2

    casual = requests.get(
        f"{BASE_URL}/stats/stats_by_weather",
        params={**DATE_PARAMS, "variable": "temperature", "user_type": "casual"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert casual.status_code == 200
    assert sum(row["total_rides"] for row in casual.json()) == 0


def test_get_stats_grouped_by_day_and_hour():
    """Test that /stats/ supports grouping by day_of_week and hour together."""
    response = requests.get(
        f"{BASE_URL}/stats/",
        params={**DATE_PARAMS, "group_by": "day_of_week,hour"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()

    assert len(payload) == 24
    assert sum(row["total_rides"] for row in payload) == 2

    friday_hour_5 = next(
        row for row in payload if row["day_of_week"] == 4 and row["hour"] == 5
    )
    friday_hour_15 = next(
        row for row in payload if row["day_of_week"] == 4 and row["hour"] == 15
    )
    assert friday_hour_5["total_rides"] == 1
    assert friday_hour_15["total_rides"] == 1

def test_get_trips_between_stations():
    """Test that /stats/station_flow_counts returns expected fields."""
    response = requests.get(
        f"{BASE_URL}/stats/station_flow_counts",
        params=YM_PARAMS,
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    for pair in payload:
        assert "station_a_id" in pair
        assert "station_a_name" in pair
        assert "station_a_lat" in pair
        assert "station_a_lon" in pair
        assert "station_b_id" in pair
        assert "station_b_name" in pair
        assert "station_b_lat" in pair
        assert "station_b_lon" in pair
        assert "groups" in pair
        assert isinstance(pair["groups"], list)
        assert len(pair["groups"]) == 1

        group = pair["groups"][0]
        assert group["day_of_week"] is None
        assert group["hour"] is None
        assert "a_to_b_count" in group
        assert "b_to_a_count" in group
        assert "total_rides" in group
        assert pair["station_a_lat"] is None or isinstance(pair["station_a_lat"], (int, float))
        assert pair["station_a_lon"] is None or isinstance(pair["station_a_lon"], (int, float))
        assert pair["station_b_lat"] is None or isinstance(pair["station_b_lat"], (int, float))
        assert pair["station_b_lon"] is None or isinstance(pair["station_b_lon"], (int, float))
        assert group["a_to_b_count"] >= 0
        assert group["b_to_a_count"] >= 0
        assert group["total_rides"] == group["a_to_b_count"] + group["b_to_a_count"]

def test_get_trips_between_stations_with_invalid_station_id():
    """Test that /stats/station_flow_counts returns empty for unknown station_id."""
    response = requests.get(
        f"{BASE_URL}/stats/station_flow_counts",
        params={**YM_PARAMS, "station_id": "invalid_station_id"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload == []

def test_get_station_counts():
    """Test that /stats/station_usage_counts returns expected station counts."""
    response = requests.get(f"{BASE_URL}/stats/station_usage_counts", params=YM_PARAMS, timeout=DEFAULT_TIMEOUT)
    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 4
    for station in payload:
        assert "groups" in station
        assert len(station["groups"]) == 1
        group = station["groups"][0]
        if station["station_id"] == "6602.05":
            assert group["outgoing_rides"] == 1
            assert group["incoming_rides"] == 0
        assert "station_id" in station
        assert "station_name" in station
        assert "outgoing_rides" in group
        assert "incoming_rides" in group
        assert group["day_of_week"] is None
        assert group["hour"] is None
        assert group["outgoing_rides"] >= 0
        assert group["incoming_rides"] >= 0


def test_get_station_counts_day_of_week_filter():
    """Test that day_of_week filter correctly limits station counts."""
    # 2026-01-02 is a Friday (day_of_week=4) — should return results
    response_friday = requests.get(
        f"{BASE_URL}/stats/station_usage_counts",
        params={**YM_PARAMS, "day_of_week": 4},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response_friday.status_code == 200
    assert len(response_friday.json()) == 4

    # Monday (day_of_week=0) — no rides, should return empty
    response_monday = requests.get(
        f"{BASE_URL}/stats/station_usage_counts",
        params={**YM_PARAMS, "day_of_week": 0},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response_monday.status_code == 200
    assert response_monday.json() == []


def test_get_station_counts_grouped_by_day_of_week():
    """Test that grouped station counts are returned in nested station-first shape."""
    response = requests.get(
        f"{BASE_URL}/stats/station_usage_counts",
        params={**YM_PARAMS, "group_by": "day_of_week"},
        timeout=DEFAULT_TIMEOUT,
    )
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert payload

    for station in payload:
        assert "station_id" in station
        assert "station_name" in station
        assert "lat" in station
        assert "lon" in station
        assert "groups" in station
        assert isinstance(station["groups"], list)
        assert station["groups"]

        for group in station["groups"]:
            assert "day_of_week" in group
            assert "hour" in group
            assert "outgoing_rides" in group
            assert "incoming_rides" in group
            assert "total_rides" in group
            assert "hours_count" in group
            assert group["hour"] is None
            assert 0 <= group["day_of_week"] <= 6
            assert group["total_rides"] == group["outgoing_rides"] + group["incoming_rides"]


