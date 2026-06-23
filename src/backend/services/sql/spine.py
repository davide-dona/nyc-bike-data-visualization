from datetime import date, timedelta

from fastapi import HTTPException

# Calendar-based spine: one row per hour in [start, end), generated independently
# of any data table so that time buckets and hours_count never depend on the
# coverage of other tables. Takes two query params: start (inclusive) and end
# (exclusive). day_of_week matches the loaders' convention (0=Monday .. 6=Sunday).
HOURS_CTE = """hours AS (
            SELECT gs::date AS date,
                   EXTRACT(HOUR FROM gs)::smallint AS hour,
                   (EXTRACT(ISODOW FROM gs) - 1)::smallint AS day_of_week
            FROM generate_series(%s::timestamp, %s::timestamp - interval '1 hour', interval '1 hour') gs
        )"""

def date_range_bounds(start_date: date, end_date: date) -> tuple[date, date]:
    """Validate an inclusive date range and return its [start, end) bounds for the hours spine."""
    if end_date < start_date:
        raise HTTPException(status_code=422, detail="end_date must not be before start_date")
    return start_date, end_date + timedelta(days=1)

def month_range_bounds(start_year: int, start_month: int, end_year: int, end_month: int) -> tuple[date, date]:
    """Validate an inclusive month range and return its [start, end) date bounds for the hours spine."""
    start = date(start_year, start_month, 1)
    end_excl = date(end_year + (end_month == 12), end_month % 12 + 1, 1)
    if end_excl <= start:
        raise HTTPException(status_code=422, detail="end month must not be before start month")
    return start, end_excl
