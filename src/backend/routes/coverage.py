from fastapi import APIRouter

from src.backend.models.coverage import DatasetDateRange
from src.backend.services.coverage import get_data_range_coverage

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/date_range", response_model=DatasetDateRange)
def get_date_range():
    """Get the min and max ride dates in the dataset"""
    return get_data_range_coverage()
