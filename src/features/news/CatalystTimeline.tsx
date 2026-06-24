import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Globe, BarChart3, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import { STATIC_TIMELINE, STATIC_CATALYSTS } from '../../store/NewsStore';
import type { TimelineEvent, CatalystType } from '../../store/NewsStore';
import { useNavigate } from 'react-router';

// ─── Type helpers ─────────────────────────────────────────────────────────────

type TimelineType = TimelineEvent['type'];
type FilterOption = 'All' | TimelineType;

const FILTERS: FilterOption[] = ['All', 'market', 'catalyst', 'macro', 'sector', 'alert'];

const FILTER_LABELS: Record<FilterOption, string> = {
  All: 'All',
  market: 'Market',
  catalyst: 'Catalyst',
  macro: 'Macro',
  sector: 'Sector',
  alert: 'Alert',
};

// Icon per timeline type
const TYPE_ICON: Record<TimelineType, React.ReactNode> = {
  market: <Globe className="w-3.5 h-3.5" />,
  catalyst: <Zap className="w-3.5 h-3.5" />,
  macro: <BarChart3 className="w-3.5 h-3.5" />,
  sector: <TrendingUp className="w-3.5 h-3.5" />,
  alert: <AlertCircle className="w-3.5 h-3.5" />,
};

// Color scheme per type
const TYPE_COLOR: Record<TimelineType, { ring: string; bg: string; text: string; line: string }> = {
  market: {
    ring: 'border-blue-500/60',
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    line: 'bg-blue-500/20',
  },
  catalyst: {
    ring: 'border-app-green/60',
    bg: 'bg-app-green/15',
    text: 'text-app-green',
    line: 'bg-app-green/20',
  },
  macro: {
    ring: 'border-yellow-500/60',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    line: 'bg-yellow-500/20',
  },
  sector: {
    ring: 'border-purple-500/60',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    line: 'bg-purple-500/20',
  },
  alert: {
    ring: 'border-app-red/60',
    bg: 'bg-app-red/15',
    text: 'text-app-red',
    line: 'bg-app-red/20',
  },
};

// Catalyst type → display label colours
const CATALYST_BADGE: Record<CatalystType, { bg: string; text: string }> = {
  Earnings: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  'Product Launch': { bg: 'bg-purple-500/15', text: 'text-purple-400' },
  Dividend: { bg: 'bg-app-green/10', text: 'text-app-green' },
  Buyback: { bg: 'bg-app-green/10', text: 'text-app-green' },
  Upgrade: { bg: 'bg-app-green/10', text: 'text-app-green' },
  Downgrade: { bg: 'bg-app-red/10', text: 'text-app-red' },
  'Market Event': { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  'Economic Data': { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  Regulatory: { bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
};

const IMPACT_COLOR: Record<string, string> = {
  High: 'text-app-red',
  Medium: 'text-yellow-400',
  Low: 'text-text-muted',
};

const SENTIMENT_COLOR: Record<string, string> = {
  Bullish: 'text-app-green',
  Bearish: 'text-app-red',
  Neutral: 'text-yellow-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

/** Get current "now" marker position among the sorted events */
function getCurrentMarkerIndex(events: TimelineEvent[]): number {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // Return index of first event after current time, -1 if after all
  const idx = events.findIndex((e) => timeToMinutes(e.time) > nowMinutes);
  if (idx === -1) return events.length; // after all events
  return idx;
}

// ─── Timeline node ────────────────────────────────────────────────────────────

interface TimelineNodeProps {
  event: TimelineEvent;
  index: number;
  isLast: boolean;
}

function TimelineNode({ event, index, isLast }: TimelineNodeProps) {
  const navigate = useNavigate();
  const colors = TYPE_COLOR[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, delay: index * 0.06, ease: 'easeOut' }}
      className="flex gap-3 group"
    >
      {/* Left: time label */}
      <div className="w-12 shrink-0 flex flex-col items-end pt-0.5">
        <span className="text-[11px] font-mono text-text-muted leading-none">
          {event.time}
        </span>
      </div>

      {/* Center: connector line + icon circle */}
      <div className="flex flex-col items-center shrink-0 w-6">
        <div
          className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${colors.bg} ${colors.ring} ${colors.text} transition-transform duration-150 group-hover:scale-110`}
        >
          {TYPE_ICON[event.type]}
        </div>
        {!isLast && (
          <div className={`w-px flex-1 mt-1 ${colors.line} min-h-[20px]`} />
        )}
      </div>

      {/* Right: label, description, symbol pill */}
      <div className="flex flex-col gap-1 pb-4 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white leading-tight">
            {event.label}
          </span>
          {event.symbol && (
            <button
              type="button"
              onClick={() => navigate(`/stock/${event.symbol}`)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all duration-150 hover:opacity-80 ${colors.bg} ${colors.ring} ${colors.text}`}
              aria-label={`View ${event.symbol} stock`}
            >
              {event.symbol}
            </button>
          )}
        </div>
        <p className="text-xs text-text-muted leading-relaxed">{event.description}</p>
      </div>
    </motion.div>
  );
}

// ─── Now marker ───────────────────────────────────────────────────────────────

function NowMarker() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex gap-3 items-center"
    >
      {/* Time */}
      <div className="w-12 shrink-0 flex items-end justify-end">
        <span className="text-[11px] font-mono text-blue-400 font-bold">{timeStr}</span>
      </div>
      {/* Dot + line */}
      <div className="flex items-center w-6 shrink-0 justify-center">
        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_2px_rgba(96,165,250,0.5)] animate-pulse" />
      </div>
      {/* Label */}
      <div className="flex items-center gap-1.5 pb-2">
        <Clock className="w-3 h-3 text-blue-400" />
        <span className="text-xs text-blue-400 font-medium">Now</span>
      </div>
    </motion.div>
  );
}

// ─── Catalyst card ────────────────────────────────────────────────────────────

interface CatalystCardProps {
  id: string;
  symbol: string;
  type: CatalystType;
  title: string;
  description: string;
  impact: string;
  sentiment: string;
  index: number;
}

function CatalystCard({
  symbol,
  type,
  title,
  description,
  impact,
  sentiment,
  index,
}: CatalystCardProps) {
  const navigate = useNavigate();
  const badge = CATALYST_BADGE[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className="glass-card border border-border-glass rounded-lg p-3 flex flex-col gap-2 hover:border-white/10 transition-colors duration-150"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          {/* Type badge */}
          <span
            className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${badge.bg} ${badge.text}`}
          >
            {type}
          </span>
          <span className="text-sm font-semibold text-white leading-tight">{title}</span>
        </div>
        {/* Symbol pill */}
        <button
          type="button"
          onClick={() => navigate(`/stock/${symbol}`)}
          className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/5 border border-border-glass text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label={`View ${symbol} stock`}
        >
          {symbol}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{description}</p>

      {/* Impact + Sentiment */}
      <div className="flex items-center gap-3 text-xs">
        <span>
          Impact:{' '}
          <span className={`font-semibold ${IMPACT_COLOR[impact] ?? 'text-text-secondary'}`}>
            {impact}
          </span>
        </span>
        <span>
          Sentiment:{' '}
          <span
            className={`font-semibold ${SENTIMENT_COLOR[sentiment] ?? 'text-text-secondary'}`}
          >
            {sentiment}
          </span>
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function CatalystTimeline() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');

  const filteredTimeline =
    activeFilter === 'All'
      ? STATIC_TIMELINE
      : STATIC_TIMELINE.filter((e) => e.type === activeFilter);

  const nowIndex = getCurrentMarkerIndex(filteredTimeline);

  const topCatalysts = STATIC_CATALYSTS.slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Timeline section ── */}
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-white">Market Timeline</h2>
          </div>
          <span className="text-xs text-text-muted">
            {filteredTimeline.length} events
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 border ${
                activeFilter === f
                  ? 'bg-white/10 border-white/20 text-white'
                  : 'bg-transparent border-border-glass text-text-muted hover:text-text-secondary hover:border-white/10'
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {filteredTimeline.map((event, i) => {
              const isLast = i === filteredTimeline.length - 1;
              const showNow = i === nowIndex;

              return (
                <React.Fragment key={event.id}>
                  {/* Insert Now marker at the right position */}
                  {showNow && (
                    <NowMarker key="now-marker" />
                  )}
                  <TimelineNode event={event} index={i} isLast={isLast && nowIndex !== filteredTimeline.length} />
                </React.Fragment>
              );
            })}
            {/* Now marker if after all events */}
            {nowIndex === filteredTimeline.length && (
              <NowMarker key="now-marker-end" />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Catalysts section ── */}
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-app-green/10 border border-app-green/20">
            <Zap className="w-4 h-4 text-app-green" />
          </div>
          <h2 className="text-base font-semibold text-white">Top Catalysts</h2>
          <span className="text-xs text-text-muted ml-auto">Today</span>
        </div>

        <div className="flex flex-col gap-2">
          {topCatalysts.map((cat, i) => (
            <CatalystCard
              key={cat.id}
              id={cat.id}
              symbol={cat.symbol}
              type={cat.type}
              title={cat.title}
              description={cat.description}
              impact={cat.impact}
              sentiment={cat.sentiment}
              index={i}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
