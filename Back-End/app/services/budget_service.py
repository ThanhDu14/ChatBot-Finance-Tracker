"""
budget_service.py
-----------------
Business logic cho Budget management:
  - get_budget()        : lấy budget hiện tại của user
  - set_budget()        : đặt/cập nhật budget tháng
  - check_budget_alert(): kiểm tra vượt ngân sách → gửi email
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from firebase_admin import firestore, auth
from fastapi import HTTPException
from dotenv import load_dotenv


def get_budget(user_id: str) -> Optional[Dict[str, Any]]:
    """Lấy budget hiện tại của user."""
    try:
        db = firestore.client()
        doc = db.collection("budgets").document(user_id).get()

        if not doc.exists:
            return None

        data = doc.to_dict()
        return {
            "monthly_budget": data.get("monthly_budget", 0),
            "alert_enabled": data.get("alert_enabled", True),
            "alert_threshold": data.get("alert_threshold", 80),  # % to trigger alert
            "last_alert_sent": data.get("last_alert_sent"),
            "updated_at": data.get("updated_at").isoformat() if data.get("updated_at") else None,
        }
    except Exception as e:
        print(f"[BudgetService] Loi get_budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def set_budget(
    user_id: str,
    monthly_budget: int,
    alert_enabled: bool = True,
    alert_threshold: int = 80,
) -> Dict[str, Any]:
    """Đặt/cập nhật budget tháng cho user."""
    if monthly_budget < 0:
        raise HTTPException(status_code=400, detail="Budget phai >= 0")
    if alert_threshold < 1 or alert_threshold > 100:
        raise HTTPException(status_code=400, detail="Threshold phai tu 1-100")

    try:
        db = firestore.client()
        now = datetime.now(timezone.utc)

        budget_data = {
            "userId": user_id,
            "monthly_budget": monthly_budget,
            "alert_enabled": alert_enabled,
            "alert_threshold": alert_threshold,
            "updated_at": now,
        }

        db.collection("budgets").document(user_id).set(budget_data, merge=True)
        print(f"[BudgetService] Budget set: user={user_id}, budget={monthly_budget:,}d, threshold={alert_threshold}%")

        return {
            "monthly_budget": monthly_budget,
            "alert_enabled": alert_enabled,
            "alert_threshold": alert_threshold,
            "updated_at": now.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[BudgetService] Loi set_budget: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_budget_status(user_id: str) -> Dict[str, Any]:
    """
    Lấy trạng thái budget: budget + tổng chi tiêu tháng hiện tại + phần trăm.
    Nếu vượt threshold → gửi email cảnh báo.
    """
    try:
        db = firestore.client()

        # Get budget
        budget_doc = db.collection("budgets").document(user_id).get()
        if not budget_doc.exists:
            return {
                "has_budget": False,
                "monthly_budget": 0,
                "current_spending": 0,
                "percentage": 0,
                "alert_enabled": False,
                "alert_threshold": 80,
                "is_over_budget": False,
            }

        budget_data = budget_doc.to_dict()
        monthly_budget = budget_data.get("monthly_budget", 0)
        alert_enabled = budget_data.get("alert_enabled", True)
        alert_threshold = budget_data.get("alert_threshold", 80)

        # Calculate current month spending
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Query transactions for this month (only by userId, filter date in Python)
        docs = list(
            db.collection("transactions")
            .where("userId", "==", user_id)
            .stream()
        )

        current_spending = 0
        for doc in docs:
            data = doc.to_dict()
            ts = data.get("timestamp")
            if ts and isinstance(ts, datetime):
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                if ts >= month_start:
                    current_spending += data.get("amount", 0)

        # Calculate percentage
        percentage = round((current_spending / monthly_budget * 100), 1) if monthly_budget > 0 else 0
        is_over_budget = current_spending > monthly_budget
        is_over_threshold = percentage >= alert_threshold

        # Send email alert if over threshold
        if alert_enabled and is_over_threshold:
            last_alert = budget_data.get("last_alert_sent")
            # Only send once per day
            should_send = True
            if last_alert and isinstance(last_alert, datetime):
                if last_alert.tzinfo is None:
                    last_alert = last_alert.replace(tzinfo=timezone.utc)
                if (now - last_alert).total_seconds() < 86400:
                    should_send = False

            if should_send:
                _send_budget_alert_email(
                    user_id, monthly_budget, current_spending, percentage, is_over_budget
                )
                # Update last alert sent
                db.collection("budgets").document(user_id).update({
                    "last_alert_sent": now
                })

        remaining = max(0, monthly_budget - current_spending)

        return {
            "has_budget": True,
            "monthly_budget": monthly_budget,
            "current_spending": current_spending,
            "remaining": remaining,
            "percentage": min(percentage, 100),
            "actual_percentage": percentage,
            "alert_enabled": alert_enabled,
            "alert_threshold": alert_threshold,
            "is_over_budget": is_over_budget,
            "is_over_threshold": is_over_threshold,
        }

    except Exception as e:
        print(f"[BudgetService] Loi get_budget_status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _send_budget_alert_email(
    user_id: str,
    budget: int,
    spending: int,
    percentage: float,
    is_over: bool,
):
    """Gửi email cảnh báo vượt ngân sách qua Gmail SMTP."""
    load_dotenv(override=True)
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")

    if not smtp_email or not smtp_password:
        print("[BudgetService] SMTP chua cau hinh, bo qua gui email.")
        return

    # Get user email from Firebase Auth
    try:
        user_record = auth.get_user(user_id)
        user_email = user_record.email
        user_name = user_record.display_name or "bạn"
    except Exception as e:
        print(f"[BudgetService] Khong lay duoc user email: {e}")
        return

    if not user_email:
        print(f"[BudgetService] User {user_id} khong co email.")
        return

    # Build email
    subject = "⚠️ Cảnh báo ngân sách - Smart Finance Tracker"
    if is_over:
        status_text = f"VƯỢT ngân sách ({percentage:.1f}%)"
        status_color = "#ba1a1a"
    else:
        status_text = f"đạt {percentage:.1f}% ngân sách"
        status_color = "#934700"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #f7f9fb; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #191c1e; font-size: 24px; margin: 0;">💰 Smart Finance Tracker</h1>
        </div>
        
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <p style="color: #414753; font-size: 16px; margin: 0 0 8px;">Xin chào <strong>{user_name}</strong>,</p>
            <p style="color: #414753; font-size: 14px; line-height: 1.6;">
                Chi tiêu tháng này của bạn đã <strong style="color: {status_color};">{status_text}</strong>.
            </p>
            
            <div style="background: #f7f9fb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #727785; font-size: 13px;">Ngân sách tháng</span>
                    <span style="color: #191c1e; font-weight: bold; font-size: 14px;">{budget:,.0f} ₫</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                    <span style="color: #727785; font-size: 13px;">Đã chi tiêu</span>
                    <span style="color: {status_color}; font-weight: bold; font-size: 14px;">{spending:,.0f} ₫</span>
                </div>
                <div style="background: #e0e3e5; border-radius: 8px; height: 8px; overflow: hidden;">
                    <div style="background: {status_color}; height: 100%; width: {min(percentage, 100):.0f}%; border-radius: 8px;"></div>
                </div>
                <p style="text-align: center; color: {status_color}; font-weight: bold; font-size: 18px; margin: 12px 0 0;">{percentage:.1f}%</p>
            </div>
            
            <p style="color: #727785; font-size: 12px; text-align: center; margin: 0;">
                Email tự động từ Smart Finance Tracker. Bạn có thể tắt thông báo trong phần cài đặt ngân sách.
            </p>
        </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_email
    msg["To"] = user_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
        print(f"[BudgetService] Email alert sent to {user_email}")
    except Exception as e:
        print(f"[BudgetService] Loi gui email: {e}")
