import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MarketRegimeProps {
  regime: 'Risk-On' | 'Neutral' | 'Risk-Off';
  regimeScore: number; // -100 to 100
  confidence: number;
  explanations: string[];
}

export const MarketRegime: React.FC<MarketRegimeProps> = ({
  regime,
  regimeScore,
  confidence,
  explanations
}) => {
  // Determine color theme based on regime
  const isRiskOn = regime === 'Risk-On';
  const isRiskOff = regime === 'Risk-Off';
  
  const themeColor = isRiskOn 
    ? '#00FF94' // Neon Green
    : isRiskOff 
    ? '#FF3B5C' // Crimson Red
    : '#EAB308'; // Amber Yellow

  const themeBg = isRiskOn 
    ? 'bg-app-green/10 text-app-green border-app-green/20' 
    : isRiskOff 
    ? 'bg-app-red/10 text-app-red border-app-red/20' 
    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';

  const glowClass = isRiskOn 
    ? 'shadow-[0_0_20px_rgba(0,255,148,0.12)] border-app-green/20' 
    : isRiskOff 
    ? 'shadow-[0_0_20px_rgba(255,59,92,0.12)] border-app-red/20' 
    : 'shadow-[0_0_20px_rgba(234,179,8,0.12)] border-yellow-500/20';

  // SVG Dial pointer rotation (-90 to +90 deg for -100 to 100 score)
  const pointerRotation = (regimeScore / 100) * 90;

  return (
    <div className={`glass-card p-5 border border-border-glass bg-[#10141a]/40 flex flex-col justify-between h-[230px] card-hover-lift transition-all duration-350 ${glowClass}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Market Regime Engine
          </h3>
          <div className="flex items-center gap-2.5 mt-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${themeBg}`}>
              {isRiskOn ? (
                <ShieldCheck className="w-5 h-5 text-app-green" />
              ) : isRiskOff ? (
                <ShieldAlert className="w-5 h-5 text-app-red" />
              ) : (
                <Shield className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight uppercase leading-none block">
                {regime}
              </span>
              <span className="text-[9px] font-bold text-text-muted font-mono tracking-wider mt-0.5 block">
                REGIME SCORE: {regimeScore > 0 ? '+' : ''}{regimeScore.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence Circle */}
        <div className="relative w-10 h-10 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="3.5"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="transparent"
              stroke={themeColor}
              strokeWidth="3.5"
              strokeDasharray={100}
              strokeDashoffset={100 - confidence}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[9px] font-extrabold text-white font-mono leading-none">
              {confidence}%
            </span>
          </div>
        </div>
      </div>

      {/* Explanation panel and Gauge Dial side-by-side */}
      <div className="flex items-center gap-4 mt-2">
        {/* Simple linear scale/dial */}
        <div className="relative w-24 h-16 flex-shrink-0 flex items-end justify-center overflow-hidden">
          <svg width="80" height="45" viewBox="0 0 80 45" className="overflow-visible">
            {/* Range arcs */}
            <path d="M 10 40 A 30 30 0 0 1 70 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            
            {/* Zones */}
            <path d="M 10 40 A 30 30 0 0 1 30 20" fill="none" stroke="#FF3B5C" strokeWidth="6" opacity="0.15" />
            <path d="M 30 20 A 30 30 0 0 1 50 20" fill="none" stroke="#EAB308" strokeWidth="6" opacity="0.15" />
            <path d="M 50 20 A 30 30 0 0 1 70 40" fill="none" stroke="#00FF94" strokeWidth="6" opacity="0.15" />
            
            {/* Center Pin */}
            <circle cx="40" cy="40" r="3.5" fill="#dfe2eb" />
            
            {/* Needle */}
            <line
              x1="40"
              y1="40"
              x2="40"
              y2="15"
              stroke="#dfe2eb"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transformOrigin: '40px 40px',
                transform: `rotate(${pointerRotation}deg)`,
                transition: 'transform 1000ms cubic-bezier(0.2, 0.8, 0.2, 1)'
              }}
            />
          </svg>
          <div className="absolute bottom-0 w-full flex justify-between px-1 text-[8px] font-bold font-mono text-text-muted">
            <span className="text-app-red">OFF</span>
            <span>NEU</span>
            <span className="text-app-green">ON</span>
          </div>
        </div>

        {/* Bullet point explanations (P0) */}
        <div className="flex-1 bg-white/3 border border-white/5 rounded-xl p-2.5 h-[100px] overflow-y-auto scrollbar-thin">
          <div className="text-[9px] uppercase font-bold text-text-muted mb-1.5 tracking-wider">
            Engine Factor Weights
          </div>
          <ul className="space-y-1.5 text-[9px] font-medium leading-relaxed text-on-surface">
            {explanations.map((exp, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <span className="text-[8px] text-text-muted mt-0.5">•</span>
                <span className="text-[#dfe2eb]">{exp}</span>
              </li>
            ))}
            {explanations.length === 0 && (
              <li className="text-text-muted italic">Computing signals...</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};
export default MarketRegime;
