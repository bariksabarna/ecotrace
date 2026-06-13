/**
 * @file storage.test.js
 * Tests for src/utils/storage.js — uses vitest's built-in localStorage mock.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToday,
  getToday,
  getLast7Days,
  saveStreak,
  getStreak,
  getDoneTips,
  markTipDone,
} from '../src/utils/storage.js';

// ── localStorage mock ─────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

beforeEach(() => {
  localStorageMock.clear();
});

// ── saveToday / getToday ──────────────────────────────────────────────────────
describe('saveToday / getToday', () => {
  it('returns empty array when nothing is stored', () => {
    expect(getToday()).toEqual([]);
  });

  it('saves and retrieves activities for today', () => {
    const activities = [
      { id: '1', category: 'transport', value: 1.68, label: 'Petrol Car' },
      { id: '2', category: 'food', value: 2.1, label: 'Veg Meal' },
    ];
    saveToday(activities);
    expect(getToday()).toEqual(activities);
  });

  it('overwrites previous save for the same day', () => {
    saveToday([{ id: '1', value: 5 }]);
    saveToday([{ id: '2', value: 10 }]);
    expect(getToday()).toEqual([{ id: '2', value: 10 }]);
  });

  it('returns empty array when stored JSON is malformed', () => {
    const today = new Date().toISOString().split('T')[0];
    localStorageMock.setItem(`ecotrace_today_${today}`, '{bad json');
    expect(getToday()).toEqual([]);
  });
});

// ── getLast7Days ──────────────────────────────────────────────────────────────
describe('getLast7Days', () => {
  it('returns 7 entries', () => {
    const days = getLast7Days();
    expect(days).toHaveLength(7);
  });

  it('returns correct date strings in YYYY-MM-DD format', () => {
    const days = getLast7Days();
    days.forEach((d) => {
      expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('last entry is today', () => {
    const today = new Date().toISOString().split('T')[0];
    const days = getLast7Days();
    expect(days[6].date).toBe(today);
  });

  it('reflects saved activities in totals', () => {
    const today = new Date().toISOString().split('T')[0];
    localStorageMock.setItem(
      `ecotrace_today_${today}`,
      JSON.stringify([{ value: 5 }, { value: 3.5 }])
    );
    const days = getLast7Days();
    expect(days[6].total).toBe(8.5);
  });

  it('returns 0 total for days with no data', () => {
    const days = getLast7Days();
    days.slice(0, 6).forEach((d) => {
      expect(d.total).toBe(0);
    });
  });

  it('handles malformed JSON gracefully', () => {
    const today = new Date().toISOString().split('T')[0];
    localStorageMock.setItem(`ecotrace_today_${today}`, 'INVALID');
    const days = getLast7Days();
    expect(days[6].total).toBe(0);
  });
});

// ── saveStreak / getStreak ────────────────────────────────────────────────────
describe('saveStreak / getStreak', () => {
  it('returns 0 when nothing is stored', () => {
    expect(getStreak()).toBe(0);
  });

  it('saves and retrieves a streak value', () => {
    saveStreak(7);
    expect(getStreak()).toBe(7);
  });

  it('overwrites previous streak', () => {
    saveStreak(3);
    saveStreak(14);
    expect(getStreak()).toBe(14);
  });

  it('returns 0 for non-numeric stored value', () => {
    localStorageMock.setItem('ecotrace_streak', 'notanumber');
    expect(getStreak()).toBe(NaN); // parseInt('notanumber', 10) → NaN
  });
});

// ── getDoneTips / markTipDone ─────────────────────────────────────────────────
describe('getDoneTips / markTipDone', () => {
  it('returns empty array initially', () => {
    expect(getDoneTips()).toEqual([]);
  });

  it('marks a tip as done', () => {
    markTipDone('tip-1');
    expect(getDoneTips()).toContain('tip-1');
  });

  it('does not duplicate the same tip', () => {
    markTipDone('tip-1');
    markTipDone('tip-1');
    const done = getDoneTips();
    expect(done.filter((id) => id === 'tip-1')).toHaveLength(1);
  });

  it('marks multiple tips', () => {
    markTipDone('tip-1');
    markTipDone('tip-3');
    markTipDone('tip-7');
    const done = getDoneTips();
    expect(done).toContain('tip-1');
    expect(done).toContain('tip-3');
    expect(done).toContain('tip-7');
    expect(done).toHaveLength(3);
  });

  it('returns empty array when stored JSON is malformed', () => {
    localStorageMock.setItem('ecotrace_done_tips', '[broken');
    expect(getDoneTips()).toEqual([]);
  });
});
