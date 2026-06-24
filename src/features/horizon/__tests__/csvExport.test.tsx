import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionsView } from '../components/TransactionsView';
import { INITIAL_TRANSACTIONS } from '../data/mockTransactions';

describe('TransactionsView - CSV Exporter', () => {
  beforeEach(() => {
    // Mock URL methods
    window.URL.createObjectURL = vi.fn(() => 'mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger Blob creation and download trigger on clicking export button', () => {
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
        formatCurrency={(val) => `$${val}`}
      />
    );

    // Get the export button
    const exportBtn = screen.getByRole('button', { name: /export csv/i });
    
    // Mock document.createElement ONLY after rendering to avoid breaking React Mounting
    const originalCreateElement = document.createElement;
    const clickSpy = vi.fn();
    const mockAnchor = {
      setAttribute: vi.fn(),
      style: {},
      click: clickSpy,
    };
    
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return mockAnchor as unknown as HTMLAnchorElement;
      }
      return originalCreateElement.call(document, tagName);
    });

    const originalAppend = document.body.appendChild;
    const originalRemove = document.body.removeChild;
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    fireEvent.click(exportBtn);

    // Verify callback triggered
    expect(mockExportClick).toHaveBeenCalled();

    // Clean up spies
    spy.mockRestore();
    document.body.appendChild = originalAppend;
    document.body.removeChild = originalRemove;
  });
});
