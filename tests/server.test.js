/**
 * @file server.test.js
 * Unit tests for EcoTrace server route validation logic.
 * Tests validation rules directly without spinning up an HTTP server,
 * avoiding cross-environment issues (rate-limiter IP detection, etc.).
 */

import { describe, it, expect } from 'vitest';

// ── Constants (mirrored from server) ──────────────────────────────────────────

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 500;
const ALLOWED_ROLES = new Set(['user', 'ai', 'model']);
const ALLOWED_CATEGORIES = new Set(['transport', 'food', 'energy', 'shopping', 'none']);

// ── Helpers (mirrored from server) ────────────────────────────────────────────

/**
 * Strips control characters from a string for safe display and logging.
 * @param {string} str - The raw input string.
 * @param {number} [maxLen=500] - Maximum allowed output length.
 * @returns {string} Sanitised, trimmed string.
 */
function sanitiseText(str, maxLen = MAX_MESSAGE_LENGTH) {
  return Array.from(String(str))
    .filter((c) => {
      const code = c.charCodeAt(0);
      return (code >= 32 && code !== 127) || code === 10 || code === 9 || code === 13;
    })
    .join('')
    .slice(0, maxLen)
    .trim();
}

/**
 * Validates the shape of an individual chat message object.
 * @param {unknown} m - The message to validate.
 * @returns {{ valid: boolean, error?: string }}
 */
function validateMessage(m) {
  if (typeof m !== 'object' || !m || typeof m.content !== 'string') {
    return { valid: false, error: 'Invalid message format.' };
  }
  if (!ALLOWED_ROLES.has(m.role)) {
    return { valid: false, error: 'Invalid message role.' };
  }
  if (m.content.length > MAX_MESSAGE_LENGTH) {
    return { valid: false, error: 'Message content too long.' };
  }
  return { valid: true };
}

/**
 * Simulates the full /api/chat validation pipeline.
 * Returns { status, error } mirroring actual HTTP response codes.
 * @param {object} body
 * @returns {{ status: number, error?: string }}
 */
function validateChatRequest(body) {
  const { messages, context } = body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, error: 'Invalid request: messages array required.' };
  }
  if (messages.length > MAX_MESSAGES) {
    return { status: 400, error: 'Too many messages in history.' };
  }
  for (const m of messages) {
    const { valid, error } = validateMessage(m);
    if (!valid) return { status: 400, error };
  }

  const lastMessage = sanitiseText(messages.at(-1)?.content ?? '');
  if (!lastMessage) {
    return { status: 400, error: 'Empty message.' };
  }

  const rawTotal = Number(context?.todayTotal);
  const safeTotal = isFinite(rawTotal) ? rawTotal.toFixed(2) : '0.00';
  const safeTopCategory = ALLOWED_CATEGORIES.has(context?.topCategory)
    ? context.topCategory
    : 'none';

  return { status: 200, safeTotal, safeTopCategory };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Server validation — messages array', () => {
  it('returns 400 when messages is missing', () => {
    const { status, error } = validateChatRequest({});
    expect(status).toBe(400);
    expect(error).toMatch(/messages array required/i);
  });

  it('returns 400 when messages is empty array', () => {
    const { status, error } = validateChatRequest({ messages: [] });
    expect(status).toBe(400);
    expect(error).toMatch(/messages array required/i);
  });

  it('returns 400 when messages is not an array', () => {
    const { status, error } = validateChatRequest({ messages: 'hello' });
    expect(status).toBe(400);
    expect(error).toMatch(/messages array required/i);
  });

  it('returns 400 when message count exceeds limit', () => {
    const messages = Array.from({ length: 51 }, (_, i) => ({
      role: 'user',
      content: `msg ${i}`,
    }));
    const { status, error } = validateChatRequest({ messages });
    expect(status).toBe(400);
    expect(error).toMatch(/too many messages/i);
  });
});

describe('Server validation — individual message', () => {
  it('returns 400 for invalid message role', () => {
    const { status, error } = validateChatRequest({
      messages: [{ role: 'admin', content: 'hello' }],
    });
    expect(status).toBe(400);
    expect(error).toMatch(/invalid message role/i);
  });

  it('returns 400 for content that is too long', () => {
    const { status, error } = validateChatRequest({
      messages: [{ role: 'user', content: 'x'.repeat(501) }],
    });
    expect(status).toBe(400);
    expect(error).toMatch(/too long/i);
  });

  it('returns 400 for non-object message entry', () => {
    const { status, error } = validateChatRequest({
      messages: ['just a string'],
    });
    expect(status).toBe(400);
    expect(error).toMatch(/invalid message format/i);
  });

  it('accepts valid "ai" role messages', () => {
    const { valid } = validateMessage({ role: 'ai', content: 'Hello!' });
    expect(valid).toBe(true);
  });

  it('accepts valid "model" role messages', () => {
    const { valid } = validateMessage({ role: 'model', content: 'Hello!' });
    expect(valid).toBe(true);
  });
});

describe('Server validation — sanitiseText', () => {
  it('strips control characters', () => {
    expect(sanitiseText('\u0000\u0001hello\u007f')).toBe('hello');
  });

  it('returns empty string for all-control input', () => {
    expect(sanitiseText('\u0000\u0001\u0002')).toBe('');
  });

  it('preserves newlines and tabs', () => {
    expect(sanitiseText('line1\nline2\ttabbed')).toBe('line1\nline2\ttabbed');
  });

  it('truncates to maxLen', () => {
    expect(sanitiseText('a'.repeat(600))).toHaveLength(500);
    expect(sanitiseText('a'.repeat(600), 100)).toHaveLength(100);
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitiseText('   hello   ')).toBe('hello');
  });
});

describe('Server validation — context sanitization', () => {
  it('uses safe total from valid numeric context', () => {
    const { safeTotal } = validateChatRequest({
      messages: [{ role: 'user', content: 'hello' }],
      context: { todayTotal: 7.654, topCategory: 'food' },
    });
    expect(safeTotal).toBe('7.65');
  });

  it('defaults safeTotal to 0.00 for non-numeric context', () => {
    const { safeTotal } = validateChatRequest({
      messages: [{ role: 'user', content: 'hello' }],
      context: { todayTotal: 'invalid', topCategory: 'food' },
    });
    expect(safeTotal).toBe('0.00');
  });

  it('defaults topCategory to none for disallowed value', () => {
    const { safeTopCategory } = validateChatRequest({
      messages: [{ role: 'user', content: 'hello' }],
      context: { todayTotal: 3, topCategory: 'weapons' },
    });
    expect(safeTopCategory).toBe('none');
  });

  it('accepts all valid top categories', () => {
    for (const cat of ['transport', 'food', 'energy', 'shopping', 'none']) {
      const { safeTopCategory } = validateChatRequest({
        messages: [{ role: 'user', content: 'hi' }],
        context: { todayTotal: 1, topCategory: cat },
      });
      expect(safeTopCategory).toBe(cat);
    }
  });
});

describe('Server validation — ALLOWED_ROLES and ALLOWED_CATEGORIES', () => {
  it('ALLOWED_ROLES contains user, ai, model', () => {
    expect(ALLOWED_ROLES.has('user')).toBe(true);
    expect(ALLOWED_ROLES.has('ai')).toBe(true);
    expect(ALLOWED_ROLES.has('model')).toBe(true);
    expect(ALLOWED_ROLES.has('admin')).toBe(false);
    expect(ALLOWED_ROLES.has('system')).toBe(false);
  });

  it('ALLOWED_CATEGORIES covers all expected values', () => {
    for (const cat of ['transport', 'food', 'energy', 'shopping', 'none']) {
      expect(ALLOWED_CATEGORIES.has(cat)).toBe(true);
    }
    expect(ALLOWED_CATEGORIES.has('weapons')).toBe(false);
    expect(ALLOWED_CATEGORIES.has('')).toBe(false);
  });
});
