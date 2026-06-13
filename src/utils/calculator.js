import { TRANSPORT, FOOD, ENERGY, SHOPPING } from './emissionFactors.js';

/**
 * Calculate CO₂ from transport.
 * @param {string} mode - Transport mode key from TRANSPORT
 * @param {number} distanceKm - Distance in km
 * @returns {number} kg CO₂
 */
export function calculateTransport(mode, distanceKm) {
  if (!mode || distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) return 0;
  const factor = TRANSPORT[mode];
  if (factor === null || factor === undefined) return 0;
  return Math.round(factor * Number(distanceKm) * 1000) / 1000;
}

/**
 * Calculate CO₂ from food.
 * @param {string} mealType - Meal type key from FOOD
 * @param {number} count - Number of meals
 * @returns {number} kg CO₂
 */
export function calculateFood(mealType, count) {
  if (!mealType || count === null || count === undefined || isNaN(count)) return 0;
  const factor = FOOD[mealType];
  if (factor === null || factor === undefined) return 0;
  return Math.round(factor * Number(count) * 1000) / 1000;
}

/**
 * Calculate CO₂ from energy usage.
 * @param {number} electricityKwh - kWh consumed
 * @param {number} lpgFraction - Fraction of LPG cylinder used (0–1)
 * @returns {number} kg CO₂
 */
export function calculateEnergy(electricityKwh, lpgFraction) {
  const kwh = electricityKwh === null || electricityKwh === undefined || isNaN(electricityKwh) ? 0 : Number(electricityKwh);
  const lpg = lpgFraction === null || lpgFraction === undefined || isNaN(lpgFraction) ? 0 : Number(lpgFraction);
  const electricityCO2 = ENERGY.electricityKwh * kwh;
  const lpgCO2 = ENERGY.lpgCylinder * lpg;
  return Math.round((electricityCO2 + lpgCO2) * 1000) / 1000;
}

/**
 * Calculate CO₂ from shopping.
 * @param {string} category - Shopping category key from SHOPPING
 * @param {number} quantity - Number of items
 * @returns {number} kg CO₂
 */
export function calculateShopping(category, quantity) {
  if (!category || quantity === null || quantity === undefined || isNaN(quantity)) return 0;
  const factor = SHOPPING[category];
  if (factor === null || factor === undefined) return 0;
  return Math.round(factor * Number(quantity) * 1000) / 1000;
}

/**
 * Calculate total CO₂ from an array of activities.
 * @param {Array<{type: string, value: number}>} activities
 * @returns {number} total kg CO₂
 */
export function calculateTotal(activities) {
  if (!Array.isArray(activities)) return 0;
  return Math.round(
    activities.reduce((sum, a) => sum + (a && !isNaN(a.value) ? Number(a.value) : 0), 0) * 1000
  ) / 1000;
}

/**
 * Get category-wise CO₂ totals.
 * @param {Array} activities
 * @returns {{ transport: number, food: number, energy: number, shopping: number }}
 */
export function getCategoryTotals(activities) {
  if (!Array.isArray(activities)) {
    return { transport: 0, food: 0, energy: 0, shopping: 0 };
  }
  return activities.reduce(
    (acc, a) => {
      if (!a || isNaN(a.value)) return acc;
      const cat = a.category || 'transport';
      if (acc[cat] !== null && acc[cat] !== undefined) {
        acc[cat] = Math.round((acc[cat] + Number(a.value)) * 1000) / 1000;
      }
      return acc;
    },
    { transport: 0, food: 0, energy: 0, shopping: 0 }
  );
}
