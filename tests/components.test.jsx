import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

    // Click Non-Veg radio button
    const nonVegRadio = screen.getByLabelText(/Number of Meals/i); // First let's select radio
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
});

describe('AIAssistant Component', () => {
  it('handles consent and allows chatting with EcoBot', async () => {
    localStorage.removeItem('chatConsent');

    const mockResponse = { text: 'Here are some tips: use public transport!' };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ text: mockResponse.text }),
      })
    );

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

    // Test text input chat flow
    const input = screen.getByPlaceholderText(/Ask EcoBot anything/i);
    fireEvent.change(input, { target: { value: 'How clean is CNG?' } });
    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    fireEvent.submit(sendBtn.closest('form'));

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
});
