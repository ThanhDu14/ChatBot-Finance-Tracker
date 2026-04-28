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
            start = now - timedelta(days=7)
            end = now
        elif period == "month":
            start = now - timedelta(days=30)
            end = now
        elif period == "year":
            start = now - timedelta(days=365)
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
        total_spending = 0.0
        category_spending: Dict[str, float] = {}
        daily_spending: Dict[str, float] = {}
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
            total_spending += amount

            # Category spending
            cat = transaction.get("category", "Khac")
            category_spending[cat] = category_spending.get(cat, 0) + amount

            # Daily spending — convert to date string key
            date_key = trans_date.strftime("%Y-%m-%d")
            daily_spending[date_key] = daily_spending.get(date_key, 0) + amount

            # Build transaction entry with safe date serialization
            created_iso = trans_date.isoformat()
            transaction_list.append(
                {
                    "transaction_id": doc.id,
                    "amount": amount,
                    "category": cat,
                    "note": transaction.get("note", ""),
                    "source": transaction.get("source", "manual"),
                    "created_at": created_iso,
                }
            )

        # Sort transactions by date (newest first)
        transaction_list.sort(key=lambda t: t["created_at"], reverse=True)

        # Sort daily spending by date
        sorted_daily = dict(sorted(daily_spending.items()))

        # Get category with max spending
        top_category = None
        max_spending = 0.0
        if category_spending:
            top_item = max(category_spending.items(), key=lambda x: x[1])
            max_spending = top_item[1]
            top_category = top_item[0]

        # Calculate trend (simple comparison)
        trend = None
        if period in ["week", "month"] and len(sorted_daily) > 1:
            dates = list(sorted_daily.keys())
            recent_amount = sorted_daily[dates[-1]]
            previous_amount = sorted_daily[dates[-2]]

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

        print(f"[AnalyticsService] Result: {len(transaction_list)} transactions in period, total={total_spending}")

        # Return summary
        return {
            "period": period,
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": end.strftime("%Y-%m-%d"),
            "total_spending": total_spending,
            "average_daily_spending": (
                total_spending / len(sorted_daily) if sorted_daily else 0
            ),
            "transaction_count": len(transaction_list),
            "categories": category_spending,
            "top_category": top_category,
            "max_spending": max_spending,
            "daily_spending": sorted_daily,
            "trend": trend,
            "transactions": transaction_list,
        }

    except ValueError:
        raise
    except Exception as e:
        print(f"[AnalyticsService] ERROR: {str(e)}")
        traceback.print_exc()
        raise  # Propagate error instead of returning None