/**
 * useAnalytics.js — Custom hook quản lý analytics data
 *
 * Usage:
 *   const { data, loading, error, refetch } = useAnalytics(userId, period);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAnalyticsSummary } from '../services/analyticsService';

export function useAnalytics(userId, period = 'month') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await getAnalyticsSummary(userId, period, controller.signal);
      // Only update state if this request wasn't aborted
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[useAnalytics] Error:', err);
        setError(err.message || 'Không thể tải dữ liệu analytics');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [userId, period]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
