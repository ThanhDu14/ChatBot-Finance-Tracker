"""
routes/auth.py
--------------
Dinh nghia cac API endpoint cho Authentication.
Tat ca business logic duoc uy quyen cho auth_service.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.auth_service import verify_id_token, revoke_refresh_tokens

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ─────────────────────────────────────────────
#  Request / Response schemas
# ─────────────────────────────────────────────
class LoginRequest(BaseModel):
    id_token: str

class LoginResponse(BaseModel):
    message: str
    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None

class LogoutRequest(BaseModel):
    user_id: Optional[str] = None  # Truyen uid neu muon revoke token phia server


# ─────────────────────────────────────────────
#  POST /auth/login
# ─────────────────────────────────────────────
@router.post("/login", response_model=LoginResponse)
async def login_with_google(request: LoginRequest):
    """
    Xac thuc Firebase ID token gui len tu frontend.
    Tra ve thong tin user neu token hop le.
    """
    user = verify_id_token(request.id_token)

    return LoginResponse(
        message="Successfully logged in",
        user_id=user.user_id,
        email=user.email,
        name=user.name,
        picture=user.picture,
    )


# ─────────────────────────────────────────────
#  POST /auth/logout
# ─────────────────────────────────────────────
@router.post("/logout")
async def logout(request: LogoutRequest = LogoutRequest()):
    """
    Xu ly logout phia server.
    - Neu truyen user_id: thu hoi tat ca refresh token (force logout).
    - Neu khong truyen: chi tra ve thanh cong (frontend tu xoa token).
    """
    if request.user_id:
        revoke_refresh_tokens(request.user_id)
        return {"message": "Successfully logged out and tokens revoked"}

    return {"message": "Successfully logged out"}
