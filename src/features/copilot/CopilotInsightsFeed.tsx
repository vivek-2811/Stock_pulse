import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, Activity, Bell, RefreshCw } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { IntelligenceEngine } from '../../services/IntelligenceEngine';
import { ScoreEngine } from '../../services/ScoreEngine';

interface Props {
  onSelectPrompt: (text: string) => void;
}

export const CopilotInsightsFeed: React.FC<Props> = ({ onSelectPrompt }) => {
  const { stocks } = useMarketStore();
  const { holdings } = usePortfolioStore();
  const { watchlists, activeListId } = useWatchlistStore();

  const insights = useMemo(() => {
    const feed = [];
    const market = IntelligenceEngine.computeMarketMetrics(stocks);
    const sectors = IntelligenceEngine.computeSectorRotation(stocks);
    const portfolio = ScoreEngine.computePortfolioHealth(holdings, stocks);

    // 1. Portfolio Concentration Alert
    if (portfolio.diversificationScore < 50 && holdings.length > 0) {
      feed.push({
        id: 'ins-1',
        type: 'risk',
        icon: AlertTriangle,
        color: 'text-rose-400 bg-rose-500/10 border-rose-500/25',
        title: 'High Portfolio Concentration',
        desc: `Diversification index has fallen to ${portfolio.diversificationScore}/100. Tech exposure represents significant concentration risk.`,
        prompt: 'Analyze portfolio rebalancing and diversification recommendations'
      });
    } else if (holdings.length > 0) {
      feed.push({
        id: 'ins-1',
        type: 'opportunity',
        icon: Sparkles,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
        title: 'Portfolio Health Favorable',
        desc: `Diversification score of ${portfolio.diversificationScore}/100 meets safety thresholds. Exposure HHI is in balance.`,
        prompt: 'Analyze portfolio risk'
      });
    }

    // 2. Regime Shift Alert
    const regimeState = market.regime;
    feed.push({
      id: 'ins-2',
      type: 'trend',
      icon: Activity,
      color: regimeState === 'Risk-On' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' : 'text-amber-400 bg-amber-500/10 border-amber-500/25',
      title: `Market Regime: ${regimeState}`,
      desc: `Fear & Greed Index registers ${market.fearGreed} (${market.fearGreedLabel}). Advancing breadth is at ${market.breadthPct}%.`,
      prompt: `Summarize the current market regime and regime history`
    });

    // 3. Sector rotation
    if (sectors[0]) {
      feed.push({
        id: 'ins-3',
        type: 'trend',
        icon: RefreshCw,
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
        title: `Sector Rotation Triggered`,
        desc: `${sectors[0].sector} is leading daily sector rotation (+${sectors[0].averageChange.toFixed(2)}%), while ${sectors[sectors.length - 1]?.sector || 'Utilities'} lags.`,
        prompt: 'What sectors are strongest and leading rotation today?'
      });
    }

    // 4. Watchlist leader
    const activeWatchlist = watchlists.find(w => w.id === activeListId);
    if (activeWatchlist && activeWatchlist.symbols.length > 0) {
      const wStocks = activeWatchlist.symbols.map(s => stocks.find(x => x.symbol === s)).filter(Boolean) as typeof stocks;
      const sortedW = wStocks.sort((a, b) => b.changePercent - a.changePercent);
      if (sortedW[0] && sortedW[0].changePercent > 1.5) {
        feed.push({
          id: 'ins-4',
          type: 'opportunity',
          icon: Sparkles,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
          title: `Watchlist Momentum Breakout`,
          desc: `**${sortedW[0].symbol}** is breaking out in your watchlist with a daily increase of +${sortedW[0].changePercent.toFixed(1)}%.`,
          prompt: `Analyze stock ${sortedW[0].symbol}`
        });
      }
    }

    return feed;
  }, [stocks, holdings, watchlists, activeListId]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 mb-1 px-1">
        <Bell className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Real-Time Insights Feed (No Prompt Required)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins, idx) => {
          const Icon = ins.icon;
          return (
            <motion.div
              key={ins.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`p-3.5 rounded-xl border flex items-start gap-3 hover:scale-[1.01] transition-transform ${ins.color}`}
            >
              <div className="p-2 rounded-lg bg-white/5 border border-white/5 mt-0.5 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white mb-0.5">{ins.title}</h4>
                <p className="text-[11px] text-text-secondary leading-normal mb-2">{ins.desc}</p>
                <button
                  onClick={() => onSelectPrompt(ins.prompt)}
                  className="text-[9px] font-bold text-app-green hover:underline flex items-center gap-1 font-mono"
                >
                  Analyze Event &rarr;
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default CopilotInsightsFeed;
