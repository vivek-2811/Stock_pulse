import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactions } from '../hooks/useTransactions';
import { INITIAL_TRANSACTIONS } from '../data/mockTransactions';
import type { Transaction } from '../types/horizon.types';

describe('useTransactions Hook & Reducer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with INITIAL_TRANSACTIONS', () => {
    const { result } = renderHook(() => useTransactions());
    expect(result.current.transactions).toEqual(INITIAL_TRANSACTIONS);
  });

  it('should clear all transactions', () => {
    const { result } = renderHook(() => useTransactions());
    act(() => {
      result.current.clearTransactions();
    });
    expect(result.current.transactions).toEqual([]);
  });

  it('should restore initial transactions', () => {
    const { result } = renderHook(() => useTransactions());
    act(() => {
      result.current.clearTransactions();
    });
    expect(result.current.transactions).toEqual([]);
    act(() => {
      result.current.restoreTransactions();
    });
    expect(result.current.transactions).toEqual(INITIAL_TRANSACTIONS);
  });

  it('should update a transaction immediately (optimistic update) and persist on success', async () => {
    const { result } = renderHook(() => useTransactions());
    const originalTx = INITIAL_TRANSACTIONS[0];
    const updatedTx: Transaction = {
      ...originalTx,
      notes: 'New Optimistic Note',
      category: 'Dining'
    };

    const onSuccess = vi.fn();
    const onError = vi.fn();

    // Trigger optimistic update
    let promise: Promise<void> | undefined;
    act(() => {
      promise = result.current.updateTransactionOptimistic(updatedTx, originalTx, onSuccess, onError);
    });

    // Check that state updated immediately (optimistic path)
    expect(result.current.transactions[0].notes).toBe('New Optimistic Note');
    expect(result.current.isSaving).toBe(updatedTx.id);

    // Fast-forward simulated network delay (1.2s)
    await act(async () => {
      vi.advanceTimersByTime(1200);
      await promise;
    });

    // Verify confirmation and state persistence
    expect(result.current.transactions[0].notes).toBe('New Optimistic Note');
    expect(result.current.isSaving).toBeNull();
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('should rollback transaction changes when update fails (network error path)', async () => {
    const { result } = renderHook(() => useTransactions());
    
    // Enable error simulation
    act(() => {
      result.current.setSimulateError(true);
    });

    const originalTx = INITIAL_TRANSACTIONS[0];
    const updatedTx: Transaction = {
      ...originalTx,
      notes: 'This will be rolled back',
      category: 'Dining'
    };

    const onSuccess = vi.fn();
    const onError = vi.fn();

    let promise: Promise<void> | undefined;
    act(() => {
      promise = result.current.updateTransactionOptimistic(updatedTx, originalTx, onSuccess, onError);
    });

    // Immediate UI update check
    expect(result.current.transactions[0].notes).toBe('This will be rolled back');

    // Fast-forward simulated network delay
    await act(async () => {
      vi.advanceTimersByTime(1200);
      await promise;
    });

    // Verify rollback to original state
    expect(result.current.transactions[0].notes).toBe(originalTx.notes);
    expect(result.current.isSaving).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Network connectivity issue. Write operation rejected.');
  });
});
