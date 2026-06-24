import React from 'react';
import { motion } from 'framer-motion';

export interface MetricItem {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

interface Props {
  metrics: MetricItem[];
}

export const CopilotMetricGrid: React.FC<Props> = ({ metrics }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2"
    >
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="p-3 bg-white/[0.02] border border-border-glass rounded-xl backdrop-blur-glass flex flex-col justify-between gap-1.5"
        >
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider block truncate">{m.label}</span>
          <div>
            <span className={`text-base font-bold font-mono ${m.color ?? 'text-white'}`}>{m.value}</span>
            {m.sub && (
              <p className="text-[9px] text-text-muted mt-0.5 truncate">{m.sub}</p>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
};
export default CopilotMetricGrid;
