import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Activity, Sparkles, AlertCircle } from 'lucide-react';
import type { InsightData } from './CopilotStore';

interface Props {
  insight: InsightData;
  index: number;
}

export const CopilotInsightCard: React.FC<Props> = ({ insight, index }) => {
  const getStyle = () => {
    switch (insight.type) {
      case 'opportunity':
        return {
          bg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          icon: Sparkles,
          iconColor: 'text-emerald-400'
        };
      case 'risk':
        return {
          bg: 'bg-red-500/5 hover:bg-red-500/10 border-red-500/20 text-red-400',
          icon: AlertTriangle,
          iconColor: 'text-red-400'
        };
      case 'alert':
        return {
          bg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 text-amber-400',
          icon: AlertCircle,
          iconColor: 'text-amber-400'
        };
      case 'trend':
        return {
          bg: 'bg-sky-500/5 hover:bg-sky-500/10 border-sky-500/20 text-sky-400',
          icon: TrendingUp,
          iconColor: 'text-sky-400'
        };
      default:
        return {
          bg: 'bg-white/[0.02] hover:bg-white/[0.04] border-border-glass text-white',
          icon: Activity,
          iconColor: 'text-text-muted'
        };
    }
  };

  const { bg, icon: Icon, iconColor } = getStyle();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`p-3 rounded-xl border backdrop-blur-glass flex items-start gap-2.5 transition-all duration-300 ${bg}`}
    >
      <div className={`p-1.5 rounded-lg bg-white/5 border border-white/5 shrink-0 mt-0.5 ${iconColor}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{insight.title}</span>
          {insight.value && (
            <span className="text-xs font-mono font-bold leading-none">{insight.value}</span>
          )}
        </div>
        <p className="text-[11px] leading-normal text-text-secondary">{insight.description}</p>
      </div>
    </motion.div>
  );
};
export default CopilotInsightCard;
