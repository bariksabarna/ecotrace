import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { calculateTotal, getCategoryTotals } from '../utils/calculator.js';
import { getStreak, getLast7Days } from '../utils/storage.js';
import { INDIA_DAILY_AVERAGE, GLOBAL_DAILY_AVERAGE } from '../utils/emissionFactors.js';

export default function Dashboard({ activities = [] }) {
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setStreak(getStreak());
    setHistory(getLast7Days());
  }, [activities]);

  const todayTotal = calculateTotal(activities);
  const catTotals = getCategoryTotals(activities);

  // Circular progress ring calculations
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 502;
  const maxLimit = 15;
  const pct = Math.min(todayTotal, maxLimit) / maxLimit;
  const strokeDashoffset = circumference - pct * circumference;

  let strokeColor = 'stroke-eco-500';
  let textColor = 'text-eco-500';
  let statusMsg = 'Excellent! Keeping it light and green.';
  if (todayTotal >= 5 && todayTotal <= 10) {
    strokeColor = 'stroke-amber-500';
    textColor = 'text-amber-500';
    statusMsg = 'Moderate footprint. Keep tracking!';
  } else if (todayTotal > 10) {
    strokeColor = 'stroke-danger';
    textColor = 'text-danger';
    statusMsg = "High footprint today. Let's offset this!";
  }

  const maxDayTotal = Math.max(...history.map((h) => h.total), 1);

  const formatDayName = (dateStr) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date(dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? '' : days[d.getDay()];
  };

  const formatMonthDay = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const categories = [
    { label: 'Transport', icon: '🚗', val: catTotals.transport, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { label: 'Food',      icon: '🍲', val: catTotals.food,      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Energy',    icon: '⚡', val: catTotals.energy,    color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    { label: 'Shopping',  icon: '🛍️', val: catTotals.shopping,  color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
  ];

  const progressPct = (val, max) => Math.min((val / max) * 100, 100);

  return (
    <div className="space-y-6 pb-8 fade-in">

      {/* Header Row */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-eco-300">Dashboard</h2>
          <p className="text-xs text-eco-300/50">Track your daily carbon footprint</p>
        </div>
        <div className="flex items-center space-x-2 bg-forest-800 border border-forest-700 px-3 py-1.5 rounded-full pulse-glow">
          <span className="text-base" role="img" aria-label="streak fire">🔥</span>
          <span className="text-xs font-semibold text-eco-300">{streak} Day Streak</span>
        </div>
      </div>

      {/* Hero Row: ring + categories — 2-col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Circular Ring Card */}
        <div className="card flex flex-col items-center justify-center py-8">
          <p className="text-xs uppercase tracking-widest text-eco-300/40 font-semibold mb-4">Today's Footprint</p>
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200" role="img" aria-label={`Today's carbon footprint: ${todayTotal.toFixed(2)} kg CO₂`}>
              <circle cx="100" cy="100" r={radius} className="stroke-forest-700 fill-none" strokeWidth={strokeWidth} />
              <circle
                cx="100" cy="100" r={radius}
                className={`fill-none ring-progress ${strokeColor}`}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-eco-300/50 uppercase tracking-widest font-semibold">Today</span>
              <span className={`text-3xl font-bold font-mono tracking-tight my-1 ${textColor}`}>
                {todayTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-eco-300/60">kg CO₂</span>
            </div>
          </div>
          <p className="text-xs text-eco-300/70 text-center mt-4 leading-relaxed max-w-xs">{statusMsg}</p>
        </div>

        {/* Category Breakdown */}
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-eco-300">Category Breakdown</h3>
          {categories.map((c) => (
            <div key={c.label} className={`flex items-center space-x-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
              <span className="text-xl w-7 text-center" role="img" aria-label={c.label}>{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-semibold ${c.color}`}>{c.label}</span>
                  <span className="text-xs font-bold font-mono text-eco-300">{c.val.toFixed(2)} kg</span>
                </div>
                <div className="w-full bg-forest-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${c.color.replace('text-', 'bg-')}`}
                    style={{ width: `${progressPct(c.val, Math.max(todayTotal, 1))}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Second Row: bar chart + benchmarks — 2-col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 7-Day Bar Chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-eco-300 mb-4">Last 7 Days</h3>
          <div className="flex justify-between items-end h-28 pt-2 px-1">
            {history.map((day, idx) => {
              const heightPct = (day.total / maxDayTotal) * 100;
              const isToday = idx === 6;
              return (
                <div key={day.date} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex justify-center items-end h-20">
                    <span className="absolute bottom-full mb-1 scale-0 group-hover:scale-100 transition-all bg-forest-900 border border-forest-700 text-[10px] text-eco-300 px-1.5 py-0.5 rounded font-mono z-10 whitespace-nowrap">
                      {day.total.toFixed(1)} kg
                    </span>
                    <div
                      className={`w-4 rounded-t-md bar-animate transition-all duration-500 ${
                        isToday ? 'bg-eco-500 shadow-md shadow-eco-500/20' : 'bg-forest-700 hover:bg-eco-400/50'
                      }`}
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-eco-300/50 mt-1.5">{formatDayName(day.date)}</span>
                  <span className="text-[8px] text-eco-300/30 font-mono">{formatMonthDay(day.date)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* India vs Global Benchmark */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-eco-300">Benchmarks</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-eco-300/80">Your Today</span>
                <span className={`font-mono font-bold ${textColor}`}>{todayTotal.toFixed(2)} kg CO₂</span>
              </div>
              <div className="w-full bg-forest-900 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    todayTotal < 5 ? 'bg-eco-500' : todayTotal <= 10 ? 'bg-amber-500' : 'bg-danger'
                  }`}
                  style={{ width: `${progressPct(todayTotal, GLOBAL_DAILY_AVERAGE)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-eco-300/80">India Avg (1.9 t/mo)</span>
                <span className="font-mono text-eco-300/60">{INDIA_DAILY_AVERAGE} kg CO₂</span>
              </div>
              <div className="w-full bg-forest-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${progressPct(INDIA_DAILY_AVERAGE, GLOBAL_DAILY_AVERAGE)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-eco-300/80">Global Avg (4.7 t/mo)</span>
                <span className="font-mono text-eco-300/60">{GLOBAL_DAILY_AVERAGE} kg CO₂</span>
              </div>
              <div className="w-full bg-forest-900 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-700 h-full rounded-full w-full" />
              </div>
            </div>

            <p className="text-[10px] text-eco-300/40 pt-2 leading-relaxed">
              India grid: 0.716 kg CO₂/kWh (CEA 2023). Transport factors: PCRA data. Food: IPCC AR6.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  /** Array of logged activity objects for the current day */
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      category: PropTypes.string,
      value: PropTypes.number,
      label: PropTypes.string,
    })
  ),
};
