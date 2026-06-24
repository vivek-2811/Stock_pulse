import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { SECTOR_SENTIMENT } from '../../store/NewsStore';
import type { SectorSentimentEntry } from '../../store/NewsStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDominantSentiment(entry: SectorSentimentEntry): 'Bullish' | 'Neutral' | 'Bearish' {
  const max = Math.max(entry.bullishPct, entry.neutralPct, entry.bearishPct);
  if (max === entry.bullishPct) return 'Bullish';
  if (max === entry.neutralPct) return 'Neutral';
  return 'Bearish';
}

const sentimentBadgeClass: Record<string, string> = {
  Bullish: 'bg-app-green/10 text-app-green border border-app-green/20',
  Neutral: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Bearish: 'bg-app-red/10 text-app-red border border-app-red/20',
};

const sentimentIcon: Record<string, React.ReactNode> = {
  Bullish: <TrendingUp className="w-3 h-3" />,
  Neutral: <Minus className="w-3 h-3" />,
  Bearish: <TrendingDown className="w-3 h-3" />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SentimentBarProps {
  bullishPct: number;
  neutralPct: number;
  bearishPct: number;
}

function SentimentBar({ bullishPct, neutralPct, bearishPct }: SentimentBarProps) {
  return (
    <div className="flex w-full h-1.5 rounded-full overflow-hidden gap-px">
      <div
        className="bg-app-green rounded-l-full transition-all duration-500"
        style={{ width: `${bullishPct}%` }}
      />
      <div
        className="bg-yellow-400 transition-all duration-500"
        style={{ width: `${neutralPct}%` }}
      />
      <div
        className="bg-app-red rounded-r-full transition-all duration-500"
        style={{ width: `${bearishPct}%` }}
      />
    </div>
  );
}

interface PerformanceBadgeProps {
  avgChange: number | null;
}

function PerformanceBadge({ avgChange }: PerformanceBadgeProps) {
  if (avgChange === null) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
        N/A
      </span>
    );
  }
  const positive = avgChange >= 0;
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-mono ${
        positive
          ? 'bg-app-green/10 text-app-green'
          : 'bg-app-red/10 text-app-red'
      }`}
    >
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{avgChange.toFixed(2)}%
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface SectorCardProps {
  entry: SectorSentimentEntry;
  index: number;
  avgChange: number | null;
}

function SectorCard({ entry, index, avgChange }: SectorCardProps) {
  const dominant = getDominantSentiment(entry);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      className="glass-card border border-border-glass rounded-xl p-4 flex flex-col gap-3 hover:border-white/10 transition-colors duration-200"
    >
      {/* Header row: sector name + live perf badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm text-white leading-tight">
            {entry.sector}
          </span>
          {/* Dominant sentiment badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium w-fit ${sentimentBadgeClass[dominant]}`}
          >
            {sentimentIcon[dominant]}
            {dominant}
          </span>
        </div>
        <PerformanceBadge avgChange={avgChange} />
      </div>

      {/* Sentiment bar */}
      <div className="flex flex-col gap-1.5">
        <SentimentBar
          bullishPct={entry.bullishPct}
          neutralPct={entry.neutralPct}
          bearishPct={entry.bearishPct}
        />
        <div className="flex justify-between text-xs text-text-muted font-mono">
          <span className="text-app-green">{entry.bullishPct}%</span>
          <span className="text-yellow-400">{entry.neutralPct}%</span>
          <span className="text-app-red">{entry.bearishPct}%</span>
        </div>
      </div>

      {/* Leader / Laggard */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 flex-1 bg-app-green/5 border border-app-green/15 rounded-lg px-2.5 py-1.5">
          <TrendingUp className="w-3 h-3 text-app-green shrink-0" />
          <span className="text-xs text-text-secondary">Leader</span>
          <span className="text-xs font-bold text-app-green ml-auto">{entry.leader}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-1 bg-app-red/5 border border-app-red/15 rounded-lg px-2.5 py-1.5">
          <TrendingDown className="w-3 h-3 text-app-red shrink-0" />
          <span className="text-xs text-text-secondary">Laggard</span>
          <span className="text-xs font-bold text-app-red ml-auto">{entry.laggard}</span>
        </div>
      </div>

      {/* Top headline */}
      <div className="flex items-start gap-1.5">
        <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted truncate leading-relaxed">
          {entry.topHeadline}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function SectorNews() {
  const stocks = useMarketStore((s) => s.stocks);

  // Build a map: sector -> avg changePercent
  const sectorAvgChange = React.useMemo<Record<string, number | null>>(() => {
    const grouped: Record<string, number[]> = {};
    stocks.forEach((stock) => {
      if (!grouped[stock.sector]) grouped[stock.sector] = [];
      grouped[stock.sector].push(stock.changePercent);
    });
    const result: Record<string, number | null> = {};
    for (const sector of Object.keys(grouped)) {
      const arr = grouped[sector];
      result[sector] = arr.length > 0
        ? arr.reduce((a, b) => a + b, 0) / arr.length
        : null;
    }
    return result;
  }, [stocks]);

  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Sector Sentiment</h2>
        <span className="text-xs text-text-muted">
          {SECTOR_SENTIMENT.length} sectors
        </span>
      </div>

      {/* 2-col grid on md+, 1-col on sm */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SECTOR_SENTIMENT.map((entry, i) => (
          <SectorCard
            key={entry.sector}
            entry={entry}
            index={i}
            avgChange={sectorAvgChange[entry.sector] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
