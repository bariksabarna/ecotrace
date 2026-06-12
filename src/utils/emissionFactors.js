// India-specific emission factors
// Sources: PCRA, CEA 2023, ICAO, IPCC AR6

// TRANSPORT: kg CO₂ per km
export const TRANSPORT = {
  carPetrol: 0.168,      // PCRA average
  carDiesel: 0.149,      // PCRA average
  cngAuto: 0.063,        // CNG auto-rickshaw
  metro: 0.041,          // Delhi Metro average
  bus: 0.089,            // State bus
  bike: 0.089,           // Motorbike
  walk: 0,               // Walking
  domesticFlight: 0.255, // ICAO per km economy
};

// ENERGY: per unit
export const ENERGY = {
  electricityKwh: 0.716, // CEA 2023 national grid factor kg CO₂/kWh
  lpgCylinder: 12.7,     // 14.2 kg cylinder × emission factor
};

// FOOD: kg CO₂ per meal
export const FOOD = {
  vegMeal: 0.7,    // IPCC AR6, Indian vegetarian portion ~0.5kg food
  nonVegMeal: 2.5, // IPCC AR6, avg chicken/fish/egg mixed
  veganMeal: 0.5,  // Lowest impact
};

// SHOPPING: kg CO₂ per item approximately
export const SHOPPING = {
  clothing: 10,
  electronics: 70,
  furniture: 50,
  grocery: 0.3,
};

export const INDIA_DAILY_AVERAGE = 63;  // kg CO₂/person/day (1.9t/month ÷ 30)
export const GLOBAL_DAILY_AVERAGE = 157; // kg CO₂/person/day (4.7t/month ÷ 30)
