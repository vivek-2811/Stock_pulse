import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { X, TrendingUp, TrendingDown, Scale, Trophy, Shield, Building2, Zap } from 'lucide-react';
import type { Stock } from '../../services/mockDataEngine';
import { computeOpportunityScore, fmtMarketCap, fmtVolume } from './screenerUtils';

interface Props {
  selectedSymbols: string[];
  allStocks: Stock[];
  onClear: () => void;
}

export const ScreenerCompareDrawer: React.FC<Props> = ({ selectedSymbols, allStocks, onClear }) => {
  const navigate = useNavigate();

  const selected = useMemo(
    () => selectedSymbols.map((sym) => allStocks.find((s) => s.symbol === sym)).filter(Boolean) as Stock[],
    [selectedSymbols, allStocks]
  );

  const scored = useMemo(() =>
    selected.map((s) => ({ ...s, score: computeOpportunityScore(s) })),
    [selected]
  );

  if (scored.length < 2) return null;

  // Badge assignments
  const maxMomentum = Math.max(...scored.map((s) => s.changePercent));
  const minBeta = Math.min(...scored.map((s) => s.beta));
  const maxCap = Math.max(...scored.map((s) => s.marketCap));
  const maxScore = Math.max(...scored.map((s) => s.score));

  const getBadges = (s: typeof scored[0]) => {
    const badges: { label: string; icon: React.ComponentType<any>; color: string }[] = [];
    if (s.changePercent === maxMomentum && maxMomentum > 0) badges.push({ label: 'Top Momentum', icon: TrendingUp, color: 'text-app-green' });
    if (s.beta === minBeta) badges.push({ label: 'Lowest Risk', icon: Shield, color: 'text-blue-400' });
    if (s.marketCap === maxCap) badges.push({ label: 'Largest Cap', icon: Building2, color: 'text-purple-400' });
    if (s.score === maxScore) badges.push({ label: 'Best Score', icon: Trophy, color: 'text-yellow-400' });
    return badges;
  };

  const rows = [
    { label: 'Price', render: (s: typeof scored[0]) => `$${s.price.toFixed(2)}` },
    { label: 'Change %', render: (s: typeof scored[0]) => `${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(2)}%`, color: (s: typeof scored[0]) => s.changePercent >= 0 ? 'text-app-green' : 'text-app-red' },
    { label: 'Mkt Cap', render: (s: typeof scored[0]) => fmtMarketCap(s.marketCap) },
    { label: 'Volume', render: (s: typeof scored[0]) => fmtVolume(s.volume) },
    { label: 'Beta', render: (s: typeof scored[0]) => s.beta.toFixed(2) },
    { label: 'Opp. Score', render: (s: typeof scored[0]) => `${s.score}`, color: (s: typeof scored[0]) => s.score >= 70 ? 'text-app-green' : s.score >= 40 ? 'text-yellow-400' : 'text-app-red' },
    { label: 'Sector', render: (s: typeof scored[0]) => s.sector.replace('Communication Services', 'Comm.') },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="compare-drawer"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface-lowest/97 backdrop-blur-glass border-t border-border-glass shadow-2xl"
        style={{ marginLeft: '240px' }} // account for sidebar
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          {/* Drawer header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-app-green" />
              <span className="text-sm font-bold text-white">Compare {scored.length} Stocks</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/compare?symbols=${selectedSymbols.join(',')}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-green/30 bg-app-green/10 text-app-green text-[11px] font-bold hover:bg-app-green/20 transition-colors"
              >
                <Scale className="w-3.5 h-3.5" /> Full Comparison →
              </button>
              <button onClick={onClear} className="text-text-muted hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Comparison grid */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left pr-4 pb-2 w-24">
                    <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Metric</span>
                  </th>
                  {scored.map((s) => {
                    const badges = getBadges(s);
                    return (
                      <th key={s.symbol} className="text-center pb-2 px-2 min-w-[120px]">
                        <div className="font-bold text-white text-sm">{s.symbol}</div>
                        <div className="flex flex-wrap justify-center gap-1 mt-1">
                          {badges.map((b) => {
                            const Icon = b.icon;
                            return (
                              <span key={b.label} className={`flex items-center gap-0.5 text-[9px] font-bold ${b.color}`}>
                                <Icon className="w-2.5 h-2.5" />{b.label}
                              </span>
                            );
                          })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-border-glass/30">
                    <td className="pr-4 py-2 text-[10px] text-text-muted font-semibold">{row.label}</td>
                    {scored.map((s) => (
                      <td key={s.symbol} className={`text-center py-2 text-xs font-bold font-mono ${row.color ? row.color(s) : 'text-white'}`}>
                        {row.render(s)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
