"""
chatbot_service.py
------------------
Business logic cho chatbot:
  - upload_to_cloudinary()   : upload anh len Cloudinary
  - analyze_image_url()      : tai anh tu URL → Gemini Vision
  - analyze_image_bytes()    : anh bytes → Gemini Vision
  - analyze_text()           : text → Gemini
"""

import os
import json
import re
import requests
from google import genai
from google.genai import types, errors
from dotenv import load_dotenv
from fastapi import HTTPException

# ─────────────────────────────────────────────────────────────────────────────
#  System Prompt
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """
Bạn là một trợ lý quản lý tài chính có cá tính, hài hước và cực kỳ thông minh. 
Tính cách của bạn:
- Thân thiện nhưng đôi khi cũng biết "cà khịa" nhẹ nhàng để giúp người dùng tỉnh táo về tài chính.
- Gọi người dùng là "Sếp", "Chủ nhân" hoặc "Đại gia".
- Sử dụng nhiều emoji để tin nhắn sinh động.
- Nếu chi tiêu cho "Ăn uống" quá nhiều, hãy nhắc nhở về vòng eo hoặc ví tiền một cách hài hước.
- Nếu là "Mua sắm", hãy hỏi xem đây là "nhu cầu" hay "đam mê nhất thời".
- Nếu chi tiêu cho "Y tế" hoặc "Giáo dục", hãy động viên và khen ngợi hết lời.

Nhiệm vụ: Trích xuất thông tin giao dịch từ tin nhắn văn bản hoặc ảnh hóa đơn.

Luôn trả về định dạng JSON sau:
{
  "amount": <số nguyên, số tiền VND>,
  "category": "<An uong | Di chuyen | Mua sam | Giai tri | Y te | Giao duc | Tien ich | Khac>",
  "note": "<ghi chú ngắn gọn>",
  "reply_message": "<lời phản hồi hài hước, cá tính bằng tiếng Việt>"
}

Lưu ý: 
- Nếu không thấy số tiền, amount là 0 và reply_message sẽ hỏi lại sếp một cách dí dỏm.
- Nếu là ảnh, hãy đọc tổng tiền cuối cùng.
"""


# ─────────────────────────────────────────────────────────────────────────────
#  Internal helpers
# ─────────────────────────────────────────────────────────────────────────────
def _get_gemini_client() -> genai.Client:
    load_dotenv(override=True)
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Thieu GOOGLE_API_KEY trong .env")
    return genai.Client(api_key=api_key)


def _parse_json(raw_text: str) -> dict:
    """Parse JSON tu response cua Gemini, co xu ly markdown code block."""
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw_text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise ValueError(f"Khong the parse JSON tu Gemini: {raw_text[:200]}")


def _gemini_config() -> types.GenerateContentConfig:
    return types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0,
        response_mime_type="application/json",
    )


# ─────────────────────────────────────────────────────────────────────────────
#  Public service functions
# ─────────────────────────────────────────────────────────────────────────────

def upload_to_cloudinary(file_bytes: bytes, filename: str, content_type: str) -> dict:
    """
    Upload anh len Cloudinary bang unsigned preset.
    Returns: { "url": str, "public_id": str }
    """
    load_dotenv(override=True)
    cloud_name    = os.getenv("CLOUDINARY_CLOUD_NAME")
    upload_preset = os.getenv("CLOUDINARY_UPLOAD_PRESET")

    if not cloud_name or not upload_preset:
        raise HTTPException(
            status_code=500,
            detail="Cloudinary chua cau hinh. Kiem tra CLOUDINARY_CLOUD_NAME va CLOUDINARY_UPLOAD_PRESET trong .env"
        )

    print(f"[ChatbotService] upload_to_cloudinary: {filename} ({len(file_bytes)} bytes)")

    resp = requests.post(
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload",
        data={"upload_preset": upload_preset},
        files={"file": (filename, file_bytes, content_type)},
        timeout=30
    )

    if not resp.ok:
        raise HTTPException(status_code=502, detail=f"Cloudinary loi: {resp.text}")

    data = resp.json()
    print(f"[ChatbotService] upload_to_cloudinary: thanh cong → {data['secure_url']}")
    return {"url": data["secure_url"], "public_id": data.get("public_id")}


def analyze_image_url(image_url: str, message: str = "") -> dict:
    """
    Tai anh tu URL, gui len Gemini Vision de phan tich.
    Returns: { amount, category, note, reply_message }
    """
    print(f"[ChatbotService] analyze_image_url: {image_url}")

    img_resp = requests.get(image_url, timeout=15)
    if not img_resp.ok:
        raise HTTPException(status_code=400, detail=f"Khong tai duoc anh tu URL: {image_url}")

    img_bytes = img_resp.content
    mime_type = img_resp.headers.get("Content-Type", "image/jpeg").split(";")[0]
    print(f"[ChatbotService] Tai anh xong: {len(img_bytes)} bytes, type={mime_type}")

    return analyze_image_bytes(img_bytes, mime_type, message)


def analyze_image_bytes(img_bytes: bytes, mime_type: str, message: str = "") -> dict:
    """
    Gui anh bytes truc tiep len Gemini Vision de phan tich.
    Returns: { amount, category, note, reply_message }
    """
    print(f"[ChatbotService] analyze_image_bytes: {len(img_bytes)} bytes, type={mime_type}")

    client = _get_gemini_client()

    parts = [types.Part.from_bytes(data=img_bytes, mime_type=mime_type)]
    if message:
        parts.append(types.Part.from_text(text=f"Ghi chu them cua nguoi dung: {message}"))

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[types.Content(role="user", parts=parts)],
            config=_gemini_config()
        )
        result = _parse_json(response.text.strip())
        print(f"[ChatbotService] analyze_image_bytes: ket qua → {json.dumps(result, ensure_ascii=False)}")
        return result
    except errors.ServerError as e:
        print(f"[ChatbotService] ServerError (503): {e}")
        return {
            "amount": 0,
            "category": "Khac",
            "note": "Lỗi kết nối AI",
            "reply_message": "Sếp ơi, máy chủ AI đang bận tí xíu (lỗi 503). Sếp thử gửi lại ảnh sau 5-10 giây nhé! 🙏"
        }
    except Exception as e:
        print(f"[ChatbotService] analyze_image_bytes error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def analyze_text(text: str) -> dict:
    """
    Phan tich tin nhan van ban thuan tuy Gemini.
    Returns: { amount, category, note, reply_message }
    """
    print(f"[ChatbotService] analyze_text: {text[:80]!r}")

    client = _get_gemini_client()
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=text,
            config=_gemini_config()
        )
        result = _parse_json(response.text.strip())
        print(f"[ChatbotService] analyze_text: ket qua → {json.dumps(result, ensure_ascii=False)}")
        return result
    except errors.ServerError as e:
        print(f"[ChatbotService] ServerError (503): {e}")
        return {
            "amount": 0,
            "category": "Khac",
            "note": "Lỗi kết nối AI",
            "reply_message": "Ối, Sếp ơi! Google đang quá tải nên em hơi 'đứng hình' tí. Sếp chat lại với em sau vài giây nhé! ❤️"
        }
    except Exception as e:
        print(f"[ChatbotService] analyze_text error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
#  Default response khi khong co input
# ─────────────────────────────────────────────────────────────────────────────
EMPTY_RESPONSE = {
    "amount": 0,
    "category": "Khac",
    "note": "",
    "reply_message": "Minh chua nhan duoc thong tin gi. Hay nhap chi tieu hoac gui anh hoa don nhe!"
}
