import React from 'react';

export default function NavBar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'tracker', label: 'Track', icon: '📊' },
    { id: 'chat', label: 'AI Chat', icon: '🤖' },
    { id: 'tips', label: 'Tips', icon: '💡' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar - hidden on md screen and up */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-forest-800 border-t border-forest-700 pb-safe z-50">
        <div className="flex justify-around items-center h-16 px-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 focus:outline-none"
                style={{ minHeight: '44px', minWidth: '44px' }}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-eco-500 text-forest-900 scale-110 shadow-lg' : 'text-eco-300 hover:bg-forest-700'
                  }`}
                >
                  <span className="text-lg leading-none">{tab.icon}</span>
                </div>
                <span
                  className={`text-[10px] mt-1 font-medium tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-eco-300 font-bold' : 'text-eco-300/60'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation - hidden on mobile/tablet */}
      <aside className="hidden md:flex flex-col w-64 bg-forest-800 border-r border-forest-700 h-screen sticky top-0 p-6 flex-shrink-0 z-40">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-eco-500 tracking-tight">EcoTrace</h1>
          <p className="text-xs text-eco-300/50">India Carbon Platform</p>
        </div>
        <nav className="flex-1 space-y-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 focus:outline-none text-left ${
                  isActive
                    ? 'bg-eco-500 text-forest-900 font-semibold shadow-md'
                    : 'text-eco-300 hover:bg-forest-700'
                }`}
                style={{ minHeight: '44px' }}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="pt-4 border-t border-forest-700/60 text-[10px] text-eco-300/40">
          Prompt Wars Submission v1.0
        </div>
      </aside>
    </>
  );
}
