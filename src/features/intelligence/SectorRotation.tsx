import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Award, Compass, Zap, BarChart2, Shield } from 'lucide-react';
import type { SectorMetric } from './utils/intelCalculations';
import { LeadershipChanges } from './LeadershipChanges';

interface SectorRotationProps {
  sectors: SectorMetric[];
}

export const SectorRotation: React.FC<SectorRotationProps> = ({ sectors }) => {
  const [selectedSectorKey, setSelectedSectorKey] = useState<string>('Technology');

  const selectedSector = sectors.find(s => s.sector === selectedSectorKey) || sectors[0];

  // Helper for polar conversion to draw SVG slices
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const describeArcSlice = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, outerRadius, endAngle);
    const end = polarToCartesian(x, y, outerRadius, startAngle);
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
      `M ${start.x} ${start.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
      "Z"
    ].join(" ");
  };

  // Sort sectors by daily performance for the Ranked Table
  const rankedSectors = [...sectors].sort((a, b) => b.dailyPerf - a.dailyPerf);
  const selectedSectorRank = rankedSectors.findIndex(s => s.sector === selectedSectorKey) + 1;

  // Render SVG Sector Wheel
  // 8 sectors = 45 degrees per sector slice
  const wheelSlices = sectors.map((sec, idx) => {
    const startAngle = idx * 45;
    const endAngle = (idx + 1) * 45;
    const isSelected = sec.sector === selectedSectorKey;
    
    // Slices radius depends on daily performance
    // dailyPerf range is typically -2.0 to +2.0
    // Map -2.0% to radius 40, +2.0% to radius 80
    const rawPerf = sec.dailyPerf;
    const outerRadius = isSelected 
      ? 84 
      : Math.min(80, Math.max(35, 60 + rawPerf * 10));
    const innerRadius = 24;

    const fillOpacity = isSelected ? 0.45 : 0.15;
    const strokeColor = isSelected ? '#00FF94' : 'rgba(255, 255, 255, 0.15)';
    
    // Performance coloring
    const isPos = sec.dailyPerf >= 0;
    const sectorColor = isPos ? '#00FF94' : '#FF3B5C';

    const midAngle = startAngle + 22.5;
    const textPos = polarToCartesian(100, 100, outerRadius + 12, midAngle);

    // Label abbreviations
    const shortLabels: Record<string, string> = {
      'Technology': 'TECH',
      'Financial': 'FIN',
      'Healthcare': 'HLTH',
      'Energy': 'ENRG',
      'Industrials': 'IND',
      'Consumer': 'CONS',
      'Communication Services': 'COMM',
      'Utilities': 'UTIL'
    };

    return (
      <g 
        key={sec.sector} 
        className="cursor-pointer group"
        onClick={() => setSelectedSectorKey(sec.sector)}
      >
        <path
          d={describeArcSlice(100, 100, innerRadius, outerRadius, startAngle, endAngle)}
          fill={sectorColor}
          fillOpacity={fillOpacity}
          stroke={strokeColor}
          strokeWidth={isSelected ? 1.5 : 0.75}
          className="transition-all duration-300 group-hover:fill-opacity-35"
        />
        {/* Label text */}
        <text
          x={textPos.x}
          y={textPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={isSelected ? '#white' : '#8A8F98'}
          className={`text-[8px] font-bold font-mono tracking-tighter transition-all duration-200 group-hover:fill-white ${
            isSelected ? 'fill-white text-[9px]' : ''
          }`}
        >
          {shortLabels[sec.sector] || sec.label.substring(0, 4).toUpperCase()}
        </text>
      </g>
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Column: Interactive Wheel & Shifts Detector */}
      <div className="lg:col-span-4 space-y-4">
        {/* Sector Wheel Card */}
        <div className="glass-card p-4.5 border border-border-glass bg-[#10141a]/40 h-[240px] flex flex-col items-center justify-center relative overflow-hidden card-hover-lift">
          <div className="absolute top-4 left-4 text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-app-green animate-pulse" /> Rotation Wheel
          </div>
          
          <svg width="200" height="200" viewBox="0 0 200 200" className="mt-2.5 overflow-visible">
            {/* Center wheel grid lines */}
            <circle cx="100" cy="100" r="24" fill="rgba(10, 14, 20, 0.9)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="3" />
            
            {wheelSlices}
            
            {/* Core Label */}
            <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fill="#8A8F98" className="text-[7px] font-bold font-mono">
              SECTORS
            </text>
          </svg>
        </div>

        {/* Leadership Shifts Detector (P1) */}
        <LeadershipChanges rankedSectors={rankedSectors} />
      </div>

      {/* Middle Column: Ranked Performance Table */}
      <div className="lg:col-span-4">
        <div className="glass-card p-4.5 border border-border-glass bg-[#10141a]/40 h-[445px] flex flex-col justify-between card-hover-lift">
          <div>
            <div className="flex justify-between items-center pb-2.5 border-b border-border-glass/40 mb-3">
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-app-green" /> Sector Strength Ranks
              </h3>
              <span className="text-[9px] text-text-muted font-mono font-bold">
                SORTED DAILY
              </span>
            </div>

            {/* Table with layout rank swaps */}
            <div className="space-y-1 max-h-[365px] overflow-y-auto pr-1">
              <div className="grid grid-cols-12 text-[8px] font-bold uppercase tracking-wider text-text-muted px-2.5 pb-1">
                <div className="col-span-2">Rank</div>
                <div className="col-span-5">Sector</div>
                <div className="col-span-2.5 text-right">Daily</div>
                <div className="col-span-2.5 text-right">Weekly</div>
              </div>

              <motion.div layout className="space-y-1.5">
                {rankedSectors.map((sec, idx) => {
                  const isSelected = sec.sector === selectedSectorKey;
                  const isTopTwo = idx < 2; // Sector Heat Glow: leading sectors get green glow (P1)
                  const isPosDaily = sec.dailyPerf >= 0;
                  const isPosWeekly = sec.weeklyPerf >= 0;

                  return (
                    <motion.div
                      layout
                      key={sec.sector}
                      onClick={() => setSelectedSectorKey(sec.sector)}
                      className={`grid grid-cols-12 items-center text-xs py-2 px-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-app-green/5 border-app-green/30 text-white font-bold'
                          : 'bg-white/2 border-white/5 text-on-surface hover:bg-white/5'
                      } ${isTopTwo && !isSelected ? 'shadow-[0_0_12px_rgba(0,255,148,0.03)] border-app-green/10' : ''}`}
                    >
                      {/* Rank */}
                      <div className="col-span-2 font-mono font-bold text-text-muted">
                        #{idx + 1}
                      </div>
                      
                      {/* Name */}
                      <div className="col-span-5 truncate text-white">
                        {sec.label}
                      </div>

                      {/* Daily Perf */}
                      <div className={`col-span-2.5 text-right font-mono font-bold ${isPosDaily ? 'text-app-green' : 'text-app-red'}`}>
                        {isPosDaily ? '+' : ''}{sec.dailyPerf.toFixed(2)}%
                      </div>

                      {/* Weekly Perf */}
                      <div className={`col-span-2.5 text-right font-mono font-bold ${isPosWeekly ? 'text-app-green' : 'text-app-red'}`}>
                        {isPosWeekly ? '+' : ''}{sec.weeklyPerf.toFixed(2)}%
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Sector Drilldown Detail Panel (P0) */}
      <div className="lg:col-span-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedSectorKey}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="glass-card p-4.5 border border-border-glass bg-[#10141a]/40 h-[445px] flex flex-col justify-between card-hover-lift"
          >
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-border-glass/40 mb-4">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-app-green" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Sector Analytics
                  </h3>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-app-green/10 text-app-green border border-app-green/20 font-bold font-mono">
                  RANK #{selectedSectorRank}
                </span>
              </div>

              {/* Title & Core Perf */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-extrabold text-white tracking-tight">
                    {selectedSector.label}
                  </h2>
                  <div className="grid grid-cols-2 gap-4 mt-2.5">
                    <div className="bg-white/2 border border-white/5 p-2 rounded-xl">
                      <span className="text-[8px] text-text-muted uppercase font-bold tracking-wider block">Daily Return</span>
                      <span className={`text-sm font-extrabold font-mono ${selectedSector.dailyPerf >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                        {selectedSector.dailyPerf >= 0 ? '+' : ''}{selectedSector.dailyPerf.toFixed(2)}%
                      </span>
                    </div>
                    <div className="bg-white/2 border border-white/5 p-2 rounded-xl">
                      <span className="text-[8px] text-text-muted uppercase font-bold tracking-wider block">Weekly Return</span>
                      <span className={`text-sm font-extrabold font-mono ${selectedSector.weeklyPerf >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                        {selectedSector.weeklyPerf >= 0 ? '+' : ''}{selectedSector.weeklyPerf.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional Stats Sheet */}
                <div className="space-y-2 border-y border-border-glass/30 py-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Relative Strength (vs SPY)</span>
                    <span className={`font-mono font-bold ${selectedSector.relativeStrength >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                      {selectedSector.relativeStrength >= 0 ? '+' : ''}{selectedSector.relativeStrength.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Net Institutional Flow</span>
                    <span className={`font-mono font-bold ${selectedSector.moneyFlow >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                      {selectedSector.moneyFlow >= 0 ? '+' : ''}${selectedSector.moneyFlow.toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Average Market Volume</span>
                    <span className="font-mono text-white font-semibold">
                      {Math.round(selectedSector.avgVolume / 1000000)}M shares
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Average Market Cap</span>
                    <span className="font-mono text-white font-semibold">
                      ${(selectedSector.avgMarketCap / 1000000000).toFixed(1)}B
                    </span>
                  </div>
                </div>

                {/* Top 5 stocks */}
                <div className="space-y-2">
                  <h4 className="text-[9px] uppercase font-bold text-text-muted tracking-wider">
                    Top Industry Component Performers
                  </h4>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {selectedSector.topStocks.map(stock => {
                      const isPos = stock.changePercent >= 0;
                      return (
                        <div key={stock.symbol} className="flex justify-between items-center py-1 px-1.5 hover:bg-white/2 rounded transition-colors text-xs">
                          <div>
                            <span className="font-bold text-white block">{stock.symbol}</span>
                            <span className="text-[9px] text-text-muted block truncate max-w-[120px]">{stock.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-white block">${stock.price.toFixed(2)}</span>
                            <span className={`font-mono text-[10px] font-bold ${isPos ? 'text-app-green' : 'text-app-red'}`}>
                              {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-2 text-[8px] text-text-muted font-mono tracking-tight text-center">
              Click slices in wheel or ranks in table to rotation-drill.
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
export default SectorRotation;
