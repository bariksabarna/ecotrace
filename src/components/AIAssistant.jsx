import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { calculateTotal, getCategoryTotals } from '../utils/calculator.js';

const quickActions = [
  'How can I reduce my transport emissions?',
  "Why is India's electricity grid factor high?",
  'Suggest 3 low-carbon Indian meal ideas',
  'What are easy energy-saving tips at home?',
];

/**
 * Sanitise a string for safe display — strips control characters.
 * @param {string} str
 * @returns {string}
 */
function sanitise(str) {
  return String(str).replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

export default function AIAssistant({ activities = [] }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content:
        'Namaste! I am EcoBot, your India-specific carbon footprint advisor. How can I help you today? 🌱',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [consent, setConsent] = useState(
    () => !!localStorage.getItem('chatConsent')
  );
  const messagesEndRef = useRef(null);

  // Derived emission context
  const todayTotal = calculateTotal(activities);
  const catTotals = getCategoryTotals(activities);
  let topCategory = 'none';
  let maxVal = 0;
  Object.entries(catTotals).forEach(([cat, val]) => {
    if (val > maxVal) {
      maxVal = val;
      topCategory = cat;
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text) => {
      if (!consent) {
        setError('Please opt‑in to use the AI assistant.');
        return;
      }
      const trimmed = sanitise(text);
      if (!trimmed || loading) return;

      setError(null);
      setInputText('');

      const userMsg = { role: 'user', content: trimmed };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setLoading(true);

      try {
        // Build API payload — send full conversation history for context
        const payload = {
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: { todayTotal, topCategory },
        };

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: sanitise(data.text ?? '') },
        ]);
      } catch (err) {
        setError(`EcoBot: ${err.message}`);
      } finally {
        setLoading(false);
      }
    },
    [consent, loading, messages, todayTotal, topCategory]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="fade-in h-full">
      {/* Page title */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-eco-300">AI Assistant</h2>
        <p className="text-xs text-eco-300/50">
          Powered by Gemini 2.0 Flash — India-specific advice
        </p>
      </div>

      {/* Desktop: 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chat Panel */}
        <div
          className="lg:col-span-2 flex flex-col"
          style={{ height: 'calc(100vh - 220px)', minHeight: '400px' }}
        >
          {/* EcoBot header */}
          <div className="bg-forest-800 border border-forest-700 rounded-2xl p-3 flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-eco-500/20 border border-eco-500/30 rounded-full flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-eco-300">EcoBot</p>
              <span className="text-[10px] text-eco-400 flex items-center">
                <span className="w-1.5 h-1.5 bg-eco-500 rounded-full mr-1 animate-pulse" />
                Online · Gemini 2.0 Flash
              </span>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-eco-500/20 border border-eco-500/30 text-eco-300 rounded-br-none'
                      : 'bg-forest-800 text-eco-300/90 border border-forest-700 rounded-bl-none'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start" aria-label="EcoBot is typing">
                <div className="bg-forest-800 border border-forest-700 rounded-2xl rounded-bl-none px-4 py-3 flex space-x-1.5 items-center">
                  <span className="w-2 h-2 bg-eco-400 rounded-full dot-1" />
                  <span className="w-2 h-2 bg-eco-400 rounded-full dot-2" />
                  <span className="w-2 h-2 bg-eco-400 rounded-full dot-3" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center" role="alert">
                <div className="bg-danger/10 border border-danger/30 text-danger text-xs rounded-xl px-4 py-2.5 text-center">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Consent Banner */}
          {!consent && (
            <div className="p-4 mb-4 bg-forest-800 border border-eco-500 rounded-xl text-eco-300">
              <p className="mb-2 text-sm">
                To enable the AI assistant, please provide explicit consent. Your
                conversation context (daily total, top category) is sent to the server.
              </p>
              <button
                onClick={() => {
                  localStorage.setItem('chatConsent', 'true');
                  setConsent(true);
                }}
                className="btn-primary"
              >
                Enable AI Assistant
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex overflow-x-auto space-x-2 pb-3 scrollbar-hide select-none flex-shrink-0">
            {quickActions.map((a, i) => (
              <button
                key={i}
                onClick={() => sendMessage(a)}
                disabled={loading || !consent}
                className="flex-shrink-0 bg-forest-800 hover:bg-forest-700 border border-forest-700 text-eco-300/70 hover:text-eco-300 text-[11px] px-3 py-1.5 rounded-full transition-all focus:outline-none disabled:opacity-50"
                aria-label={`Quick action: ${a}`}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center space-x-2 flex-shrink-0"
          >
            <label htmlFor="ecobot-input" className="sr-only">
              Message EcoBot
            </label>
            <input
              id="ecobot-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask EcoBot anything about carbon footprint..."
              className="input-field flex-1"
              disabled={loading || !consent}
              maxLength={500}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim() || !consent}
              className="btn-primary flex items-center justify-center h-10 w-10 rounded-xl flex-shrink-0"
              aria-label="Send message"
            >
              <span className="text-base" aria-hidden="true">➔</span>
            </button>
          </form>
        </div>

        {/* Info Side Panel */}
        <div className="space-y-4 hidden lg:block">
          <div className="card">
            <h3 className="text-xs font-semibold text-eco-300/60 uppercase tracking-wider mb-3">
              Your Context
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-eco-300/60">Today's total</span>
                <span className="font-mono font-bold text-eco-300">
                  {todayTotal.toFixed(2)} kg CO₂
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-eco-300/60">Top category</span>
                <span className="font-semibold text-eco-300 capitalize">
                  {topCategory}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xs font-semibold text-eco-300/60 uppercase tracking-wider mb-3">
              Quick Tips
            </h3>
            <ul className="space-y-2 text-xs text-eco-300/70 leading-relaxed">
              <li>🚇 Metro is 4× cleaner than a petrol car</li>
              <li>🥦 A veg meal saves 1.8 kg vs. non-veg</li>
              <li>🌡️ AC at 26°C saves ~30% energy</li>
              <li>💡 Turn off standby appliances</li>
              <li>🛒 Buy local, reduce packaging waste</li>
            </ul>
          </div>

          <div className="card">
            <h3 className="text-xs font-semibold text-eco-300/60 uppercase tracking-wider mb-3">
              About EcoBot
            </h3>
            <p className="text-[11px] text-eco-300/50 leading-relaxed">
              Powered by Gemini 2.0 Flash. Uses India-specific data: CEA 2023
              grid factors, PCRA transport data, and IPCC AR6 food emissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

AIAssistant.propTypes = {
  /** Array of logged activity objects for the current day to provide context to the AI assistant */
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      category: PropTypes.string,
      value: PropTypes.number,
      label: PropTypes.string,
    })
  ),
};
