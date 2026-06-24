import React from 'react';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import type { MarketIntelligence } from './utils/intelCalculations';

interface InstitutionalFlowProps {
  intel: MarketIntelligence;
}

export const InstitutionalFlow: React.FC<InstitutionalFlowProps> = ({ intel }) => {
  const { flow, sectors } = intel;

  // Render curved Sankey connection path
  // Connecting pool at (30, 95) to sector at (240, y)
  const getSankeyPath = (y: number) => {
    return `M 35 95 C 110 95, 160 ${y}, 235 ${y}`;
  };

  return (
    <div className="glass-card p-5 border border-border-glass bg-[#10141a]/40 flex flex-col justify-between h-[395px] card-hover-lift">
      <div>
        <div className="flex justify-between items-center pb-2.5 border-b border-border-glass/40 mb-4">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-app-green animate-pulse" /> Institutional Flow Monitor
          </h3>
          <span className="text-[9px] font-mono font-bold text-text-muted">
            BLOCK TRADE CAPITAL FLOWS
          </span>
        </div>

        {/* Top Summary Blocks */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/2 border border-white/5 p-2 rounded-xl text-center">
            <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider block">Net Capital Flow</span>
            <span className={`text-xs font-mono font-extrabold flex items-center justify-center gap-0.5 mt-0.5 ${
              flow.netInflow >= 0 ? 'text-app-green' : 'text-app-red'
            }`}>
              {flow.netInflow >= 0 ? '+' : ''}${flow.netInflow.toFixed(1)}M
              {flow.netInflow >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            </span>
          </div>

          <div className="bg-white/2 border border-white/5 p-2 rounded-xl text-center">
            <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider block">Growth Allocation</span>
            <span className={`text-xs font-mono font-extrabold flex items-center justify-center gap-0.5 mt-0.5 ${
              flow.growthFlow >= 0 ? 'text-app-green' : 'text-app-red'
            }`}>
              {flow.growthFlow >= 0 ? '+' : ''}${flow.growthFlow.toFixed(1)}M
            </span>
          </div>

          <div className="bg-white/2 border border-white/5 p-2 rounded-xl text-center">
            <span className="text-[8px] text-text-muted font-bold uppercase tracking-wider block">Defensive Shift</span>
            <span className={`text-xs font-mono font-extrabold flex items-center justify-center gap-0.5 mt-0.5 ${
              flow.defensiveFlow >= 0 ? 'text-app-green' : 'text-app-red'
            }`}>
              {flow.defensiveFlow >= 0 ? '+' : ''}${flow.defensiveFlow.toFixed(1)}M
            </span>
          </div>
        </div>

        {/* Sankey Flow Board */}
        <div className="relative w-full h-[220px] bg-surface-lowest/40 border border-white/5 rounded-2xl flex items-center justify-between p-3.5 overflow-hidden">
          
          {/* Institutional Vault Node */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-app-green/10 to-blue-500/10 border border-white/10 flex flex-col items-center justify-center text-center z-10 shadow-lg">
            <span className="text-[7px] text-text-muted uppercase font-bold leading-none">Institutional</span>
            <span className="text-[10px] font-extrabold text-white font-mono mt-1">POOL</span>
            <span className="text-[7px] font-mono text-app-green font-bold mt-0.5">ACTIVE</span>
          </div>

          {/* Connection Lines & Flowing Currents */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 220">
            {/* Draw paths for each sector */}
            {sectors.map((sec, idx) => {
              // Y spacing: 8 sectors spaced between y=12 and y=208
              const y = 12 + idx * 28;
              const isPositive = sec.moneyFlow >= 0;
              const pathId = `flow-path-${sec.sector}`;
              
              const strokeColor = isPositive 
                ? 'rgba(0, 255, 148, 0.15)' 
                : 'rgba(255, 59, 92, 0.15)';
              
              const particleColor = isPositive ? '#00FF94' : '#FF3B5C';
              const speed = isPositive ? '3.5s' : '5s';

              return (
                <g key={sec.sector}>
                  {/* Base Current Line */}
                  <path
                    id={pathId}
                    d={getSankeyPath(y)}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray={!isPositive ? '3 3' : undefined}
                  />

                  {/* Flow Particle */}
                  <circle r="2" fill={particleColor}>
                    <animateMotion
                      path={getSankeyPath(y)}
                      dur={speed}
                      repeatCount="indefinite"
                      rotate="auto"
                      keyPoints={isPositive ? '0;1' : '1;0'} // flows backwards if outflow
                      keyTimes="0;1"
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* Right sectors listing aligned with SVG y points */}
          <div className="flex flex-col justify-between h-full pl-24 w-full z-10">
            {sectors.map((sec, idx) => {
              const isPos = sec.moneyFlow >= 0;
              return (
                <div 
                  key={sec.sector} 
                  className="flex items-center justify-between text-[10px] h-[24px]"
                >
                  <span className="text-text-muted font-medium truncate max-w-[100px]">
                    {sec.label}
                  </span>
                  
                  {/* Money flow tag */}
                  <span className={`font-mono font-bold ${
                    isPos ? 'text-app-green' : 'text-app-red'
                  }`}>
                    {isPos ? '+' : ''}${sec.moneyFlow.toFixed(1)}M
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
};
export default InstitutionalFlow;
