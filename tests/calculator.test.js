import { describe, it, expect } from 'vitest';
import {
  calculateTransport,
  calculateFood,
  calculateEnergy,
  calculateShopping,
  calculateTotal,
  getCategoryTotals,
} from '../src/utils/calculator.js';

describe('calculateTransport', () => {
  it('carPetrol 10km → 1.68', () => {
    expect(calculateTransport('carPetrol', 10)).toBe(1.68);
  });

  it('metro 10km → 0.41', () => {
    expect(calculateTransport('metro', 10)).toBe(0.41);
  });

  it('walk 5km → 0', () => {
    expect(calculateTransport('walk', 5)).toBe(0);
  });

  it('undefined mode → 0', () => {
    expect(calculateTransport(undefined, 10)).toBe(0);
  });

  it('null distance → 0', () => {
    expect(calculateTransport('metro', null)).toBe(0);
  });

  it('unknown mode → 0', () => {
    expect(calculateTransport('helicopter', 100)).toBe(0);
  });

  it('bike 20km → 1.78', () => {
    expect(calculateTransport('bike', 20)).toBe(1.78);
  });

  it('domesticFlight 500km → 127.5', () => {
    expect(calculateTransport('domesticFlight', 500)).toBe(127.5);
  });
});

describe('calculateFood', () => {
  it('vegMeal 3 meals → 2.1', () => {
    expect(calculateFood('vegMeal', 3)).toBe(2.1);
  });

  it('nonVegMeal 2 meals → 5.0', () => {
    expect(calculateFood('nonVegMeal', 2)).toBe(5.0);
  });

  it('veganMeal 1 meal → 0.5', () => {
    expect(calculateFood('veganMeal', 1)).toBe(0.5);
  });

  it('undefined mealType → 0', () => {
    expect(calculateFood(undefined, 3)).toBe(0);
  });

  it('null count → 0', () => {
    expect(calculateFood('vegMeal', null)).toBe(0);
  });
});

describe('calculateEnergy', () => {
  it('10 kWh → 7.16 kg', () => {
    expect(calculateEnergy(10, 0)).toBe(7.16);
  });

  it('full LPG cylinder → 12.7 kg', () => {
    expect(calculateEnergy(0, 1)).toBe(12.7);
  });

  it('both null → 0', () => {
    expect(calculateEnergy(null, null)).toBe(0);
  });

  it('half cylinder + 5 kWh', () => {
    const expected = Math.round((0.716 * 5 + 12.7 * 0.5) * 1000) / 1000;
    expect(calculateEnergy(5, 0.5)).toBe(expected);
  });
});

describe('calculateShopping', () => {
  it('1 electronics → 70', () => {
    expect(calculateShopping('electronics', 1)).toBe(70);
  });

  it('3 clothing → 30', () => {
    expect(calculateShopping('clothing', 3)).toBe(30);
  });

  it('undefined category → 0', () => {
    expect(calculateShopping(undefined, 5)).toBe(0);
  });
});

describe('calculateTotal', () => {
  it('mixed activities array returns correct sum', () => {
    const activities = [
      { category: 'transport', value: 1.68 },
      { category: 'food', value: 2.1 },
      { category: 'energy', value: 7.16 },
    ];
    expect(calculateTotal(activities)).toBe(10.94);
  });

  it('empty array → 0', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('null input → 0', () => {
    expect(calculateTotal(null)).toBe(0);
  });

  it('activities with undefined value are skipped', () => {
    const activities = [
      { category: 'transport', value: 5.0 },
      { category: 'food', value: undefined },
    ];
    expect(calculateTotal(activities)).toBe(5.0);
  });
});

describe('getCategoryTotals', () => {
  it('returns correct category breakdown', () => {
    const activities = [
      { category: 'transport', value: 1.68 },
      { category: 'food', value: 2.1 },
      { category: 'transport', value: 0.41 },
      { category: 'energy', value: 7.16 },
      { category: 'shopping', value: 10 },
    ];
    const result = getCategoryTotals(activities);
    expect(result.transport).toBe(2.09);
    expect(result.food).toBe(2.1);
    expect(result.energy).toBe(7.16);
    expect(result.shopping).toBe(10);
  });

  it('empty array returns zeros', () => {
    const result = getCategoryTotals([]);
    expect(result).toEqual({ transport: 0, food: 0, energy: 0, shopping: 0 });
  });

  it('null input returns zeros', () => {
    const result = getCategoryTotals(null);
    expect(result).toEqual({ transport: 0, food: 0, energy: 0, shopping: 0 });
  });
});
