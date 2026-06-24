import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Star, StarOff,
  CheckSquare, Square, ChevronDown, Eye, EyeOff, LayoutGrid, List,
  TrendingUp, TrendingDown
} from 'lucide-react';
import CountUp from 'react-countup';
import type { Stock } from '../../services/mockDataEngine';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { computeOpportunityScore, fmtMarketCap, fmtVolume, SECTOR_COLORS } from './screenerUtils';
import { ScreenerEmptyState } from './ScreenerEmptyState';
import type { ScreenerFilterState } from '../../store/SavedScreensStore';

interface Props {
  stocks: Stock[];
  allStocks: Stock[];
  filters: ScreenerFilterState;
  onResetFilters: () => void;
  selectedSymbols: string[];
  onSelectionChange: (symbols: string[]) => void;
  onHoverStock: (stock: Stock | null) => void;
  viewMode: 'table' | 'heatmap';
  isLoading?: boolean;
}

type SortKey = 'rank' | 'symbol' | 'name' | 'price' | 'changePercent' | 'volume' | 'marketCap' | 'beta' | 'score';
type SortDir = 'asc' | 'desc';

const ROW_HEIGHT = 48;
const OVERSCAN = 5;
const PAGE_SIZE = 50;

// Rank badge color
function RankBadge({ rank }: { rank: number }) {
  const cls =
    rank === 1 ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/40' :
    rank === 2 ? 'bg-slate-300/20 text-slate-300 border-slate-300/40' :
    rank === 3 ? 'bg-orange-400/20 text-orange-400 border-orange-400/40' :
    'bg-white/5 text-text-muted border-border-glass';
  return (
    <span className={`inline-flex items-center justify-center text-[10px] font-bold border rounded px-1.5 py-0.5 min-w-[28px] ${cls}`}>
      #{rank}
    </span>
  );
}

// Score ring SVG (radial fill)
function ScoreRing({ score, animate: doAnimate }: { score: number; animate: boolean }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color =
    score >= 70 ? '#00FF94' :
    score >= 40 ? '#FBBF24' :
    '#FF3B5C';

  return (
    <div className="relative w-9 h-9 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="36" height="36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
        <motion.circle
          cx="18" cy="18" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: doAnimate ? circ - fill : circ - fill }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </svg>
      <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-px">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-2 h-12 border-b border-border-glass/30">
          <div className="w-4 h-4 bg-white/5 rounded animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
          <div className="w-14 h-4 bg-white/8 rounded animate-pulse" />
          <div className="w-32 h-4 bg-white/5 rounded animate-pulse flex-1" />
          <div className="w-16 h-4 bg-white/8 rounded animate-pulse" />
          <div className="w-16 h-4 bg-white/5 rounded animate-pulse" />
          <div className="w-12 h-4 bg-white/5 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export const ScreenerResults: React.FC<Props> = ({
  stocks,
  allStocks,
  filters,
  onResetFilters,
  selectedSymbols,
  onSelectionChange,
  onHoverStock,
  viewMode,
  isLoading,
}) => {
  const navigate = useNavigate();
  const { watchlists, activeListId, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const activeWatchlist = watchlists.find((w) => w.id === activeListId);

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Column visibility
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());
  const [colPickerOpen, setColPickerOpen] = useState(false);

  // Virtual scroll
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(480);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Row flash tracking
  const prevPricesRef = useRef<Map<string, number>>(new Map());
  const [flashMap, setFlashMap] = useState<Map<string, 'up' | 'down'>>(new Map());

  // Memoised scored + sorted list
  const scoredStocks = useMemo(() => {
    return stocks.map((s) => ({ ...s, score: computeOpportunityScore(s) }));
  }, [stocks]);

  const sorted = useMemo(() => {
    return [...scoredStocks].sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortKey) {
        case 'rank': case 'score': va = a.score; vb = b.score; break;
        case 'symbol': va = a.symbol; vb = b.symbol; break;
        case 'name': va = a.name; vb = b.name; break;
        case 'price': va = a.price; vb = b.price; break;
        case 'changePercent': va = a.changePercent; vb = b.changePercent; break;
        case 'volume': va = a.volume; vb = b.volume; break;
        case 'marketCap': va = a.marketCap; vb = b.marketCap; break;
        case 'beta': va = a.beta; vb = b.beta; break;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [scoredStocks, sortKey, sortDir]);

  // Assign rank after sorting by score desc
  const rankedStocks = useMemo(() => {
    const byScore = [...scoredStocks].sort((a, b) => b.score - a.score);
    const rankMap = new Map<string, number>();
    byScore.forEach((s, i) => rankMap.set(s.symbol, i + 1));
    return sorted.map((s) => ({ ...s, rank: rankMap.get(s.symbol) ?? 0 }));
  }, [sorted, scoredStocks]);

  // Virtual window
  const visibleSlice = useMemo(() => {
    const limited = rankedStocks.slice(0, visibleCount);
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
    const end = Math.min(limited.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
    return { start, end, total: limited.length, rows: limited.slice(start, end) };
  }, [rankedStocks, scrollTop, containerHeight, visibleCount]);

  // Track price changes for row flash
  useEffect(() => {
    const newFlash = new Map<string, 'up' | 'down'>();
    stocks.forEach((s) => {
      const prev = prevPricesRef.current.get(s.symbol);
      if (prev !== undefined && prev !== s.price) {
        newFlash.set(s.symbol, s.price > prev ? 'up' : 'down');
      }
      prevPricesRef.current.set(s.symbol, s.price);
    });
    if (newFlash.size > 0) {
      setFlashMap(newFlash);
      setTimeout(() => setFlashMap(new Map()), 800);
    }
  }, [stocks]);

  // Scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const st = containerRef.current.scrollTop;
    setScrollTop(st);
    // Load more as we approach bottom
    const bottom = st + containerRef.current.clientHeight;
    const totalH = visibleCount * ROW_HEIGHT;
    if (bottom > totalH - ROW_HEIGHT * 10 && visibleCount < rankedStocks.length) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, rankedStocks.length));
    }
  }, [visibleCount, rankedStocks.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    const ro = new ResizeObserver(() => setContainerHeight(el.clientHeight));
    ro.observe(el);
    return () => { el.removeEventListener('scroll', handleScroll); ro.disconnect(); };
  }, [handleScroll]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'desc'
      ? <ArrowDown className="w-3 h-3 text-app-green" />
      : <ArrowUp className="w-3 h-3 text-app-green" />;
  };

  const toggleWatchlist = (symbol: string) => {
    if (activeWatchlist?.symbols.includes(symbol)) {
      removeFromWatchlist(activeListId, symbol);
    } else {
      addToWatchlist(activeListId, symbol);
    }
  };

  const toggleSelect = (symbol: string) => {
    if (selectedSymbols.includes(symbol)) {
      onSelectionChange(selectedSymbols.filter((s) => s !== symbol));
    } else if (selectedSymbols.length < 4) {
      onSelectionChange([...selectedSymbols, symbol]);
    }
  };

  const COLUMNS = [
    { key: 'rank', label: 'Rank / Score' },
    { key: 'symbol', label: 'Symbol' },
    { key: 'name', label: 'Company' },
    { key: 'price', label: 'Price' },
    { key: 'changePercent', label: 'Change %' },
    { key: 'volume', label: 'Volume' },
    { key: 'marketCap', label: 'Mkt Cap' },
    { key: 'beta', label: 'Beta' },
    { key: 'sector', label: 'Sector' },
    { key: 'watchlist', label: 'Watch' },
  ];

  const showCol = (key: string) => !hiddenCols.has(key);

  if (isLoading) return <TableSkeleton />;
  if (stocks.length === 0) {
    return <ScreenerEmptyState allStocks={allStocks} filters={filters} onResetFilters={onResetFilters} />;
  }

  const topPad = visibleSlice.start * ROW_HEIGHT;
  const bottomPad = (visibleSlice.total - visibleSlice.end) * ROW_HEIGHT;

  return (
    <div className="glass-card rounded-2xl border border-border-glass overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-glass shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">{rankedStocks.length.toLocaleString()} Results</span>
          {selectedSymbols.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold"
            >
              {selectedSymbols.length} selected
            </motion.span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setColPickerOpen((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-glass text-[11px] text-text-muted hover:text-white hover:border-white/20 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Columns
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {colPickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 z-30 bg-surface-low border border-border-glass rounded-xl p-2 shadow-2xl min-w-[160px]"
              >
                {COLUMNS.filter(c => c.key !== 'rank' && c.key !== 'symbol').map((col) => {
                  const hidden = hiddenCols.has(col.key);
                  return (
                    <button
                      key={col.key}
                      onClick={() => setHiddenCols((prev) => {
                        const next = new Set(prev);
                        hidden ? next.delete(col.key) : next.add(col.key);
                        return next;
                      })}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-xs text-left"
                    >
                      {hidden ? <EyeOff className="w-3.5 h-3.5 text-text-muted" /> : <Eye className="w-3.5 h-3.5 text-app-green" />}
                      <span className={hidden ? 'text-text-muted' : 'text-white'}>{col.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scrollable Table */}
      <div
        ref={containerRef}
        className="overflow-auto flex-1"
        style={{ height: '520px' }}
        role="grid"
        aria-label="Stock screener results"
      >
        <table className="w-full border-collapse min-w-[800px]">
          <thead className="sticky top-0 z-20 bg-surface-lowest/95 backdrop-blur-glass">
            <tr>
              {/* Select */}
              <th className="w-10 px-2 py-3 text-left">
                <span className="sr-only">Select</span>
              </th>
              {showCol('rank') && (
                <th className="px-3 py-3 text-left">
                  <button onClick={() => handleSort('rank')} className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-white">
                    Rank <SortIcon col="rank" />
                  </button>
                </th>
              )}
              {showCol('symbol') && (
                <th className="px-3 py-3 text-left">
                  <button onClick={() => handleSort('symbol')} className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-white">
                    Symbol <SortIcon col="symbol" />
                  </button>
                </th>
              )}
              {showCol('name') && (
                <th className="px-3 py-3 text-left">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-white">
                    Company <SortIcon col="name" />
                  </button>
                </th>
              )}
              {showCol('price') && (
                <th className="px-3 py-3 text-right">
                  <button onClick={() => handleSort('price')} className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-white ml-auto">
                    Price <SortIcon col="price" />
                  </button>
                </th>
              )}
              {showCol('changePercent') && (
                <th className="px-3 py-3 text-right">
                  <button onClick={() => handleSort('changePercent')} className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-white ml-auto">
                    Chg % <SortIcon col="changePercent" />
                  </button>
                </th>
              )}
              {showCol('volume') && (
                <th className="px-3 py-3 text-right">
                  <button onClick={() => handleSort('volume')} className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-white ml-auto">
                    Volume <SortIcon col="volume" />
                  </button>
                </th>
              )}
              {showCol('marketCap') && (
                <th className="px-3 py-3 text-right">
                  <button onClick={() => handleSort('marketCap')} className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-white ml-auto">
                    Mkt Cap <SortIcon col="marketCap" />
                  </button>
                </th>
              )}
              {showCol('beta') && (
                <th className="px-3 py-3 text-right">
                  <button onClick={() => handleSort('beta')} className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-white ml-auto">
                    Beta <SortIcon col="beta" />
                  </button>
                </th>
              )}
              {showCol('sector') && (
                <th className="px-3 py-3 text-left">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sector</span>
                </th>
              )}
              {showCol('watchlist') && (
                <th className="px-3 py-3 text-center">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Watch</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* Top spacer */}
            {topPad > 0 && <tr><td colSpan={99} style={{ height: topPad, padding: 0, border: 'none' }} /></tr>}

            <AnimatePresence mode="popLayout" initial={false}>
              {visibleSlice.rows.map((stock) => {
                const flash = flashMap.get(stock.symbol);
                const isSelected = selectedSymbols.includes(stock.symbol);
                const isWatched = activeWatchlist?.symbols.includes(stock.symbol) ?? false;
                const isUp = stock.changePercent >= 0;
                const isMomentum = stock.changePercent >= 1.5 && (stock.volume / (stock.avgVolume || 1)) > 1.2;

                return (
                  <motion.tr
                    key={stock.symbol}
                    layout
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.18 }}
                    className={`border-b border-border-glass/40 cursor-pointer transition-colors duration-150
                      ${flash === 'up' ? 'bg-app-green/8' : flash === 'down' ? 'bg-app-red/8' : 'hover:bg-white/[0.02]'}
                      ${isSelected ? 'bg-blue-500/5 border-l-2 border-l-blue-500/60' : ''}
                      ${isMomentum ? 'animate-pulse-emerald' : ''}
                    `}
                    style={{ height: ROW_HEIGHT }}
                    onMouseEnter={() => onHoverStock(stock)}
                    onMouseLeave={() => onHoverStock(null)}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    role="row"
                    aria-selected={isSelected}
                  >
                    {/* Select checkbox */}
                    <td className="w-10 px-2" onClick={(e) => { e.stopPropagation(); toggleSelect(stock.symbol); }}>
                      {isSelected
                        ? <CheckSquare className="w-4 h-4 text-blue-400" />
                        : <Square className="w-4 h-4 text-text-muted hover:text-white transition-colors" />
                      }
                    </td>

                    {/* Rank + Score */}
                    {showCol('rank') && (
                      <td className="px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <RankBadge rank={stock.rank} />
                          <ScoreRing score={stock.score} animate={true} />
                        </div>
                      </td>
                    )}

                    {/* Symbol */}
                    {showCol('symbol') && (
                      <td className="px-3">
                        <span className="text-sm font-bold text-white font-mono">{stock.symbol}</span>
                      </td>
                    )}

                    {/* Company */}
                    {showCol('name') && (
                      <td className="px-3 max-w-[180px]">
                        <span className="text-xs text-text-muted truncate block">{stock.name}</span>
                      </td>
                    )}

                    {/* Price */}
                    {showCol('price') && (
                      <td className="px-3 text-right">
                        <span className="text-sm font-bold font-mono text-white tabular-nums">
                          ${stock.price.toFixed(2)}
                        </span>
                      </td>
                    )}

                    {/* Change % */}
                    {showCol('changePercent') && (
                      <td className="px-3 text-right">
                        <span className={`flex items-center justify-end gap-1 text-xs font-bold ${isUp ? 'text-app-green' : 'text-app-red'}`}>
                          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                      </td>
                    )}

                    {/* Volume */}
                    {showCol('volume') && (
                      <td className="px-3 text-right">
                        <span className="text-xs font-mono text-text-muted">{fmtVolume(stock.volume)}</span>
                      </td>
                    )}

                    {/* Market Cap */}
                    {showCol('marketCap') && (
                      <td className="px-3 text-right">
                        <span className="text-xs font-mono text-text-muted">{fmtMarketCap(stock.marketCap)}</span>
                      </td>
                    )}

                    {/* Beta */}
                    {showCol('beta') && (
                      <td className="px-3 text-right">
                        <span className={`text-xs font-bold font-mono ${stock.beta > 1.3 ? 'text-app-red' : stock.beta < 0.8 ? 'text-app-green' : 'text-yellow-400'}`}>
                          {stock.beta.toFixed(2)}
                        </span>
                      </td>
                    )}

                    {/* Sector */}
                    {showCol('sector') && (
                      <td className="px-3">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            color: SECTOR_COLORS[stock.sector] ?? '#8A8F98',
                            backgroundColor: `${SECTOR_COLORS[stock.sector] ?? '#8A8F98'}18`,
                          }}
                        >
                          {stock.sector.replace('Communication Services', 'Comm.').replace('Financial', 'Financials')}
                        </span>
                      </td>
                    )}

                    {/* Watchlist */}
                    {showCol('watchlist') && (
                      <td className="px-3 text-center" onClick={(e) => { e.stopPropagation(); toggleWatchlist(stock.symbol); }}>
                        <button
                          aria-label={isWatched ? `Remove ${stock.symbol} from watchlist` : `Add ${stock.symbol} to watchlist`}
                          className={`p-1.5 rounded-lg transition-colors ${isWatched ? 'text-yellow-400 hover:text-yellow-500' : 'text-text-muted hover:text-yellow-400'}`}
                        >
                          {isWatched ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </button>
                      </td>
                    )}
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {/* Bottom spacer */}
            {bottomPad > 0 && <tr><td colSpan={99} style={{ height: bottomPad, padding: 0, border: 'none' }} /></tr>}
          </tbody>
        </table>
      </div>

      {/* Load More indicator */}
      {visibleCount < rankedStocks.length && (
        <div className="px-4 py-3 border-t border-border-glass text-center shrink-0">
          <span className="text-[11px] text-text-muted">
            Showing {Math.min(visibleCount, rankedStocks.length)} of {rankedStocks.length} — scroll to load more
          </span>
        </div>
      )}

      {/* Aria live region for sort announcements */}
      <div aria-live="polite" className="sr-only">
        Sorted by {sortKey} {sortDir === 'asc' ? 'ascending' : 'descending'}
      </div>
    </div>
  );
};
