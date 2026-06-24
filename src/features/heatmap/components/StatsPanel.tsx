import React from 'react';
import type { Stock } from '../../../services/mockDataEngine';

interface StatsPanelProps {
  currentSector: string | null;
  stocks: Stock[];
  onSelectStock: (symbol: string) => void;
  hoveredSymbol: string | null;
  onHoverSymbol: (symbol: string | null) => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  currentSector,
  stocks,
  onSelectStock,
  hoveredSymbol,
  onHoverSymbol,
}) => {
  // Filter stocks based on scope
  const scopeStocks = currentSector
    ? stocks.filter(s => s.sector === currentSector)
    : stocks;

  if (scopeStocks.length === 0) return null;

  // 1. Largest Gainer
  const largestGainer = [...scopeStocks].sort((a, b) => b.changePercent - a.changePercent)[0];

  // 2. Largest Loser
  const largestLoser = [...scopeStocks].sort((a, b) => a.changePercent - b.changePercent)[0];

  // 3. Most Active (Ratio volume / avgVolume)
  const mostActive = [...scopeStocks].sort((a, b) => {
    const ratioA = a.volume / (a.avgVolume || 1);
    const ratioB = b.volume / (b.avgVolume || 1);
    return ratioB - ratioA;
  })[0];

  // 4. Sector Leader (Highest Market Cap)
  const sectorLeader = [...scopeStocks].sort((a, b) => b.marketCap - a.marketCap)[0];

  // 5. Sector Laggard (Lowest Performing relative to peers)
  const laggard = [...scopeStocks].sort((a, b) => a.changePercent - b.changePercent)[0];

  const statItems = [
    { label: 'Largest Gainer', stock: largestGainer, metric: `${largestGainer.changePercent >= 0 ? '+' : ''}${largestGainer.changePercent.toFixed(2)}%` },
    { label: 'Largest Loser', stock: largestLoser, metric: `${largestLoser.changePercent.toFixed(2)}%` },
    { label: 'Most Active', stock: mostActive, metric: `${(mostActive.volume / (mostActive.avgVolume || 1)).toFixed(1)}x Vol` },
    { label: 'Sector Leader', stock: sectorLeader, metric: `$${(sectorLeader.marketCap / 1e9).toFixed(0)}B` },
    { label: 'Sector Laggard', stock: laggard, metric: `${laggard.changePercent.toFixed(2)}%` },
  ];

  return (
    <div className="bg-surface-low/30 border border-border-glass rounded-2xl p-4 space-y-4 shadow-xl backdrop-blur-glass flex flex-col h-full justify-between">
      <div>
        <h3 className="text-xs uppercase font-bold tracking-wider text-text-muted">
          {currentSector ? 'Sector Highlights' : 'Market Highlights'}
        </h3>
      </div>

      <div className="space-y-2.5 flex-1 flex flex-col justify-center mt-2">
        {statItems.map(({ label, stock, metric }) => {
          if (!stock) return null;
          const isHovered = hoveredSymbol === stock.symbol;

          return (
            <div
              key={label}
              onClick={() => onSelectStock(stock.symbol)}
              onMouseEnter={() => onHoverSymbol(stock.symbol)}
              onMouseLeave={() => onHoverSymbol(null)}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                isHovered
                  ? 'bg-white/5 border-app-green/40 shadow-glow-green-sm scale-[1.015]'
                  : 'bg-white/[0.01] border-border-glass hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <div className="min-w-0 pr-2">
                <span className="text-[9px] text-text-muted font-semibold block">{label}</span>
                <span className="font-bold text-xs text-white tracking-tight flex items-center gap-1 mt-0.5">
                  {stock.symbol}
                  <span className="text-[9px] text-text-muted font-normal font-sans truncate block max-w-[80px] group-hover:text-white/60 transition-colors">
                    {stock.name}
                  </span>
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-xs font-bold font-mono ${
                  stock.changePercent > 0
                    ? 'text-app-green'
                    : stock.changePercent < 0
                    ? 'text-app-red'
                    : 'text-text-muted'
                }`}>
                  {metric}
                </span>
                <span className="text-[9px] text-text-muted font-mono block mt-0.5">
                  ${stock.price.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatsPanel;
