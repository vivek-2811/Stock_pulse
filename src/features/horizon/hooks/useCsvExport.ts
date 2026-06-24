import { useCallback } from 'react';
import type { Transaction } from '../types/horizon.types';

export function useCsvExport(transactions: Transaction[]) {
  const exportCsv = useCallback(() => {
    if (transactions.length === 0) return;
    
    const headers = ['ID', 'Date', 'Merchant', 'Category', 'Account', 'Status', 'Amount', 'Notes'];
    const rows = transactions.map(txn => [
      txn.id,
      txn.date,
      txn.merchant,
      txn.category,
      txn.account,
      txn.status,
      txn.amount,
      txn.notes.replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Horizon_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [transactions]);

  return { exportCsv };
}
export default useCsvExport;
