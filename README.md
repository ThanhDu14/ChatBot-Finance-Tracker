# Smart Finance Tracker - Dashboard & AI Chatbot OCR

## Thông tin sinh viên
- **Họ và tên:** Nguyễn Thành Dự
- **Mã số sinh viên:** 24120288
- **Lớp / Khóa:** 24CTT3

## Tên mô hình và liên kết
- **Tên mô hình:** Google Gemini 1.5 Flash / Gemini 2.0 Flash
- **Công nghệ AI:** Google GenAI SDK
- **Liên kết tài liệu:** [Google Gemini API Docs](https://ai.google.dev/docs)

## Mô tả ngắn về chức năng của hệ thống
Hệ thống là một ứng dụng quản lý tài chính cá nhân thông minh, tích hợp AI Chatbot để giúp người dùng theo dõi chi tiêu một cách tự động và thú vị.
- **AI Chatbot (Financial Butler):** Trò chuyện với người dùng bằng phong cách hài hước, cá tính (gọi người dùng là "Sếp", "Đại gia").
- **OCR Hóa đơn:** Tự động nhận diện và trích xuất thông tin từ ảnh chụp hóa đơn (Số tiền, Hạng mục, Ghi chú) bằng mô hình Gemini Vision.
- **Dashboard trực quan:** Thống kê tổng quan thu chi, số dư và hiển thị biểu đồ phân bổ chi tiêu (Pie Chart, Bar Chart) sử dụng Recharts.
- **Đồng bộ đám mây:** Dữ liệu giao dịch được lưu trữ trên Firebase Firestore và hình ảnh hóa đơn được quản lý qua Cloudinary.

## Hướng dẫn cài đặt thư viện

### 1. Cài đặt Back-End (Python FastAPI)
Yêu cầu Python 3.9+. 

1. Di chuyển vào thư mục `Back-End`:
   ```bash
   cd Back-End
   ```

2. Tạo môi trường ảo (Virtual Environment):
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```

4. Cấu hình môi trường:
   - Sao chép file `.env.example` thành `.env`:
     ```bash
     cp .env.example .env
     ```
   - Mở file `.env` và điền đầy đủ các thông số (API Key, Firebase Credentials, Cloudinary, Email).

### 2. Cài đặt Front-End (React Vite)
Yêu cầu Node.js. 

1. Di chuyển vào thư mục `Front-End/chatbot-finance-tracker`:
   ```bash
   cd Front-End/chatbot-finance-tracker
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

## Hướng dẫn chạy chương trình

### 1. Chạy Back-End
Tại thư mục `Back-End`, khởi chạy server FastAPI:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Server sẽ chạy tại: `http://127.0.0.1:8000`

### 2. Chạy Front-End
Tại thư mục `Front-End/chatbot-finance-tracker`, khởi chạy môi trường phát triển:
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:5173` (hoặc port được hiển thị trong terminal).

## Hướng dẫn gọi API và ví dụ request/response

Hệ thống cung cấp các API Endpoint chính cho Chatbot:

### 1. `POST /chatbot/upload`
- **Chức năng:** Tải ảnh hóa đơn lên Cloudinary để lấy URL xử lý.
- **Tham số:** `file` (form-data) - File hình ảnh.
- **Response mẫu:**
  ```json
  {
      "url": "https://res.cloudinary.com/.../image.jpg",
      "public_id": "temp_id_123"
  }
  ```

### 2. `POST /chatbot/chat`
- **Chức năng:** Gửi tin nhắn văn bản hoặc URL ảnh hóa đơn để AI phân tích giao dịch.
- **Request mẫu (Văn bản):**
  ```json
  {
      "user_id": "user_123",
      "message": "Sếp vừa đi ăn lẩu hết 500k"
  }
  ```
- **Response mẫu:**
  ```json
  {
      "amount": 500000,
      "category": "An uong",
      "note": "Ăn lẩu",
      "reply_message": "Ối sếp ơi, 500k cho một bữa lẩu à? Vòng eo của sếp đang 'biểu tình' đấy, nhưng ví tiền thì vẫn còn ổn áp lắm! 🍲💸"
  }
  ```

### 3. `GET /analytics/summary/{user_id}`
- **Chức năng:** Lấy dữ liệu tổng hợp thu chi để hiển thị trên Dashboard.
- **Response mẫu:**
  ```json
  {
      "total_income": 20000000,
      "total_expense": 5000000,
      "balance": 15000000,
      "categories": [
          {"name": "An uong", "value": 1200000},
          {"name": "Mua sam", "value": 800000}
      ]
  }
  ```

## Liên kết video demo
- **Video Demo:** [Link Google Drive / YouTube của bạn]
