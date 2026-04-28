from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from app.services.analytics_service import get_analytics_summary

router = APIRouter(tags=["Analytics"])


class AnalyticsSummaryResponse(BaseModel):
    period: str
    start_date: str
    end_date: str
    total_spending: float
    average_daily_spending: float
    transaction_count: int
    categories: Dict[str, float]
    top_category: Optional[str]
    max_spending: float
    daily_spending: Dict[str, float]
    trend: Optional[Dict[str, Any]]
    transactions: List[Dict[str, Any]]


@router.get("/analytics/v1/summary", response_model=AnalyticsSummaryResponse)
def get_analytics_summary_endpoint(
    user_id: str = Query(..., description="User ID"),
    period: str = Query("month", description="'today', 'week', 'month', 'year', or 'custom'"),
):
    '''
    Get spending analytics summary for a user
    '''
    try:
        analytics_summary = get_analytics_summary(user_id, period)

        if analytics_summary:
            return analytics_summary
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch analytics summary")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")