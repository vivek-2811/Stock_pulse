import React, { useMemo } from 'react';
import type { Transaction } from '../types/horizon.types';
import { BarChart, PieChart, Users } from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
  privacyMode: boolean;
  formatCurrency: (amount: number) => string;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  privacyMode,
  formatCurrency
}) => {
  // 1. Calculate spending breakdown (only negative transactions)
  const categorySpending = useMemo(() => {
    const spendingMap: Record<string, number> = {};
    let totalSpending = 0;

    transactions.forEach((tx) => {
      if (tx.amount < 0) {
        const amt = Math.abs(tx.amount);
        spendingMap[tx.category] = (spendingMap[tx.category] || 0) + amt;
        totalSpending += amt;
      }
    });

    return Object.entries(spendingMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // 2. Calculate monthly trend (group by month/date simulated)
  const monthlyTrends = useMemo(() => {
    // We group by month (e.g. May vs June based on dates in mock data)
    let juneIncome = 0;
    let juneExpense = 0;
    let mayIncome = 0;
    let mayExpense = 0;

    transactions.forEach((tx) => {
      const isJune = tx.date.includes('Jun');
      if (tx.amount > 0) {
        if (isJune) juneIncome += tx.amount;
        else mayIncome += tx.amount;
      } else {
        const absAmt = Math.abs(tx.amount);
        if (isJune) juneExpense += absAmt;
        else mayExpense += absAmt;
      }
    });

    return [
      { name: 'May 2026', income: mayIncome, expense: mayExpense },
      { name: 'June 2026', income: juneIncome, expense: juneExpense }
    ];
  }, [transactions]);

  // 3. Calculate most active merchants by transaction counts
  const activeMerchants = useMemo(() => {
    const merchantMap: Record<string, { name: string; logo: string; count: number; total: number }> = {};
    
    transactions.forEach((tx) => {
      const key = tx.merchant.split('(')[0].trim(); // trimAmazon string
      if (!merchantMap[key]) {
        merchantMap[key] = {
          name: key,
          logo: tx.logo,
          count: 0,
          total: 0
        };
      }
      merchantMap[key].count += 1;
      merchantMap[key].total += Math.abs(tx.amount);
    });

    return Object.values(merchantMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [transactions]);

  const maxSpending = categorySpending.length > 0 ? categorySpending[0].amount : 1;
  const maxTrendVal = Math.max(
    ...monthlyTrends.map((t) => Math.max(t.income, t.expense)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="bg-surface-low border border-border-glass rounded-2xl p-5">
        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Insights / Analytics</span>
        <h2 className="text-base font-bold text-white tracking-tight mt-0.5">Analytics</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
          Visualize spending breakdowns, income ratios, and merchant velocity calculated directly from the active database.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <div className="bg-surface-low border border-border-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border-glass">
            <PieChart className="w-4.5 h-4.5 text-app-green" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Spending Breakdown</h3>
          </div>

          {categorySpending.length > 0 ? (
            <div className="space-y-3.5">
              {categorySpending.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white">{item.category}</span>
                    <span className="text-text-secondary font-mono">
                      {privacyMode ? '••••' : formatCurrency(item.amount)} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-app-green/80 to-app-green rounded-full"
                      style={{ width: `${(item.amount / maxSpending) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted text-center py-6">No spending records available.</p>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-surface-low border border-border-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border-glass">
            <BarChart className="w-4.5 h-4.5 text-app-green" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Income vs Expense Trend</h3>
          </div>

          <div className="flex justify-around items-end h-40 pt-4 pb-2">
            {monthlyTrends.map((trend, idx) => {
              const incPct = (trend.income / maxTrendVal) * 100;
              const expPct = (trend.expense / maxTrendVal) * 100;

              return (
                <div key={idx} className="flex flex-col items-center gap-2 w-1/3">
                  <div className="flex gap-3 items-end h-28 w-full justify-center">
                    {/* Income Bar */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-app-green font-mono">
                        {privacyMode ? '••' : `$${Math.round(trend.income)}`}
                      </span>
                      <div
                        className="w-4 rounded-t bg-gradient-to-t from-app-green/30 to-app-green shadow-glow-green-sm"
                        style={{ height: `${incPct * 0.7}px` }}
                      />
                      <span className="text-[8px] text-text-muted">Inc</span>
                    </div>

                    {/* Expense Bar */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-red-500 font-mono">
                        {privacyMode ? '••' : `$${Math.round(trend.expense)}`}
                      </span>
                      <div
                        className="w-4 rounded-t bg-gradient-to-t from-red-500/30 to-red-500"
                        style={{ height: `${expPct * 0.7}px` }}
                      />
                      <span className="text-[8px] text-text-muted">Exp</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-white font-bold">{trend.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Most Active Merchants */}
      <div className="bg-surface-low border border-border-glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border-glass">
          <Users className="w-4.5 h-4.5 text-app-green" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Most Active Merchants</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activeMerchants.map((item, idx) => (
            <div
              key={idx}
              className="bg-white/[0.01] border border-border-glass rounded-xl p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  {item.logo}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{item.name}</span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {item.count} transaction{item.count === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-white font-mono shrink-0">
                {privacyMode ? '$ ••••' : formatCurrency(item.total)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AnalyticsView;
