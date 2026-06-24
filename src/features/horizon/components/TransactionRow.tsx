import React from 'react';
import type { Transaction } from '../types/horizon.types';

interface TransactionRowProps {
  transaction: Transaction;
  isActive: boolean;
  isSelected: boolean;
  privacyMode: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick: (id: string) => void;
  formatCurrency: (amount: number) => string;
}

// React.memo prevents re-rendering of all rows when only search query, parent tab, or another row's selection state changes
export const TransactionRow: React.FC<TransactionRowProps> = React.memo(({
  transaction,
  isActive,
  isSelected,
  privacyMode,
  onSelect,
  onClick,
  formatCurrency
}) => {
  const [datePart, timePart] = transaction.date.split(', ');

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
    }
  };

  return (
    <tr
      onClick={() => onClick(transaction.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(transaction.id);
        }
      }}
      tabIndex={0}
      className={`group transition-all duration-200 border-b border-border-glass hover:bg-white/4 cursor-pointer outline-none focus:bg-white/5 focus:ring-1 focus:ring-app-green ${
        isActive ? 'bg-app-green/[0.03]' : 'odd:bg-white/[0.005] even:bg-white/[0.015]'
      }`}
    >

      {/* Checkbox */}
      <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
        <label className="relative flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(transaction.id, e.target.checked)}
            className="absolute opacity-0 cursor-pointer h-0 w-0 peer"
          />
          <span className="h-4.5 w-4.5 rounded bg-surface-low border border-border-glass peer-checked:bg-app-green peer-checked:border-app-green flex items-center justify-center transition-all duration-150 after:content-[''] after:hidden peer-checked:after:block after:w-1 after:h-2 after:border-solid after:border-black after:border-width-0-2-2-0 after:rotate-45 after:-mt-0.5" />
        </label>
      </td>

      {/* Date */}
      <td className="py-4 px-6 text-text-muted text-[11px] font-sans font-medium whitespace-nowrap">
        {datePart}
      </td>

      {/* Merchant Info */}
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-border-glass flex items-center justify-center font-bold text-xs text-white shrink-0">
            {transaction.logo}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-xs font-semibold truncate max-w-[200px]" title={transaction.merchant}>
              {transaction.merchant}
            </span>
            <span className="text-[10px] text-text-muted font-mono mt-0.5">
              {timePart || ''}
            </span>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="py-4 px-6">
        <span className="inline-flex px-2 py-0.5 rounded-full bg-white/5 border border-border-glass text-[10px] font-semibold text-text-secondary whitespace-nowrap">
          {transaction.category}
        </span>
      </td>

      {/* Account */}
      <td className="py-4 px-6 text-xs text-text-muted font-medium whitespace-nowrap">
        {transaction.account}
      </td>

      {/* Status */}
      <td className="py-4 px-6">
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusClass(transaction.status)}`}>
          {transaction.status}
        </span>
      </td>

      {/* Amount */}
      <td className={`py-4 px-6 text-right font-mono font-bold text-xs whitespace-nowrap ${
        transaction.amount < 0 ? 'text-white' : 'text-app-green'
      }`}>
        {privacyMode ? '••••' : formatCurrency(transaction.amount)}
      </td>
    </tr>
  );
});

TransactionRow.displayName = 'TransactionRow';
export default TransactionRow;
