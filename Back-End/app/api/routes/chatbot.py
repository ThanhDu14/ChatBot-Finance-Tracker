"""
routes/chatbot.py
-----------------
Dinh nghia cac API endpoint cho Chatbot.
Tat ca business logic duoc uy quyen cho chatbot_service.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
import asyncio

from app.services.chatbot_service import (
    upload_to_cloudinary,
    analyze_image_url,
    analyze_image_bytes,
    analyze_text,
    EMPTY_RESPONSE,
)

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


class ChatRequest(BaseModel):
    user_id: str
    message: Optional[str] = ""
    image_url: Optional[str] = None


# ══════════════════════════════════════════════════════════════════════════════
#  POST /chatbot/upload
#  Nhan file anh → upload Cloudinary → tra { url, public_id }
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        result = await asyncio.to_thread(
            upload_to_cloudinary,
            file_bytes,
            file.filename,
            file.content_type or "image/jpeg"
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  POST /chatbot/chat
#  Xu ly chat chinh: image_url → Gemini Vision | message → Gemini text
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/chat")
async def process_chat(request: ChatRequest):
    try:
        if request.image_url:
            return await asyncio.to_thread(
                analyze_image_url,
                request.image_url,
                request.message or ""
            )

        if request.message and request.message.strip():
            return await asyncio.to_thread(analyze_text, request.message)

        return EMPTY_RESPONSE

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(status_code=429, detail="Vuot gioi han API Gemini. Thu lai sau it phut!")
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════════════════════════
#  POST /chatbot/chat-upload
#  Full pipeline: file upload → Gemini Vision (dung de test Postman)
# ══════════════════════════════════════════════════════════════════════════════
@router.post("/chat-upload")
async def chat_with_upload(
    user_id: str = "test_user",
    message: str = "",
    file: UploadFile = File(None)
):
    try:
        if file and file.filename:
            file_bytes = await file.read()
            return await asyncio.to_thread(
                analyze_image_bytes,
                file_bytes,
                file.content_type or "image/jpeg",
                message
            )

        if message.strip():
            return await asyncio.to_thread(analyze_text, message)

        return EMPTY_RESPONSE

    except HTTPException:
        raise
    except Exception as e:
        import traceback; traceback.print_exc()
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            raise HTTPException(status_code=429, detail="Vuot gioi han API Gemini.")
        raise HTTPException(status_code=500, detail=str(e))
