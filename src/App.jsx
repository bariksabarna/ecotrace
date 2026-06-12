import React, { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import Tracker from './components/Tracker';
import AIAssistant from './components/AIAssistant';
import Tips from './components/Tips';
import { getToday, saveStreak, getStreak } from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Load today's activities
    const todayData = getToday();
    setActivities(todayData);

    // Simple streak logic on app open
    const currentStreak = getStreak();
    if (currentStreak === 0) {
      saveStreak(1); // Start with 1 if brand new
    }
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard activities={activities} />;
      case 'tracker':
        return <Tracker activities={activities} setActivities={setActivities} />;
      case 'chat':
        return <AIAssistant activities={activities} />;
      case 'tips':
        return <Tips activities={activities} />;
      default:
        return <Dashboard activities={activities} />;
    }
  };

  return (
    <div className="min-h-screen bg-forest-900 text-eco-300 flex flex-col md:flex-row selection:bg-eco-500 selection:text-forest-900">
      {/* Responsive NavBar */}
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
}
