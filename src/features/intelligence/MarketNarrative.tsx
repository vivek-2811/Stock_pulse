import React, { useState } from 'react';
import { Sparkles, Clipboard, Check } from 'lucide-react';
import type { MarketIntelligence } from './utils/intelCalculations';

interface MarketNarrativeProps {
  intel: MarketIntelligence;
}

export const MarketNarrative: React.FC<MarketNarrativeProps> = ({ intel }) => {
  const [copied, setCopied] = useState(false);

  // Generate dynamic narrative text
  const generateNarrative = (): string => {
    const { regime, breadth, sectors, flow, fgLabel, healthScore } = intel;

    // Find leading/lagging sectors with rates
    const techSector = sectors.find(s => s.sector === 'Technology');
    const utilitySector = sectors.find(s => s.sector === 'Utilities');
    const leadName = sectors.slice().sort((a, b) => b.dailyPerf - a.dailyPerf)[0]?.label || 'Technology';
    const leadPerf = sectors.slice().sort((a, b) => b.dailyPerf - a.dailyPerf)[0]?.dailyPerf || 0;
    const lagName = sectors.slice().sort((a, b) => a.dailyPerf - b.dailyPerf)[0]?.label || 'Utilities';
    const lagPerf = sectors.slice().sort((a, b) => a.dailyPerf - b.dailyPerf)[0]?.dailyPerf || 0;

    let sentence1 = `Markets are currently displaying ${regime} behavior, with the Master Health Index registering at a strong ${healthScore}/100. `;
    if (healthScore < 40) {
      sentence1 = `Markets are currently displaying risk-averse ${regime} behavior, marked by a depressed Master Health Index of ${healthScore}/100. `;
    } else if (healthScore < 60) {
      sentence1 = `Markets are displaying a transitionary ${regime} regime, with the Master Health Index balanced at ${healthScore}/100. `;
    }

    const leadPerfSign = leadPerf >= 0 ? '+' : '';
    const lagPerfSign = lagPerf >= 0 ? '+' : '';
    const sentence2 = `${leadName} is leading the market upward at ${leadPerfSign}${leadPerf.toFixed(2)}%, while ${lagName} continues to lag at ${lagPerfSign}${lagPerf.toFixed(2)}%. `;

    const sentence3 = `Market breadth is ${breadth.breadthPct > 55 ? 'supportive' : breadth.breadthPct < 45 ? 'weakening' : 'mixed'} with ${Math.round(breadth.breadthPct)}% of equities advancing against ${Math.round(100 - breadth.breadthPct)}% declining. `;

    const flowDirection = flow.netInflow >= 0 ? 'inflow' : 'outflow';
    const flowAbs = Math.abs(flow.netInflow).toFixed(1);
    const growthAbs = Math.abs(flow.growthFlow).toFixed(1);
    const growthSign = flow.growthFlow >= 0 ? 'inflows' : 'outflows';
    
    let sentence4 = `Institutional flows show a net ${flowDirection} of $${flowAbs}M across sectors, with growth clusters registering $${growthAbs}M in net ${growthSign}. `;

    const sentence5 = `Overall sentiment stands in ${fgLabel} territory, signaling that market participants are maintaining a ${fgLabel === 'Greed' || fgLabel === 'Extreme Greed' ? 'constructive' : fgLabel === 'Fear' || fgLabel === 'Extreme Fear' ? 'cautious' : 'balanced'} risk stance.`;

    return sentence1 + sentence2 + sentence3 + sentence4 + sentence5;
  };

  const handleCopySnapshot = () => {
    const narrativeText = generateNarrative();
    const leading = intel.sectors.slice().sort((a, b) => b.dailyPerf - a.dailyPerf)[0];
    const lagging = intel.sectors.slice().sort((a, b) => a.dailyPerf - b.dailyPerf)[0];
    
    const leadPerfSign = (leading?.dailyPerf || 0) >= 0 ? '+' : '';
    const lagPerfSign = (lagging?.dailyPerf || 0) >= 0 ? '+' : '';

    const snapshot = `StockPulse Market Intelligence Snapshot
=========================================
Market Health Index: ${intel.healthScore}/100 (${intel.healthScore >= 50 ? 'Bullish Bias' : 'Bearish Bias'})
Market Regime: ${intel.regime} (Confidence: ${intel.regimeConfidence}%)
Fear & Greed Index: ${intel.fgScore} (${intel.fgLabel})
-----------------------------------------
Breadth: ${Math.round(intel.breadth.breadthPct)}% Advancing (${intel.breadth.advancers} Adv / ${intel.breadth.decliners} Dec)
Leading Sector: ${leading?.label || 'N/A'} (${leadPerfSign}${leading?.dailyPerf.toFixed(2)}%)
Weakest Sector: ${lagging?.label || 'N/A'} (${lagPerfSign}${lagging?.dailyPerf.toFixed(2)}%)
Institutional Flow: ${intel.flow.netInflow >= 0 ? '+' : ''}$${intel.flow.netInflow.toFixed(1)}M Net Flow ($${intel.flow.growthFlow.toFixed(1)}M into Growth)
-----------------------------------------
Narrative:
${narrativeText}
=========================================
Generated: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(snapshot).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="glass-card p-5 border border-border-glass bg-[#10141a]/30 flex flex-col justify-between h-auto card-hover-lift">
      <div className="flex justify-between items-center pb-3 border-b border-border-glass/40 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-app-green/10 flex items-center justify-center border border-app-green/20">
            <Sparkles className="w-3.5 h-3.5 text-app-green" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Live Market Intelligence Narrative
          </h3>
        </div>
        
        {/* Copy Snapshot Button (P0) */}
        <button
          onClick={handleCopySnapshot}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
            copied
              ? 'bg-app-green/10 border-app-green/30 text-app-green'
              : 'bg-surface-glass border-border-glass text-text-muted hover:text-white hover:border-app-green/30'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" /> COPIED TO CLIPBOARD
            </>
          ) : (
            <>
              <Clipboard className="w-3.5 h-3.5" /> COPY DAILY SNAPSHOT
            </>
          )}
        </button>
      </div>

      {/* Narrative Body */}
      <div className="text-xs md:text-[13px] leading-relaxed text-[#dfe2eb] font-sans font-medium selection:bg-app-green/20">
        {generateNarrative()}
      </div>
    </div>
  );
};
export default MarketNarrative;
