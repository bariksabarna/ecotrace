import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TRANSPORT, FOOD, ENERGY, SHOPPING } from '../utils/emissionFactors.js';
import {
  calculateTransport,
  calculateFood,
  calculateEnergy,
  calculateShopping,
  calculateTotal,
} from '../utils/calculator.js';
import { saveToday } from '../utils/storage.js';

function SectionHeader({ icon, label, isOpen, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 focus:outline-none focus:ring-2 focus:ring-eco-500/50 rounded-t-2xl"
      aria-expanded={isOpen}
      aria-controls={`section-${label.toLowerCase()}`}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl" role="img" aria-label={label}>{icon}</span>
        <span className="font-semibold text-eco-300 text-sm md:text-base">{label}</span>
      </div>
      <span className={`text-eco-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
    </button>
  );
}

SectionHeader.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default function Tracker({ activities = [], setActivities }) {
  const [openSection, setOpenSection] = useState('transport');

  const [transportMode, setTransportMode] = useState('carPetrol');
  const [distance, setDistance] = useState('');
  const [foodType, setFoodType] = useState('vegMeal');
  const [mealCount, setMealCount] = useState('1');
  const [energyKwh, setEnergyKwh] = useState('10');
  const [lpgFraction, setLpgFraction] = useState('0');
  const [shoppingCategory, setShoppingCategory] = useState('clothing');
  const [quantity, setQuantity] = useState('1');

  const todayTotal = calculateTotal(activities);

  const addActivity = (category, value, label) => {
    if (value <= 0) return;
    const a = {
      id: Date.now().toString(),
      category,
      value: Number(value),
      label,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...activities, a];
    setActivities(updated);
    saveToday(updated);
  };

  const removeActivity = (id) => {
    const updated = activities.filter((a) => a.id !== id);
    setActivities(updated);
    saveToday(updated);
  };

  const exportLog = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ecotrace_log_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const toggle = (s) => setOpenSection(openSection === s ? null : s);

  const modeLabels = {
    carPetrol: 'Petrol Car', carDiesel: 'Diesel Car', cngAuto: 'CNG Auto',
    metro: 'Metro', bus: 'State Bus', bike: 'Motorbike',
    walk: 'Walk', domesticFlight: 'Domestic Flight',
  };

  const mealLabels = { vegMeal: 'Veg Meal', nonVegMeal: 'Non-Veg Meal', veganMeal: 'Vegan Meal' };
  const shopLabels = { clothing: 'Clothing', electronics: 'Electronics', furniture: 'Furniture', grocery: 'Grocery' };

  return (
    <div className="space-y-6 pb-8 fade-in">

      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-eco-300">Track Activities</h2>
        <p className="text-xs text-eco-300/50">Log your daily activities to calculate emissions</p>
      </div>

      {/* Running Total Strip */}
      <div className="bg-gradient-to-r from-forest-800 to-forest-700 border border-eco-500/20 rounded-2xl p-4 flex justify-between items-center sticky top-2 z-30 shadow-lg shadow-forest-900/40">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-eco-300/50 font-semibold">Today so far</p>
          <p className="text-2xl font-bold font-mono text-eco-500">{todayTotal.toFixed(2)} <span className="text-sm text-eco-300/60">kg CO₂</span></p>
        </div>
        <div className="text-4xl opacity-10 select-none">🌱</div>
      </div>

      {/* Desktop 2-col: forms left, log right; Mobile single-col */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Forms Column (wider) */}
        <div className="lg:col-span-3 space-y-4">

          {/* TRANSPORT */}
          <div className="border border-forest-700 bg-forest-800 rounded-2xl overflow-hidden">
            <SectionHeader icon="🚗" label="Transport" isOpen={openSection === 'transport'} onToggle={() => toggle('transport')} />
            {openSection === 'transport' && (
              <form
                id="section-transport"
                onSubmit={(e) => {
                  e.preventDefault();
                  const km = parseFloat(distance);
                  if (!km || km <= 0) return;
                  addActivity('transport', calculateTransport(transportMode, km), `${modeLabels[transportMode]} (${km} km)`);
                  setDistance('');
                }}
                className="p-4 border-t border-forest-700 space-y-4 bg-forest-900/40"
              >
                <div>
                  <label className="text-xs text-eco-300/60 block mb-1.5">Transport Mode</label>
                  <select value={transportMode} onChange={(e) => setTransportMode(e.target.value)} className="input-field" aria-label="Transport Mode">
                    <option value="carPetrol">Petrol Car (0.168 kg/km)</option>
                    <option value="carDiesel">Diesel Car (0.149 kg/km)</option>
                    <option value="cngAuto">CNG Auto (0.063 kg/km)</option>
                    <option value="metro">Metro (0.041 kg/km)</option>
                    <option value="bus">State Bus (0.089 kg/km)</option>
                    <option value="bike">Motorbike (0.089 kg/km)</option>
                    <option value="walk">Walk (0 kg/km)</option>
                    <option value="domesticFlight">Domestic Flight (0.255 kg/km)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-eco-300/60 block mb-1.5">Distance (km)</label>
                  <input type="number" step="any" min="0.1" required placeholder="e.g. 10" value={distance}
                    onChange={(e) => setDistance(e.target.value)} className="input-field font-mono" aria-label="Distance in kilometers" />
                </div>
                <button type="submit" className="btn-primary w-full">Add to Log</button>
              </form>
            )}
          </div>

          {/* FOOD */}
          <div className="border border-forest-700 bg-forest-800 rounded-2xl overflow-hidden">
            <SectionHeader icon="🍲" label="Food" isOpen={openSection === 'food'} onToggle={() => toggle('food')} />
            {openSection === 'food' && (
              <form
                id="section-food"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = parseInt(mealCount, 10);
                  if (!n || n <= 0) return;
                  addActivity('food', calculateFood(foodType, n), `${mealLabels[foodType]} × ${n}`);
                  setMealCount('1');
                }}
                className="p-4 border-t border-forest-700 space-y-4 bg-forest-900/40"
              >
                <div>
                  <label className="text-xs text-eco-300/60 block mb-1.5">Meal Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'vegMeal', label: 'Veg', sub: '0.7 kg/meal' },
                      { key: 'nonVegMeal', label: 'Non-Veg', sub: '2.5 kg/meal' },
                      { key: 'veganMeal', label: 'Vegan', sub: '0.5 kg/meal' },
                    ].map((m) => (
                      <label key={m.key} className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all ${
                        foodType === m.key ? 'border-eco-500 bg-eco-500/10 text-eco-300' : 'border-forest-700 bg-forest-800 hover:bg-forest-700 text-eco-300/60'
                      }`}>
                        <input type="radio" name="foodType" value={m.key} checked={foodType === m.key}
                          onChange={() => setFoodType(m.key)} className="sr-only" />
                        <span className="text-xs font-semibold">{m.label}</span>
                        <span className="text-[10px] opacity-60 mt-0.5 font-mono">{m.sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-eco-300/60 block mb-1.5">Number of Meals</label>
                  <input type="number" min="1" required value={mealCount}
                    onChange={(e) => setMealCount(e.target.value)} className="input-field font-mono" aria-label="Number of meals" />
                </div>
                <button type="submit" className="btn-primary w-full">Add to Log</button>
              </form>
            )}
          </div>

          {/* ENERGY */}
          <div className="border border-forest-700 bg-forest-800 rounded-2xl overflow-hidden">
            <SectionHeader icon="⚡" label="Energy" isOpen={openSection === 'energy'} onToggle={() => toggle('energy')} />
            {openSection === 'energy' && (
              <form
                id="section-energy"
                onSubmit={(e) => {
                  e.preventDefault();
                  const kwh = parseFloat(energyKwh) || 0;
                  const lpg = parseFloat(lpgFraction) || 0;
                  if (kwh === 0 && lpg === 0) return;
                  const label = kwh > 0 && lpg > 0
                    ? `Electricity (${kwh} kWh) + LPG (${lpg} cyl)`
                    : kwh > 0 ? `Electricity (${kwh} kWh)` : `LPG (${lpg} cyl)`;
                  addActivity('energy', calculateEnergy(kwh, lpg), label);
                }}
                className="p-4 border-t border-forest-700 space-y-4 bg-forest-900/40"
              >
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-xs text-eco-300/60">Electricity (kWh)</label>
                    <span className="text-xs font-mono font-semibold text-eco-400">{energyKwh} kWh</span>
                  </div>
                  <input type="range" min="0" max="50" step="1" value={energyKwh}
                    onChange={(e) => setEnergyKwh(e.target.value)} className="w-full accent-eco-500"
                    aria-label="Electricity usage in kilowatt hours" />
                </div>
                <div>
                  <label className="text-xs text-eco-300/60 block mb-1.5">LPG Cylinder Fraction Used</label>
                  <select value={lpgFraction} onChange={(e) => setLpgFraction(e.target.value)} className="input-field" aria-label="LPG Cylinder fraction">
                    <option value="0">0 (None)</option>
                    <option value="0.25">0.25 (Quarter)</option>
                    <option value="0.5">0.5 (Half)</option>
                    <option value="0.75">0.75 (Three-quarters)</option>
                    <option value="1">1.0 (Full cylinder)</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary w-full">Add to Log</button>
              </form>
            )}
          </div>

          {/* SHOPPING */}
          <div className="border border-forest-700 bg-forest-800 rounded-2xl overflow-hidden">
            <SectionHeader icon="🛍️" label="Shopping" isOpen={openSection === 'shopping'} onToggle={() => toggle('shopping')} />
            {openSection === 'shopping' && (
              <form
                id="section-shopping"
                onSubmit={(e) => {
                  e.preventDefault();
                  const qty = parseInt(quantity, 10);
                  if (!qty || qty <= 0) return;
                  addActivity('shopping', calculateShopping(shoppingCategory, qty), `${shopLabels[shoppingCategory]} × ${qty}`);
                  setQuantity('1');
                }}
                className="p-4 border-t border-forest-700 space-y-4 bg-forest-900/40"
              >
                <div>
                  <label className="text-xs text-eco-300/60 block mb-1.5">Category</label>
                  <select value={shoppingCategory} onChange={(e) => setShoppingCategory(e.target.value)} className="input-field" aria-label="Shopping Category">
                    <option value="clothing">Clothing (10 kg CO₂/item)</option>
                    <option value="electronics">Electronics (70 kg CO₂/item)</option>
                    <option value="furniture">Furniture (50 kg CO₂/item)</option>
                    <option value="grocery">Grocery Trip (0.3 kg CO₂/item)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-eco-300/60 block mb-1.5">Quantity</label>
                  <input type="number" min="1" required value={quantity}
                    onChange={(e) => setQuantity(e.target.value)} className="input-field font-mono" aria-label="Quantity" />
                </div>
                <button type="submit" className="btn-primary w-full">Add to Log</button>
              </form>
            )}
          </div>
        </div>

        {/* Log Column (narrower) */}
        <div className="lg:col-span-2">
          <div className="card sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-eco-300">Today's Log</h3>
              <div className="flex items-center space-x-2">
                {activities.length > 0 && (
                  <button
                    onClick={exportLog}
                    className="text-[10px] text-eco-400 hover:text-eco-300 border border-eco-500/30 px-2 py-0.5 rounded transition-colors"
                    aria-label="Export today's log as JSON"
                  >
                    Export JSON
                  </button>
                )}
                <span className="text-[10px] text-eco-300/40 font-mono">{activities.length} entries</span>
              </div>
            </div>
            {activities.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-xs text-eco-300/40">No activities logged yet.</p>
                <p className="text-[10px] text-eco-300/30 mt-1">Use the forms to start tracking.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {[...activities].reverse().map((a) => (
                  <div key={a.id}
                    className="flex justify-between items-center bg-forest-900/50 border border-forest-700 rounded-xl px-3 py-2.5 hover:border-forest-600 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-eco-300 truncate">{a.label}</p>
                      <p className="text-[10px] text-eco-300/40">{a.timestamp} · {a.category}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                      <span className="text-xs font-bold font-mono text-eco-400">+{a.value.toFixed(2)}</span>
                      <button onClick={() => removeActivity(a.id)}
                        className="text-danger/60 hover:text-danger p-1 text-xs focus:outline-none transition-colors"
                        aria-label={`Remove ${a.label}`}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Tracker.propTypes = {
  /** Current day's logged activities */
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
      timestamp: PropTypes.string,
    })
  ),
  /** Setter to update the activities state in App */
  setActivities: PropTypes.func.isRequired,
};
