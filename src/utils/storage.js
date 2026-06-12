import { calculateTotal } from './calculator.js';

const PREFIX = 'ecotrace_today_';
const STREAK_KEY = 'ecotrace_streak';
const DONE_TIPS_KEY = 'ecotrace_done_tips';

/**
 * Get date string YYYY-MM-DD for a given Date (or today).
 */
function dateKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Save today's activities array.
 * @param {Array} activities
 */
export function saveToday(activities) {
  try {
    localStorage.setItem(`${PREFIX}${dateKey()}`, JSON.stringify(activities));
  } catch (e) {
    console.error('saveToday error:', e);
  }
}

/**
 * Get today's activities array.
 * @returns {Array}
 */
export function getToday() {
  try {
    const raw = localStorage.getItem(`${PREFIX}${dateKey()}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Get last 7 days of { date, total } objects.
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
 * Save streak count.
 * @param {number} days
 */
export function saveStreak(days) {
  try {
    localStorage.setItem(STREAK_KEY, String(days));
  } catch (e) {
    console.error('saveStreak error:', e);
  }
}

/**
 * Get current streak count.
 * @returns {number}
 */
export function getStreak() {
  try {
    const val = localStorage.getItem(STREAK_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Get array of done tip IDs.
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
 * Mark a tip as done.
 * @param {string} tipId
 */
export function markTipDone(tipId) {
  try {
    const done = getDoneTips();
    if (!done.includes(tipId)) {
      done.push(tipId);
      localStorage.setItem(DONE_TIPS_KEY, JSON.stringify(done));
    }
  } catch (e) {
    console.error('markTipDone error:', e);
  }
}
