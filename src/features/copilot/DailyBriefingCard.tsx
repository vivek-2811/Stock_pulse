import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sun, ShieldAlert, Sparkles, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { IntelligenceEngine } from '../../services/IntelligenceEngine';

interface Props {
  onSelectPrompt: (text: string) => void;
}

export const DailyBriefingCard: React.FC<Props> = ({ onSelectPrompt }) => {
  const { stocks } = useMarketStore();

  const briefing = useMemo(() => {
    const market = IntelligenceEngine.computeMarketMetrics(stocks);
    const sectors = IntelligenceEngine.computeSectorRotation(stocks);
    
    const leadSec = sectors[0]?.sector || 'Technology';
    const lagSec = sectors[sectors.length - 1]?.sector || 'Utilities';

    // Find biggest gainer & loser stocks
    const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
    const topStock = sorted[0];
    const bottomStock = sorted[sorted.length - 1];

    return {
      regime: market.regime,
      fearGreed: market.fearGreed,
      fearGreedLabel: market.fearGreedLabel,
      leadSec,
      lagSec,
      topStockSymbol: topStock?.symbol || 'NVDA',
      topStockChange: topStock?.changePercent || 0,
      bottomStockSymbol: bottomStock?.symbol || 'TSLA',
      bottomStockChange: bottomStock?.changePercent || 0
    };
  }, [stocks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="p-5 rounded-2xl border border-[#00FF94]/25 bg-gradient-to-tr from-[#00FF94]/5 via-white/[0.01] to-transparent backdrop-blur-md relative overflow-hidden"
    >
      <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-[#00FF94]/8 blur-2xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sun className="w-5 h-5 text-yellow-400 animate-spin-slow" />
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">Good Morning, Vivek</h3>
            <p className="text-[10px] text-text-muted">StockPulse Quantitative Intelligence Briefing</p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#00FF94]/10 text-[#00FF94] border border-[#00FF94]/20 text-[9px] font-mono font-bold uppercase tracking-wider">
          {briefing.regime} Regime
        </span>
      </div>

      {/* Grid summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.01] border border-border-glass/40 p-3 rounded-xl">
        <div>
          <span className="text-[9px] text-text-muted uppercase font-bold block">Fear & Greed</span>
          <span className="text-xs font-bold text-white font-mono mt-0.5 block">{briefing.fearGreed}/100</span>
          <span className="text-[9px] text-text-muted font-mono">{briefing.fearGreedLabel}</span>
        </div>
        <div>
          <span className="text-[9px] text-text-muted uppercase font-bold block">Top Sector</span>
          <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">{briefing.leadSec}</span>
          <span className="text-[9px] text-text-muted font-mono">Outperforming avg</span>
        </div>
        <div>
          <span className="text-[9px] text-text-muted uppercase font-bold block">Weakest Sector</span>
          <span className="text-xs font-bold text-red-400 font-mono mt-0.5 block">{briefing.lagSec}</span>
          <span className="text-[9px] text-text-muted font-mono">Underperforming avg</span>
        </div>
        <div>
          <span className="text-[9px] text-text-muted uppercase font-bold block">Active Stocks</span>
          <span className="text-xs font-bold text-white font-mono mt-0.5 block">{stocks.length} Tickers</span>
          <span className="text-[9px] text-text-muted font-mono">WebSocket Sync Active</span>
        </div>
      </div>

      {/* Highlights */}
      <div className="mt-4 space-y-2.5">
        <div className="flex items-start gap-2 text-xs text-text-secondary">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-normal">
            **Opportunity Highlight**: **{briefing.topStockSymbol}** is leading market momentum today, up **{briefing.topStockChange >= 0 ? '+' : ''}{briefing.topStockChange.toFixed(2)}%** with institutional buying flows detected.
          </p>
        </div>

        <div className="flex items-start gap-2 text-xs text-text-secondary">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="leading-normal">
            **Risk Flag**: **{briefing.bottomStockSymbol}** has entered a declining price trend, down **{briefing.bottomStockChange.toFixed(2)}%** in early trading. Sector rotation shows defensive reallocation.
          </p>
        </div>
      </div>

      {/* Call-to-action button */}
      <div className="mt-4 pt-3.5 border-t border-border-glass/40 flex justify-end">
        <button
          onClick={() => onSelectPrompt('Summarize today\'s market regime and risk factors')}
          className="flex items-center gap-1 text-[10px] font-bold text-[#00FF94] hover:underline"
        >
          Generate Comprehensive Briefing Analysis <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
export default DailyBriefingCard;
