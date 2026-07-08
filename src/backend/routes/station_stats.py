from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.backend.models.params import MonthRange, StationFilters
from src.backend.models.station_stats.flow_counts import StationFlowCounts
from src.backend.models.station_stats.ride_counts import StationRideCounts, StationRideGroupBy

from src.backend.services.station_stats.ride_counts import get_station_ride_counts_stats
from src.backend.services.station_stats.flow_counts import get_trips_between_stations_stats

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/station_usage_counts", response_model=list[StationRideCounts])
def get_station_ride_counts(
    month_range: Annotated[MonthRange, Depends()],
    filters: Annotated[StationFilters, Depends()],
    group_by: StationRideGroupBy = Query(default=StationRideGroupBy.NONE),
    day_of_week: int | None = Query(default=None, ge=0, le=6),
    limit: int | None = Query(default=100, ge=1, le=3000)
):
    """Get the count of rides starting or ending at each station, optionally grouped by day_of_week, hour, or both."""
    return get_station_ride_counts_stats(
        month_range,
        filters,
        day_of_week=day_of_week,
        group_by=group_by,
        limit=limit,
    )

@router.get("/station_flow_counts", response_model=list[StationFlowCounts])
def get_trips_between_stations(
    month_range: Annotated[MonthRange, Depends()],
    filters: Annotated[StationFilters, Depends()],
    limit: int | None = Query(default=None, ge=1, le=1000)
):
    """Get the count of rides between each station pair. When limit is omitted,
    station-scoped requests return every partner pair; citywide requests are
    capped server-side."""
    return get_trips_between_stations_stats(month_range, filters, limit=limit)
