import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, TrendingUp, ShieldAlert, Zap, BarChart3, Globe } from 'lucide-react';
import type { Stock } from '../../services/mockDataEngine';
import { generateInsights } from './screenerUtils';

interface Props {
  filteredStocks: Stock[];
  allStocks: Stock[];
  isLoading?: boolean;
}

const INSIGHT_ICONS = [Lightbulb, TrendingUp, ShieldAlert, Zap, Globe, BarChart3];
const INSIGHT_COLORS = [
  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'text-app-green bg-app-green/10 border-app-green/20',
  'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'text-blue-400 bg-blue-400/10 border-blue-400/20',
  'text-purple-400 bg-purple-400/10 border-purple-400/20',
  'text-app-green bg-app-green/10 border-app-green/20',
];

function InsightSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border-glass">
      <div className="w-7 h-7 rounded-lg bg-white/5 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-white/5 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export const ScreenerInsights: React.FC<Props> = ({ filteredStocks, allStocks, isLoading }) => {
  const insights = React.useMemo(
    () => generateInsights(filteredStocks, allStocks),
    [filteredStocks, allStocks]
  );

  return (
    <div className="glass-card rounded-2xl p-4 border border-border-glass">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
          <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
        </div>
        <span className="text-xs font-bold text-white">Screener Insights</span>
        <span className="ml-auto text-[9px] text-text-muted uppercase tracking-wider">Auto-generated</span>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <InsightSkeleton key={i} />)
        ) : insights.length === 0 ? (
          <p className="text-xs text-text-muted py-2 text-center">No insights — apply filters to generate analysis.</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {insights.map((insight, i) => {
              const Icon = INSIGHT_ICONS[i % INSIGHT_ICONS.length];
              const colorClass = INSIGHT_COLORS[i % INSIGHT_COLORS.length];
              const [iconCls, ...rest] = colorClass.split(' ');
              return (
                <motion.div
                  key={insight}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.07, duration: 0.3 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${rest.join(' ')}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${rest.join(' ')}`}>
                    <Icon className={`w-3.5 h-3.5 ${iconCls}`} />
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">{insight}</p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
