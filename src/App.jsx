import React, { useState, useEffect, useCallback } from 'react';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import AIAssistant from './components/AIAssistant';
import Tips from './components/Tips';
import ErrorBoundary from './components/ErrorBoundary';
import { getToday, saveStreak, getStreak, getLast7Days } from './utils/storage';

/**
 * Compute the current tracking streak.
 * A streak increments when the user has logged at least one activity on the
 * previous calendar day. Calling this every app-open keeps it accurate.
 * @returns {number} new streak value (already saved to localStorage)
 */
function computeStreak() {
  const history = getLast7Days(); // [{date, total}, ...] ascending
  const today = history[6];
  const yesterday = history[5];

  const currentStreak = getStreak();

  // If the user has data for today OR yesterday, keep/extend streak
  if (yesterday.total > 0) {
    const newStreak = currentStreak > 0 ? currentStreak + 1 : 1;
    saveStreak(newStreak);
    return newStreak;
  } else if (today.total > 0 && currentStreak === 0) {
    saveStreak(1);
    return 1;
  } else if (currentStreak === 0) {
    saveStreak(0);
    return 0;
  }
  return currentStreak;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Load today's persisted activities
    setActivities(getToday());
    // Update streak based on recent history
    computeStreak();
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard activities={activities} />;
      case 'tracker':
        return <Tracker activities={activities} setActivities={setActivities} />;
      case 'faq':
        return <AIAssistant activities={activities} />;
      case 'tips':
        return <Tips activities={activities} />;
      default:
        return <Dashboard activities={activities} />;
    }
  };

  return (
    <div className="min-h-screen bg-forest-900 text-eco-300 flex flex-col md:flex-row selection:bg-eco-500 selection:text-forest-900">
      {/* Skip to main content — screen-reader / keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-eco-500 focus:text-forest-900 focus:rounded-lg focus:font-semibold focus:outline-none"
      >
        Skip to main content
      </a>

      <NavBar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main
        id="main-content"
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8"
        tabIndex={-1}
      >
        <div className="max-w-5xl mx-auto">
          <ErrorBoundary>
            {renderActiveTab()}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
