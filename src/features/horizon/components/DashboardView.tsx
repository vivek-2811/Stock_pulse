import React, { useMemo } from 'react';
import type { Transaction } from '../types/horizon.types';
import { TrendingUp, Award, Clock } from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  privacyMode: boolean;
  formatCurrency: (amount: number) => string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  privacyMode,
  formatCurrency
}) => {
  const stats = useMemo(() => {
    let net = 0;
    const categoryCounts: Record<string, number> = {};
    let pendingCount = 0;

    transactions.forEach((tx) => {
      net += tx.amount;
      if (tx.status === 'pending') {
        pendingCount++;
      }
      // Track category count
      categoryCounts[tx.category] = (categoryCounts[tx.category] || 0) + 1;
    });

    // Find top category
    let topCategory = 'None';
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topCategory = cat;
      }
    });

    return {
      netFlow: net,
      topCategory,
      pendingCount
    };
  }, [transactions]);

  const cards = [
    {
      title: 'Net Cash Flow',
      value: privacyMode ? '$ ••••' : formatCurrency(stats.netFlow),
      meta: 'Sum of all ledger items',
      icon: TrendingUp,
      color: stats.netFlow >= 0 ? 'text-app-green bg-app-green/10 border-app-green/20' : 'text-red-500 bg-red-500/10 border-red-500/20'
    },
    {
      title: 'Top Category',
      value: stats.topCategory,
      meta: 'Most frequent category',
      icon: Award,
      color: 'text-sky-400 bg-sky-400/10 border-sky-450/20'
    },
    {
      title: 'Pending Review',
      value: `${stats.pendingCount} item${stats.pendingCount === 1 ? '' : 's'}`,
      meta: 'Awaiting clearance',
      icon: Clock,
      color: stats.pendingCount > 0 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="bg-surface-low border border-border-glass rounded-2xl p-5">
        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Overview / Dashboard</span>
        <h2 className="text-base font-bold text-white tracking-tight mt-0.5">Dashboard</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
          Track net cash flow, category momentum, and review alerts from a single summary screen.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-surface-low border border-border-glass hover:border-white/10 rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">{card.title}</span>
                <span className="text-base font-black text-white mt-1 block truncate font-mono">
                  {card.value}
                </span>
                <span className="text-[10px] text-text-muted mt-0.5 block">{card.meta}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DashboardView;
