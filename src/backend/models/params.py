from datetime import date, timedelta

from fastapi import HTTPException
from pydantic import BaseModel, Field, model_validator

from src.backend.models.ride import MemberCasual, RideableType

class DateRange(BaseModel):
    """Inclusive date range for stats queries."""

    start_date: date
    end_date: date

    @model_validator(mode="after")
    def _check_order(self) -> "DateRange":
        if self.end_date < self.start_date:
            raise HTTPException(status_code=422, detail="end_date must not be before start_date")
        return self

    def bounds(self) -> tuple[date, date]:
        """Return the [start, end) date bounds for the hours spine."""
        return self.start_date, self.end_date + timedelta(days=1)


class MonthRange(BaseModel):
    """Inclusive month range for stats queries."""

    start_year: int = Field(ge=2000, le=2100)
    start_month: int = Field(ge=1, le=12)
    end_year: int = Field(ge=2000, le=2100)
    end_month: int = Field(ge=1, le=12)

    @model_validator(mode="after")
    def _check_order(self) -> "MonthRange":
        if (self.end_year, self.end_month) < (self.start_year, self.start_month):
            raise HTTPException(status_code=422, detail="end month must not be before start month")
        return self

    def bounds(self) -> tuple[date, date]:
        """Return the [start, end) date bounds for the hours spine."""
        start = date(self.start_year, self.start_month, 1)
        end_excl = date(self.end_year + (self.end_month == 12), self.end_month % 12 + 1, 1)
        return start, end_excl


class RideFilters(BaseModel):
    """Optional ride-level filters shared by the stats endpoints."""

    user_type: MemberCasual | None = None
    bike_type: RideableType | None = None


class StationFilters(RideFilters):
    """Ride filters plus the station restriction used by the station stats endpoints."""

    station_id: str | None = None
