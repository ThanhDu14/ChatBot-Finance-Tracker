from firebase_admin import firestore
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta, timezone
import traceback


def get_analytics_summary(
    user_id: str,
    period: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category: Optional[str] = None,
) -> Optional[Dict]:
    """
    Get spending analytics for a user.

    Args:
        user_id: User ID
        period: 'today', 'week', 'month', 'year', or 'custom'
        start_date: Custom start date (YYYY-MM-DD)
        end_date: Custom end date (YYYY-MM-DD)
        category: Optional category filter

    Returns:
        Dictionary with analytics summary or None if error
    """
    try:
        # Calculate date range based on period
        now = datetime.now(timezone.utc)

        if period == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif period == "week":
            # Đầu tuần hiện tại (Thứ 2)
            start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif period == "month":
            # Đầu tháng hiện tại
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif period == "year":
            # Đầu năm hiện tại
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif period == "custom" and start_date and end_date:
            start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        else:
            raise ValueError("Invalid period or date range")

        print(f"[AnalyticsService] Fetching analytics for user={user_id}, period={period}, start={start}, end={end}")

        # Query transactions from Firestore
        # Only filter by userId to avoid needing a composite index.
        # Date filtering is done in Python below.
        db = firestore.client()
        transactions_ref = db.collection("transactions")
        query = transactions_ref.where("userId", "==", user_id)

        # Add category filter if provided (equality filter, no composite index needed with userId)
        if category:
            query = query.where("category", "==", category)

        # Execute query
        docs = list(query.stream())
        print(f"[AnalyticsService] Found {len(docs)} total transactions for user")

        # Calculate analytics — filter by date in Python
        total_income = 0.0
        total_expense = 0.0
        category_spending: Dict[str, float] = {}
        daily_expense: Dict[str, float] = {}
        daily_income: Dict[str, float] = {}
        transaction_list: List[Dict[str, Any]] = []

        for doc in docs:
            transaction = doc.to_dict()
            trans_date = transaction.get("timestamp")

            # --- Date filter in Python (avoids composite index) ---
            if trans_date is not None:
                # Firestore may return timezone-aware or naive datetime
                if hasattr(trans_date, 'tzinfo') and trans_date.tzinfo is None:
                    trans_date = trans_date.replace(tzinfo=timezone.utc)
                if trans_date < start or trans_date > end:
                    continue
            else:
                # Skip transactions without a timestamp
                continue

            amount = transaction.get("amount", 0)
            trans_type = transaction.get("type", "expense")
            
            # Convert to date string key
            date_key = trans_date.strftime("%Y-%m-%d")

            if trans_type == "income":
                total_income += amount
                daily_income[date_key] = daily_income.get(date_key, 0) + amount
            else:
                total_expense += amount
                # Category spending only for expenses
                cat = transaction.get("category", "Khac")
                category_spending[cat] = category_spending.get(cat, 0) + amount
                daily_expense[date_key] = daily_expense.get(date_key, 0) + amount

            # Build transaction entry with safe date serialization
            created_iso = trans_date.isoformat()
            transaction_list.append(
                {
                    "transaction_id": doc.id,
                    "amount": amount,
                    "category": transaction.get("category", "Khac"),
                    "note": transaction.get("note", ""),
                    "type": trans_type,
                    "source": transaction.get("source", "manual"),
                    "created_at": created_iso,
                }
            )

        # Sort transactions by date (newest first)
        transaction_list.sort(key=lambda t: t["created_at"], reverse=True)

        # Sort daily spending by date
        sorted_daily_expense = dict(sorted(daily_expense.items()))
        sorted_daily_income = dict(sorted(daily_income.items()))

        # Get category with max spending
        top_category = None
        max_spending = 0.0
        if category_spending:
            top_item = max(category_spending.items(), key=lambda x: x[1])
            max_spending = top_item[1]
            top_category = top_item[0]

        # Calculate trend (simple comparison) for expenses
        trend = None
        if period in ["week", "month"] and len(sorted_daily_expense) > 1:
            dates = list(sorted_daily_expense.keys())
            recent_amount = sorted_daily_expense[dates[-1]]
            previous_amount = sorted_daily_expense[dates[-2]]

            if previous_amount > 0:
                percentage = (
                    (recent_amount - previous_amount) / previous_amount * 100
                )
                trend = {
                    "change_percentage": round(percentage, 1),
                    "direction": "up" if percentage > 0 else "down",
                }
            else:
                trend = {
                    "change_percentage": 100,
                    "direction": "up" if recent_amount > 0 else "neutral",
                }

        print(f"[AnalyticsService] Result: {len(transaction_list)} transactions in period, expense={total_expense}, income={total_income}")

        # Return summary
        return {
            "period": period,
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
            "total_spending": total_expense,  # Legacy field for compatibility
            "total_expense": total_expense,
            "total_income": total_income,
            "net_balance": total_income - total_expense,
            "average_daily_spending": (
                total_expense / len(sorted_daily_expense) if sorted_daily_expense else 0
            ),
            "transaction_count": len(transaction_list),
            "categories": category_spending,
            "top_category": top_category,
            "max_spending": max_spending,
            "daily_spending": sorted_daily_expense,  # Legacy field
            "daily_expense": sorted_daily_expense,
            "daily_income": sorted_daily_income,
            "trend": trend,
            "transactions": transaction_list,
        }

    except ValueError:
        raise
    except Exception as e:
        print(f"[AnalyticsService] ERROR: {str(e)}")
        traceback.print_exc()
        raise  # Propagate error instead of returning None