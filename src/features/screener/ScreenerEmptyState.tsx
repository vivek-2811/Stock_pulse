import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Lightbulb, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import type { Stock } from '../../services/mockDataEngine';
import type { ScreenerFilterState } from '../../store/SavedScreensStore';
import { computeOpportunityScore, applyFilters, findClosestMatches, suggestRelaxation, EMPTY_FILTERS } from './screenerUtils';

interface Props {
  allStocks: Stock[];
  filters: ScreenerFilterState;
  onResetFilters: () => void;
}

export const ScreenerEmptyState: React.FC<Props> = ({ allStocks, filters, onResetFilters }) => {
  const closest = useMemo(() => findClosestMatches(allStocks, filters, 3), [allStocks, filters]);
  const suggestion = useMemo(() => suggestRelaxation(allStocks, filters), [allStocks, filters]);

  const filterLabels: Record<string, string> = {
    priceRange: 'Price Range',
    marketCap: 'Market Cap',
    volume: 'Volume',
    performance: 'Performance',
    beta: 'Risk (Beta)',
    Sector: 'Sector',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center py-16 px-4 gap-8"
    >
      {/* Main message */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-border-glass flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-text-muted" />
        </div>
        <h3 className="text-lg font-bold text-white">No stocks match current filters</h3>
        <p className="text-sm text-text-muted max-w-sm">
          Try relaxing one or more filters to expand your results.
        </p>
      </div>

      {/* Suggestion */}
      {suggestion && suggestion.gain > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 max-w-sm w-full"
        >
          <Lightbulb className="w-5 h-5 text-yellow-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-yellow-400">Suggested Fix</p>
            <p className="text-xs text-text-muted mt-0.5">
              Remove the <span className="text-white font-semibold">{filterLabels[suggestion.filterLabel] ?? suggestion.filterLabel}</span> filter to add{' '}
              <span className="text-app-green font-bold">+{suggestion.gain} results</span>
            </p>
          </div>
        </motion.div>
      )}

      {/* Closest Matches */}
      {closest.length > 0 && (
        <div className="w-full max-w-lg space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted text-center">
            Closest Matches
          </p>
          <div className="space-y-2">
            {closest.map((stock, i) => {
              const score = computeOpportunityScore(stock);
              const isUp = stock.changePercent >= 0;
              return (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.07 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border-glass bg-surface-low/30 hover:border-white/15 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{stock.symbol}</span>
                      <span className="text-xs text-text-muted truncate">{stock.name}</span>
                    </div>
                    <span className="text-[10px] text-text-muted">{stock.sector}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs font-bold ${isUp ? 'text-app-green' : 'text-app-red'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </span>
                    <div className="w-8 h-8 rounded-full bg-app-green/10 border border-app-green/25 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-app-green">{score}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reset CTA */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={onResetFilters}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-app-green/30 bg-app-green/10 text-app-green text-sm font-bold hover:bg-app-green/20 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Reset All Filters
      </motion.button>
    </motion.div>
  );
};
