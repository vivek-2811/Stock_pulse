import React from 'react';
import type { Stock } from '../../services/mockDataEngine';
import { formatMarketCap, formatVolume } from './heatmap.utils';

interface HeatmapTooltipProps {
  stock: Stock | null;
  x: number;
  y: number;
}

export const HeatmapTooltip: React.FC<HeatmapTooltipProps> = ({ stock, x, y }) => {
  if (!stock) return null;

  const isPositive = stock.changePercent >= 0;
  const tooltipWidth = 224; // w-56 is 14rem = 224px
  const tooltipHeight = 110;

  // Prevent viewport overflow
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

  let left = x + 15;
  let top = y + 15;

  if (left + tooltipWidth > screenWidth) {
    left = x - tooltipWidth - 15;
  }
  if (top + tooltipHeight > screenHeight) {
    top = y - tooltipHeight - 15;
  }

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        pointerEvents: 'none',
        zIndex: 100,
        transform: 'translate3d(0, 0, 0)'
      }}
      className="w-56 glass-card p-3 bg-[#0e131b]/95 border border-border-glass rounded-xl shadow-2xl space-y-2 text-xs backdrop-blur-md"
    >
      <div className="flex justify-between items-start">
        <div className="overflow-hidden pr-2">
          <span className="font-bold text-white text-sm block tracking-tight truncate">{stock.symbol}</span>
          <span className="text-[10px] text-text-muted block truncate leading-tight">{stock.name}</span>
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
          isPositive ? 'bg-app-green/10 text-app-green border border-app-green/20' : 'bg-app-red/10 text-app-red border border-app-red/20'
        }`}>
          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="border-t border-border-glass/30 pt-2 grid grid-cols-2 gap-x-2 gap-y-1.5 font-semibold text-[10px] text-text-muted">
        <div>
          <span className="block text-[8.5px] text-text-muted/50 uppercase tracking-wide">Price</span>
          <span className="text-white text-[11px] font-bold font-mono">${stock.price.toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="block text-[8.5px] text-text-muted/50 uppercase tracking-wide">Market Cap</span>
          <span className="text-white font-mono">{formatMarketCap(stock.marketCap)}</span>
        </div>
        <div>
          <span className="block text-[8.5px] text-text-muted/50 uppercase tracking-wide">Volume</span>
          <span className="text-white font-mono">{formatVolume(stock.volume)}</span>
        </div>
        <div className="text-right">
          <span className="block text-[8.5px] text-text-muted/50 uppercase tracking-wide">Sector</span>
          <span className="text-white truncate block max-w-[80px]">{stock.sector}</span>
        </div>
      </div>
    </div>
  );
};
