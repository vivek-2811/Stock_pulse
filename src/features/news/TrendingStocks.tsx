import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, TrendingUp, TrendingDown, Zap, Activity } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { STATIC_ARTICLES } from '../../store/NewsStore';
import { useNavigate } from 'react-router';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface TrendingRow {
  symbol: string;
  name: string;
  changePercent: number;
  volume: number;
  avgVolume: number;
  trendScore: number;
  momentumScore: number;
  sentimentScore: number;
  newsCount: number;
  volRatio: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TrendBarProps {
  score: number;
  positive: boolean;
}

function TrendBar({ score, positive }: TrendBarProps) {
  return (
    <div className="relative w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${positive ? 'bg-app-green' : 'bg-app-red'}`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, score)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

interface RankBadgeProps {
  rank: number;
}

function RankBadge({ rank }: RankBadgeProps) {
  const gold = rank === 1;
  const silver = rank === 2;
  const bronze = rank === 3;
  const base = 'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0';
  const cls = gold
    ? `${base} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`
    : silver
    ? `${base} bg-slate-400/20 text-slate-300 border border-slate-400/30`
    : bronze
    ? `${base} bg-orange-700/20 text-orange-400 border border-orange-700/30`
    : `${base} bg-white/5 text-text-muted`;
  return <span className={cls}>{rank}</span>;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function TrendingStocks() {
  const stocks = useMarketStore((s) => s.stocks);
  const navigate = useNavigate();

  const trending = useMemo<TrendingRow[]>(() => {
    return stocks
      .map((stock) => {
        const volRatio = Math.min(3, stock.volume / Math.max(1, stock.avgVolume));

        // News count: articles that mention this symbol in relatedSymbols
        const newsCount = STATIC_ARTICLES.filter((a) =>
          a.relatedSymbols.includes(stock.symbol)
        ).length;

        // Momentum bonus
        const momentumBonus = stock.changePercent > 0 ? 1 : 0;

        // trendScore formula
        const trendScore = Math.min(
          100,
          Math.max(
            0,
            volRatio * 30 +
              Math.abs(stock.changePercent) * 8 +
              newsCount * 12 +
              momentumBonus * 20
          )
        );

        // momentumScore
        const momentumScore = Math.min(100, Math.abs(stock.changePercent) * 20);

        // sentimentScore: (bullish articles - bearish articles) scaled 0-100
        const mentioningArticles = STATIC_ARTICLES.filter((a) =>
          a.relatedSymbols.includes(stock.symbol)
        );
        const bullishCount = mentioningArticles.filter(
          (a) => a.sentiment === 'Bullish'
        ).length;
        const bearishCount = mentioningArticles.filter(
          (a) => a.sentiment === 'Bearish'
        ).length;
        const rawSentiment = bullishCount - bearishCount;
        // Scale: raw ranges from -newsCount to +newsCount → map to 0-100
        const sentimentScore =
          newsCount > 0
            ? Math.min(100, Math.max(0, ((rawSentiment + newsCount) / (2 * newsCount)) * 100))
            : 50;

        return {
          symbol: stock.symbol,
          name: stock.name,
          changePercent: stock.changePercent,
          volume: stock.volume,
          avgVolume: stock.avgVolume,
          trendScore,
          momentumScore,
          sentimentScore,
          newsCount,
          volRatio,
        } satisfies TrendingRow;
      })
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10);
  }, [stocks]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <Flame className="w-4 h-4 text-orange-400" />
        </div>
        <h2 className="text-base font-semibold text-white">Trending Stocks</h2>
        <span className="text-xs text-text-muted ml-auto">By trend score</span>
      </div>

      {/* Column labels */}
      <div className="grid grid-cols-[28px_1fr_80px_68px_56px_36px] items-center gap-x-2 px-3 text-[10px] text-text-muted uppercase tracking-wider font-medium">
        <span>#</span>
        <span>Symbol</span>
        <span>Trend</span>
        <span className="text-right">Change</span>
        <span className="text-right">Vol</span>
        <span className="text-right">News</span>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1">
        {trending.map((row, i) => {
          const positive = row.changePercent >= 0;
          return (
            <motion.button
              key={row.symbol}
              type="button"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: 'easeOut' }}
              onClick={() => navigate(`/stock/${row.symbol}`)}
              className="grid grid-cols-[28px_1fr_80px_68px_56px_36px] items-center gap-x-2 px-3 py-2.5 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors duration-150 text-left w-full group"
              aria-label={`View ${row.symbol} stock details`}
            >
              {/* Rank */}
              <RankBadge rank={i + 1} />

              {/* Symbol + name */}
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-sm font-bold leading-tight ${
                    positive ? 'text-app-green' : 'text-app-red'
                  }`}
                >
                  {row.symbol}
                </span>
                <span className="text-[10px] text-text-muted truncate leading-tight">
                  {row.name}
                </span>
              </div>

              {/* Trend bar + score */}
              <div className="flex flex-col gap-1">
                <TrendBar score={row.trendScore} positive={positive} />
                <span className="text-[10px] text-text-muted font-mono">
                  {row.trendScore.toFixed(0)}
                </span>
              </div>

              {/* changePercent badge */}
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md font-mono font-medium ${
                    positive
                      ? 'bg-app-green/10 text-app-green'
                      : 'bg-app-red/10 text-app-red'
                  }`}
                >
                  {positive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {positive ? '+' : ''}{row.changePercent.toFixed(2)}%
                </span>
              </div>

              {/* Volume vs avg */}
              <div className="text-right">
                <span
                  className={`text-xs font-mono font-semibold ${
                    row.volRatio >= 1.5
                      ? 'text-orange-400'
                      : row.volRatio >= 1
                      ? 'text-text-secondary'
                      : 'text-text-muted'
                  }`}
                >
                  {row.volRatio.toFixed(1)}x
                </span>
              </div>

              {/* News count */}
              <div className="text-right">
                {row.newsCount > 0 ? (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 border border-blue-500/25 text-[10px] text-blue-400 font-bold">
                    {row.newsCount}
                  </span>
                ) : (
                  <span className="text-xs text-text-muted">—</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Footer legend */}
      <div className="flex items-center gap-4 pt-1 border-t border-border-glass text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" /> Score = vol + momentum + news
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Zap className="w-3 h-3 text-orange-400" /> Live
        </span>
      </div>
    </div>
  );
}
