import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useNewsStore, EARNINGS_CALENDAR } from '../../store/NewsStore';
import type { EarningsEntry } from '../../store/NewsStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type EarningsView = 'today' | 'week' | 'month';

function isWithinDays(isoDate: string, days: number): boolean {
  const now = Date.now();
  const ts = new Date(isoDate).getTime();
  const diffMs = ts - now;
  // Allow entries from -6 hours (today already passed) to +days ahead
  return diffMs >= -6 * 3600000 && diffMs <= days * 86400000;
}

function formatReportDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function epsSurpriseBadge(estimate: number, previous: number): {
  label: string;
  className: string;
} {
  if (estimate > previous * 1.05) {
    return {
      label: 'Beat Expected',
      className: 'text-app-green bg-app-green/10 border-app-green/25',
    };
  }
  if (estimate < previous * 0.95) {
    return {
      label: 'Miss Risk',
      className: 'text-app-red bg-app-red/10 border-app-red/25',
    };
  }
  return {
    label: 'In-line',
    className: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
  };
}

function TimeLabel({ time }: { time: EarningsEntry['time'] }) {
  const colors: Record<EarningsEntry['time'], string> = {
    'Before Open': 'text-app-green',
    'After Close': 'text-yellow-400',
    'During Market': 'text-blue-400',
  };
  return (
    <span className={`flex items-center gap-1 text-[11px] font-medium ${colors[time]}`}>
      <Clock size={11} />
      {time}
    </span>
  );
}

// ─── Earnings Card ────────────────────────────────────────────────────────────

function EarningsCard({ entry, index }: { entry: EarningsEntry; index: number }) {
  const badge = epsSurpriseBadge(entry.epsEstimate, entry.epsPrevious);
  const epsUp = entry.epsEstimate >= entry.epsPrevious;
  const epsDelta = ((entry.epsEstimate - entry.epsPrevious) / Math.abs(entry.epsPrevious)) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: 'easeOut' }}
      className="glass-card border border-border-glass rounded-xl p-4 hover:border-white/20 transition-colors group cursor-default"
    >
      {/* Top section */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Symbol + Company */}
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg font-bold text-app-green tracking-tight">
              {entry.symbol}
            </span>
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-text-secondary">{entry.name}</p>
        </div>

        {/* Sector pill + arrow */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 text-text-muted border border-border-glass">
            {entry.sector}
          </span>
          <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Date + Time row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <Calendar size={11} />
          <span className="font-medium text-text-secondary">
            {formatReportDate(entry.reportDate)}
          </span>
        </div>
        <span className="text-text-muted text-[10px]">·</span>
        <TimeLabel time={entry.time} />
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-2">
        {/* EPS Estimate */}
        <div className="surface-low rounded-lg p-2.5 flex flex-col gap-1">
          <p className="text-[9px] text-text-muted uppercase tracking-wide font-medium">
            EPS Est.
          </p>
          <p className="text-sm font-bold text-white">${entry.epsEstimate.toFixed(2)}</p>
        </div>

        {/* EPS Previous + delta */}
        <div className="surface-low rounded-lg p-2.5 flex flex-col gap-1">
          <p className="text-[9px] text-text-muted uppercase tracking-wide font-medium">
            EPS Prev.
          </p>
          <div className="flex items-center gap-1">
            <p className="text-sm font-bold text-white">${entry.epsPrevious.toFixed(2)}</p>
            <span
              className={`flex items-center text-[10px] font-semibold ${
                epsUp ? 'text-app-green' : 'text-app-red'
              }`}
            >
              {epsUp ? (
                <TrendingUp size={10} />
              ) : (
                <TrendingDown size={10} />
              )}
              {Math.abs(epsDelta).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Revenue estimate */}
        <div className="surface-low rounded-lg p-2.5 flex flex-col gap-1">
          <p className="text-[9px] text-text-muted uppercase tracking-wide font-medium">
            Rev. Est.
          </p>
          <p className="text-sm font-bold text-white truncate">{entry.revenueEstimate}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const VIEW_TABS: { key: EarningsView; label: string; days: number }[] = [
  { key: 'today', label: 'Today', days: 1 },
  { key: 'week', label: 'This Week', days: 7 },
  { key: 'month', label: 'This Month', days: 30 },
];

export function EarningsCenter() {
  const { earningsView, setEarningsView } = useNewsStore();

  const activeDays = useMemo(
    () => VIEW_TABS.find((t) => t.key === earningsView)?.days ?? 7,
    [earningsView]
  );

  const filtered = useMemo(() => {
    return EARNINGS_CALENDAR.filter((e) => isWithinDays(e.reportDate, activeDays)).sort(
      (a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
    );
  }, [activeDays]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-app-green" />
        <h2 className="text-sm font-semibold text-white">Earnings Calendar</h2>
        <span className="ml-auto text-[11px] text-text-muted">
          {filtered.length} upcoming
        </span>
      </div>

      {/* View tab bar */}
      <div className="flex items-center gap-1 p-1 glass-card border border-border-glass rounded-xl">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setEarningsView(tab.key)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              earningsView === tab.key
                ? 'bg-white/12 text-white border border-white/15 shadow-sm'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Earnings cards */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 gap-3"
          >
            <Calendar size={32} className="text-text-muted opacity-40" />
            <p className="text-text-muted text-sm">No earnings reports scheduled</p>
            <p className="text-text-muted text-xs opacity-60">
              Try selecting a wider time range
            </p>
          </motion.div>
        ) : (
          filtered.map((entry, i) => (
            <EarningsCard key={`${entry.symbol}-${entry.reportDate}`} entry={entry} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
