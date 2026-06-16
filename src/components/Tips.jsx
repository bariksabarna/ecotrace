import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getCategoryTotals } from '../utils/calculator.js';
import { getDoneTips, markTipDone } from '../utils/storage.js';

const staticTips = [
  { id: 'tip-1', category: 'transport', headline: 'Take the metro or a CNG auto instead of booking a private cab.', co2Saving: 3.5, difficulty: 'Easy' },
  { id: 'tip-2', category: 'transport', headline: 'Carpool with colleagues or use two-wheelers for short commutes.', co2Saving: 2.1, difficulty: 'Medium' },
  { id: 'tip-3', category: 'transport', headline: 'Walk or cycle for trips under 2 km — zero emissions and great exercise.', co2Saving: 1.0, difficulty: 'Easy' },
  { id: 'tip-4', category: 'food', headline: 'Opt for a traditional Indian vegetarian thali instead of a chicken/mutton dish.', co2Saving: 1.8, difficulty: 'Easy' },
  { id: 'tip-5', category: 'food', headline: 'Try a fully vegan meal today (plant-based milk, no ghee or butter).', co2Saving: 0.5, difficulty: 'Medium' },
  { id: 'tip-6', category: 'food', headline: 'Buy local seasonal vegetables from a nearby mandi to cut cold-chain emissions.', co2Saving: 0.3, difficulty: 'Easy' },
  { id: 'tip-7', category: 'energy', headline: 'Set your AC thermostat to 26°C — every degree lower raises energy use by ~6%.', co2Saving: 4.2, difficulty: 'Easy' },
  { id: 'tip-8', category: 'energy', headline: 'Unplug chargers and switch off appliances at the mains socket when not in use.', co2Saving: 0.8, difficulty: 'Easy' },
  { id: 'tip-9', category: 'energy', headline: 'Install a 5-star BEE-rated ceiling fan — uses 50W vs 75W for a regular fan.', co2Saving: 1.2, difficulty: 'Hard' },
  { id: 'tip-10', category: 'shopping', headline: 'Avoid fast-fashion garments; reuse or rent clothes for weddings and functions.', co2Saving: 10.0, difficulty: 'Hard' },
  { id: 'tip-11', category: 'shopping', headline: 'Buy vegetables at local mandis with reusable bags — reduce packaging emissions.', co2Saving: 1.2, difficulty: 'Easy' },
];

const difficultyColors = {
  Easy:   'bg-eco-300/10 text-eco-400 border-eco-500/20',
  Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Hard:   'bg-danger/10 text-danger border-danger/20',
};

export default function Tips({ activities = [], tips = staticTips }) {
  const [doneTipIds, setDoneTipIds] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    setDoneTipIds(getDoneTips());
  }, []);

  const catTotals = getCategoryTotals(activities);
  let highestCategory = '';
  let maxEmission = 0;
  Object.entries(catTotals).forEach(([cat, val]) => {
    if (val > maxEmission) { maxEmission = val; highestCategory = cat; }
  });

  const handleDone = (id) => {
    markTipDone(id);
    setDoneTipIds(getDoneTips());
  };

  const filterOptions = ['All', 'Transport', 'Food', 'Energy', 'Shopping'];

  const filtered = tips.filter((t) =>
    activeFilter === 'All' || t.category.toLowerCase() === activeFilter.toLowerCase()
  );

  const undone = filtered.filter((t) => !doneTipIds.includes(t.id)).sort((a, b) => {
    if (a.category === highestCategory && b.category !== highestCategory) return -1;
    if (b.category === highestCategory && a.category !== highestCategory) return 1;
    return b.co2Saving - a.co2Saving;
  });
  const done = filtered.filter((t) => doneTipIds.includes(t.id));
  const finalTips = [...undone, ...done];

  return (
    <div className="space-y-6 pb-8 fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-eco-300">Eco Tips</h2>
        <p className="text-xs text-eco-300/50">India-specific actions to reduce your daily footprint</p>
      </div>

      {/* Filter + Alert row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex overflow-x-auto space-x-2 scrollbar-hide select-none flex-shrink-0">
          {filterOptions.map((opt) => (
            <button key={opt} onClick={() => setActiveFilter(opt)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                activeFilter === opt
                  ? 'bg-eco-500 text-forest-900 border-eco-500 shadow-md shadow-eco-500/20'
                  : 'bg-forest-800 text-eco-300/70 border-forest-700 hover:text-eco-300'
              }`}>
              {opt}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-eco-300/40 sm:ml-auto flex-shrink-0">
          {undone.length} remaining · {done.length} done
        </div>
      </div>

      {highestCategory && maxEmission > 0 && (
        <div className="bg-amber-500/5 border-l-4 border-amber-500 rounded-r-2xl p-4">
          <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Priority Alert</p>
          <p className="text-xs text-eco-300/80 leading-relaxed">
            Your highest-emission category is <span className="font-bold text-eco-300 capitalize">{highestCategory}</span> ({catTotals[highestCategory].toFixed(2)} kg today). Relevant tips are shown first.
          </p>
        </div>
      )}

      {/* Tips Grid — 1 col on mobile, 2 col on md, 3 col on xl */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {finalTips.map((tip) => {
          const isDone = doneTipIds.includes(tip.id);
          return (
            <div key={tip.id}
              className={`card flex flex-col justify-between space-y-3 transition-all duration-300 ${isDone ? 'opacity-40' : 'hover:border-forest-600 hover:shadow-md hover:shadow-forest-900/40'}`}>
              <div className="flex justify-between items-start">
                <span className="chip bg-forest-700 text-eco-300/70 font-mono text-[9px] uppercase border border-forest-600">
                  {tip.category}
                </span>
                <span className={`chip text-[10px] border ${difficultyColors[tip.difficulty]}`}>
                  {tip.difficulty}
                </span>
              </div>
              <p className="text-sm text-eco-300 leading-relaxed flex-1">{tip.headline}</p>
              <div className="flex justify-between items-center pt-2 border-t border-forest-700/60">
                <div>
                  <span className="text-[10px] text-eco-300/40">Save up to</span>
                  <p className="text-xs font-bold text-eco-400 font-mono">{tip.co2Saving.toFixed(1)} kg CO₂</p>
                </div>
                <button
                  onClick={() => handleDone(tip.id)}
                  disabled={isDone}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 focus:outline-none ${
                    isDone
                      ? 'bg-forest-700 text-eco-300/30 cursor-not-allowed'
                      : 'bg-eco-500 text-forest-900 hover:bg-eco-400 active:scale-95'
                  }`}
                  aria-label={isDone ? `Completed: ${tip.headline}` : `Mark complete: ${tip.headline}`}>
                  {isDone ? '✓ Done' : 'Mark Done'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {finalTips.length === 0 && (
        <div className="text-center py-12 text-eco-300/40 text-sm">No tips for this filter.</div>
      )}
    </div>
  );
}

Tips.propTypes = {
  /** Current day's logged activities for personalising tip priority */
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string,
      value: PropTypes.number,
    })
  ),
  /** Custom list of tips to override static defaults */
  tips: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      headline: PropTypes.string.isRequired,
      co2Saving: PropTypes.number.isRequired,
      difficulty: PropTypes.string.isRequired,
    })
  ),
};
