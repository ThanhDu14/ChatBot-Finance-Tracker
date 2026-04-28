/**
 * api.js — Base HTTP client
 * Cấu hình chung: base URL, headers, error handling
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Wrapper fetch với base URL và xử lý lỗi chuẩn.
 * @param {string} endpoint  — VD: '/chatbot/chat'
 * @param {RequestInit} options — fetch options (method, body, signal, ...)
 * @returns {Promise<any>}   — parsed JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      // Không set Content-Type cho FormData (browser tự set multipart boundary)
      ...(options.body instanceof FormData
        ? {}
        : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error.detail || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}
