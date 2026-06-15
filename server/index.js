import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

const app = express();

// ── Compression (efficiency) ──────────────────────────────────────────────────
app.use(compression());

// ── CORS — restrict to same origin and known Cloud Run domain ─────────────────
const ALLOWED_ORIGINS = new Set([
  'https://ecotrace-1059171200393.us-central1.run.app',
  'https://ecotrace-wywmtrwwda-uc.a.run.app',
  // Allow localhost only in development
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:8080', 'http://localhost:5173']
    : []),
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// ── Security Headers via Helmet ───────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // 'unsafe-inline' required only for React's dynamic style={} attributes
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

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please slow down.' },
});

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

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

/** Allowed role values in message history */
const ALLOWED_ROLES = new Set(['user', 'ai', 'model']);

/** Allowed top-category values to prevent injection */
const ALLOWED_CATEGORIES = new Set(['transport', 'food', 'energy', 'shopping', 'none']);

// ── Chat Endpoint ─────────────────────────────────────────────────────────────
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { messages, context } = req.body;

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages array required.' });
    }
    if (messages.length > 50) {
      return res.status(400).json({ error: 'Too many messages in history.' });
    }

    // Validate each message shape — role must be allowlisted
    for (const m of messages) {
      if (typeof m !== 'object' || !m || typeof m.content !== 'string') {
        return res.status(400).json({ error: 'Invalid message format.' });
      }
      if (!ALLOWED_ROLES.has(m.role)) {
        return res.status(400).json({ error: 'Invalid message role.' });
      }
      if (m.content.length > 500) {
        return res.status(400).json({ error: 'Message content too long.' });
      }
    }

    if (!genAI) {
      return res.status(503).json({ error: 'AI service is not configured on this server.' });
    }

    const lastMessage = Array.from(String(messages.at(-1)?.content ?? ''))
      .filter((c) => {
        const code = c.charCodeAt(0);
        return (code >= 32 && code !== 127) || code === 10 || code === 9 || code === 13;
      })
      .join('')
      .slice(0, 500)
      .trim();

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
      parts: [{ text: String(m.content).slice(0, 500) }],
    }));

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const chat = model.startChat({ systemInstruction: SYSTEM_PROMPT, history });

    const contextStr = context
      ? `[User context: today = ${safeTotal} kg CO₂, highest category = ${safeTopCategory}]\n`
      : '';

    const result = await chat.sendMessage(contextStr + lastMessage);
    return res.json({ text: result.response.text() });
  } catch (err) {
    // Structured error log — intentionally kept for server-side diagnostics
    // eslint-disable-next-line no-console
    console.error('[EcoTrace] Chat error:', err.message);
    return res
      .status(500)
      .json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'EcoTrace' });
});

// ── SPA Fallback ──────────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8080;
// eslint-disable-next-line no-console
app.listen(PORT, () => console.log(`EcoTrace server running on :${PORT}`));
