import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, BarChart2 } from 'lucide-react';
import type { Stock } from '../../services/mockDataEngine';
import { computeMarketContext } from './screenerUtils';

interface Props {
  allStocks: Stock[];
}

export const ScreenerMarketContext: React.FC<Props> = ({ allStocks }) => {
  const ctx = useMemo(() => computeMarketContext(allStocks), [allStocks]);

  const regimeConfig = {
    'Risk-On': {
      color: 'text-app-green',
      bg: 'bg-app-green/10',
      border: 'border-app-green/30',
      icon: TrendingUp,
      pulse: 'animate-pulse-emerald',
    },
    'Risk-Off': {
      color: 'text-app-red',
      bg: 'bg-app-red/10',
      border: 'border-app-red/30',
      icon: TrendingDown,
      pulse: 'animate-pulse-crimson',
    },
    Neutral: {
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/30',
      icon: Minus,
      pulse: '',
    },
  } as const;

  const regime = ctx.regime as keyof typeof regimeConfig;
  const cfg = regimeConfig[regime] ?? regimeConfig['Neutral'];
  const RegimeIcon = cfg.icon;

  const fearGreedColor =
    ctx.fearGreed >= 75 ? 'text-app-green' :
    ctx.fearGreed >= 51 ? 'text-yellow-300' :
    ctx.fearGreed >= 26 ? 'text-orange-400' :
    'text-app-red';

  const breadthColor =
    ctx.breadthPct >= 60 ? 'text-app-green' :
    ctx.breadthPct >= 45 ? 'text-yellow-300' :
    'text-app-red';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl border border-border-glass bg-surface-low/40 backdrop-blur-glass"
    >
      <div className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase font-bold tracking-widest">
        <Zap className="w-3 h-3 text-app-green" />
        Market Context
      </div>

      <div className="h-4 w-px bg-border-glass" />

      {/* Market Regime */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${cfg.bg} ${cfg.border} ${cfg.color} ${cfg.pulse}`}>
        <RegimeIcon className="w-3 h-3" />
        <span>Market: {ctx.regime}</span>
      </div>

      {/* Fear & Greed */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-text-muted font-semibold">Fear & Greed</span>
        <span className={`text-[13px] font-bold font-mono ${fearGreedColor}`}>{ctx.fearGreed}</span>
        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: ctx.fearGreed >= 75 ? '#00FF94' :
                          ctx.fearGreed >= 51 ? '#FBBF24' :
                          ctx.fearGreed >= 26 ? '#FB923C' : '#FF3B5C',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${ctx.fearGreed}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="h-4 w-px bg-border-glass" />

      {/* Breadth */}
      <div className="flex items-center gap-1.5">
        <BarChart2 className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-[10px] text-text-muted font-semibold">Breadth</span>
        <span className={`text-[13px] font-bold font-mono ${breadthColor}`}>{ctx.breadthPct}%</span>
        <span className="text-[10px] text-text-muted">Advancing</span>
      </div>

      <div className="h-4 w-px bg-border-glass" />

      {/* Sector Leader */}
      <div className="flex items-center gap-1.5">
        <TrendingUp className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-[10px] text-text-muted font-semibold">Leading Sector</span>
        <span className="text-[11px] font-bold text-white bg-app-green/10 border border-app-green/20 px-2 py-0.5 rounded-full">
          {ctx.sectorLeader}
        </span>
      </div>
    </motion.div>
  );
};
