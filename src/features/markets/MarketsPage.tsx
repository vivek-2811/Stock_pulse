import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useMarketStore } from '../../store/useMarketStore';
import { TableSkeleton } from '../../components/LoadingState';
import { Search, BarChart3 } from 'lucide-react';

// Sparkline SVG renderer
const MiniSparkline: React.FC<{ data: number[]; isPositive: boolean }> = ({ data, isPositive }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const width = 100;
  const height = 30;
  const padding = 2;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="70" height="24" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={isPositive ? '#00FF94' : '#FF3B5C'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const MarketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { stocks, indices } = useMarketStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [displayCount, setDisplayCount] = useState(40);

  // Reset display count when filter changes
  React.useEffect(() => {
    setDisplayCount(40);
  }, [searchQuery, selectedSector]);

  if (stocks.length === 0) {
    return <TableSkeleton rows={8} />;
  }

  // Get distinct sectors
  const sectors = ['All', ...Array.from(new Set(stocks.map(s => s.sector)))];

  // Filter stocks
  const filteredStocks = stocks.filter(
    stock => {
      const matchQuery = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          stock.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSector = selectedSector === 'All' || stock.sector === selectedSector;
      return matchQuery && matchSector;
    }
  );

  const visibleStocks = filteredStocks.slice(0, displayCount);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-glass">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Global Markets</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">Explore indexes, sector weights, and full stock listings.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-app-green text-white font-semibold"
            placeholder="Search symbols..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 2. Index Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {indices.map(idx => {
          const isPositive = idx.change >= 0;
          return (
            <div key={idx.symbol} className="glass-card rounded-2xl p-4.5">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">{idx.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  isPositive ? 'bg-app-green/10 text-app-green' : 'bg-app-red/10 text-app-red'
                }`}>
                  {isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2 font-mono">
                <span className="text-base font-bold text-white">
                  {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-text-muted">({idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Sector Filter controls */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-surface-low border border-border-glass text-xs font-bold text-text-muted w-fit">
        {sectors.map((sector) => (
          <button
            key={sector}
            onClick={() => setSelectedSector(sector)}
            className={`px-3 py-1.5 rounded-lg transition-all duration-150 ${
              selectedSector === sector
                ? 'bg-surface-high text-white shadow-sm'
                : 'hover:text-white'
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* 4. Filtered stock list Grid */}
      {visibleStocks.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visibleStocks.map((stock) => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                  className="glass-card rounded-2xl p-4.5 hover:scale-[1.01] hover:shadow-glow-green-sm cursor-pointer transition-all duration-150 flex flex-col justify-between h-40 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-lowest border border-border-glass flex items-center justify-center font-bold text-xs text-white">
                        {stock.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-sm block group-hover:text-app-green transition-colors text-white">{stock.symbol}</span>
                        <span className="text-[9px] text-text-muted block max-w-[100px] truncate">{stock.name}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      isPositive ? 'bg-app-green/10 text-app-green' : 'bg-app-red/10 text-app-red'
                    }`}>
                      {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="mt-2.5 flex justify-between items-end">
                    <div className="font-mono">
                      <span className="text-base font-bold text-white block">${stock.price.toFixed(2)}</span>
                      <span className="text-[9px] text-text-muted block font-sans">MCap: ${(stock.marketCap / 1000000000).toFixed(0)}B</span>
                    </div>
                    
                    <div className="h-6 flex items-center">
                      <MiniSparkline data={stock.sparkline} isPositive={isPositive} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStocks.length > displayCount && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setDisplayCount(prev => prev + 40)}
                className="px-6 py-2.5 rounded-xl border border-border-glass bg-surface-glass text-xs font-bold text-white hover:bg-white/5 transition-all cursor-pointer shadow-md"
              >
                Load More Stocks ({filteredStocks.length - displayCount} remaining)
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted border border-dashed border-border-glass flex flex-col justify-center items-center">
          <BarChart3 className="w-10 h-10 text-border-glass mb-2" />
          <p className="text-sm font-semibold text-white">No stocks found matching your filters</p>
          <p className="text-xs mt-1">Try resetting the sector selector to "All" or typing different keywords.</p>
        </div>
      )}

    </div>
  );
};
export default MarketsPage;
