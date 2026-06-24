import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown, Activity, BarChart2, Building2, DollarSign } from 'lucide-react';
import type { Stock } from '../../services/mockDataEngine';
import { computeSectorDistribution, fmtMarketCap, fmtVolume } from './screenerUtils';

interface Props {
  filteredStocks: Stock[];
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-4 border border-border-glass flex flex-col gap-2 min-w-[120px]">
      <div className="h-3 w-16 bg-white/5 rounded animate-pulse" />
      <div className="h-6 w-24 bg-white/8 rounded animate-pulse" />
      <div className="h-2 w-12 bg-white/5 rounded animate-pulse" />
    </div>
  );
}

export const ScreenerStatsBar: React.FC<Props> = ({ filteredStocks, isLoading }) => {
  const stats = useMemo(() => {
    if (filteredStocks.length === 0) {
      return { count: 0, avgChange: 0, avgVolume: 0, avgBeta: 0, dominantSector: '—', largestCap: null as Stock | null };
    }
    const count = filteredStocks.length;
    const avgChange = filteredStocks.reduce((s, x) => s + x.changePercent, 0) / count;
    const avgVolume = filteredStocks.reduce((s, x) => s + x.volume, 0) / count;
    const avgBeta = filteredStocks.reduce((s, x) => s + x.beta, 0) / count;

    const sectorCounts: Record<string, number> = {};
    filteredStocks.forEach((s) => { sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1; });
    const dominantSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    const largestCap = [...filteredStocks].sort((a, b) => b.marketCap - a.marketCap)[0] ?? null;

    return { count, avgChange, avgVolume, avgBeta, dominantSector, largestCap };
  }, [filteredStocks]);

  const sectorDist = useMemo(() => computeSectorDistribution(filteredStocks), [filteredStocks]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  const cards = [
    {
      label: 'Matching Stocks',
      value: <CountUp key={stats.count} end={stats.count} duration={0.6} separator="," />,
      sub: 'candidates',
      icon: Activity,
      color: 'text-app-green',
    },
    {
      label: 'Avg Change',
      value: (
        <span className={stats.avgChange >= 0 ? 'text-app-green' : 'text-app-red'}>
          {stats.avgChange >= 0 ? '+' : ''}<CountUp key={stats.avgChange} end={stats.avgChange} duration={0.5} decimals={2} />%
        </span>
      ),
      sub: 'today',
      icon: stats.avgChange >= 0 ? TrendingUp : TrendingDown,
      color: stats.avgChange >= 0 ? 'text-app-green' : 'text-app-red',
    },
    {
      label: 'Avg Volume',
      value: <span className="text-white">{fmtVolume(Math.round(stats.avgVolume))}</span>,
      sub: 'shares/day',
      icon: BarChart2,
      color: 'text-blue-400',
    },
    {
      label: 'Avg Beta',
      value: (
        <span className={stats.avgBeta > 1.3 ? 'text-app-red' : stats.avgBeta < 0.8 ? 'text-app-green' : 'text-yellow-400'}>
          <CountUp key={stats.avgBeta} end={stats.avgBeta} duration={0.5} decimals={2} />
        </span>
      ),
      sub: stats.avgBeta > 1.3 ? 'High Risk' : stats.avgBeta < 0.8 ? 'Low Risk' : 'Moderate',
      icon: Activity,
      color: stats.avgBeta > 1.3 ? 'text-app-red' : 'text-app-green',
    },
    {
      label: 'Dominant Sector',
      value: <span className="text-white text-sm">{stats.dominantSector}</span>,
      sub: 'by count',
      icon: Building2,
      color: 'text-purple-400',
    },
    {
      label: 'Largest Cap',
      value: <span className="text-white">{stats.largestCap ? fmtMarketCap(stats.largestCap.marketCap) : '—'}</span>,
      sub: stats.largestCap?.symbol ?? '',
      icon: DollarSign,
      color: 'text-app-green',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="glass-card rounded-2xl p-4 border border-border-glass hover:border-white/15 transition-colors duration-200"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">{card.label}</span>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums">{card.value}</div>
              <div className="text-[10px] text-text-muted mt-0.5">{card.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Sector Distribution Bar */}
      {sectorDist.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="glass-card rounded-2xl px-4 py-3 border border-border-glass"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Sector Distribution</span>
            <span className="text-[9px] text-text-muted">({filteredStocks.length} stocks)</span>
          </div>
          <div className="space-y-2">
            {sectorDist.map((entry) => (
              <div key={entry.sector} className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted w-24 truncate">{entry.displayName}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: entry.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${entry.pct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-white w-8 text-right">{entry.pct}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
