import React from 'react';
import type { Stock } from '../../../services/mockDataEngine';

interface HeatmapTooltipProps {
  stock: Stock | null;
  x: number;
  y: number;
  visible: boolean;
}

export const HeatmapTooltip: React.FC<HeatmapTooltipProps> = ({ stock, x, y, visible }) => {
  if (!visible || !stock) return null;

  const isPos = stock.changePercent >= 0;
  const volRatio = stock.volume / (stock.avgVolume || 1);

  // Sparkline coordinates helper
  const points = stock.sparkline || [];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 110;
  const height = 24;
  const svgPoints = points
    .map((val, idx) => {
      const px = (idx / (points.length - 1)) * width;
      const py = height - ((val - min) / range) * height;
      return `${px},${py}`;
    })
    .join(' ');

  // Keep tooltip on screen (simple viewport containment)
  const tooltipX = Math.min(window.innerWidth - 240, x + 15);
  const tooltipY = Math.min(window.innerHeight - 200, y + 15);

  return (
    <div
      style={{
        position: 'fixed',
        left: tooltipX,
        top: tooltipY,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      className="bg-[#0A0E14] border border-border-glass rounded-2xl p-4 min-w-[220px] shadow-2xl flex flex-col justify-between backdrop-blur-md"
    >
      <div>
        <div className="flex justify-between items-start">
          <div className="min-w-0 pr-2">
            <span className="font-bold text-sm text-white tracking-tight">{stock.symbol}</span>
            <span className="text-[10px] text-text-muted block truncate">
              {stock.name}
            </span>
          </div>
          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
            isPos ? 'bg-app-green/10 text-app-green' : 'bg-app-red/10 text-app-red'
          }`}>
            {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </span>
        </div>

        <div className="mt-3 flex justify-between items-end border-t border-white/5 pt-3">
          <div className="space-y-1 text-[10px] text-text-muted">
            <div>Price: <span className="text-white font-bold font-mono">${stock.price.toFixed(2)}</span></div>
            <div>P/E: <span className="text-white font-mono">{stock.peRatio.toFixed(1)}</span></div>
            <div>Beta: <span className="text-white font-mono">{stock.beta.toFixed(2)}</span></div>
          </div>
          <div className="space-y-1.5 text-[10px] text-text-muted text-right">
            <div>Cap: <span className="text-white font-mono">${(stock.marketCap / 1e9).toFixed(1)}B</span></div>
            <div>Activity: <span className="text-white font-mono">{volRatio.toFixed(1)}x Vol</span></div>
            
            {/* Sparkline */}
            <div className="mt-2 flex items-center justify-end">
              <svg width={width} height={height} className="overflow-visible">
                <polyline
                  fill="none"
                  stroke={isPos ? '#00FF94' : '#FF3B5C'}
                  strokeWidth="1.5"
                  points={svgPoints}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapTooltip;
