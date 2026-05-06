from fastapi import APIRouter, HTTPException, Query, Request, Response
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
from app.services.analytics_service import get_analytics_summary
from fastapi_cache.decorator import cache

router = APIRouter(tags=["Analytics"])

def analytics_key_builder(
    func,
    namespace: Optional[str] = "",
    request: Request = None,
    response: Response = None,
    *args,
    **kwargs,
):
    endpoint_kwargs = kwargs.get("kwargs", {})
    user_id = endpoint_kwargs.get("user_id", "unknown")
    period = endpoint_kwargs.get("period", "unknown")
    return f"{namespace}:{func.__name__}:{user_id}:{period}"


class AnalyticsSummaryResponse(BaseModel):
    period: str
    start_date: str
    end_date: str
    total_spending: float
    total_expense: float = 0.0
    total_income: float = 0.0
    net_balance: float = 0.0
    average_daily_spending: float
    transaction_count: int
    categories: Dict[str, float]
    top_category: Optional[str]
    max_spending: float
    daily_spending: Dict[str, float]
    daily_expense: Dict[str, float] = {}
    daily_income: Dict[str, float] = {}
    trend: Optional[Dict[str, Any]]
    transactions: List[Dict[str, Any]]


@router.get("/analytics/v1/summary", response_model=AnalyticsSummaryResponse)
@cache(expire=300, key_builder=analytics_key_builder)
def get_analytics_summary_endpoint(
    user_id: str = Query(..., description="User ID"),
    period: str = Query("month", description="'today', 'week', 'month', 'year', or 'custom'"),
):
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