/**
 * budgetService.js — Frontend service layer cho Budget API
 */

const API_BASE = 'http://localhost:8000';

export async function getBudgetStatus(userId) {
  const res = await fetch(`${API_BASE}/budget/status?user_id=${userId}`);
  if (!res.ok) throw new Error(`Budget status error: ${res.status}`);
  return res.json();
}

export async function getBudget(userId) {
  const res = await fetch(`${API_BASE}/budget?user_id=${userId}`);
  if (!res.ok) throw new Error(`Get budget error: ${res.status}`);
  return res.json();
}

export async function setBudget({ userId, monthlyBudget, alertEnabled = true, alertThreshold = 80 }) {
  const res = await fetch(`${API_BASE}/budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      monthly_budget: monthlyBudget,
      alert_enabled: alertEnabled,
      alert_threshold: alertThreshold,
    }),
  });
  if (!res.ok) throw new Error(`Set budget error: ${res.status}`);
  return res.json();
}
