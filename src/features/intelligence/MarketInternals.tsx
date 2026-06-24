import React from 'react';
import { Info } from 'lucide-react';
import type { MarketIntelligence } from './utils/intelCalculations';

interface MarketInternalsProps {
  intel: MarketIntelligence;
}

export const MarketInternals: React.FC<MarketInternalsProps> = ({ intel }) => {
  const { breadth, riskScore, healthScore } = intel;

  // Determine Risk Category
  const getRiskLabel = (score: number) => {
    if (score < 25) return { text: 'Low Risk', color: 'text-app-green bg-app-green/10 border-app-green/20' };
    if (score < 50) return { text: 'Moderate', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' };
    if (score < 75) return { text: 'Elevated', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' };
    return { text: 'High Risk', color: 'text-app-red bg-app-red/10 border-app-red/20' };
  };

  const riskLabel = getRiskLabel(riskScore);

  return (
    <div className="glass-card p-5 border border-border-glass bg-[#10141a]/40 flex flex-col justify-between h-[230px] card-hover-lift">
      <div>
        <div className="flex justify-between items-center pb-2 border-b border-border-glass/40 mb-3">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            Market Internals
          </h3>
          <span className="text-[9px] font-mono font-bold text-text-muted">
            BLOOMBERG TERMINAL FEED
          </span>
        </div>

        {/* High Density Terminal Grid */}
        <div className="divide-y divide-border-glass/30 text-xs">
          
          {/* Row 1: A/D Ratio */}
          <div className="flex justify-between py-2 items-center">
            <span className="text-text-muted font-sans font-medium">Advance / Decline Ratio</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-extrabold ${breadth.adRatio >= 1 ? 'text-app-green' : 'text-app-red'}`}>
                {breadth.adRatio.toFixed(2)}x
              </span>
              <span className="text-[9px] text-text-muted font-mono">
                ({breadth.advancers}:{breadth.decliners})
              </span>
            </div>
          </div>

          {/* Row 2: Up / Down Volume */}
          <div className="flex justify-between py-2 items-center">
            <span className="text-text-muted font-sans font-medium">Up Volume / Down Volume</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-extrabold ${breadth.upVolume >= breadth.downVolume ? 'text-app-green' : 'text-app-red'}`}>
                {(breadth.upVolume / (breadth.downVolume || 1)).toFixed(2)}x
              </span>
              <span className="text-[9px] text-text-muted font-mono">
                ({Math.round(breadth.upVolume / 1000000)}M / {Math.round(breadth.downVolume / 1000000)}M)
              </span>
            </div>
          </div>

          {/* Row 3: New Highs / New Lows */}
          <div className="flex justify-between py-2 items-center">
            <span className="text-text-muted font-sans font-medium">New Highs / New Lows (52W)</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-app-green font-bold">+{breadth.newHighs}</span>
              <span className="text-border-glass">/</span>
              <span className="text-app-red font-bold">-{breadth.newLows}</span>
            </div>
          </div>

          {/* Row 4: Breadth Percentage */}
          <div className="flex justify-between py-2 items-center">
            <span className="text-text-muted font-sans font-medium">Equities Breadth Ratio</span>
            <span className={`font-mono font-bold ${breadth.breadthPct >= 50 ? 'text-app-green' : 'text-app-red'}`}>
              {breadth.breadthPct.toFixed(1)}% Advancing
            </span>
          </div>

          {/* Row 5: Risk Score */}
          <div className="flex justify-between py-2 items-center">
            <span className="text-text-muted font-sans font-medium">Calculated Risk Score</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-white">
                {riskScore}/100
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase border ${riskLabel.color}`}>
                {riskLabel.text}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default MarketInternals;
