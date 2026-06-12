import React, { useState, useRef, useEffect } from 'react';
import { calculateTotal, getCategoryTotals } from '../utils/calculator.js';

const quickActions = [
  'How can I reduce my transport emissions?',
  "Why is India's electricity grid factor high?",
  'Suggest 3 low-carbon Indian meal ideas',
  'What are easy energy-saving tips at home?',
];

export default function AIAssistant({ activities = [] }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Namaste! I am EcoBot, your India-specific carbon footprint advisor. How can I help you today? 🌱',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const todayTotal = calculateTotal(activities);
  const catTotals = getCategoryTotals(activities);
  let topCategory = 'none';
  let maxVal = 0;
  Object.entries(catTotals).forEach(([cat, val]) => {
    if (val > maxVal) { maxVal = val; topCategory = cat; }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);
    setInputText('');
    const newMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context: { todayTotal, topCategory } }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: 'ai', content: data.text }]);
    } catch (err) {
      setError('EcoBot is taking a nap — try again!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in h-full">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-eco-300">AI Assistant</h1>
        <p className="text-xs text-eco-300/50">Powered by Gemini 2.0 Flash — India-specific advice</p>
      </div>

      {/* Desktop: 2-col layout — chat on left, info panel on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chat Panel (wide) */}
        <div className="lg:col-span-2 flex flex-col" style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}>

          {/* EcoBot header */}
          <div className="bg-forest-800 border border-forest-700 rounded-2xl p-3 flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-eco-500/20 border border-eco-500/30 rounded-full flex items-center justify-center text-xl">🤖</div>
            <div>
              <p className="text-sm font-semibold text-eco-300">EcoBot</p>
              <span className="text-[10px] text-eco-400 flex items-center">
                <span className="w-1.5 h-1.5 bg-eco-500 rounded-full mr-1 animate-pulse" />
                Online · Gemini AI
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-eco-500/20 border border-eco-500/30 text-eco-300 rounded-br-none'
                    : 'bg-forest-800 text-eco-300/90 border border-forest-700 rounded-bl-none'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-forest-800 border border-forest-700 rounded-2xl rounded-bl-none px-4 py-3 flex space-x-1.5 items-center">
                  <span className="w-2 h-2 bg-eco-400 rounded-full dot-1" />
                  <span className="w-2 h-2 bg-eco-400 rounded-full dot-2" />
                  <span className="w-2 h-2 bg-eco-400 rounded-full dot-3" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-danger/10 border border-danger/30 text-danger text-xs rounded-xl px-4 py-2.5 text-center">
                  {error}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="flex overflow-x-auto space-x-2 pb-3 scrollbar-hide select-none flex-shrink-0">
            {quickActions.map((a, i) => (
              <button key={i} onClick={() => sendMessage(a)} disabled={loading}
                className="flex-shrink-0 bg-forest-800 hover:bg-forest-700 border border-forest-700 text-eco-300/70 hover:text-eco-300 text-[11px] px-3 py-1.5 rounded-full transition-all focus:outline-none disabled:opacity-50">
                {a}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(inputText); }} className="flex items-center space-x-2 flex-shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask EcoBot anything about carbon footprint..."
              className="input-field flex-1"
              disabled={loading}
              aria-label="Message text"
            />
            <button type="submit" disabled={loading || !inputText.trim()}
              className="btn-primary flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0"
              aria-label="Send message">
              <span className="text-base">➔</span>
            </button>
          </form>
        </div>

        {/* Info Side Panel */}
        <div className="space-y-4 hidden lg:block">
          <div className="card">
            <h3 className="text-xs font-semibold text-eco-300/60 uppercase tracking-wider mb-3">Your Context</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-eco-300/60">Today's total</span>
                <span className="font-mono font-bold text-eco-300">{todayTotal.toFixed(2)} kg CO₂</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-eco-300/60">Top category</span>
                <span className="font-semibold text-eco-300 capitalize">{topCategory}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xs font-semibold text-eco-300/60 uppercase tracking-wider mb-3">Quick Tips</h3>
            <ul className="space-y-2 text-xs text-eco-300/70 leading-relaxed">
              <li>🚇 Metro is 4× cleaner than a petrol car</li>
              <li>🥦 A veg meal saves 1.8 kg vs. non-veg</li>
              <li>🌡️ AC at 26°C saves ~30% energy</li>
              <li>💡 Turn off standby appliances</li>
              <li>🛒 Buy local, reduce packaging waste</li>
            </ul>
          </div>

          <div className="card">
            <h3 className="text-xs font-semibold text-eco-300/60 uppercase tracking-wider mb-3">About EcoBot</h3>
            <p className="text-[11px] text-eco-300/50 leading-relaxed">
              Powered by Gemini 2.0 Flash. Trained on India-specific data including CEA 2023 grid factors, PCRA transport data, and IPCC AR6 food emissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
