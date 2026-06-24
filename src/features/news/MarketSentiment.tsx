import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { STATIC_ARTICLES, SECTOR_SENTIMENT } from '../../store/NewsStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function fearGreedLabel(score: number): string {
  if (score < 25) return 'Extreme Fear';
  if (score < 50) return 'Fear';
  if (score < 75) return 'Greed';
  return 'Extreme Greed';
}

function fearGreedColor(score: number): string {
  if (score < 25) return '#ef4444'; // red
  if (score < 50) return '#f97316'; // orange
  if (score < 75) return '#eab308'; // yellow
  return '#22c55e'; // green
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────
// Half-circle: viewBox 0 0 200 110, arc radius 90, center (100,100)
// Arc spans 180°: from left (180°) to right (0°)

const GAUGE_CX = 100;
const GAUGE_CY = 100;
const GAUGE_R = 82;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

// Arc zones: score 0→100 mapped to -90°→+90° (i.e. 180° → 360° in standard)
// We draw arcs from -90° (left) to +90° (right) as: 180° → 0° in our helper
// Zone boundaries in degrees (from left = 180° to right = 360° / 0°)
// score 0=180°, 25=225°, 50=270°, 75=315°, 100=360°

function scoreToAngle(score: number): number {
  // Map 0–100 → 180°–360°
  return 180 + (score / 100) * 180;
}

const ZONE_ARCS = [
  { from: 0, to: 25, color: '#ef4444' },   // Extreme Fear – red
  { from: 25, to: 50, color: '#f97316' },  // Fear – orange
  { from: 50, to: 75, color: '#eab308' },  // Greed – yellow
  { from: 75, to: 100, color: '#22c55e' }, // Extreme Greed – green
];

function GaugeSVG({ score }: { score: number }) {
  const needleAngleDeg = 180 + (clamp(score, 0, 100) / 100) * 180; // 180–360
  // Convert to CSS rotate angle where 0° = 12 o'clock; needle points to 6 o'clock at 0% (left)
  // We'll rotate the needle line around the center.
  // Needle: starts at center, points outward at needleAngleDeg (standard polar)
  const needlePolarRad = ((needleAngleDeg - 90) * Math.PI) / 180;
  const needleTipX = GAUGE_CX + (GAUGE_R - 10) * Math.cos(needlePolarRad);
  const needleTipY = GAUGE_CY + (GAUGE_R - 10) * Math.sin(needlePolarRad);
  const color = fearGreedColor(score);

  return (
    <svg viewBox="0 0 200 110" className="w-full max-w-[280px]" aria-label="Fear & Greed Gauge">
      {/* Track */}
      <path
        d={describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, 180, 360)}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Colored zone arcs */}
      {ZONE_ARCS.map((zone) => (
        <path
          key={zone.from}
          d={describeArc(
            GAUGE_CX,
            GAUGE_CY,
            GAUGE_R,
            scoreToAngle(zone.from),
            scoreToAngle(zone.to)
          )}
          fill="none"
          stroke={zone.color}
          strokeWidth="14"
          strokeLinecap="butt"
          opacity="0.35"
        />
      ))}

      {/* Active arc up to score */}
      {score > 0 && (
        <path
          d={describeArc(GAUGE_CX, GAUGE_CY, GAUGE_R, 180, scoreToAngle(clamp(score, 0, 100)))}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.85"
        />
      )}

      {/* Needle */}
      <line
        x1={GAUGE_CX}
        y1={GAUGE_CY}
        x2={needleTipX}
        y2={needleTipY}
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Needle base dot */}
      <circle cx={GAUGE_CX} cy={GAUGE_CY} r="5" fill={color} opacity="0.9" />

      {/* Score text */}
      <text
        x={GAUGE_CX}
        y={GAUGE_CY - 18}
        textAnchor="middle"
        fill={color}
        fontSize="22"
        fontWeight="700"
        fontFamily="inherit"
      >
        {Math.round(score)}
      </text>
      <text
        x={GAUGE_CX}
        y={GAUGE_CY - 4}
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize="8"
        fontFamily="inherit"
      >
        {fearGreedLabel(score).toUpperCase()}
      </text>
    </svg>
  );
}

// ─── Sentiment Bar ────────────────────────────────────────────────────────────

function SentimentBar({
  label,
  pct,
  count,
  color,
  icon,
}: {
  label: string;
  pct: number;
  count: number;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-text-secondary font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted">{count}</span>
          <span className={`font-semibold ${color}`}>{pct.toFixed(0)}%</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: 'currentColor' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div
            className="h-full w-full rounded-full"
            style={{
              backgroundColor:
                label === 'Bullish'
                  ? 'var(--app-green, #22c55e)'
                  : label === 'Bearish'
                    ? 'var(--app-red, #ef4444)'
                    : 'rgba(255,255,255,0.4)',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MarketSentiment() {
  const { stocks } = useMarketStore();

  const newsSentiment = useMemo(() => {
    const total = STATIC_ARTICLES.length;
    const bullishCount = STATIC_ARTICLES.filter((a) => a.sentiment === 'Bullish').length;
    const neutralCount = STATIC_ARTICLES.filter((a) => a.sentiment === 'Neutral').length;
    const bearishCount = STATIC_ARTICLES.filter((a) => a.sentiment === 'Bearish').length;
    const bullishPct = total > 0 ? (bullishCount / total) * 100 : 0;
    const neutralPct = total > 0 ? (neutralCount / total) * 100 : 0;
    const bearishPct = total > 0 ? (bearishCount / total) * 100 : 0;
    return { total, bullishCount, neutralCount, bearishCount, bullishPct, neutralPct, bearishPct };
  }, []);

  const stockSentiment = useMemo(() => {
    const total = stocks.length;
    if (total === 0) return { advancing: 0, unchanged: 0, declining: 0, advancingPct: 0 };
    const advancing = stocks.filter((s) => s.changePercent > 0).length;
    const declining = stocks.filter((s) => s.changePercent < 0).length;
    const unchanged = total - advancing - declining;
    return {
      advancing,
      unchanged,
      declining,
      advancingPct: (advancing / total) * 100,
    };
  }, [stocks]);

  const fearGreed = useMemo(() => {
    const score =
      newsSentiment.bullishPct * 0.6 + stockSentiment.advancingPct * 0.4;
    return clamp(score, 0, 100);
  }, [newsSentiment.bullishPct, stockSentiment.advancingPct]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-app-green" />
        <h2 className="text-sm font-semibold text-white">Market Sentiment</h2>
      </div>

      {/* Fear & Greed Gauge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="glass-card border border-border-glass rounded-xl p-5 flex flex-col items-center gap-2"
      >
        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
          Fear &amp; Greed Index
        </p>
        <GaugeSVG score={fearGreed} />
        <div className="flex items-center justify-between w-full mt-1 text-[10px] text-text-muted">
          <span>Extreme Fear</span>
          <span>Fear</span>
          <span>Greed</span>
          <span>Extreme Greed</span>
        </div>
      </motion.div>

      {/* Market breadth bars */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-card border border-border-glass rounded-xl p-4 flex flex-col gap-3"
      >
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          Market Breadth
        </p>
        <SentimentBar
          label="Bullish"
          pct={(stockSentiment.advancing / Math.max(stocks.length, 1)) * 100}
          count={stockSentiment.advancing}
          color="text-app-green"
          icon={<TrendingUp size={13} className="text-app-green" />}
        />
        <SentimentBar
          label="Neutral"
          pct={(stockSentiment.unchanged / Math.max(stocks.length, 1)) * 100}
          count={stockSentiment.unchanged}
          color="text-text-muted"
          icon={<Minus size={13} className="text-text-muted" />}
        />
        <SentimentBar
          label="Bearish"
          pct={(stockSentiment.declining / Math.max(stocks.length, 1)) * 100}
          count={stockSentiment.declining}
          color="text-app-red"
          icon={<TrendingDown size={13} className="text-app-red" />}
        />
      </motion.div>

      {/* News sentiment breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass-card border border-border-glass rounded-xl p-4 flex flex-col gap-3"
      >
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
          News Sentiment
        </p>
        <SentimentBar
          label="Bullish"
          pct={newsSentiment.bullishPct}
          count={newsSentiment.bullishCount}
          color="text-app-green"
          icon={<TrendingUp size={13} className="text-app-green" />}
        />
        <SentimentBar
          label="Neutral"
          pct={newsSentiment.neutralPct}
          count={newsSentiment.neutralCount}
          color="text-text-muted"
          icon={<Minus size={13} className="text-text-muted" />}
        />
        <SentimentBar
          label="Bearish"
          pct={newsSentiment.bearishPct}
          count={newsSentiment.bearishCount}
          color="text-app-red"
          icon={<TrendingDown size={13} className="text-app-red" />}
        />
        <p className="text-[10px] text-text-muted mt-0.5">
          Based on {newsSentiment.total} articles
        </p>
      </motion.div>

      {/* Sector sentiment table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="glass-card border border-border-glass rounded-xl p-4 flex flex-col gap-2"
      >
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-1">
          Sector Breakdown
        </p>
        {SECTOR_SENTIMENT.map((s) => (
          <div key={s.sector} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-[11px] text-text-secondary truncate">
              {s.sector}
            </span>
            <div className="flex-1 flex gap-0.5 h-2 rounded-full overflow-hidden">
              <div
                className="bg-app-green opacity-70 transition-all duration-700"
                style={{ width: `${s.bullishPct}%` }}
              />
              <div
                className="bg-white/30 transition-all duration-700"
                style={{ width: `${s.neutralPct}%` }}
              />
              <div
                className="bg-app-red opacity-70 transition-all duration-700"
                style={{ width: `${s.bearishPct}%` }}
              />
            </div>
            <span
              className={`w-8 text-right text-[10px] font-semibold ${
                s.bullishPct > s.bearishPct ? 'text-app-green' : 'text-app-red'
              }`}
            >
              {s.bullishPct}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
