import { calculateTotal } from './calculator.js';

const PREFIX = 'ecotrace_today_';
const STREAK_KEY = 'ecotrace_streak';
const DONE_TIPS_KEY = 'ecotrace_done_tips';

/**
 * Get date string YYYY-MM-DD for a given Date (or today).
 * @param {Date} [date]
 * @returns {string}
 */
function dateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Save today's activities array to localStorage.
 * @param {Array} activities
 * @returns {void}
 */
export function saveToday(activities) {
  try {
    localStorage.setItem(`${PREFIX}${dateKey()}`, JSON.stringify(activities));
  } catch {
    // localStorage unavailable (private-mode quota exhaustion) — fail silently
  }
}

/**
 * Get today's activities array from localStorage.
 * @returns {Array}
 */
export function getToday() {
  try {
    const raw = localStorage.getItem(`${PREFIX}${dateKey()}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get last 7 days of { date, total } objects, oldest first.
 * @returns {Array<{date: string, total: number}>}
 */
export function getLast7Days() {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    try {
      const raw = localStorage.getItem(`${PREFIX}${key}`);
      const activities = raw ? JSON.parse(raw) : [];
      result.push({ date: key, total: calculateTotal(activities) });
    } catch {
      result.push({ date: key, total: 0 });
    }
  }
  return result;
}

/**
 * Save streak count to localStorage.
 * @param {number} days
 * @returns {void}
 */
export function saveStreak(days) {
  try {
    localStorage.setItem(STREAK_KEY, String(days));
  } catch {
    // fail silently
  }
}

/**
 * Get current streak count from localStorage.
 * @returns {number}
 */
export function getStreak() {
  try {
    const val = localStorage.getItem(STREAK_KEY);
    if (!val) return 0;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

/**
 * Get array of completed tip IDs from localStorage.
 * @returns {Array<string>}
 */
export function getDoneTips() {
  try {
    const raw = localStorage.getItem(DONE_TIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mark a tip as done in localStorage.
 * @param {string} tipId
 * @returns {void}
 */
export function markTipDone(tipId) {
  try {
    const done = getDoneTips();
    if (!done.includes(tipId)) {
      done.push(tipId);
      localStorage.setItem(DONE_TIPS_KEY, JSON.stringify(done));
    }
  } catch {
    // fail silently
  }
}
