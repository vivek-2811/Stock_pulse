import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, BarChart2 } from 'lucide-react';

interface MarketBreadthProps {
  breadth: {
    advancers: number;
    decliners: number;
    unchanged: number;
    newHighs: number;
    newLows: number;
    adRatio: number;
    upVolume: number;
    downVolume: number;
    breadthPct: number;
  };
}

export const MarketBreadth: React.FC<MarketBreadthProps> = ({ breadth }) => {
  const [adHistory, setAdHistory] = useState<number[]>(() => {
    // Seed data
    return [1.02, 1.15, 1.08, 1.22, 1.34, 1.39, 1.42];
  });

  useEffect(() => {
    setAdHistory(prev => {
      const next = [...prev, breadth.adRatio];
      if (next.length > 15) {
        next.shift();
      }
      return next;
    });
  }, [breadth.adRatio]);

  const totalStocks = breadth.advancers + breadth.decliners + breadth.unchanged || 1;
  const advancerPct = (breadth.advancers / totalStocks) * 100;
  const declinerPct = (breadth.decliners / totalStocks) * 100;
  const unchangedPct = (breadth.unchanged / totalStocks) * 100;

  const totalVol = breadth.upVolume + breadth.downVolume || 1;
  const upVolPct = (breadth.upVolume / totalVol) * 100;
  const downVolPct = (breadth.downVolume / totalVol) * 100;

  const renderSparkline = (data: number[]) => {
    if (data.length < 2) return '';
    const width = 110;
    const height = 24;
    const min = Math.min(...data) - 0.05;
    const max = Math.max(...data) + 0.05;
    const range = max - min || 1;

    return data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="glass-card p-5 border border-border-glass bg-[#10141a]/40 flex flex-col justify-between h-[230px] card-hover-lift">
      <div>
        <div className="flex justify-between items-center pb-2 border-b border-border-glass/40 mb-3">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            Market Breadth (Adv/Dec)
          </h3>
          <span className="text-[9px] font-mono text-text-muted">
            {breadth.advancers} ADV / {breadth.decliners} DEC
          </span>
        </div>

        {/* Stacked Breadth Bars */}
        <div className="space-y-3.5">
          {/* Bar 1: Advancers vs Decliners ratio */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-app-green flex items-center gap-0.5">
                <ArrowUp className="w-3 h-3" /> {advancerPct.toFixed(0)}% Advancing
              </span>
              <span className="text-text-muted">
                {breadth.unchanged > 0 && `${breadth.unchanged} flat`}
              </span>
              <span className="text-app-red flex items-center gap-0.5">
                {declinerPct.toFixed(0)}% Declining <ArrowDown className="w-3 h-3" />
              </span>
            </div>
            {/* Double Segment Bar */}
            <div className="w-full h-3 rounded-lg overflow-hidden flex bg-surface-lowest border border-border-glass/25">
              <div 
                className="h-full bg-app-green shadow-glow-green-sm transition-all duration-700" 
                style={{ width: `${advancerPct}%` }}
              />
              <div 
                className="h-full bg-text-muted/20 transition-all duration-700" 
                style={{ width: `${unchangedPct}%` }}
              />
              <div 
                className="h-full bg-app-red shadow-glow-red-sm transition-all duration-700" 
                style={{ width: `${declinerPct}%` }}
              />
            </div>
          </div>

          {/* Bar 2: Up Volume vs Down Volume */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-app-green">
                Up Volume: {Math.round(breadth.upVolume / 1000000)}M ({upVolPct.toFixed(0)}%)
              </span>
              <span className="text-app-red">
                ({downVolPct.toFixed(0)}%) {Math.round(breadth.downVolume / 1000000)}M :Down Volume
              </span>
            </div>
            {/* Volume stacked bar */}
            <div className="w-full h-3 rounded-lg overflow-hidden flex bg-surface-lowest border border-border-glass/25">
              <div 
                className="h-full bg-app-green/80 transition-all duration-700" 
                style={{ width: `${upVolPct}%` }}
              />
              <div 
                className="h-full bg-app-red/80 transition-all duration-700" 
                style={{ width: `${downVolPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Breadth History Sparkline at bottom */}
      <div className="flex items-end justify-between pt-2 border-t border-white/5 mt-1.5">
        <div className="flex flex-col">
          <span className="text-[8px] font-extrabold text-text-muted uppercase tracking-wider">
            A/D Ratio Trend
          </span>
          <span className="text-sm font-bold text-white font-mono leading-none mt-0.5">
            {breadth.adRatio.toFixed(2)}x
          </span>
        </div>
        
        {/* SVG Sparkline */}
        <div className="inline-flex items-end">
          <svg width="110" height="24" className="overflow-visible">
            <polyline
              fill="none"
              stroke="#00FF94"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={renderSparkline(adHistory)}
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
export default MarketBreadth;
