import React, { useState, useEffect } from 'react';
import { Gauge, TrendingUp, Sparkles } from 'lucide-react';

interface FearGreedProps {
  fgScore: number;
  fgLabel: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  fgDetails: {
    momentum: number;
    volatility: number;
    breadth: number;
    volume: number;
    trend: number;
  };
}

export const FearGreedGauge: React.FC<FearGreedProps> = ({
  fgScore,
  fgLabel,
  fgDetails
}) => {
  const [history, setHistory] = useState<number[]>(() => {
    // Stable seed history values
    return [48, 52, 45, 58, 65, 71, 74];
  });

  // Track history updates
  useEffect(() => {
    setHistory(prev => {
      const next = [...prev, fgScore];
      if (next.length > 10) {
        next.shift();
      }
      return next;
    });
  }, [fgScore]);

  // Determine F&G category colors
  const getColor = (score: number) => {
    if (score <= 25) return '#FF3B5C'; // Crimson Red
    if (score <= 45) return '#F97316'; // Orange
    if (score <= 55) return '#EAB308'; // Amber Yellow
    if (score <= 75) return '#84CC16'; // Lime Green
    return '#00FF94'; // Neon Green
  };

  const needleRotation = -120 + (fgScore / 100) * 240;

  // Render history trend sparkline
  const renderSparkline = (data: number[]) => {
    if (data.length < 2) return '';
    const width = 110;
    const height = 24;
    const min = Math.min(...data) - 2;
    const max = Math.max(...data) + 2;
    const range = max - min || 1;

    return data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="glass-card p-5 border border-border-glass bg-[#10141a]/40 flex flex-col justify-between h-[230px] card-hover-lift">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            Fear & Greed Index
          </h3>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums leading-none">
              {fgScore}
            </span>
            <span 
              className="text-[10px] font-bold tracking-wide uppercase"
              style={{ color: getColor(fgScore) }}
            >
              {fgLabel}
            </span>
          </div>
        </div>

        {/* Index Sparkline history */}
        <div className="text-right">
          <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block mb-1">
            Historical Trend
          </span>
          <div className="inline-flex items-end gap-1.5">
            <svg width="90" height="20" className="overflow-visible">
              <polyline
                fill="none"
                stroke={getColor(fgScore)}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={renderSparkline(history)}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Visual content: Dial on left, detailed list on right */}
      <div className="flex items-center gap-5 mt-1">
        {/* Speedometer Gauge */}
        <div className="relative w-28 h-20 flex-shrink-0 flex items-end justify-center overflow-hidden">
          <svg width="112" height="60" viewBox="0 0 112 60" className="overflow-visible">
            {/* Background Arc */}
            <path
              d="M 12 56 A 44 44 0 0 1 100 56"
              fill="none"
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Zone Markers (Ext Fear -> Ext Greed) */}
            <path d="M 12 56 A 44 44 0 0 1 34 26" fill="none" stroke="#FF3B5C" strokeWidth="8" opacity="0.4" />
            <path d="M 34 26 A 44 44 0 0 1 56 12" fill="none" stroke="#F97316" strokeWidth="8" opacity="0.4" />
            <path d="M 56 12 A 44 44 0 0 1 78 26" fill="none" stroke="#EAB308" strokeWidth="8" opacity="0.4" />
            <path d="M 78 26 A 44 44 0 0 1 100 56" fill="none" stroke="#00FF94" strokeWidth="8" opacity="0.4" />

            {/* Glowing Center Pin */}
            <circle cx="56" cy="56" r="4.5" fill="#dfe2eb" />
            
            {/* Needle */}
            <line
              x1="56"
              y1="56"
              x2="56"
              y2="18"
              stroke="#dfe2eb"
              strokeWidth="2.2"
              strokeLinecap="round"
              style={{
                transformOrigin: '56px 56px',
                transform: `rotate(${needleRotation}deg)`,
                transition: 'transform 1000ms cubic-bezier(0.18, 0.89, 0.32, 1.28)'
              }}
            />
          </svg>
          <div className="absolute bottom-0 text-[9px] font-bold text-text-muted font-mono tracking-wide">
            SENTIMENT DIAL
          </div>
        </div>

        {/* Detailed Indicators Grid */}
        <div className="flex-1 space-y-1.5 bg-white/2 border border-white/5 p-2 rounded-xl h-[100px] overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] font-semibold text-[#dfe2eb]">
            <div className="space-y-0.5">
              <span className="text-text-muted block text-[8px] uppercase tracking-wider">Momentum</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${fgDetails.momentum}%` }} />
                </div>
                <span className="font-mono">{fgDetails.momentum}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-text-muted block text-[8px] uppercase tracking-wider">Volatility (VIX)</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${fgDetails.volatility}%` }} />
                </div>
                <span className="font-mono">{fgDetails.volatility}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-text-muted block text-[8px] uppercase tracking-wider">Breadth %</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-app-green" style={{ width: `${fgDetails.breadth}%` }} />
                </div>
                <span className="font-mono">{fgDetails.breadth}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-text-muted block text-[8px] uppercase tracking-wider">Up Vol Ratio</span>
              <div className="flex items-center gap-1">
                <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-lime-500" style={{ width: `${fgDetails.volume}%` }} />
                </div>
                <span className="font-mono">{fgDetails.volume}</span>
              </div>
            </div>

            <div className="space-y-0.5 col-span-2">
              <span className="text-text-muted block text-[8px] uppercase tracking-wider">Index Trend Bias</span>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${fgDetails.trend}%` }} />
                </div>
                <span className="font-mono">{fgDetails.trend}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FearGreedGauge;
