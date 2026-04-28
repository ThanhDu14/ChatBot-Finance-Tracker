"""
routes/transactions.py
----------------------
API endpoints cho Transaction management.
Business logic được ủy quyền cho transaction_service.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio

from app.services.transaction_service import (
    save_transaction,
    list_transactions,
    update_transaction,
    delete_transaction,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ─────────────────────────────────────────────
#  Request / Response schemas
# ─────────────────────────────────────────────
class SaveTransactionRequest(BaseModel):
    user_id: str
    amount: int = Field(..., gt=0, description="So tien VND, phai lon hon 0")
    category: str
    note: str = ""
    chat_message_id: Optional[str] = None  # ID tin nhan chat de mark confirmed


class SaveTransactionResponse(BaseModel):
    transaction_id: str
    user_id: str
    amount: int
    category: str
    note: str
    created_at: str
    message: str = "Giao dich da duoc luu thanh cong!"


class UpdateTransactionRequest(BaseModel):
    user_id: str
    amount: Optional[int] = None
    category: Optional[str] = None
    note: Optional[str] = None


class TransactionListResponse(BaseModel):
    transactions: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int


# ══════════════════════════════════════════════════════════════════════════════
#  GET /transactions
#  Lấy danh sách giao dịch với phân trang, filter
# ══════════════════════════════════════════════════════════════════════════════
@router.get("", response_model=TransactionListResponse)
async def get_transactions(
    user_id: str = Query(..., description="Firebase UID"),
    category: Optional[str] = Query(None, description="Filter theo category"),
    search: Optional[str] = Query(None, description="Tim kiem theo note/category"),
    page: int = Query(1, ge=1, description="Trang hien tai"),
    page_size: int = Query(10, ge=1, le=50, description="So item moi trang"),
):
    """Lấy danh sách giao dịch của user."""
    return await asyncio.to_thread(
        list_transactions, user_id, category, search, page, page_size
    )


# ══════════════════════════════════════════════════════════════════════════════
#  POST /transactions
#  Validate và lưu giao dịch vào Firestore (thay thế việc ghi từ frontend)
# ══════════════════════════════════════════════════════════════════════════════
@router.post("", response_model=SaveTransactionResponse)
async def create_transaction(request: SaveTransactionRequest):
    """
    Lưu một giao dịch chi tiêu vào Firestore.
    Nếu có chat_message_id, tự động mark tin nhắn đó là confirmed.
    """
    result = await asyncio.to_thread(
        save_transaction,
        request.user_id,
        request.amount,
        request.category,
        request.note,
        request.chat_message_id,
    )

    return SaveTransactionResponse(
        transaction_id=result.transaction_id,
        user_id=result.user_id,
        amount=result.amount,
        category=result.category,
        note=result.note,
        created_at=result.created_at,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  PUT /transactions/{transaction_id}
#  Cập nhật giao dịch
# ══════════════════════════════════════════════════════════════════════════════
@router.put("/{transaction_id}")
async def edit_transaction(transaction_id: str, request: UpdateTransactionRequest):
    """Cập nhật giao dịch. Chỉ owner mới được phép."""
    return await asyncio.to_thread(
        update_transaction,
        transaction_id,
        request.user_id,
        request.amount,
        request.category,
        request.note,
    )


# ══════════════════════════════════════════════════════════════════════════════
#  DELETE /transactions/{transaction_id}
#  Xóa giao dịch
# ══════════════════════════════════════════════════════════════════════════════
@router.delete("/{transaction_id}")
async def remove_transaction(
    transaction_id: str,
    user_id: str = Query(..., description="Firebase UID de xac thuc quyen"),
):
    """Xóa giao dịch. Chỉ owner mới được phép."""
    await asyncio.to_thread(delete_transaction, transaction_id, user_id)
    return {"message": "Giao dich da duoc xoa thanh cong"}
