import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Maximum number of messages allowed per chat request */
const MAX_MESSAGES = 50;

/** Maximum character length per individual message */
const MAX_MESSAGE_LENGTH = 500;

/** Body size limit for all JSON requests */
const BODY_SIZE_LIMIT = '10kb';

/** Allowed role values in message history */
const ALLOWED_ROLES = new Set(['user', 'ai', 'model']);

/** Allowed top-category values to prevent prompt injection */
const ALLOWED_CATEGORIES = new Set(['transport', 'food', 'energy', 'shopping', 'none']);

/** Allowed origins for CORS */
const ALLOWED_ORIGINS = new Set([
  'https://ecotrace-1059171200393.us-central1.run.app',
  'https://ecotrace-wywmtrwwda-uc.a.run.app',
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:8080', 'http://localhost:5173']
    : []),
]);

// ── App Bootstrap ─────────────────────────────────────────────────────────────

const app = express();
app.set('trust proxy', 1);

// ── Request ID Middleware (traceability) ──────────────────────────────────────

/**
 * Attaches a unique request ID to every incoming request for distributed tracing.
 * Uses the upstream `X-Request-Id` header if provided, otherwise generates a new UUID.
 */
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// ── HTTPS Redirect (production only) ─────────────────────────────────────────

app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
  next();
});

// ── Compression ───────────────────────────────────────────────────────────────

app.use(compression());

// ── CORS ─────────────────────────────────────────────────────────────────────

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Request-Id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// ── Security Headers ──────────────────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  })
);

// Permissions-Policy: disable sensitive browser APIs not needed by this app
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  next();
});

// ── Rate Limiting ─────────────────────────────────────────────────────────────

/** Global limiter: 200 req/min per IP across all routes */
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
  keyGenerator: (req) => req.ip,
});

/** Tighter limiter for the AI chat endpoint: 20 req/min per IP */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
  keyGenerator: (req) => req.ip,
});

app.use(globalLimiter);

// ── Body Parser ───────────────────────────────────────────────────────────────


app.use(express.json({ limit: BODY_SIZE_LIMIT }));

/** Catch malformed JSON bodies and return a clean 400 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }
  next(err);
});


// ── Static Files ──────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, '../dist'), { maxAge: '1d' }));

// ── Gemini Client ─────────────────────────────────────────────────────────────

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const SYSTEM_PROMPT = `You are EcoBot, an India-specific carbon footprint advisor.
You help users understand and reduce their daily carbon footprint using data accurate for India.
Key facts: India's grid emission factor is 0.716 kg CO₂/kWh (CEA 2023).
The average Indian emits about 1.9 tonnes CO₂/month.
Common Indian transport: CNG auto, metro, state buses, two-wheelers.
Be concise (2–4 sentences), practical, encouraging, and India-specific.
When listing tips, give max 5 bullet points.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Chat Endpoint ─────────────────────────────────────────────────────────────

app.post('/api/chat', chatLimiter, async (req, res) => {
  const { requestId } = req;

  try {
    const { messages, context } = req.body;

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array required.' });
    }
    if (messages.length > MAX_MESSAGES) {
      return res.status(400).json({ error: 'Too many messages in history.' });
    }

    // Validate each message shape
    for (const m of messages) {
      const { valid, error } = validateMessage(m);
      if (!valid) return res.status(400).json({ error });
    }

    if (!genAI) {
      return res.status(503).json({ error: 'AI service is not configured on this server.' });
    }

    const lastMessage = sanitiseText(messages.at(-1)?.content ?? '');

    if (!lastMessage) {
      return res.status(400).json({ error: 'Empty message.' });
    }

    // Sanitize context fields (allowlist + type coercion)
    const rawTotal = Number(context?.todayTotal);
    const safeTotal = isFinite(rawTotal) ? rawTotal.toFixed(2) : '0.00';
    const safeTopCategory = ALLOWED_CATEGORIES.has(context?.topCategory)
      ? context.topCategory
      : 'none';

    // Build conversation history (all except last message)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: sanitiseText(m.content) }],
    }));

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const chat = model.startChat({ systemInstruction: SYSTEM_PROMPT, history });

    const contextStr = context
      ? `[User context: today = ${safeTotal} kg CO₂, highest category = ${safeTopCategory}]\n`
      : '';

    const result = await chat.sendMessage(contextStr + lastMessage);
    return res.json({ text: result.response.text() });
  } catch (err) {
    // Structured error log with request ID for traceability
    // eslint-disable-next-line no-console
    console.error(`[EcoTrace][${requestId}] Chat error:`, err.message);
    return res
      .status(500)
      .json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
});

// ── Health Check ──────────────────────────────────────────────────────────────

/**
 * GET /health — Liveness probe for Cloud Run and load balancers.
 * Returns service name, status, and current timestamp.
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'EcoTrace',
    version: process.env.npm_package_version ?? '0.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── SPA Fallback ──────────────────────────────────────────────────────────────

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ── Global Error Handler ──────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => { // eslint-disable-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line no-console
  console.error(`[EcoTrace][${req.requestId}] Unhandled error:`, err.message);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

// ── Start Server ──────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8080;
// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`EcoTrace server running on :${PORT}`));
