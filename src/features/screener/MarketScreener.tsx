import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMarketStore } from '../../store/useMarketStore';
import { Search, Filter, HelpCircle } from 'lucide-react';

export const MarketScreener: React.FC = () => {
  const navigate = useNavigate();
  const { stocks } = useMarketStore();

  // Filters state
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [maxPE, setMaxPE] = useState(100);
  const [minMCapB, setMinMCapB] = useState(0);
  const [minVolumeM, setMinVolumeM] = useState(0);
  const [minYield, setMinYield] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Preset select
  const [activePreset, setActivePreset] = useState<'NONE' | 'GAINERS' | 'LOSERS' | 'UNDERVALUED' | 'HIGH_VOLUME'>('NONE');

  // Sectors list
  const sectors = ['ALL', ...Array.from(new Set(stocks.map(s => s.sector)))];

  // Apply preset triggers
  useEffect(() => {
    switch (activePreset) {
      case 'GAINERS':
        setSelectedSector('ALL');
        setMaxPE(100);
        setMinMCapB(0);
        setMinVolumeM(0);
        setMinYield(0);
        break;
      case 'LOSERS':
        setSelectedSector('ALL');
        setMaxPE(100);
        setMinMCapB(0);
        setMinVolumeM(0);
        setMinYield(0);
        break;
      case 'UNDERVALUED':
        setSelectedSector('ALL');
        setMaxPE(20);
        setMinMCapB(0);
        setMinVolumeM(0);
        setMinYield(0);
        break;
      case 'HIGH_VOLUME':
        setSelectedSector('ALL');
        setMaxPE(100);
        setMinMCapB(0);
        setMinVolumeM(30); // 30M
        setMinYield(0);
        break;
      default:
        break;
    }
  }, [activePreset]);

  // Filtering logic
  const filteredStocks = stocks.filter(stock => {
    const matchSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        stock.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchSector = selectedSector === 'ALL' || stock.sector === selectedSector;
    
    // Evaluate metrics
    const stockPE = stock.peRatio || 0;
    const matchPE = stockPE <= maxPE;
    
    const mCapB = stock.marketCap / 1000000000;
    const matchMCap = mCapB >= minMCapB;
    
    const volM = stock.volume / 1000000;
    const matchVol = volM >= minVolumeM;
    
    const matchYield = stock.dividendYield >= minYield;

    // Presets specific filter checks
    if (activePreset === 'GAINERS' && stock.changePercent <= 0) return false;
    if (activePreset === 'LOSERS' && stock.changePercent >= 0) return false;

    return matchSearch && matchSector && matchPE && matchMCap && matchVol && matchYield;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-glass">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-app-green" /> Quantitative Market Screener
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">Filter indices constituents using multi-factor financial metrics.</p>
        </div>
      </div>

      {/* Preset Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: 'NONE', label: 'All Custom' },
          { id: 'GAINERS', label: 'Top Gainers 🟢' },
          { id: 'LOSERS', label: 'Top Losers 🔴' },
          { id: 'UNDERVALUED', label: 'Undervalued (PE ≤ 20)' },
          { id: 'HIGH_VOLUME', label: 'High Vol (≥ 30M)' }
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setActivePreset(p.id as any)}
            className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
              activePreset === p.id
                ? 'border-app-green/30 bg-app-green/10 text-app-green shadow-glow-green-sm'
                : 'border-border-glass bg-surface-glass text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Panel sidebar */}
        <div className="glass-card rounded-2xl p-5 border border-border-glass space-y-5 lg:col-span-1">
          <div className="flex justify-between items-center pb-2 border-b border-border-glass">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Metric Filters</span>
            <button
              onClick={() => {
                setActivePreset('NONE');
                setSelectedSector('ALL');
                setMaxPE(100);
                setMinMCapB(0);
                setMinVolumeM(0);
                setMinYield(0);
                setSearchQuery('');
              }}
              className="text-[10px] text-app-green hover:underline font-bold"
            >
              Reset All
            </button>
          </div>

          {/* Search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase">Ticker Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search symbol..."
                className="w-full bg-surface-lowest text-xs border border-border-glass rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-app-green"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Sector select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-muted uppercase">Sector Group</label>
            <select
              value={selectedSector}
              onChange={e => {
                setSelectedSector(e.target.value);
                setActivePreset('NONE');
              }}
              className="w-full bg-surface-lowest text-xs border border-border-glass rounded-lg px-3 py-2 text-white outline-none focus:border-app-green cursor-pointer font-semibold"
            >
              {sectors.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>
          </div>

          {/* PE Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
              <span>Max P/E Ratio</span>
              <span className="font-mono text-white text-[11px]">{maxPE === 100 ? 'Any' : `≤ ${maxPE}`}</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={maxPE}
              onChange={e => {
                setMaxPE(parseInt(e.target.value));
                setActivePreset('NONE');
              }}
              className="w-full accent-app-green bg-surface-lowest rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>

          {/* Market Cap Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
              <span>Min Market Cap</span>
              <span className="font-mono text-white text-[11px]">{minMCapB === 0 ? 'Any' : `≥ $${minMCapB}B`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={minMCapB}
              onChange={e => {
                setMinMCapB(parseInt(e.target.value));
                setActivePreset('NONE');
              }}
              className="w-full accent-app-green bg-surface-lowest rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
              <span>Min Volume</span>
              <span className="font-mono text-white text-[11px]">{minVolumeM === 0 ? 'Any' : `≥ ${minVolumeM}M`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minVolumeM}
              onChange={e => {
                setMinVolumeM(parseInt(e.target.value));
                setActivePreset('NONE');
              }}
              className="w-full accent-app-green bg-surface-lowest rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>

          {/* Yield Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
              <span>Min Dividend Yield</span>
              <span className="font-mono text-white text-[11px]">{minYield === 0 ? 'Any' : `≥ ${minYield}%`}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minYield}
              onChange={e => {
                setMinYield(parseFloat(e.target.value));
                setActivePreset('NONE');
              }}
              className="w-full accent-app-green bg-surface-lowest rounded-lg appearance-none h-1.5 cursor-pointer"
            />
          </div>
        </div>

        {/* Results list */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Matches Found: <strong className="text-white">{filteredStocks.length}</strong></span>
            <span>Live Ticker Synchronization Enabled</span>
          </div>

          {filteredStocks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStocks.map(stock => {
                const isPos = stock.changePercent >= 0;
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    className="glass-card rounded-2xl p-5 border border-border-glass hover:scale-[1.01] hover:shadow-glow-green-sm cursor-pointer transition-all duration-150 flex flex-col justify-between h-40"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-surface-lowest border border-border-glass flex items-center justify-center font-bold text-sm text-white">
                          {stock.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <span className="font-bold text-base text-white block hover:text-app-green transition-colors">{stock.symbol}</span>
                          <span className="text-[10px] text-text-muted block max-w-[120px] truncate">{stock.name}</span>
                        </div>
                      </div>

                      <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                        isPos ? 'bg-app-green/10 text-app-green' : 'bg-app-red/10 text-app-red'
                      }`}>
                        {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-4 flex justify-between items-end">
                      <div className="font-mono">
                        <span className="text-lg font-bold text-white block">${stock.price.toFixed(2)}</span>
                        <span className="text-[10px] text-text-muted block font-sans">PE: {stock.peRatio || '--'} • Vol: {(stock.volume / 1000000).toFixed(1)}M</span>
                      </div>

                      <div className="text-right text-[10px] text-text-muted font-sans">
                        <span className="block">MCap: ${(stock.marketCap / 1000000000).toFixed(1)}B</span>
                        <span className="block mt-0.5">Beta: {stock.beta}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-16 text-center text-text-muted border border-dashed border-border-glass flex flex-col justify-center items-center">
              <HelpCircle className="w-10 h-10 text-border-glass mb-2 animate-pulse" />
              <p className="text-sm font-semibold text-white">No constituents match filters</p>
              <p className="text-xs mt-1">Try resetting the P/E range, sector selector, or clearing the ticker search string.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default MarketScreener;
