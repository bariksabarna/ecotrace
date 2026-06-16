# 🏆 Prompt Wars — 100/100 Playbook
> Derived from **EcoTrace** (Carbon Footprint Platform) — Final Score: **97.03/100**
> Use this as a battle-tested checklist for every future Prompt Wars challenge.

---

## 📊 Score Card (EcoTrace)

| Category | Score | Notes |
|---|---|---|
| **Code Quality** | 88 | ⚠️ Lost points — see fix below |
| **Security** | ✅ 100 | Full marks |
| **Efficiency** | ✅ 100 | Full marks |
| **Testing** | ✅ 100 | Full marks |
| **Accessibility** | 99 | Near-perfect |
| **Problem Statement Alignment** | ✅ 100 | Full marks |
| **TOTAL** | **97.03 / 100** | |

---

## 🔴 Code Quality — Why We Got 88 (and How to Hit 100)

### Root Cause
The evaluator's static analysis checks **comment density, JSDoc coverage, and function documentation**.
Even though ESLint passed with **zero warnings**, the scorer penalised us because:

| File | Comments Found | Issue |
|---|---|---|
| `src/utils/calculator.js` | 0 | No JSDoc on any function |
| `src/components/Tracker.jsx` | 0 | No inline comments explaining logic |
| `src/components/Dashboard.jsx` | 1 | Very sparse |
| `src/components/AIAssistant.jsx` | 2 | Acceptable but low |

### Fix — JSDoc Every Function

```js
/**
 * Calculates the carbon footprint of a transport activity.
 * @param {string} mode - Transport mode ('car', 'bus', 'flight', etc.)
 * @param {number} distanceKm - Distance travelled in kilometres.
 * @returns {number} CO2 emissions in kg.
 */
export function calculateTransport(mode, distanceKm) {
  const factor = EMISSION_FACTORS.transport[mode] ?? 0;
  return parseFloat((factor * distanceKm).toFixed(4));
}
```

### Fix — Inline Comments in Complex Logic

```js
// Sanitise input by stripping control characters (avoids no-control-regex lint rule)
const sanitised = input.split('').filter(c => c.charCodeAt(0) >= 32).join('');
```

### Fix — Component-Level Header Comments

```jsx
/**
 * Dashboard Component
 * Renders the main overview including today's footprint gauge,
 * 7-day bar chart, category breakdown, and global benchmarks.
 *
 * @component
 * @param {Object} props
 * @param {Array}  props.activities - List of logged activities for today.
 * @param {Array}  props.history    - 7-day historical data array.
 */
function Dashboard({ activities, history }) { ... }
```

### Fix — PropTypes on Every Component

```js
Dashboard.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.shape({
    id:       PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    co2:      PropTypes.number.isRequired,
  })).isRequired,
  history: PropTypes.array.isRequired,
};
```

### Fix — README with Architecture Diagram

A well-documented README.md with setup steps, architecture, and API docs signals
high code quality to automated scorers.

---

## 🟢 Security — How We Hit 100

### 1. Helmet (HTTP Security Headers)
```js
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

### 2. Rate Limiting — DO NOT override keyGenerator
```js
import rateLimit from 'express-rate-limit';

// CORRECT — use default keyGenerator (IPv6-safe)
const globalLimiter = rateLimit({ windowMs: 60_000, max: 200 });
const aiLimiter     = rateLimit({ windowMs: 60_000, max: 20 });

// WRONG — causes ERR_ERL_KEY_GEN_IPV6 crash in Cloud Run
const badLimiter = rateLimit({ keyGenerator: (req) => req.ip });
```

### 3. Strict CORS
```js
import cors from 'cors';
const ALLOWED = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({ origin: ALLOWED, credentials: true }));
```

### 4. Input Sanitisation (no regex control chars)
```js
// Strip control characters WITHOUT using /[\x00-\x1F]/ (triggers no-control-regex lint)
function sanitise(str) {
  return str.split('').filter(c => c.charCodeAt(0) >= 32).join('').slice(0, 500);
}
```

### 5. No Secrets in Code
- Use `.env` locally, `gcloud run deploy --set-env-vars` in production.
- Add `.env` to `.gitignore` and `.dockerignore`.

---

## 🟢 Efficiency — How We Hit 100

### 1. Multistage Docker Build
```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Lean runtime (no devDependencies, no src/)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY server/ ./server/
EXPOSE 8080
CMD ["node", "server/index.js"]
```

### 2. Gzip Compression
```js
import compression from 'compression';
app.use(compression()); // must be in `dependencies`, not `devDependencies`
```

### 3. Static File Serving with Cache Headers
```js
app.use(express.static('dist', {
  maxAge: '1d',
  etag: true,
}));
```

### 4. Bundle Size < 250 kB gzipped
- Use `vite build` — tree-shakes automatically.
- Avoid heavy libraries (lodash, moment.js, etc.).
- Target: dist/assets/index.js < 250 kB raw, < 75 kB gzipped.

### 5. Correct `package.json` placement
```json
"dependencies": {
  "compression": "^1.8.1",
  "express":     "^4.22.2",
  "helmet":      "^8.2.0"
},
"devDependencies": {
  "vitest":   "^4.1.8",
  "vite":     "^8.0.12"
}
```

---

## 🟢 Testing — How We Hit 100

### Golden Rule: 100% Coverage on All Axes
```
% Stmts | % Branch | % Funcs | % Lines
  100   |   100    |   100   |   100
```

### Test Stack
```json
"devDependencies": {
  "vitest":                   "^4.1.8",
  "@vitest/coverage-v8":      "^4.1.8",
  "@testing-library/react":   "^16.3.2",
  "@testing-library/jest-dom":"^6.9.1",
  "jsdom":                    "^29.1.1"
}
```

### vitest.config.js Setup
```js
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx'],
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
    },
  },
});
```

### Test File Structure
```
tests/
  setup.js              # global mocks (localStorage, fetch, ResizeObserver)
  calculator.test.js    # pure function unit tests (50 tests)
  server.test.js        # API endpoint integration tests (20 tests)
  components.test.jsx   # React component render + interaction tests (38 tests)
```

### Key Testing Patterns

**Mock localStorage globally (setup.js)**
```js
const store = {};
global.localStorage = {
  getItem:    (k) => store[k] ?? null,
  setItem:    (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear:      () => Object.keys(store).forEach(k => delete store[k]),
};
```

**Mock fetch for AI API calls**
```js
global.fetch = vi.fn().mockResolvedValue({
  ok: true, json: async () => ({ reply: 'Test AI response' }),
});
```

**Test every branch explicitly**
```js
it('handles empty input gracefully', () => {
  expect(calculateTransport('car', 0)).toBe(0);
  expect(calculateTransport('car', -1)).toBe(0);     // negative guard
  expect(calculateTransport('unknown', 10)).toBe(0); // unknown mode
});
```

**Use act() for async state updates**
```jsx
import { act } from 'react';

it('updates footprint after adding activity', async () => {
  render(<Tracker onAdd={mockFn} />);
  await act(async () => {
    fireEvent.change(screen.getByLabelText('distance'), { target: { value: '10' }});
    fireEvent.click(screen.getByText('Add to Log'));
  });
  expect(mockFn).toHaveBeenCalledWith(expect.objectContaining({ co2: expect.any(Number) }));
});
```

---

## 🟢 Accessibility — How We Hit 99 (and the fix for 100)

### What We Got Right
- Semantic HTML: nav, main, section, article, header, footer
- Single h1 per page (evaluators check this strictly)
- aria-label on all icon-only buttons
- role="status" on live-updating score regions
- Colour contrast ratio >= 4.5:1 on all text

### The Missing 1 Point — Add These Next Time
```jsx
{/* aria-live for dynamic content updates */}
<div aria-live="polite" aria-atomic="true">
  Today's footprint: {total} kg CO2
</div>

{/* Skip-navigation link */}
<a href="#main-content" className="skip-link">Skip to main content</a>

{/* Explicit label elements for all form inputs */}
<label htmlFor="distance-input">Distance (km)</label>
<input id="distance-input" type="number" ... />
```

### Run axe-core in Tests
```js
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<App />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 🟢 Problem Statement Alignment — How We Hit 100

### Formula: Map Every Feature to a Requirement

Before writing a single line of code:
1. Read the problem statement 3 times.
2. Extract every verb ("track", "visualise", "advise", "compare") — these are your features.
3. Build a requirements traceability matrix:

| Requirement | Implementation | File |
|---|---|---|
| Track daily emissions | Activity logger with categories | Tracker.jsx |
| Visualise trends | 7-day bar chart | Dashboard.jsx |
| Compare to benchmarks | India avg / Global avg panels | Dashboard.jsx |
| AI-powered advice | Gemini 2.0 Flash integration | AIAssistant.jsx |
| Personalised tips | Dynamic filter by highest category | Tips.jsx |
| Streak motivation | Day streak counter in header | NavBar.jsx |

Every feature must be testable and visible in the UI. Evaluators test what they see.

---

## 🚀 Deployment Checklist (Cloud Run)

```bash
# 1. Run tests locally — must pass 100%
npm run test:coverage

# 2. Run linter — must be zero warnings
npm run lint

# 3. Build frontend — verify no errors
npm run build

# 4. Deploy to Cloud Run (source-based — no local Docker needed)
gcloud run deploy <service-name> \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --project <project-id>

# 5. Set environment variables
gcloud run services update <service-name> \
  --set-env-vars "NODE_ENV=production,GEMINI_API_KEY=<key>" \
  --region us-central1
```

### Key .dockerignore entries
```
node_modules
dist
.env
.git
coverage
tests
```

---

## 📋 Pre-Submission Checklist

### CODE QUALITY
- [ ] JSDoc on every exported function
- [ ] Inline comments on all non-obvious logic
- [ ] PropTypes defined on every React component
- [ ] README.md with setup, architecture, and API docs
- [ ] Zero ESLint warnings (--max-warnings 0)
- [ ] Consistent code formatting (Prettier)

### SECURITY
- [ ] Helmet with custom CSP directives
- [ ] Rate limiting on all API routes (no custom keyGenerator)
- [ ] CORS restricted to allowed origins
- [ ] No hardcoded secrets (.env + .dockerignore)
- [ ] Input sanitisation on all user inputs

### EFFICIENCY
- [ ] Multistage Dockerfile (builder + runner)
- [ ] compression() middleware in dependencies
- [ ] Static assets served with cache headers
- [ ] Bundle size < 250 kB JS raw
- [ ] All runtime packages in `dependencies`

### TESTING
- [ ] 100% statements, branches, functions, lines
- [ ] Unit tests for all pure functions
- [ ] Integration tests for all API endpoints
- [ ] Component tests for all UI interactions
- [ ] Edge cases tested (empty input, nulls, errors)

### ACCESSIBILITY
- [ ] Single h1 per page
- [ ] All interactive elements have aria-label
- [ ] All form inputs have explicit label htmlFor
- [ ] aria-live on dynamic content regions
- [ ] Skip navigation link present
- [ ] axe-core test integrated

### DEPLOYMENT
- [ ] .dockerignore excludes node_modules, dist, .env, .git
- [ ] Cloud Run deploy succeeds (exit code 0)
- [ ] Live URL returns HTTP 200
- [ ] GEMINI_API_KEY set via gcloud env vars
- [ ] HTTPS enforced (Cloud Run default)

---

## 🧠 Key Lessons Learned

1. **Comment everything** — static analysers score documentation density, not just correctness.
2. **Never override `keyGenerator`** in express-rate-limit — breaks IPv6 in Cloud Run.
3. **Put runtime packages in `dependencies`** — compression in devDependencies breaks production.
4. **100% branch coverage requires explicit sad-path tests** — test null, -1, '', and error states.
5. **One h1 per page is non-negotiable** for accessibility scoring.
6. **Multistage Docker = smaller image = faster cold start = better Efficiency score.**
7. **Source-based Cloud Run deploy** (--source .) is simpler and faster than building Docker locally.
8. **Problem alignment is about traceability** — every requirement must map to a visible, tested feature.
9. **Use axe-core** in tests to catch accessibility violations before submission.
10. **Run lint with --max-warnings 0** to catch every warning, not just errors.

---

*Generated post-EcoTrace submission — Prompt Wars 2026 | Score: 97.03/100*
