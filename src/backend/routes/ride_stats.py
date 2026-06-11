from datetime import date
from fastapi import APIRouter, Query
from src.backend.models.ride import MemberCasual, RideableType

from src.backend.models.ride_stats import StatsGroupBy, Stats, GroupedStats, WeatherVariable

from src.backend.services.ride_stats import get_stats_data

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/", response_model=Stats | list[GroupedStats])
def get_stats(
    group_by: StatsGroupBy = Query(default=StatsGroupBy.NONE),
    user_type: MemberCasual | None = Query(default=None),
    bike_type: RideableType | None = Query(default=None),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    """Get historical rides stats, optionally grouped by day_of_week, hour, or both."""
    return get_stats_data(
        group_by=group_by,
        user_type=user_type,
        bike_type=bike_type,
        start_date=start_date,
        end_date=end_date,
    )

@router.get("/stats_by_weather", response_model=list[GroupedStats])
def get_stats_by_weather(
    group_by: StatsGroupBy = Query(default=StatsGroupBy.NONE),
    variable: WeatherVariable = Query(default=WeatherVariable.WEATHER_CODE),
    user_type: MemberCasual | None = Query(default=None),
    bike_type: RideableType | None = Query(default=None),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    """Get historical rides stats bucketed by a weather variable, optionally grouped by day_of_week, hour, or both."""
    return get_stats_data(
        group_by=group_by,
        user_type=user_type,
        bike_type=bike_type,
        start_date=start_date,
        end_date=end_date,
        weather_var=variable,
    )
