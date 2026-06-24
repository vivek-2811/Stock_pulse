import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { X, Star, StarOff, TrendingUp, TrendingDown, ExternalLink, CheckCircle } from 'lucide-react';
import type { Stock } from '../../services/mockDataEngine';
import type { ScreenerFilterState } from '../../store/SavedScreensStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { computeOpportunityScore, computeWhyPassed, fmtMarketCap, fmtVolume, SECTOR_COLORS } from './screenerUtils';

interface Props {
  stock: Stock | null;
  filters: ScreenerFilterState;
  onClose: () => void;
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 200;
  const H = 48;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(' ');

  const color = positive ? '#00FF94' : '#FF3B5C';
  const fillId = `spark-fill-${positive ? 'g' : 'r'}`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${H} ${pts} ${W},${H}`}
        fill={`url(#${fillId})`}
      />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export const ScreenerQuickPreview: React.FC<Props> = ({ stock, filters, onClose }) => {
  const navigate = useNavigate();
  const { watchlists, activeListId, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const activeWatchlist = watchlists.find((w) => w.id === activeListId);
  const isWatched = stock ? (activeWatchlist?.symbols.includes(stock.symbol) ?? false) : false;
  const panelRef = useRef<HTMLDivElement>(null);

  const score = stock ? computeOpportunityScore(stock) : 0;
  const reasons = stock ? computeWhyPassed(stock, filters) : [];

  const toggleWatchlist = () => {
    if (!stock) return;
    if (isWatched) removeFromWatchlist(activeListId, stock.symbol);
    else addToWatchlist(activeListId, stock.symbol);
  };

  if (!stock) return null;

  const isUp = stock.changePercent >= 0;
  const range52 = stock.high52W - stock.low52W;
  const rangePct = range52 > 0 ? ((stock.price - stock.low52W) / range52) * 100 : 50;
  const scoreColor = score >= 70 ? '#00FF94' : score >= 40 ? '#FBBF24' : '#FF3B5C';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stock.symbol}
        ref={panelRef}
        layout
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-72 shrink-0 glass-card rounded-2xl border border-border-glass flex flex-col overflow-hidden bg-surface-low/60"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border-glass">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">{stock.symbol}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ color: SECTOR_COLORS[stock.sector] ?? '#8A8F98', backgroundColor: `${SECTOR_COLORS[stock.sector] ?? '#8A8F98'}18` }}
              >
                {stock.sector.replace('Communication Services', 'Comm.')}
              </span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5 leading-snug">{stock.name}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Price + Sparkline */}
        <div className="p-4 border-b border-border-glass space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xl font-bold text-white font-mono">${stock.price.toFixed(2)}</span>
              <span className={`ml-2 text-sm font-bold ${isUp ? 'text-app-green' : 'text-app-red'}`}>
                {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border"
              style={{ color: scoreColor, borderColor: `${scoreColor}40`, backgroundColor: `${scoreColor}15` }}
            >
              {score}
            </div>
          </div>
          <MiniSparkline data={stock.sparkline} positive={isUp} />
        </div>

        {/* Metrics */}
        <div className="p-4 space-y-3 border-b border-border-glass">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Mkt Cap', value: fmtMarketCap(stock.marketCap) },
              { label: 'Volume', value: fmtVolume(stock.volume) },
              { label: 'Beta', value: stock.beta.toFixed(2) },
              { label: 'P/E Ratio', value: stock.peRatio.toFixed(1) },
              { label: 'Div Yield', value: stock.dividendYield > 0 ? `${stock.dividendYield.toFixed(2)}%` : '—' },
              { label: 'EPS', value: `$${stock.eps.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] text-text-muted uppercase tracking-wider">{label}</p>
                <p className="text-xs font-bold text-white font-mono mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* 52W Range */}
          <div>
            <div className="flex justify-between text-[9px] text-text-muted mb-1">
              <span>52W Low ${stock.low52W.toFixed(0)}</span>
              <span>52W High ${stock.high52W.toFixed(0)}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-app-green"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, rangePct)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Why This Passed */}
        {reasons.length > 0 && (
          <div className="p-4 border-b border-border-glass">
            <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2">Why This Passed</p>
            <div className="space-y-1.5">
              {reasons.map((reason, i) => (
                <motion.div
                  key={reason}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-app-green shrink-0" />
                  <span className="text-[11px] text-on-surface">{reason}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex gap-2 mt-auto">
          <button
            onClick={toggleWatchlist}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-colors flex-1 justify-center ${
              isWatched
                ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20'
                : 'border-border-glass text-text-muted hover:text-white hover:border-white/20'
            }`}
          >
            {isWatched ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
            {isWatched ? 'Watching' : 'Watch'}
          </button>
          <button
            onClick={() => navigate(`/stock/${stock.symbol}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-app-green/30 bg-app-green/10 text-app-green text-[11px] font-bold hover:bg-app-green/20 transition-colors flex-1 justify-center"
          >
            Full Details <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
