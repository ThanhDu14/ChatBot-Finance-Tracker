"""
routes/budget.py
----------------
API endpoints cho Budget management.
"""

from fastapi import APIRouter, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import asyncio
from fastapi_cache.decorator import cache
from fastapi_cache import FastAPICache

from app.services.budget_service import get_budget, set_budget, get_budget_status

router = APIRouter(prefix="/budget", tags=["Budget"])

def budget_status_key_builder(
    func,
    namespace: Optional[str] = "",
    request: Request = None,
    response: Response = None,
    *args,
    **kwargs,
):
    endpoint_kwargs = kwargs.get("kwargs", {})
    user_id = endpoint_kwargs.get("user_id", "unknown")
    return f"{namespace}:{func.__name__}:{user_id}"

async def clear_budget_cache(user_id: str):
    backend = FastAPICache.get_backend()
    if hasattr(backend, "redis"):
        keys = await backend.redis.keys(f"finance-cache::budget_status:{user_id}")
        if keys:
            await backend.redis.delete(*keys)


class SetBudgetRequest(BaseModel):
    user_id: str
    monthly_budget: int = Field(..., ge=0, description="Ngan sach thang (VND)")
    alert_enabled: bool = True
    alert_threshold: int = Field(80, ge=1, le=100, description="Nguong canh bao (%)")


# ══════════════════════════════════════════════════════════════════════════════
#  GET /budget/status
#  Lấy trạng thái ngân sách: budget + chi tiêu hiện tại + %
# ══════════════════════════════════════════════════════════════════════════════
@router.get("/status")
@cache(expire=300, key_builder=budget_status_key_builder)
async def budget_status(
    user_id: str = Query(..., description="Firebase UID"),
):
    """Lấy trạng thái ngân sách tháng hiện tại."""
    return await asyncio.to_thread(get_budget_status, user_id)


# ══════════════════════════════════════════════════════════════════════════════
#  GET /budget
#  Lấy thông tin budget đã đặt
# ══════════════════════════════════════════════════════════════════════════════
@router.get("")
async def get_user_budget(
    user_id: str = Query(..., description="Firebase UID"),
):
    """Lấy budget hiện tại của user."""
    result = await asyncio.to_thread(get_budget, user_id)
    if result is None:
        return {"has_budget": False}
    return {**result, "has_budget": True}


# ══════════════════════════════════════════════════════════════════════════════
#  POST /budget
#  Đặt/cập nhật budget tháng
# ══════════════════════════════════════════════════════════════════════════════
@router.post("")
async def update_budget(request: SetBudgetRequest):
    """Đặt hoặc cập nhật budget tháng."""
    result = await asyncio.to_thread(
        set_budget,
        request.user_id,
        request.monthly_budget,
        request.alert_enabled,
        request.alert_threshold,
    )
    await clear_budget_cache(request.user_id)
    return result
#  POST /budget
#  Đặt/cập nhật budget tháng
# ══════════════════════════════════════════════════════════════════════════════
@router.post("")
async def update_budget(request: SetBudgetRequest):
    """Đặt hoặc cập nhật budget tháng."""
    result = await asyncio.to_thread(
        set_budget,
        request.user_id,
        request.monthly_budget,
        request.alert_enabled,
        request.alert_threshold,
    )
    await clear_budget_cache(request.user_id)
    return result   
