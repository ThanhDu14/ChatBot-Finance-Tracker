from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import firebase_admin
from firebase_admin import auth, credentials
import os

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Models
class LoginRequest(BaseModel):
    id_token: str

class LoginResponse(BaseModel):
    message: str
    user_id: str
    email: str
    name: str | None = None
    picture: str | None = None

# API Endpoint
@router.post("/login", response_model=LoginResponse)
async def login_with_google(request: LoginRequest):
    """
    Verify Google ID token sent from frontend and log the user in.
    """
    try:
        # Verify the ID token using Firebase Admin SDK
        decoded_token = auth.verify_id_token(request.id_token)
        
        user_id = decoded_token.get("uid")
        email = decoded_token.get("email")
        name = decoded_token.get("name")
        picture = decoded_token.get("picture")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: No UID found")

        # Here you could check if the user exists in your own database,
        # create a session cookie, or issue your own JWT if needed.
        # For now, we simply return success.

        return LoginResponse(
            message="Successfully logged in",
            user_id=user_id,
            email=email,
            name=name,
            picture=picture
        )

    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid ID token")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Expired ID token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

@router.post("/logout")
async def logout():
    """
    Handle user logout on the backend.
    In a stateless JWT setup (like Firebase), the frontend handles token deletion.
    If using session cookies, this endpoint would clear them.
    """

    return {"message": "Successfully logged out"}
