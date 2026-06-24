import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TransactionsView } from '../components/TransactionsView';
import { INITIAL_TRANSACTIONS } from '../data/mockTransactions';

describe('TransactionsView - Search Filtering with Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockFormatCurrency = (val: number) => `$${val}`;

  it('should filter transactions list only after debounce delay', async () => {
    const mockSelectTransaction = vi.fn();
    const mockClearClick = vi.fn();
    const mockExportClick = vi.fn();
    const mockConnectClick = vi.fn();

    render(
      <TransactionsView
        transactions={INITIAL_TRANSACTIONS}
        privacyMode={false}
        activeTransactionId={null}
        onSelectTransaction={mockSelectTransaction}
        onClearClick={mockClearClick}
        onExportClick={mockExportClick}
        onConnectClick={mockConnectClick}
        formatCurrency={mockFormatCurrency}
      />
    );

    // Initial state: first page displays 5 items
    const rowsBefore = screen.getAllByRole('checkbox');
    expect(rowsBefore.length).toBe(6); // 1 select-all + 5 items

    // Get search input and type "Starbucks"
    const searchInput = screen.getByPlaceholderText(/search by merchant/i);
    
    // Type query
    act(() => {
      fireEvent.change(searchInput, { target: { value: 'Starbucks' } });
    });

    // Instantly check: should not filter yet because of debounce
    const rowsInstant = screen.getAllByRole('checkbox');
    expect(rowsInstant.length).toBe(6);

    // Advance timers by 300ms to clear the 250ms debounce and await state updates
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    // Check filtered results: only Starbucks row should remain (plus select-all checkbox)
    const rowsAfter = screen.getAllByRole('checkbox');
    expect(rowsAfter.length).toBe(2); // 1 select-all checkbox + 1 matching row
    expect(screen.getByText('Starbucks Coffee')).toBeInTheDocument();
  });
});
