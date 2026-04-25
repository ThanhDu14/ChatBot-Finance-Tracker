"""
auth_service.py
---------------
Business logic cho Authentication:
  - verify_id_token()  : xac thuc Firebase ID token, tra ve UserInfo
  - revoke_token()     : thu hoi token (neu can dung session-based auth)
"""

from dataclasses import dataclass
from typing import Optional
from firebase_admin import auth
from fastapi import HTTPException


@dataclass
class UserInfo:
    """Thong tin user sau khi xac thuc thanh cong."""
    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None


def verify_id_token(id_token: str) -> UserInfo:
    """
    Xac thuc Firebase ID token gui len tu frontend.

    Args:
        id_token: Firebase ID token (JWT) tu client.

    Returns:
        UserInfo chua uid, email, name, picture.

    Raises:
        HTTPException 401: Token khong hop le hoac het han.
        HTTPException 500: Loi khac trong qua trinh xac thuc.
    """
    try:
        decoded = auth.verify_id_token(id_token)
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid ID token")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Expired ID token")
    except auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="ID token da bi thu hoi")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

    user_id = decoded.get("uid")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: Khong co UID")

    return UserInfo(
        user_id=user_id,
        email=decoded.get("email", ""),
        name=decoded.get("name"),
        picture=decoded.get("picture"),
    )


def revoke_refresh_tokens(user_id: str) -> None:
    """
    Thu hoi tat ca refresh token cua user (dung khi logout phia server).
    Huu ich neu app dung session-based auth hoac muon force logout.

    Args:
        user_id: Firebase UID cua user.
    """
    try:
        auth.revoke_refresh_tokens(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Khong the thu hoi token: {str(e)}")
