import React, { useState } from 'react';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { Calendar, Search, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { transactions, clearPortfolio } = usePortfolioStore();
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  // Filter transactions
  const filteredTx = transactions.filter(tx => {
    const matchSymbol = tx.symbol.toLowerCase().includes(filterSymbol.toLowerCase());
    const matchType = filterType === 'ALL' || tx.type === filterType;
    return matchSymbol && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-glass">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-app-green" /> Transaction Audit Ledger
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">Verify historical buy/sell trades, simulated flat fees, and closed realized gains.</p>
        </div>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to clear your trade ledger and active positions?')) {
              clearPortfolio();
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all duration-200"
        >
          <RefreshCcw className="w-3.5 h-3.5" /> Clear Audit Trail
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-sm placeholder-[#5A5F68] focus:outline-none focus:ring-1 focus:ring-app-green text-white font-medium"
            placeholder="Search by symbol..."
            value={filterSymbol}
            onChange={e => setFilterSymbol(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-xl bg-surface-low border border-border-glass text-xs font-bold text-text-muted w-full sm:w-auto justify-around">
          {(['ALL', 'BUY', 'SELL'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-lg transition-all duration-150 flex-1 sm:flex-none ${
                filterType === type
                  ? 'bg-surface-high text-white shadow-sm'
                  : 'hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Transactions' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Grid Table */}
      {filteredTx.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden border border-border-glass">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border-glass bg-surface-lowest/50 text-[10px] font-bold text-text-muted uppercase tracking-wider font-sans">
                  <th className="py-4.5 px-6">Timestamp</th>
                  <th className="py-4.5 px-6">Asset Ticker</th>
                  <th className="py-4.5 px-6 text-center">Type</th>
                  <th className="py-4.5 px-6 text-right">Shares Size</th>
                  <th className="py-4.5 px-6 text-right">Execution Price</th>
                  <th className="py-4.5 px-6 text-right">Simulated Brokerage Fee</th>
                  <th className="py-4.5 px-6 text-right">Net Value</th>
                  <th className="py-4.5 px-6 text-right">Realized Gain/Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-glass font-mono text-xs text-on-surface">
                {filteredTx.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  const dateStr = new Date(tx.date).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  const netValue = tx.quantity * tx.price + (isBuy ? tx.fee : -tx.fee);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-white/2 transition-colors duration-150"
                    >
                      {/* Date */}
                      <td className="py-4 px-6 text-text-muted text-[11px] font-sans">
                        {dateStr}
                      </td>

                      {/* Symbol */}
                      <td className="py-4 px-6 font-bold text-sm text-white">
                        {tx.symbol}
                      </td>

                      {/* Side Type */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold leading-normal ${
                          isBuy 
                            ? 'bg-app-green/10 text-app-green' 
                            : 'bg-app-red/10 text-app-red'
                        }`}>
                          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {tx.type}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-6 text-right font-semibold">
                        {tx.quantity}
                      </td>

                      {/* Price */}
                      <td className="py-4 px-6 text-right font-semibold">
                        ${tx.price.toFixed(2)}
                      </td>

                      {/* Fee */}
                      <td className="py-4 px-6 text-right text-text-muted">
                        ${tx.fee.toFixed(2)}
                      </td>

                      {/* Net Value */}
                      <td className="py-4 px-6 text-right text-white font-semibold">
                        ${netValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Realized P/L */}
                      <td className={`py-4 px-6 text-right font-bold ${
                        tx.realizedPnL === undefined 
                          ? 'text-text-muted' 
                          : tx.realizedPnL >= 0 
                            ? 'text-app-green' 
                            : 'text-app-red'
                      }`}>
                        {tx.realizedPnL === undefined 
                          ? '--' 
                          : `${tx.realizedPnL >= 0 ? '+' : ''}$${tx.realizedPnL.toFixed(2)}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted border border-dashed border-border-glass flex flex-col justify-center items-center">
          <Calendar className="w-10 h-10 text-border-glass mb-2 animate-pulse" />
          <p className="text-sm font-semibold text-white">No transactions found</p>
          <p className="text-xs mt-1">Simulate buy/sell trades on the dashboard or stock details page to populate this ledger.</p>
        </div>
      )}
    </div>
  );
};
export default TransactionsPage;
