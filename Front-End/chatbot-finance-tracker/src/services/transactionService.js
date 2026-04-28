/**
 * transactionService.js — Frontend service layer cho Transaction API
 *
 * Endpoints:
 *   GET    /transactions?user_id=...&page=...&category=...&search=...
 *   PUT    /transactions/:id
 *   DELETE /transactions/:id?user_id=...
 */

import { apiRequest } from './api';

/**
 * Lấy danh sách giao dịch với phân trang + filter.
 */
export async function getTransactions({ userId, page = 1, pageSize = 10, category, search }) {
  const params = new URLSearchParams({ user_id: userId, page, page_size: pageSize });
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  return apiRequest(`/transactions?${params.toString()}`);
}

/**
 * Cập nhật giao dịch.
 */
export async function updateTransaction(transactionId, { userId, amount, category, note }) {
  return apiRequest(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      user_id: userId,
      ...(amount !== undefined && { amount }),
      ...(category !== undefined && { category }),
      ...(note !== undefined && { note }),
    }),
  });
}

/**
 * Xóa giao dịch.
 */
export async function deleteTransaction(transactionId, userId) {
  return apiRequest(`/transactions/${transactionId}?user_id=${userId}`, {
    method: 'DELETE',
  });
}
