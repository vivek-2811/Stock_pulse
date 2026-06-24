import React, { useState, useMemo } from 'react';
import type { Transaction } from '../types/horizon.types';
import { CategoryPills } from './CategoryPills';
import { TransactionRow } from './TransactionRow';
import { EmptyState } from './EmptyState';
import { Search, Download, Trash2, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

import { useDebouncedSearch } from '../hooks/useDebouncedSearch';

interface TransactionsViewProps {
  transactions: Transaction[];
  privacyMode: boolean;
  activeTransactionId: string | null;
  onSelectTransaction: (id: string) => void;
  onClearClick: () => void;
  onExportClick: () => void;
  onConnectClick: () => void;
  formatCurrency: (amount: number) => string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  privacyMode,
  activeTransactionId,
  onSelectTransaction,
  onClearClick,
  onExportClick,
  onConnectClick,
  formatCurrency
}) => {
  // Search and Category states
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const debouncedSearch = useDebouncedSearch(search, 250);

  // Multi-row selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination states
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // Filter transactions based on category pill & debounced search input
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const categoryLower = tx.category.toLowerCase();
      const catMatch =
        category === 'all' || categoryLower === category.toLowerCase();

      const query = debouncedSearch.toLowerCase().trim();
      const searchMatch =
        !query ||
        tx.merchant.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query) ||
        tx.account.toLowerCase().includes(query) ||
        tx.id.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query);


      return catMatch && searchMatch;
    });
  }, [transactions, category, debouncedSearch]);

  // Reset pagination page when filters change (render-time adjustment)
  const [prevCategory, setPrevCategory] = useState('all');
  const [prevDebouncedSearch, setPrevDebouncedSearch] = useState('');

  if (category !== prevCategory || debouncedSearch !== prevDebouncedSearch) {
    setPrevCategory(category);
    setPrevDebouncedSearch(debouncedSearch);
    setPage(1);
  }

  // Paginated list
  const paginatedTransactions = useMemo(() => {
    const startIdx = (page - 1) * PAGE_SIZE;
    return filteredTransactions.slice(startIdx, startIdx + PAGE_SIZE);
  }, [filteredTransactions, page]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));

  // Compute dynamic stats based on filtered transactions (matches prototype behavior)
  const stats = useMemo(() => {
    let outflow = 0;
    let inflow = 0;
    let pending = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.status === 'pending') {
        pending += Math.abs(tx.amount);
      }
      if (tx.amount < 0) {
        outflow += Math.abs(tx.amount);
      } else {
        inflow += tx.amount;
      }
    });

    return { outflow, inflow, pending };
  }, [filteredTransactions]);

  // Checkbox select all handlers
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedTransactions.map((tx) => tx.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleRowSelect = (id: string, selected: boolean) => {
    if (selected) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const isAllSelected =
    paginatedTransactions.length > 0 &&
    paginatedTransactions.every((tx) => selectedIds.includes(tx.id));

  return (
    <div className="space-y-6">
      {/* 1. Stat Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Outflow */}
        <div className="bg-[#121824] border border-border-glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] hover:border-white/10 hover:shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Monthly Outflow</span>
            <span className="text-base font-black text-white mt-1 block font-mono">
              {privacyMode ? '$ ••••' : formatCurrency(-stats.outflow)}
            </span>
            <span className="text-[9px] text-red-500 font-semibold block mt-0.5">Visible items outflow</span>
          </div>
        </div>

        {/* Inflow */}
        <div className="bg-[#121824] border border-border-glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] hover:border-white/10 hover:shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-550 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Monthly Inflow</span>
            <span className="text-base font-black text-white mt-1 block font-mono">
              {privacyMode ? '$ ••••' : formatCurrency(stats.inflow)}
            </span>
            <span className="text-[9px] text-emerald-500 font-semibold block mt-0.5">Visible items inflow</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-[#121824] border border-border-glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] hover:border-white/10 hover:shadow-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Pending Clearance</span>
            <span className="text-base font-black text-white mt-1 block font-mono">
              {privacyMode ? '$ ••••' : formatCurrency(stats.pending)}
            </span>
            <span className="text-[9px] text-amber-500 font-semibold block mt-0.5">Awaiting clearance</span>
          </div>
        </div>
      </div>

      {/* 2. Control Panel */}
      <div className="bg-[#121824] border border-border-glass rounded-2xl p-5 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by merchant, category, account, or reference ID..."
            className="w-full bg-[#1D283F] border border-border-glass rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder-text-muted outline-none focus:border-app-green focus:shadow-glow-green-sm transition-all duration-150"
          />
        </div>

        {/* Filtering & Action Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <CategoryPills selectedCategory={category} onSelectCategory={setCategory} />

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClearClick}
              disabled={transactions.length === 0}
              className="px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Data
            </button>
            <button
              onClick={onExportClick}
              disabled={transactions.length === 0}
              className="px-4 py-2 rounded-xl border border-border-glass bg-surface-low hover:bg-white/5 hover:border-white/10 text-white disabled:opacity-40 disabled:hover:bg-transparent text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* 3. Table Container */}
      {transactions.length === 0 ? (
        <div className="bg-[#121824] border border-border-glass rounded-2xl p-6">
          <EmptyState type="no-history" onConnect={onConnectClick} />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-[#121824] border border-border-glass rounded-2xl p-6">
          <EmptyState type="no-results" />
        </div>
      ) : (
        <div className="bg-[#121824] border border-border-glass rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-black/10 border-b border-border-glass text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-4 px-6 w-10">
                    <label className="relative flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAllChange}
                        className="absolute opacity-0 cursor-pointer h-0 w-0 peer"
                      />
                      <span className="h-4.5 w-4.5 rounded bg-surface-low border border-border-glass peer-checked:bg-app-green peer-checked:border-app-green flex items-center justify-center transition-all duration-150 after:content-[''] after:hidden peer-checked:after:block after:w-1 after:h-2 after:border-solid after:border-black after:border-width-0-2-2-0 after:rotate-45 after:-mt-0.5" />
                    </label>
                  </th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Merchant / Description</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Account</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-glass">
                {paginatedTransactions.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    isActive={tx.id === activeTransactionId}
                    isSelected={selectedIds.includes(tx.id)}
                    privacyMode={privacyMode}
                    onSelect={handleRowSelect}
                    onClick={onSelectTransaction}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="flex items-center justify-between px-6 py-4.5 border-t border-border-glass bg-black/5 text-xs">
            <span className="text-text-muted font-medium">
              Showing {Math.min(filteredTransactions.length, (page - 1) * PAGE_SIZE + 1)}-
              {Math.min(filteredTransactions.length, page * PAGE_SIZE)} of{' '}
              {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-lg border border-border-glass text-white bg-surface-low hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-all duration-150 text-[11px] font-bold cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-lg border border-border-glass text-white bg-surface-low hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-all duration-150 text-[11px] font-bold cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TransactionsView;
