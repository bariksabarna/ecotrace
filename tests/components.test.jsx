import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import NavBar from '../src/components/NavBar';
import Dashboard from '../src/components/Dashboard';
import Tips from '../src/components/Tips';
import Tracker from '../src/components/Tracker';
import ErrorBoundary from '../src/components/ErrorBoundary';
import AIAssistant from '../src/components/AIAssistant';

// Mock scrollIntoView for jsdom compatibility
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock storage functions
const mockGetStreak = vi.fn().mockReturnValue(3);
const mockGetLast7Days = vi.fn().mockReturnValue([
  { date: '2026-06-09', total: 1 },
  { date: '2026-06-10', total: 6 },
  { date: '2026-06-11', total: 12 },
  { date: '2026-06-12', total: 0 },
  { date: '2026-06-13', total: 0 },
  { date: '2026-06-14', total: 0 },
  { date: '2026-06-15', total: 0 },
]);
const mockGetDoneTips = vi.fn().mockReturnValue(['tip-2']);
const mockMarkTipDone = vi.fn();
const mockSaveToday = vi.fn();

vi.mock('../src/utils/storage.js', () => {
  return {
    getStreak: () => mockGetStreak(),
    getLast7Days: () => mockGetLast7Days(),
    getDoneTips: () => mockGetDoneTips(),
    markTipDone: (id) => mockMarkTipDone(id),
    saveToday: (act) => mockSaveToday(act),
  };
});

describe('NavBar Component', () => {
  it('renders tab buttons and responds to tab change on both mobile and desktop', () => {
    const handleTabChange = vi.fn();
    render(<NavBar activeTab="dashboard" setActiveTab={handleTabChange} />);

    // Mobile buttons
    const mobileBtns = screen.getAllByRole('button', { name: /Track/i });
    expect(mobileBtns.length).toBe(2); // One mobile, one desktop
    fireEvent.click(mobileBtns[0]);
    expect(handleTabChange).toHaveBeenCalledWith('tracker');

    // Desktop button click
    const tipsBtns = screen.getAllByRole('button', { name: /Tips/i });
    fireEvent.click(tipsBtns[1]);
    expect(handleTabChange).toHaveBeenCalledWith('tips');
  });
});

describe('Dashboard Component', () => {
  it('renders progress ring and category totals correctly under low carbon footprint', () => {
    const mockActivities = [
      { id: '1', category: 'transport', value: 2.5, label: 'Petrol Car' },
      { id: '2', category: 'food', value: 1.5, label: 'Veg Meal' },
    ];
    render(<Dashboard activities={mockActivities} />);
    expect(screen.getByText('4.00')).toBeInTheDocument();
    expect(screen.getByText('Excellent! Keeping it light and green.')).toBeInTheDocument();
  });

  it('renders correctly with moderate footprint (5 - 10 kg)', () => {
    const mockActivities = [
      { id: '1', category: 'transport', value: 8.0, label: 'Petrol Car' },
    ];
    render(<Dashboard activities={mockActivities} />);
    expect(screen.getByText('8.00')).toBeInTheDocument();
    expect(screen.getByText('Moderate footprint. Keep tracking!')).toBeInTheDocument();
  });

  it('renders correctly with high footprint (> 10 kg)', () => {
    const mockActivities = [
      { id: '1', category: 'transport', value: 14.5, label: 'Petrol Car' },
    ];
    render(<Dashboard activities={mockActivities} />);
    expect(screen.getByText('14.50')).toBeInTheDocument();
    expect(screen.getByText("High footprint today. Let's offset this!")).toBeInTheDocument();
  });

  it('handles invalid date formats gracefully', () => {
    mockGetLast7Days.mockReturnValueOnce([
      { date: 'invalid-date', total: 5.0 }
    ]);
    render(<Dashboard activities={[]} />);
    // Verification that it rendered successfully without crash (means dates were formatted as '')
    expect(screen.getByText('Today\'s Footprint')).toBeInTheDocument();
  });
});

describe('Tips Component', () => {
  it('displays tips list, handles filters, and marks tips done', () => {
    const mockActivities = [{ category: 'food', value: 5.0 }];
    render(<Tips activities={mockActivities} />);

    // Tips page header
    expect(screen.getByText('Eco Tips')).toBeInTheDocument();

    // Active priority alert
    expect(screen.getByText(/Your highest-emission category is/i)).toBeInTheDocument();

    // Filter by food
    const foodFilterBtn = screen.getByRole('button', { name: /^Food$/i });
    fireEvent.click(foodFilterBtn);

    // Filter by shopping
    const shoppingFilterBtn = screen.getByRole('button', { name: /^Shopping$/i });
    fireEvent.click(shoppingFilterBtn);

    // Filter by all
    const allFilterBtn = screen.getByRole('button', { name: /^All$/i });
    fireEvent.click(allFilterBtn);

    // Clicking "Mark Done" triggers storage saving
    const markDoneBtns = screen.getAllByRole('button', { name: /Mark complete/i });
    fireEvent.click(markDoneBtns[0]);
    expect(mockMarkTipDone).toHaveBeenCalled();
  });

  it('renders empty message when tips list is empty', () => {
    render(<Tips activities={[]} tips={[]} />);
    expect(screen.getByText('No tips for this filter.')).toBeInTheDocument();
  });
});

describe('Tracker Component', () => {
  it('renders all tracker categories and handles adding & removing activities', () => {
    const setActivities = vi.fn();
    const mockActivities = [
      { id: 'act-1', category: 'transport', value: 2.0, label: 'Metro', timestamp: '12:00 PM' }
    ];

    const { rerender } = render(<Tracker activities={mockActivities} setActivities={setActivities} />);

    expect(screen.getByText('Track Activities')).toBeInTheDocument();
    expect(screen.getByText('2.00')).toBeInTheDocument();
    expect(screen.getByText('Metro')).toBeInTheDocument();

    // Test Export JSON button
    const exportBtn = screen.getByRole('button', { name: /Export today's log/i });
    fireEvent.click(exportBtn);

    // Test removing activity
    const removeBtn = screen.getByRole('button', { name: /Remove Metro/i });
    fireEvent.click(removeBtn);
    expect(setActivities).toHaveBeenCalled();

    // Test adding Transport
    rerender(<Tracker activities={[]} setActivities={setActivities} />);
    const distanceInput = screen.getByLabelText(/Distance in kilometers/i);
    fireEvent.change(distanceInput, { target: { value: '25' } });
    const transportSelect = screen.getByLabelText(/Transport Mode/i);
    fireEvent.change(transportSelect, { target: { value: 'metro' } });
    const transportForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(transportForm);
    expect(setActivities).toHaveBeenCalled();

    // Toggle to Food section
    const foodTab = screen.getByRole('button', { name: /Food/i });
    fireEvent.click(foodTab);

    // Find and change the number of meals input
    const mealCountInput = screen.getByLabelText(/Number of Meals/i);
    fireEvent.change(mealCountInput, { target: { value: '3' } });

    // Click Vegan radio button
    const veganLabel = screen.getByText('Vegan');
    fireEvent.click(veganLabel);

    const foodForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(foodForm);
    expect(setActivities).toHaveBeenCalled();

    // Toggle to Energy section
    const energyTab = screen.getByRole('button', { name: /Energy/i });
    fireEvent.click(energyTab);
    const energySlider = screen.getByLabelText(/Electricity usage/i);
    fireEvent.change(energySlider, { target: { value: '20' } });
    const lpgSelect = screen.getByLabelText(/LPG Cylinder/i);
    fireEvent.change(lpgSelect, { target: { value: '0.5' } });
    const energyForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(energyForm);
    expect(setActivities).toHaveBeenCalled();

    // Toggle to Shopping section
    const shoppingTab = screen.getByRole('button', { name: /Shopping/i });
    fireEvent.click(shoppingTab);
    const shopCatSelect = screen.getByLabelText(/Shopping Category/i);
    fireEvent.change(shopCatSelect, { target: { value: 'electronics' } });
    
    // Change quantity input
    const quantityInput = screen.getByLabelText('Quantity');
    fireEvent.change(quantityInput, { target: { value: '3' } });
    
    const shopForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(shopForm);
    expect(setActivities).toHaveBeenCalled();


    // Collapse Transport Section by clicking it
    const transportTab = screen.getByRole('button', { name: /Transport/i });
    fireEvent.click(transportTab);
  });

  it('handles empty or invalid inputs in tracker forms gracefully', () => {
    const setActivities = vi.fn();
    render(<Tracker activities={[]} setActivities={setActivities} />);

    // 1. Transport section invalid input
    const transportTab = screen.getByRole('button', { name: /Transport/i });
    let distanceInput = screen.queryByLabelText(/Distance in kilometers/i);
    if (!distanceInput) {
      fireEvent.click(transportTab);
      distanceInput = screen.getByLabelText(/Distance in kilometers/i);
    }
    fireEvent.change(distanceInput, { target: { value: '0' } });
    const transportForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(transportForm);
    expect(setActivities).not.toHaveBeenCalled();

    // 2. Food section invalid input
    const foodTab = screen.getByRole('button', { name: /Food/i });
    fireEvent.click(foodTab);
    const mealCountInput = screen.getByLabelText(/Number of Meals/i);
    fireEvent.change(mealCountInput, { target: { value: '0' } });
    const foodForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(foodForm);
    expect(setActivities).not.toHaveBeenCalled();

    // 3. Energy section with zero values (kWh = 0, LPG = 0)
    const energyTab = screen.getByRole('button', { name: /Energy/i });
    fireEvent.click(energyTab);
    const energySlider = screen.getByLabelText(/Electricity usage/i);
    fireEvent.change(energySlider, { target: { value: '0' } });
    const lpgSelect = screen.getByLabelText(/LPG Cylinder/i);
    fireEvent.change(lpgSelect, { target: { value: '0' } });
    const energyForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(energyForm);
    expect(setActivities).not.toHaveBeenCalled();

    // 4. Energy section with only kWh > 0 (LPG = 0)
    fireEvent.change(energySlider, { target: { value: '15' } });
    fireEvent.submit(energyForm);
    expect(setActivities).toHaveBeenCalled();
    setActivities.mockClear();

    // 5. Energy section with only LPG > 0 (kWh = 0)
    fireEvent.change(energySlider, { target: { value: '0' } });
    fireEvent.change(lpgSelect, { target: { value: '1' } });
    fireEvent.submit(energyForm);
    expect(setActivities).toHaveBeenCalled();
    setActivities.mockClear();

    // 6. Shopping section invalid input
    const shoppingTab = screen.getByRole('button', { name: /Shopping/i });
    fireEvent.click(shoppingTab);
    const quantityInput = screen.getByLabelText('Quantity');
    fireEvent.change(quantityInput, { target: { value: '0' } });
    const shopForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(shopForm);
    // 7. Transport with Walk mode (value = 0)
    const transportTabObj = screen.getByRole('button', { name: /Transport/i });
    fireEvent.click(transportTabObj);
    const distInput = screen.getByLabelText(/Distance in kilometers/i);
    fireEvent.change(distInput, { target: { value: '10' } });
    const modeSelect = screen.getByLabelText(/Transport Mode/i);
    fireEvent.change(modeSelect, { target: { value: 'walk' } });
    const transForm = screen.getByRole('button', { name: /Add to Log/i }).closest('form');
    fireEvent.submit(transForm);
    expect(setActivities).not.toHaveBeenCalled();

    // Collapse it again (sets openSection to null because openSection === s)
    fireEvent.click(transportTabObj);
  });
});

describe('AIAssistant Component', () => {
  it('handles consent and allows chatting with EcoBot', async () => {
    localStorage.removeItem('chatConsent');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url, options) => {
      return Promise.resolve({
        ok: true,
        json: () => {
          const body = JSON.parse(options.body);
          const lastMsg = body.messages[body.messages.length - 1].content;
          if (lastMsg.includes('CNG')) {
            return Promise.resolve({ text: 'CNG is cleaner than petrol.' });
          }
          return Promise.resolve({ text: 'Here are some tips: use public transport!' });
        },
      });
    });

    const mockActivities = [
      { id: '1', category: 'transport', value: 3.0, label: 'Metro' },
    ];

    render(<AIAssistant activities={mockActivities} />);

    // Check header
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();

    // Consent banner should be visible
    expect(screen.getByText(/please provide explicit consent/i)).toBeInTheDocument();

    // Click Enable AI Assistant
    const enableBtn = screen.getByRole('button', { name: /Enable AI Assistant/i });
    fireEvent.click(enableBtn);

    // Now clicking quick action should call fetch
    const quickBtn = screen.getAllByRole('button', { name: /Quick action:/i })[0];
    fireEvent.click(quickBtn);
    expect(fetchSpy).toHaveBeenCalled();
    expect(await screen.findByText('Here are some tips: use public transport!')).toBeInTheDocument();

    // Test text input chat flow
    const input = screen.getByPlaceholderText(/Ask EcoBot anything/i);
    fireEvent.change(input, { target: { value: 'How clean is CNG?' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.submit(sendBtn.closest('form'));
    expect(await screen.findByText('CNG is cleaner than petrol.')).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  it('handles sending message without consent', async () => {
    localStorage.removeItem('chatConsent');
    render(<AIAssistant activities={[]} />);
    // Input is disabled, but JSDOM allows simulating form submit or change
    const input = screen.getByPlaceholderText(/Ask EcoBot anything/i);
    fireEvent.change(input, { target: { value: 'Is this secure?' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.submit(sendBtn.closest('form'));
    
    expect(screen.getByText('Please opt‑in to use the AI assistant.')).toBeInTheDocument();
  });

  it('handles API failure and shows error message', async () => {
    localStorage.setItem('chatConsent', 'true');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'AI service unavailable' }),
      })
    );
    render(<AIAssistant activities={[]} />);
    const input = screen.getByPlaceholderText(/Ask EcoBot anything/i);
    fireEvent.change(input, { target: { value: 'Help me' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.submit(sendBtn.closest('form'));

    // Wait for the async state updates to finish and error to be rendered
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('EcoBot: AI service unavailable');

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });

    fetchSpy.mockRestore();
  });

  it('handles network throw error', async () => {
    localStorage.setItem('chatConsent', 'true');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.reject(new Error('Failed to fetch'))
    );
    render(<AIAssistant activities={[]} />);
    const input = screen.getByPlaceholderText(/Ask EcoBot anything/i);
    fireEvent.change(input, { target: { value: 'Help me fast' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.submit(sendBtn.closest('form'));

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('EcoBot: Failed to fetch');

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });

    fetchSpy.mockRestore();
  });

  it('handles JSON parse error on non-ok response', async () => {
    localStorage.setItem('chatConsent', 'true');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 502,
        json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
      })
    );
    render(<AIAssistant activities={[]} />);
    const input = screen.getByPlaceholderText(/Ask EcoBot anything/i);
    fireEvent.change(input, { target: { value: 'Trigger parse error' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.submit(sendBtn.closest('form'));

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toHaveTextContent('EcoBot: HTTP 502');

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });

    fetchSpy.mockRestore();
  });

  it('returns early if trimmed is empty or already loading', async () => {
    localStorage.setItem('chatConsent', 'true');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<AIAssistant activities={[]} />);
    const input = screen.getByPlaceholderText(/Ask EcoBot anything/i);
    fireEvent.change(input, { target: { value: '   ' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.submit(sendBtn.closest('form'));
    expect(fetchSpy).not.toHaveBeenCalled();

    let resolveFetch;
    const slowPromise = new Promise((resolve) => { resolveFetch = resolve; });
    fetchSpy.mockImplementation(() => slowPromise.then(() => ({
      ok: true,
      json: () => Promise.resolve({ text: 'Slow reply' }),
    })));

    fireEvent.change(input, { target: { value: 'Slow query' } });
    fireEvent.submit(sendBtn.closest('form'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: 'Fast query' } });
    fireEvent.submit(sendBtn.closest('form'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    resolveFetch();
    expect(await screen.findByText('Slow reply')).toBeInTheDocument();

    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });

    fetchSpy.mockRestore();
  });

  it('handles nullish or missing text property in response', async () => {
    localStorage.setItem('chatConsent', 'true');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ text: null }),
      })
    );
    const { container } = render(<AIAssistant activities={[]} />);
    const input = screen.getByPlaceholderText(/Ask EcoBot anything/i);
    fireEvent.change(input, { target: { value: 'Empty response' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.submit(sendBtn.closest('form'));

    await waitFor(() => {
      const bubbles = container.querySelectorAll('.max-w-\\[85\\%\\]');
      expect(bubbles.length).toBe(3);
      expect(input).not.toBeDisabled();
    });

    fetchSpy.mockRestore();
  });
});

describe('ErrorBoundary Component', () => {
  const ProblematicComponent = () => {
    throw new Error('Test rendering error');
  };

  it('catches render errors and displays fallback UI', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test rendering error')).toBeInTheDocument();

    const reloadBtn = screen.getByRole('button', { name: /Try reloading/i });
    fireEvent.click(reloadBtn);

    spy.mockRestore();
  });

  it('catches render errors without a message and displays fallback UI', () => {
    const ProblematicNoMessageComponent = () => {
      throw null; // Will trigger catch without message or error?.message being undefined
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblematicNoMessageComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Unknown error')).toBeInTheDocument();

    spy.mockRestore();
  });
});
