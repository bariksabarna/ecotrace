# EcoTrace — Carbon Footprint Awareness Platform

EcoTrace is an interactive Carbon Footprint Awareness Platform built specifically for Prompt Wars (Hack2Skill × Google). It is optimized for the Indian context to help users calculate, visualize, and reduce their daily carbon emissions.

## 🚀 Live Demo
**Cloud Run URL**: [https://ecotrace-1065171738734.asia-south1.run.app](https://ecotrace-1065171738734.asia-south1.run.app) *(will be updated upon deployment)*

---

## 🍃 Chosen Vertical
- **Environmental Sustainability & Carbon Footprint Awareness**

---

## 🛠️ Stack & Architecture
- **Frontend**: React 18 + Vite (configured with custom forest theme Tailwind CSS v3)
- **Backend**: Express.js (Node 20 runtime) serving built static assets and proxies API calls securely
- **AI Integration**: Gemini 2.0 Flash (`@google/generative-ai` SDK) with role/context-based chat history
- **Persistence**: 100% `localStorage` (Privacy first - no remote database required)
- **Deployment**: Google Cloud Run (Containerized Docker build)

---

## 📐 Core Calculator Logic
Emissions are calculated daily using India-specific factors (kg CO₂ emissions per unit/km):
- **Transport**: Distance (km) is multiplied by fuel/efficiency factors:
  - Petrol Car: `0.168` kg/km
  - Diesel Car: `0.149` kg/km
  - CNG Auto: `0.063` kg/km
  - Delhi Metro: `0.041` kg/km
  - Bus / Motorbike: `0.089` kg/km
  - Domestic Flight: `0.255` kg/km
  - Walking: `0.0` kg/km
- **Food**: Meal count multiplied by type factors:
  - Vegetarian: `0.7` kg/meal
  - Non-Vegetarian: `2.5` kg/meal
  - Vegan: `0.5` kg/meal
- **Energy**: Combining grid electricity and LPG cylinder fraction:
  - Electricity: `0.716` kg/kWh
  - LPG Cylinder (14.2kg): `12.7` kg/cylinder
- **Shopping**: Quantity multiplied by product category factors:
  - Clothing: `10` kg/item
  - Electronics: `70` kg/item
  - Furniture: `50` kg/item
  - Grocery: `0.3` kg/item

---

## 📝 Key Assumptions
1. **LPG Cylinder**: Standard Indian LPG cylinders are assumed to contain 14.2 kg of gas, with an emission factor of approx `12.7` kg CO₂ per full cylinder usage.
2. **Indian Power Grid**: The emission factor is set to `0.716` kg CO₂/kWh as per the Central Electricity Authority (CEA) 2023 grid emissions report.
3. **Daily Averages**:
   - Indian average emissions: `63` kg CO₂/day per capita (based on ~1.9 tonnes/month benchmark).
   - Global average emissions: `157` kg CO₂/day per capita (based on ~4.7 tonnes/month benchmark).

---

## 🧪 Testing
Includes a comprehensive test suite covering all pure functions and edge cases in the calculator module:
- Run tests: `npm test`
- Run coverage: `npm run test:coverage` (Target: >80% coverage on `calculator.js`)
