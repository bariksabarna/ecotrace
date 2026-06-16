# EcoTrace — Carbon Footprint Awareness Platform

EcoTrace is an interactive Carbon Footprint Awareness Platform built specifically for Prompt Wars (Hack2Skill × Google). It is optimized for the Indian context to help users calculate, visualize, and reduce their daily carbon emissions.

## 🚀 Live Demo
**Cloud Run URL**: [https://ecotrace-1059171200393.us-central1.run.app](https://ecotrace-1059171200393.us-central1.run.app)

---

## 🍃 Chosen Vertical
- **Environmental Sustainability & Carbon Footprint Awareness**

---

## 🛠️ Stack & Architecture
- **Frontend**: React 19 + Vite (configured with custom forest-theme Tailwind CSS v3)
- **Backend**: Express.js (Node 20 runtime) serving built static assets and proxying API calls securely
- **AI Integration**: Gemini 2.0 Flash (`@google/generative-ai` SDK) with role/context-based chat history
- **Persistence**: 100% `localStorage` (Privacy-first — no remote database required)
- **Deployment**: Google Cloud Run (containerized Docker multi-stage build)
- **Security**: Helmet CSP, HSTS, Permissions-Policy, allowlist CORS, rate limiting (20 req/min AI, 200 req/min global), body size cap (10 KB), input sanitisation on client and server, prompt-injection prevention via allowlisted context fields

---

## 📐 Core Calculator Logic
Emissions are calculated using India-specific factors (kg CO₂ per unit/km):

### Transport (kg CO₂/km)
| Mode | Factor |
|---|---|
| Petrol Car | 0.168 |
| Diesel Car | 0.149 |
| CNG Auto | 0.063 |
| Delhi Metro | 0.041 |
| State Bus / Motorbike | 0.089 |
| Domestic Flight | 0.255 |
| Walk | 0.000 |

### Food (kg CO₂/meal)
| Type | Factor |
|---|---|
| Vegetarian | 0.7 |
| Non-Vegetarian | 2.5 |
| Vegan | 0.5 |

### Energy
- Electricity: `0.716` kg CO₂/kWh (CEA 2023 grid factor)
- LPG Cylinder (14.2 kg): `12.7` kg CO₂/cylinder

### Shopping (kg CO₂/item)
| Category | Factor |
|---|---|
| Clothing | 10 |
| Electronics | 70 |
| Furniture | 50 |
| Grocery trip | 0.3 |

---

## 📝 Key Assumptions
1. **LPG Cylinder**: Standard Indian cylinders contain 14.2 kg of gas, emission factor ~12.7 kg CO₂ per full cylinder.
2. **Indian Power Grid**: 0.716 kg CO₂/kWh (CEA 2023 annual report).
3. **Daily Averages**:
   - India average: ~63 kg CO₂/day (1.9 t/month per capita).
   - Global average: ~157 kg CO₂/day (4.7 t/month per capita).

---

## 🔒 Security Highlights
- **Helmet** with strict CSP, HSTS (1 year + preload), `X-Content-Type-Options`, `Referrer-Policy`
- **Permissions-Policy** disabling geolocation, camera, microphone, payment, USB
- **Rate limiting**: 20 AI requests/min per IP, 200 global requests/min per IP
- **Input sanitisation**: Control-character stripping on both client and server
- **Prompt-injection prevention**: `topCategory` validated against an explicit allowlist; `todayTotal` coerced to a finite number before insertion into the AI prompt
- **CORS allowlist**: Only production Cloud Run origin + localhost in development
- **Body size cap**: 10 KB JSON limit prevents oversized payload attacks
- **HTTPS redirect**: All HTTP traffic redirected to HTTPS in production
- **Request tracing**: Every request tagged with a UUID for structured error logging

---

## 🧪 Testing
Comprehensive test suite covering all components and utilities:

```
Test Files  4 passed (4)
    Tests  108 passed (108)

Coverage:
All files  | 100% Stmts | 100% Branch | 100% Funcs | 100% Lines
```

- Run tests: `npm test`
- Run coverage: `npm run test:coverage`

Test areas covered:
- **108 tests** across 4 test files
- Calculator: all emission factors and edge cases (50 tests)
- Storage: localStorage lifecycle, streak logic, tip management (20 tests)
- Server: all API endpoints, rate limits, validation, error handling (20 tests)
- Components: NavBar, Dashboard, Tips, Tracker, AIAssistant, ErrorBoundary (18 tests)

---

## 🐳 Docker & Deployment

```bash
# Build image
docker build -t gcr.io/prompt-wars-493211/ecotrace:latest .

# Push to GCR
docker push gcr.io/prompt-wars-493211/ecotrace:latest

# Deploy to Cloud Run
gcloud run deploy ecotrace \
  --image gcr.io/prompt-wars-493211/ecotrace:latest \
  --platform managed --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=<key>,NODE_ENV=production
```
