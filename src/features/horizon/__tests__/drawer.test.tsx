import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HorizonPage } from '../HorizonPage';

describe('DetailsDrawer - Focus Management & Esc Closing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should open drawer on row click, trap focus, close on Esc, and restore focus to triggering row', async () => {
    render(<HorizonPage />);

    // 1. Advance timers by 1s to bypass initial loading skeleton
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // 2. Find the first transaction row (e.g. Amazon.com) and click it
    const rowEl = screen.getByText('Amazon.com (International Services LLC, US Retail Operations Branch)').closest('tr');
    expect(rowEl).toBeInTheDocument();

    // Focus the row
    rowEl?.focus();
    expect(document.activeElement).toBe(rowEl);

    // Click the row to open the details drawer
    act(() => {
      fireEvent.click(rowEl!);
    });

    // 3. Verify drawer is open
    const drawerTitle = screen.getByRole('heading', { name: /transaction details/i });
    expect(drawerTitle).toBeInTheDocument();

    // 4. Verify focus shifted to inside the drawer (the close button is the first focusable element)
    const closeBtn = screen.getByRole('button', { name: /close drawer/i });
    expect(document.activeElement).toBe(closeBtn);

    // 5. Fire Escape key using window.dispatchEvent to ensure listener on window is triggered in JSDOM
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    });

    // 5.5. Advance timers using async act to let the Framer Motion exit animation complete and unmount the drawer
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // 6. Verify drawer is unmounted and focus is restored to the triggering row
    expect(screen.queryByRole('heading', { name: /transaction details/i })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(rowEl);
  });
});
