/**
 * chatbotService.js — Frontend service layer cho Chatbot API
 *
 * Tập trung tất cả HTTP calls liên quan đến chatbot:
 *   - uploadImage()      : upload ảnh lên Cloudinary qua backend
 *   - sendMessage()      : gửi tin nhắn + image_url tới Gemini
 *   - saveTransaction()  : lưu giao dịch đã xác nhận qua backend
 */

import { apiRequest } from './api';

/**
 * Upload ảnh lên Cloudinary qua backend proxy.
 *
 * @param {File}        file    — File object từ input[type="file"]
 * @param {AbortSignal} signal  — AbortController.signal để hủy khi cần
 * @returns {Promise<string>}   — Cloudinary secure_url
 */
export async function uploadImage(file, signal) {
  const formData = new FormData();
  formData.append('file', file);

  const data = await apiRequest('/chatbot/upload', {
    method: 'POST',
    body: formData,
    signal,
  });

  return data.url; // Cloudinary secure_url
}

/**
 * Gửi tin nhắn văn bản và/hoặc URL ảnh đến backend chatbot.
 * Backend sẽ dùng Gemini Vision (nếu có ảnh) hoặc Gemini text.
 *
 * @param {object} params
 * @param {string} params.userId        — Firebase UID của user
 * @param {string} params.message       — Tin nhắn văn bản (có thể rỗng)
 * @param {string|null} params.imageUrl — Cloudinary URL (null nếu không có ảnh)
 * @param {AbortSignal} params.signal   — AbortController.signal
 * @returns {Promise<{amount: number, category: string, note: string, reply_message: string}>}
 */
export async function sendMessage({ userId, message, imageUrl, signal }) {
  return apiRequest('/chatbot/chat', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      message: message || '',
      image_url: imageUrl || null,
    }),
    signal,
  });
}

/**
 * Lưu giao dịch xác nhận vào Firestore qua backend.
 * Backend sẽ validate, lưu và tự động mark chat message là confirmed.
 *
 * @param {object} params
 * @param {string} params.userId         — Firebase UID
 * @param {number} params.amount         — Số tiền VND (> 0)
 * @param {string} params.category       — Hạng mục chi tiêu
 * @param {string} params.note           — Ghi chú
 * @param {string|null} params.chatMessageId — Firestore ID của tin nhắn chat
 * @returns {Promise<{ transaction_id, amount, category, note, created_at, message }>}
 */
export async function saveTransaction({ userId, amount, category, note, chatMessageId }) {
  return apiRequest('/transactions', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      amount,
      category,
      note: note || '',
      chat_message_id: chatMessageId || null,
    }),
  });
}

