"""
transaction_service.py
----------------------
Business logic cho Transactions:
  - save_transaction()    : validate và lưu giao dịch vào Firestore
  - list_transactions()   : lấy danh sách giao dịch (phân trang, filter)
  - update_transaction()  : cập nhật giao dịch
  - delete_transaction()  : xóa giao dịch
  - mark_chat_confirmed() : cập nhật trạng thái confirmed trong chat_history
"""

from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from firebase_admin import firestore
from fastapi import HTTPException


VALID_EXPENSE_CATEGORIES = {
    "An uong", "Di chuyen", "Mua sam",
    "Giai tri", "Y te", "Giao duc", "Tien ich", "Khac"
}

VALID_INCOME_CATEGORIES = {
    "Luong", "Thuong", "Kinh doanh", "Dau tu", "Khac"
}

VALID_CATEGORIES = VALID_EXPENSE_CATEGORIES | VALID_INCOME_CATEGORIES


@dataclass
class TransactionResult:
    transaction_id: str
    user_id: str
    amount: int
    category: str
    note: str
    created_at: str  # ISO string


def save_transaction(
    user_id: str,
    amount: int,
    category: str,
    note: str,
    chat_message_id: Optional[str] = None,
    type: str = "expense",
) -> TransactionResult:
    """
    Validate và lưu một giao dịch (thu nhập/chi tiêu) vào Firestore.
    """
    # ── Validation ────────────────────────────────────────────────────────────
    if not user_id:
        raise HTTPException(status_code=400, detail="Thieu user_id")
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount phai lon hon 0")
        
    if type not in ["income", "expense"]:
        raise HTTPException(status_code=400, detail="Type phai la 'income' hoac 'expense'")
        
    valid_cats = VALID_INCOME_CATEGORIES if type == "income" else VALID_EXPENSE_CATEGORIES
    if category not in valid_cats:
        raise HTTPException(
            status_code=400,
            detail=f"Category khong hop le cho loai {type}. Chon 1 trong: {', '.join(sorted(valid_cats))}"
        )

    # ── Ghi vào Firestore ─────────────────────────────────────────────────────
    try:
        db = firestore.client()
        now = datetime.now(timezone.utc)

        tx_ref = db.collection("transactions").document()
        tx_ref.set({
            "userId": user_id,
            "amount": amount,
            "category": category,
            "note": note.strip(),
            "type": type,
            "timestamp": now,
            "source": "chatbot" if chat_message_id else "manual",
            "chatMessageId": chat_message_id,
        })

        print(f"[TransactionService] Luu thanh cong: {tx_ref.id} | {type} | {amount:,}d | {category}")

        # ── Mark chat message là confirmed (nếu có) ───────────────────────────
        if chat_message_id:
            _mark_chat_confirmed(db, user_id, chat_message_id)

        return TransactionResult(
            transaction_id=tx_ref.id,
            user_id=user_id,
            amount=amount,
            category=category,
            note=note.strip(),
            type=type,
            created_at=now.isoformat(),
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[TransactionService] Loi Firestore: {e}")
        raise HTTPException(status_code=500, detail=f"Khong the luu giao dich: {str(e)}")


def list_transactions(
    user_id: str,
    category: Optional[str] = None,
    search: Optional[str] = None,
    type: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
) -> Dict[str, Any]:
    """
    Lấy danh sách giao dịch của user với phân trang và filter.

    Returns:
        { transactions: [...], total: int, page: int, page_size: int, total_pages: int }
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="Thieu user_id")

    try:
        db = firestore.client()
        query = db.collection("transactions").where("userId", "==", user_id)

        if category and category in VALID_CATEGORIES:
            query = query.where("category", "==", category)

        if type and type in ["income", "expense"]:
            query = query.where("type", "==", type)

        # Fetch all matching docs (filter search in Python to avoid composite index)
        docs = list(query.stream())

        # Build transaction list
        all_transactions = []
        for doc in docs:
            data = doc.to_dict()
            ts = data.get("timestamp")
            created_at = ts.isoformat() if isinstance(ts, datetime) else str(ts) if ts else ""

            all_transactions.append({
                "transaction_id": doc.id,
                "amount": data.get("amount", 0),
                "category": data.get("category", "Khac"),
                "note": data.get("note", ""),
                "type": data.get("type", "expense"),
                "source": data.get("source", "manual"),
                "created_at": created_at,
            })

        # Search filter (in Python)
        if search and search.strip():
            search_lower = search.strip().lower()
            all_transactions = [
                t for t in all_transactions
                if search_lower in t["note"].lower()
                or search_lower in t["category"].lower()
            ]

        # Sort by date (newest first)
        all_transactions.sort(key=lambda t: t["created_at"], reverse=True)

        # Pagination
        total = len(all_transactions)
        total_pages = max(1, (total + page_size - 1) // page_size)
        page = max(1, min(page, total_pages))
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated = all_transactions[start_idx:end_idx]

        return {
            "transactions": paginated,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[TransactionService] Loi list: {e}")
        raise HTTPException(status_code=500, detail=f"Khong the lay danh sach: {str(e)}")


def update_transaction(
    transaction_id: str,
    user_id: str,
    amount: Optional[int] = None,
    category: Optional[str] = None,
    note: Optional[str] = None,
    type: Optional[str] = None,
) -> Dict[str, Any]:
    """Cập nhật một giao dịch. Chỉ cập nhật các field được truyền vào."""
    if not user_id:
        raise HTTPException(status_code=400, detail="Thieu user_id")

    try:
        db = firestore.client()
        tx_ref = db.collection("transactions").document(transaction_id)
        doc = tx_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Giao dich khong ton tai")

        data = doc.to_dict()
        if data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Khong co quyen chinh sua giao dich nay")

        # Build update payload
        update_data = {}
        
        current_type = type if type else data.get("type", "expense")
        valid_cats = VALID_INCOME_CATEGORIES if current_type == "income" else VALID_EXPENSE_CATEGORIES

        if type is not None:
            if type not in ["income", "expense"]:
                raise HTTPException(status_code=400, detail="Type phai la 'income' hoac 'expense'")
            update_data["type"] = type

        if amount is not None:
            if amount <= 0:
                raise HTTPException(status_code=400, detail="amount phai lon hon 0")
            update_data["amount"] = amount
            
        if category is not None:
            if category not in valid_cats:
                raise HTTPException(status_code=400, detail=f"Category khong hop le cho loai {current_type}")
            update_data["category"] = category
            
        if note is not None:
            update_data["note"] = note.strip()

        if not update_data:
            raise HTTPException(status_code=400, detail="Khong co du lieu de cap nhat")

        tx_ref.update(update_data)
        print(f"[TransactionService] Cap nhat: {transaction_id} | {update_data}")

        # Return updated data
        updated_doc = tx_ref.get().to_dict()
        ts = updated_doc.get("timestamp")
        return {
            "transaction_id": transaction_id,
            "amount": updated_doc.get("amount"),
            "category": updated_doc.get("category"),
            "note": updated_doc.get("note"),
            "type": updated_doc.get("type", "expense"),
            "source": updated_doc.get("source"),
            "created_at": ts.isoformat() if isinstance(ts, datetime) else str(ts),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[TransactionService] Loi update: {e}")
        raise HTTPException(status_code=500, detail=f"Khong the cap nhat: {str(e)}")


def delete_transaction(transaction_id: str, user_id: str) -> None:
    """Xóa một giao dịch. Kiểm tra quyền sở hữu trước."""
    if not user_id:
        raise HTTPException(status_code=400, detail="Thieu user_id")

    try:
        db = firestore.client()
        tx_ref = db.collection("transactions").document(transaction_id)
        doc = tx_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Giao dich khong ton tai")

        data = doc.to_dict()
        if data.get("userId") != user_id:
            raise HTTPException(status_code=403, detail="Khong co quyen xoa giao dich nay")

        tx_ref.delete()
        print(f"[TransactionService] Xoa: {transaction_id}")

    except HTTPException:
        raise
    except Exception as e:
        print(f"[TransactionService] Loi delete: {e}")
        raise HTTPException(status_code=500, detail=f"Khong the xoa: {str(e)}")


def _mark_chat_confirmed(db, user_id: str, message_id: str) -> None:
    """Cập nhật trạng thái confirmed = True cho tin nhắn chat."""
    try:
        msg_ref = (
            db.collection("chat_history")
            .document(user_id)
            .collection("messages")
            .document(message_id)
        )
        msg_ref.update({"confirmed": True, "transactionData": None})
        print(f"[TransactionService] Mark confirmed: chat_history/{user_id}/messages/{message_id}")
    except Exception as e:
        # Khong fail toan bo request neu chi loi update chat
        print(f"[TransactionService] Canh bao: Khong the mark confirmed: {e}")
