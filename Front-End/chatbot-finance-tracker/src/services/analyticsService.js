/**
 * analyticsService.js — Frontend service layer cho Analytics API
 *
 * Gọi backend endpoint:
 *   GET /analytics/v1/summary?user_id=...&period=...
 *
 * Response shape:
 *   { period, start_date, end_date, total_spending, average_daily_spending,
 *     transaction_count, categories, top_category, max_spending,
 *     daily_spending, trend, transactions }
 */

import { apiRequest } from './api';

/**
 * Lấy analytics summary cho user theo khoảng thời gian.
 *
 * @param {string} userId  — Firebase UID
 * @param {string} period  — 'today' | 'week' | 'month' | 'year'
 * @param {AbortSignal} [signal] — Optional abort signal
 * @returns {Promise<Object>}
 */
export async function getAnalyticsSummary(userId, period = 'month', signal) {
  const params = new URLSearchParams({ user_id: userId, period });
  return apiRequest(`/analytics/v1/summary?${params.toString()}`, { signal });
}
