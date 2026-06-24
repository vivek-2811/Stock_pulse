import React from 'react';
import { Search, Flame, ShieldAlert, Activity, HelpCircle } from 'lucide-react';
import type { HeatmapFilters } from './heatmap.types';
import type { MarketRegimeInfo } from './heatmap.utils';

interface HeatmapControlsProps {
  filters: HeatmapFilters;
  onChangeFilters: (filters: HeatmapFilters) => void;
  sectors: string[];
  regime: MarketRegimeInfo;
  showRegimeOverlay: boolean;
  onToggleRegimeOverlay: () => void;
}

export const HeatmapControls: React.FC<HeatmapControlsProps> = ({
  filters,
  onChangeFilters,
  sectors,
  regime,
  showRegimeOverlay,
  onToggleRegimeOverlay
}) => {
  
  const handleCapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({ ...filters, marketCap: e.target.value as any });
  };

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({ ...filters, sector: e.target.value });
  };

  const handlePerfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({ ...filters, performance: e.target.value as any });
  };

  const handleVolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChangeFilters({ ...filters, volume: e.target.value as any });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeFilters({ ...filters, search: e.target.value });
  };

  // Helper to color-code regime indicators
  const getRegimeColorClass = (status: 'Risk-On' | 'Neutral' | 'Risk-Off') => {
    if (status === 'Risk-On') return 'text-app-green bg-app-green/10 border-app-green/30';
    if (status === 'Risk-Off') return 'text-app-red bg-app-red/10 border-app-red/30';
    return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
  };

  const getRegimeIcon = (status: 'Risk-On' | 'Neutral' | 'Risk-Off') => {
    if (status === 'Risk-On') return <Flame className="w-3.5 h-3.5" />;
    if (status === 'Risk-Off') return <ShieldAlert className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  return (
    <div className="w-full glass-card p-4 bg-[#0e131b]/60 backdrop-blur-md border border-border-glass rounded-2xl flex flex-col gap-4 shadow-xl">
      {/* Upper Row: Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-text-muted/60" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-app-green text-white font-semibold"
            placeholder="Search stock..."
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Sector Filter */}
        <div>
          <select
            value={filters.sector}
            onChange={handleSectorChange}
            className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-app-green cursor-pointer"
          >
            <option value="All">All Sectors</option>
            {sectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Market Cap Filter */}
        <div>
          <select
            value={filters.marketCap}
            onChange={handleCapChange}
            className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-app-green cursor-pointer"
          >
            <option value="All">All Caps</option>
            <option value="Mega">Mega Cap (&gt;$200B)</option>
            <option value="Large">Large Cap ($10B - $200B)</option>
            <option value="Mid">Mid Cap ($2B - $10B)</option>
            <option value="Small">Small Cap (&lt;$2B)</option>
          </select>
        </div>

        {/* Performance Filter */}
        <div>
          <select
            value={filters.performance}
            onChange={handlePerfChange}
            className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-app-green cursor-pointer"
          >
            <option value="All">All Performers</option>
            <option value="Gainers">Gainers Only</option>
            <option value="Losers">Losers Only</option>
          </select>
        </div>

        {/* Volume Filter */}
        <div>
          <select
            value={filters.volume}
            onChange={handleVolChange}
            className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-app-green cursor-pointer"
          >
            <option value="All">All Volumes</option>
            <option value="High">High Volume (&gt;10M)</option>
            <option value="Medium">Medium (1M - 10M)</option>
            <option value="Low">Low Volume (&lt;1M)</option>
          </select>
        </div>
      </div>

      {/* Lower Row: Market Regime & Analysis Layer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-glass/30">
        {/* Regime Info */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Market Regime:</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold font-sans transition-all duration-300 ${getRegimeColorClass(regime.status)}`}>
            {getRegimeIcon(regime.status)}
            <span>{regime.status}</span>
            <span className="opacity-40 font-mono">({regime.score > 0 ? '+' : ''}{regime.score})</span>
          </div>
          <span className="text-[10px] text-text-muted font-semibold hidden md:inline">
            Breadth: <span className="font-mono text-white">{regime.breadthPercent.toFixed(0)}% Up</span>
          </span>
        </div>

        {/* Regime Overlay Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRegimeOverlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
              showRegimeOverlay
                ? 'bg-app-green text-black border-app-green hover:bg-app-green/90 shadow-glow-green-sm'
                : 'bg-surface-glass text-text-muted border-border-glass hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className={`w-4 h-4 ${showRegimeOverlay ? 'animate-pulse' : ''}`} />
            <span>Overlay Regime Highlights</span>
          </button>
          
          {/* Subtle Help Tooltip Indicator */}
          <div className="relative group text-text-muted hover:text-white cursor-help">
            <HelpCircle className="w-4 h-4" />
            <div className="absolute right-0 bottom-full mb-2 w-64 p-3 bg-[#0e131b] border border-border-glass rounded-xl shadow-2xl text-[10px] text-text-muted leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <span className="font-bold text-white block mb-1">How it works:</span>
              Highlighting focuses on Cyclical/Growth sectors during <span className="text-app-green font-bold">Risk-On</span> regimes (Technology, Consumer, Financial) or Defensive sectors during <span className="text-app-red font-bold">Risk-Off</span> regimes (Healthcare, Utilities), fading out non-regime nodes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
