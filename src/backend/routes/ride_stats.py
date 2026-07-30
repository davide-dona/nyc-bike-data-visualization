from typing import Annotated

from fastapi import APIRouter, Depends, Query

from src.backend.models.params import DateRange, RideFilters
from src.backend.models.ride_stats import StatsGroupBy, Stats, GroupedStats, WeatherVariable

from src.backend.services.ride_stats import get_stats_data

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/", response_model=Stats | list[GroupedStats])
def get_stats(
    date_range: Annotated[DateRange, Depends()],
    filters: Annotated[RideFilters, Depends()],
    group_by: StatsGroupBy = Query(default=StatsGroupBy.NONE),
):
    """Get historical rides stats, optionally grouped by day_of_week, hour, or both."""
    return get_stats_data(date_range, filters, group_by=group_by)

@router.get("/stats_by_weather", response_model=list[GroupedStats])
def get_stats_by_weather(
    date_range: Annotated[DateRange, Depends()],
    filters: Annotated[RideFilters, Depends()],
    group_by: StatsGroupBy = Query(default=StatsGroupBy.NONE),
    variable: WeatherVariable = Query(default=WeatherVariable.WEATHER_CODE),
):
    """Get historical rides stats bucketed by a weather variable, optionally grouped by day_of_week, hour, or both."""
    return get_stats_data(date_range, filters, group_by=group_by, weather_var=variable)
