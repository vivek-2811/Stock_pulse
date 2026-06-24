import { useReducer, useEffect, useCallback, useState } from 'react';
import type { Transaction } from '../types/horizon.types';
import { INITIAL_TRANSACTIONS } from '../data/mockTransactions';

type TransactionAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'CLEAR_TRANSACTIONS' }
  | { type: 'RESTORE_TRANSACTIONS' };

function transactionsReducer(state: Transaction[], action: TransactionAction): Transaction[] {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return action.payload;
    case 'UPDATE_TRANSACTION':
      return state.map((tx) => (tx.id === action.payload.id ? action.payload : tx));
    case 'CLEAR_TRANSACTIONS':
      return [];
    case 'RESTORE_TRANSACTIONS':
      return INITIAL_TRANSACTIONS;
    default:
      return state;
  }
}

export function useTransactions() {
  const [state, dispatch] = useReducer(transactionsReducer, [], () => {
    const saved = localStorage.getItem('horizon_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_TRANSACTIONS;
      }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [simulateError, setSimulateError] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('horizon_transactions', JSON.stringify(state));
  }, [state]);

  const clearTransactions = useCallback(() => {
    dispatch({ type: 'CLEAR_TRANSACTIONS' });
  }, []);

  const restoreTransactions = useCallback(() => {
    dispatch({ type: 'RESTORE_TRANSACTIONS' });
  }, []);

  const updateTransactionOptimistic = useCallback(
    async (
      updatedTx: Transaction,
      originalTx: Transaction,
      onSuccess?: () => void,
      onError?: (errMessage: string) => void
    ) => {
      // 1. Optimistic Update: Change the UI state immediately
      dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTx });
      setIsSaving(updatedTx.id);

      // 2. Simulate API Call
      try {
        await new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            if (simulateError) {
              reject(new Error('Network connectivity issue. Write operation rejected.'));
            } else {
              resolve();
            }
          }, 1200); // 1.2s network latency simulation
        });

        // Success Path
        setIsSaving(null);
        if (onSuccess) onSuccess();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Operation failed';
        // 3. Rollback Path: Revert back to original on error
        dispatch({ type: 'UPDATE_TRANSACTION', payload: originalTx });
        setIsSaving(null);
        if (onError) onError(errorMessage);
      }
    },
    [simulateError]
  );

  return {
    transactions: state,
    clearTransactions,
    restoreTransactions,
    updateTransactionOptimistic,
    simulateError,
    setSimulateError,
    isSaving,
  };
}
export default useTransactions;
