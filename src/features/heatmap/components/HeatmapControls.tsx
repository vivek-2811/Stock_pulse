import React, { useState } from 'react';
import { Search, Clock } from 'lucide-react';
import type { Stock } from '../../../services/mockDataEngine';

interface HeatmapControlsProps {
  stocks: Stock[];
  searchSymbol: string;
  onSearchChange: (symbol: string) => void;
  sizeBy: 'marketCap' | 'volume';
  onSizeByChange: (val: 'marketCap' | 'volume') => void;
  colorTheme: 'classic' | 'neon' | 'mono';
  onColorThemeChange: (val: 'classic' | 'neon' | 'mono') => void;
  perfFilter: 'all' | 'gainers' | 'losers';
  onPerfFilterChange: (val: 'all' | 'gainers' | 'losers') => void;
  selectedSnapshot: 'now' | '5m' | '15m' | '1h';
  onSnapshotChange: (val: 'now' | '5m' | '15m' | '1h') => void;
}

export const HeatmapControls: React.FC<HeatmapControlsProps> = ({
  stocks,
  searchSymbol,
  onSearchChange,
  sizeBy,
  onSizeByChange,
  colorTheme,
  onColorThemeChange,
  perfFilter,
  onPerfFilterChange,
  selectedSnapshot,
  onSnapshotChange,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter list of stocks for autofill suggestions
  const suggestions = searchSymbol
    ? stocks
        .filter(s => s.symbol.toLowerCase().includes(searchSymbol.toLowerCase()) || s.name.toLowerCase().includes(searchSymbol.toLowerCase()))
        .slice(0, 5)
    : [];

  const timeMachineOptions: { value: typeof selectedSnapshot; label: string }[] = [
    { value: 'now', label: 'Live (Now)' },
    { value: '5m', label: '5m Ago' },
    { value: '15m', label: '15m Ago' },
    { value: '1h', label: '1h Ago' },
  ];

  return (
    <div className="bg-surface-low border border-border-glass rounded-2xl p-4.5 space-y-4 shadow-xl select-none">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Search Input with Autocomplete */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchSymbol}
              placeholder="Search ticker (e.g. NVDA)..."
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={(e) => onSearchChange(e.target.value.toUpperCase())}
              className="w-full bg-surface-lowest text-white placeholder-text-muted text-xs font-semibold rounded-xl pl-10 pr-4 py-3 border border-border-glass focus:border-app-green/50 outline-none transition-all shadow-inner focus:shadow-glow-green-sm"
            />
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-[#10141a] border border-border-glass rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-border-glass/40 max-h-60">
              {suggestions.map((s) => (
                <button
                  key={s.symbol}
                  onClick={() => {
                    onSearchChange(s.symbol);
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs text-white hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-app-green">{s.symbol}</span>
                    <span className="text-text-muted text-[10px] ml-2">{s.name}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${s.changePercent >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                    {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Size By Toggles */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted pl-1">Size By</span>
            <div className="flex items-center bg-surface-lowest border border-border-glass rounded-xl p-0.5 font-semibold text-[10px] text-text-muted">
              <button
                onClick={() => onSizeByChange('marketCap')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sizeBy === 'marketCap' ? 'bg-white/5 text-white font-bold' : 'hover:text-white'
                }`}
              >
                Market Cap
              </button>
              <button
                onClick={() => onSizeByChange('volume')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sizeBy === 'volume' ? 'bg-white/5 text-white font-bold' : 'hover:text-white'
                }`}
              >
                Volume
              </button>
            </div>
          </div>

          {/* Color Schemes */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted pl-1">Color Theme</span>
            <div className="flex items-center bg-surface-lowest border border-border-glass rounded-xl p-0.5 font-semibold text-[10px] text-text-muted">
              <button
                onClick={() => onColorThemeChange('classic')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  colorTheme === 'classic' ? 'bg-white/5 text-white font-bold' : 'hover:text-white'
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => onColorThemeChange('neon')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  colorTheme === 'neon' ? 'bg-white/5 text-white font-bold' : 'hover:text-white'
                }`}
              >
                Neon
              </button>
              <button
                onClick={() => onColorThemeChange('mono')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  colorTheme === 'mono' ? 'bg-white/5 text-white font-bold' : 'hover:text-white'
                }`}
              >
                Mono
              </button>
            </div>
          </div>

          {/* Performance Filter */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted pl-1">Filters</span>
            <div className="flex items-center bg-surface-lowest border border-border-glass rounded-xl p-0.5 font-semibold text-[10px] text-text-muted">
              <button
                onClick={() => onPerfFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  perfFilter === 'all' ? 'bg-white/5 text-white font-bold' : 'hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => onPerfFilterChange('gainers')}
                className={`px-3 py-1.5 rounded-lg transition-all text-app-green cursor-pointer ${
                  perfFilter === 'gainers' ? 'bg-app-green/10 text-app-green font-bold border border-app-green/10' : 'hover:text-white'
                }`}
              >
                Gainers
              </button>
              <button
                onClick={() => onPerfFilterChange('losers')}
                className={`px-3 py-1.5 rounded-lg transition-all text-app-red cursor-pointer ${
                  perfFilter === 'losers' ? 'bg-app-red/10 text-app-red font-bold border border-app-red/10' : 'hover:text-white'
                }`}
              >
                Losers
              </button>
            </div>
          </div>

          {/* Time Machine Snapshot Selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-text-muted pl-1 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-app-green" /> Time Machine
            </span>
            <div className="flex items-center bg-surface-lowest border border-border-glass rounded-xl p-0.5 font-semibold text-[10px] text-text-muted">
              {timeMachineOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSnapshotChange(opt.value)}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    selectedSnapshot === opt.value
                      ? 'bg-app-green/10 text-app-green font-bold border border-app-green/10'
                      : 'hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeatmapControls;
