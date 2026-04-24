# 🚀 Dự án: Smart Finance Tracker - Dashboard & AI Chatbot OCR

Hệ thống quản lý tài chính cá nhân thông minh kết hợp AI để tự động phân loại chi tiêu từ hóa đơn ảnh chụp.

---

## 🏗️ Kiến trúc tổng thể (Tech Stack)
- **Front-End:** React (Vite), Tailwind CSS, Lucide Icons, Recharts (vẽ biểu đồ).
- **Back-End:** Python (FastAPI).
- **AI Engine:** Gemini API (đọc hiểu ngữ cảnh) & PaddleOCR (trích xuất văn bản thô - tùy chọn).
- **Cloud/Database:** Firebase (Auth, Firestore, Storage).

---

## 📱 Cấu trúc các trang Front-End (React-Vite)

### 1. Page: Login (Đăng nhập)
- **Chức năng:** Sử dụng Firebase Auth (Google Provider).
- **Giao diện:** - Nút "Đăng nhập với Google".
    - Hình nền hoặc minh họa về quản lý tài chính.
- **Logic:** Sau khi đăng nhập thành công, lưu `uid` của user vào Context/Redux để quản lý phiên làm việc.

### 2. Page: Dashboard (Bảng điều khiển)
Đây là trang trung tâm để user theo dõi dòng tiền.
- **Thống kê tổng quan:** Tổng thu, tổng chi, số dư hiện tại.
- **Biểu đồ (Recharts):**
    - Biểu đồ tròn (Pie Chart): Phân bổ chi tiêu theo hạng mục (Ăn uống, Di chuyển, Shopping...).
    - Biểu đồ cột/đường (Bar/Line Chart): Xu hướng chi tiêu theo ngày/tháng.
- **Danh sách giao dịch:** Hiển thị các khoản chi gần đây, có bộ lọc theo ngày.

### 3. Component: Chatbot Widget
Một cửa sổ chat nhỏ hiện ở góc màn hình hoặc một trang riêng.
- **Giao diện:** Khung chat realtime.
- **Nút Upload:** Cho phép chọn ảnh hóa đơn (Bill).
- **Luồng xử lý:** 1. User gửi ảnh.
    2. React upload ảnh lên Firebase Storage -> Lấy URL.
    3. Gửi URL ảnh sang Python Backend.
    4. Nhận kết quả JSON từ Backend và hiển thị xác nhận cho User.

---

## 🐍 Cấu trúc Back-End (Python FastAPI)

Hệ thống API điều phối giữa AI và Database.

### 1. Endpoint: `/process-bill` (POST)
- **Đầu vào:** URL ảnh từ Firebase Storage.
- **Xử lý:**
    - Bước 1: (Tùy chọn) Dùng `PaddleOCR` để lấy text nếu ảnh mờ.
    - Bước 2: Gọi `Gemini API` với Prompt chuyên dụng để trích xuất: Tên shop, Tổng tiền, Hạng mục, Danh sách món.
- **Đầu ra:** Trả về JSON sạch cho Front-End.

### 2. Endpoint: `/sync-data` (POST)
- Nhận dữ liệu đã xác nhận từ User và ghi trực tiếp vào **Firestore**.

---

## 💾 Cấu trúc Cơ sở dữ liệu (Firestore)

- **Collection `users`**:
    - `uid`: ID định danh.
    - `email`, `displayName`.
    - `budget`: Hạn mức chi tiêu tháng.
- **Collection `transactions`**:
    - `userId`: Liên kết với user.
    - `amount`: Số tiền.
    - `category`: Hạng mục (Gemini tự phân loại).
    - `timestamp`: Thời gian giao dịch.
    - `imageUrl`: Link ảnh hóa đơn gốc trên Storage.
    - `note`: Ghi chú thêm.

---

## 🛠️ Danh sách việc cần làm ngay (To-do List)

- [ ] **Giai đoạn 1:** Khởi tạo Project Firebase, bật Google Auth và Firestore.
- [ ] **Giai đoạn 2:** Viết trang Login và Setup Router trong React.
- [ ] **Giai đoạn 3:** Viết Backend FastAPI kết nối Gemini API (thử nghiệm trích xuất JSON).
- [ ] **Giai đoạn 4:** Làm Component Chatbot, xử lý upload ảnh lên Firebase Storage.
- [ ] **Giai đoạn 5:** Dùng Recharts vẽ biểu đồ Dashboard dựa trên dữ liệu thật từ Firestore.

---

## 💡 Lưu ý bảo mật
- Không lưu `API_KEY` của Gemini ở Front-End, luôn để ở file `.env` phía Backend.
- Sử dụng **Firebase Security Rules** để đảm bảo user này không đọc được dữ liệu của user kia.
