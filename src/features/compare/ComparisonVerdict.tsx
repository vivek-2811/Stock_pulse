import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scale, Sparkles, TrendingUp, ShieldAlert, Award } from 'lucide-react';
import type { Stock } from '../../services/mockDataEngine';
import { ScoreEngine } from '../../services/ScoreEngine';

interface Props {
  stocks: Stock[];
}

export const ComparisonVerdict: React.FC<Props> = ({ stocks }) => {
  const verdicts = useMemo(() => {
    if (stocks.length < 2) return null;

    const scored = stocks.map(s => {
      const opp = ScoreEngine.computeOpportunityScore(s);
      const factors = ScoreEngine.computeFactorScores(s);
      return { stock: s, opp, factors };
    });

    const bestGrowth = scored.reduce((a, b) => a.factors.growth > b.factors.growth ? a : b).stock;
    const bestValue = scored.reduce((a, b) => a.factors.value > b.factors.value ? a : b).stock;
    const bestDefensive = scored.reduce((a, b) => a.factors.safety > b.factors.safety ? a : b).stock;
    const bestOverall = scored.reduce((a, b) => a.opp > b.opp ? a : b).stock;

    return { bestGrowth, bestValue, bestDefensive, bestOverall };
  }, [stocks]);

  if (!verdicts) return null;

  const cards = [
    { label: 'Best Growth Pick', stock: verdicts.bestGrowth, icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { label: 'Best Value Pick', stock: verdicts.bestValue, icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Best Defensive Pick', stock: verdicts.bestDefensive, icon: ShieldAlert, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Best Overall Pick', stock: verdicts.bestOverall, icon: Award, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
  ];

  return (
    <div className="glass-card rounded-2xl p-4 border border-border-glass bg-white/[0.01]">
      <div className="pb-2 border-b border-border-glass/40 mb-3 flex items-center gap-1.5">
        <Scale className="w-4 h-4 text-indigo-400" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Comparison Verdict Cards</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${c.color}`}
            >
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70 mb-0.5">{c.label}</span>
                <span className="text-base font-bold font-mono text-white block">{c.stock.symbol}</span>
                <span className="text-[10px] text-text-muted truncate block">{c.stock.name}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] font-mono font-bold text-white/95">
                <span>Price: ${c.stock.price.toFixed(2)}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default ComparisonVerdict;
