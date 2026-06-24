import React from 'react';
import type { Stock } from '../../../services/mockDataEngine';

interface SectorStatsProps {
  currentSector: string | null;
  stocks: Stock[];
}

export const SectorStats: React.FC<SectorStatsProps> = ({ currentSector, stocks }) => {
  // Filter stocks based on current zoom level
  const activeStocks = currentSector
    ? stocks.filter(s => s.sector === currentSector)
    : stocks;

  const count = activeStocks.length;
  if (count === 0) return null;

  let totalMarketCap = 0;
  let sumChange = 0;
  let sumPE = 0;
  let sumBeta = 0;
  let advancers = 0;
  let decliners = 0;

  activeStocks.forEach(s => {
    totalMarketCap += s.marketCap;
    sumChange += s.changePercent;
    sumPE += s.peRatio || 0;
    sumBeta += s.beta || 1.0;
    if (s.changePercent > 0) advancers++;
    if (s.changePercent < 0) decliners++;
  });

  const avgChange = sumChange / count;
  const avgPE = sumPE / count;
  const avgBeta = sumBeta / count;

  // Format Market Cap
  const formatCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    return `$${(cap / 1e6).toFixed(1)}M`;
  };

  const isPos = avgChange >= 0;

  return (
    <div className="bg-surface-low/50 border border-border-glass rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl backdrop-blur-glass">
      <div>
        <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
          {currentSector ? 'Sector Selected' : 'Overall Market Scope'}
        </div>
        <h2 className="text-base font-bold text-white mt-0.5">
          {currentSector ? `${currentSector} Sector` : 'All Market Sectors'}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-border-glass/40 w-full md:w-auto">
        <div className="flex flex-col pt-2 sm:pt-0">
          <span className="text-[10px] text-text-muted font-medium">Avg Performance</span>
          <span className={`text-sm font-bold font-mono mt-0.5 ${isPos ? 'text-app-green' : 'text-app-red'}`}>
            {isPos ? '+' : ''}{avgChange.toFixed(2)}%
          </span>
        </div>

        <div className="flex flex-col sm:pl-6 pt-2 sm:pt-0">
          <span className="text-[10px] text-text-muted font-medium">Market Breadth</span>
          <span className="text-xs font-bold text-white mt-1 flex items-center gap-1.5 font-mono">
            <span className="text-app-green">{advancers} ▲</span>
            <span className="text-white/20">|</span>
            <span className="text-app-red">{decliners} ▼</span>
          </span>
        </div>

        <div className="flex flex-col sm:pl-6 pt-2 sm:pt-0">
          <span className="text-[10px] text-text-muted font-medium">Total Valuation</span>
          <span className="text-xs font-bold text-white mt-1 font-mono">
            {formatCap(totalMarketCap)}
          </span>
        </div>

        <div className="flex flex-col sm:pl-6 pt-2 sm:pt-0">
          <span className="text-[10px] text-text-muted font-medium">Avg P/E Ratio</span>
          <span className="text-xs font-bold text-white mt-1 font-mono">
            {avgPE.toFixed(1)}x
          </span>
        </div>

        <div className="flex flex-col sm:pl-6 pt-2 sm:pt-0">
          <span className="text-[10px] text-text-muted font-medium">Avg Beta</span>
          <span className="text-xs font-bold text-white mt-1 font-mono">
            {avgBeta.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SectorStats;
