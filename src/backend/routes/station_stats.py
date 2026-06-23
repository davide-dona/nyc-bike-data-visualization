from fastapi import APIRouter, Query
from src.backend.models.ride import MemberCasual, RideableType

from src.backend.models.station_stats.flow_counts import StationFlowCounts
from src.backend.models.station_stats.ride_counts import StationRideCounts, StationRideGroupBy

from src.backend.services.station_stats.ride_counts import get_station_ride_counts_stats
from src.backend.services.station_stats.flow_counts import get_trips_between_stations_stats

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/station_usage_counts", response_model=list[StationRideCounts])
def get_station_ride_counts(
    group_by: StationRideGroupBy = Query(default=StationRideGroupBy.NONE),
    user_type: MemberCasual | None = Query(default=None),
    bike_type: RideableType | None = Query(default=None),
    start_year: int = Query(..., ge=2000, le=2100),
    start_month: int = Query(..., ge=1, le=12),
    end_year: int = Query(..., ge=2000, le=2100),
    end_month: int = Query(..., ge=1, le=12),
    station_id: str | None = Query(default=None),
    day_of_week: int | None = Query(default=None, ge=0, le=6),
    limit: int | None = Query(default=100, ge=1, le=3000)
):
    """Get the count of rides starting or ending at each station, optionally grouped by day_of_week, hour, or both."""
    return get_station_ride_counts_stats(
        group_by=group_by,
        user_type=user_type,
        bike_type=bike_type,
        start_year=start_year,
        start_month=start_month,
        end_year=end_year,
        end_month=end_month,
        station_id=station_id,
        day_of_week=day_of_week,
        limit=limit,
    )

@router.get("/station_flow_counts", response_model=list[StationFlowCounts])
def get_trips_between_stations(
    user_type: MemberCasual | None = Query(default=None),
    bike_type: RideableType | None = Query(default=None),
    start_year: int = Query(..., ge=2000, le=2100),
    start_month: int = Query(..., ge=1, le=12),
    end_year: int = Query(..., ge=2000, le=2100),
    end_month: int = Query(..., ge=1, le=12),
    station_id: str | None = Query(default=None),
    limit: int | None = Query(default=100, ge=1, le=1000)
):
    """Get the count of rides between each station pair."""
    return get_trips_between_stations_stats(
        user_type=user_type,
        bike_type=bike_type,
        start_year=start_year,
        start_month=start_month,
        end_year=end_year,
        end_month=end_month,
        station_id=station_id,
        limit=limit,
    )
