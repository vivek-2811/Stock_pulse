import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity, Globe, Zap, BarChart2, BookOpen, Target, Sparkles } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useSavedScreensStore } from '../../store/SavedScreensStore';
import { useCopilotStore } from './CopilotStore';
import { ScoreEngine } from '../../services/ScoreEngine';
import { IntelligenceEngine } from '../../services/IntelligenceEngine';

function StatRow({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-border-glass/30 last:border-0">
      <span className="text-[10px] text-text-muted font-medium">{label}</span>
      <div className="text-right">
        <span className={`text-[11px] font-bold font-mono ${color ?? 'text-white'}`}>{value}</span>
        {sub && <p className="text-[9px] text-text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl border border-border-glass p-3.5 space-y-1 bg-white/[0.01]">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{title}</span>
      </div>
      {children}
    </div>
  );
}

export const CopilotContextPanel: React.FC = () => {
  const { stocks } = useMarketStore();
  const { watchlists, activeListId } = useWatchlistStore();
  const { holdings } = usePortfolioStore();
  const { screens } = useSavedScreensStore();
  const { recentStocks } = useCopilotStore();

  const ctx = useMemo(() => IntelligenceEngine.computeMarketMetrics(stocks), [stocks]);
  const sectors = useMemo(() => IntelligenceEngine.computeSectorRotation(stocks), [stocks]);
  const activeWatchlist = watchlists.find((w) => w.id === activeListId);

  // Get last searched stock details
  const activeStockSymbol = recentStocks[0] || 'AAPL';
  const activeStock = useMemo(() => {
    return stocks.find(s => s.symbol === activeStockSymbol);
  }, [stocks, activeStockSymbol]);

  const activeStockScore = useMemo(() => {
    return activeStock ? ScoreEngine.computeOpportunityScore(activeStock) : 0;
  }, [activeStock]);

  const totalPortfolioValue = useMemo(() => {
    const stockMap = new Map(stocks.map((s) => [s.symbol, s]));
    return holdings.reduce((sum, h) => {
      const price = stockMap.get(h.symbol)?.price ?? h.avgBuyPrice;
      return sum + price * h.quantity;
    }, 0);
  }, [holdings, stocks]);

  const totalPortfolioCost = holdings.reduce((s, h) => s + h.avgBuyPrice * h.quantity, 0);
  const portfolioPnLPct = totalPortfolioCost > 0
    ? ((totalPortfolioValue - totalPortfolioCost) / totalPortfolioCost) * 100
    : 0;

  const regimeColor =
    ctx.regime === 'Risk-On' ? 'text-emerald-400' :
    ctx.regime === 'Risk-Off' ? 'text-red-400' :
    'text-yellow-400';

  const watchlistSymbols = activeWatchlist?.symbols ?? [];
  const watchlistStocks = watchlistSymbols.map((sym) => stocks.find((s) => s.symbol === sym)).filter(Boolean) as typeof stocks;
  const watchlistAvg = watchlistStocks.length
    ? watchlistStocks.reduce((s, x) => s + x.changePercent, 0) / watchlistStocks.length
    : 0;

  const marketAvg = stocks.length ? stocks.reduce((s, x) => s + x.changePercent, 0) / stocks.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1"
      style={{ maxHeight: 'calc(100vh - 120px)' }}
    >
      {/* 1. Selected Stock Context card */}
      {activeStock && (
        <Section icon={Target} title="Selected Stock Context">
          <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-2.5 mb-2">
            <div>
              <span className="text-xs font-mono font-bold text-white block">{activeStock.symbol}</span>
              <span className="text-[9px] text-text-muted truncate block max-w-[120px]">{activeStock.name}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono font-bold text-white block">${activeStock.price.toFixed(2)}</span>
              <span className={`text-[9px] font-bold ${activeStock.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {activeStock.changePercent >= 0 ? '+' : ''}{activeStock.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <StatRow label="Opportunity Score" value={`${activeStockScore}/100`} color={activeStockScore >= 70 ? 'text-emerald-400' : 'text-white'} />
          <StatRow label="Beta (Volatility)" value={activeStock.beta.toFixed(2)} />
          <StatRow label="Valuation P/E" value={activeStock.peRatio.toFixed(1)} />
        </Section>
      )}

      {/* 2. Market Context */}
      <Section icon={Globe} title="Market Context">
        <StatRow
          label="Regime"
          value={<span className={regimeColor}>{ctx.regime}</span>}
        />
        <StatRow
          label="Fear & Greed"
          value={ctx.fearGreed}
          sub={ctx.fearGreedLabel}
          color={ctx.fearGreed >= 60 ? 'text-emerald-400' : ctx.fearGreed <= 35 ? 'text-red-455' : 'text-yellow-400'}
        />
        <StatRow
          label="Breadth"
          value={`${ctx.breadthPct}%`}
          sub={`${ctx.advancingCount} of ${stocks.length} up`}
          color={ctx.breadthPct > 55 ? 'text-emerald-400' : ctx.breadthPct < 45 ? 'text-red-400' : 'text-yellow-400'}
        />
        <StatRow label="Sector Leader" value={sectors[0]?.sector || 'N/A'} />
      </Section>

      {/* 3. Portfolio Context */}
      <Section icon={BarChart2} title="Portfolio Metrics">
        {holdings.length === 0 ? (
          <p className="text-[10px] text-text-muted py-1 text-center font-mono">No holdings active</p>
        ) : (
          <>
            <StatRow label="Holdings Count" value={holdings.length} />
            <StatRow
              label="Total NAV"
              value={`$${totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            />
            <StatRow
              label="Overall Return"
              value={`${portfolioPnLPct >= 0 ? '+' : ''}${portfolioPnLPct.toFixed(2)}%`}
              color={portfolioPnLPct >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
          </>
        )}
      </Section>

      {/* 4. Active Watchlist */}
      <Section icon={Activity} title="Active Watchlist">
        {!activeWatchlist || watchlistSymbols.length === 0 ? (
          <p className="text-[10px] text-text-muted py-1 text-center font-mono">No symbols added</p>
        ) : (
          <>
            <StatRow label="Active List" value={<span className="text-[11px] truncate max-w-[100px] block">{activeWatchlist.name}</span>} />
            <StatRow label="Tickers Count" value={watchlistSymbols.length} />
            <StatRow
              label="Avg Change"
              value={`${watchlistAvg >= 0 ? '+' : ''}${watchlistAvg.toFixed(2)}%`}
              color={watchlistAvg >= 0 ? 'text-emerald-400' : 'text-red-400'}
            />
            <StatRow
              label="vs Market Bench"
              value={`${(watchlistAvg - marketAvg) >= 0 ? '+' : ''}${(watchlistAvg - marketAvg).toFixed(2)}%`}
              color={(watchlistAvg - marketAvg) >= 0 ? 'text-emerald-400' : 'text-red-455'}
            />
          </>
        )}
      </Section>
    </motion.div>
  );
};
export default CopilotContextPanel;
