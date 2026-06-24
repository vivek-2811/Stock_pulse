import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { ConfidenceLevel } from '../../store/useCopilotStore';

interface Props {
  level: ConfidenceLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const CONFIG: Record<ConfidenceLevel, {
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentType<{ className?: string }>;
  bars: number;
}> = {
  High: {
    color: 'text-app-green',
    bg: 'bg-app-green/10',
    border: 'border-app-green/30',
    icon: ShieldCheck,
    bars: 3,
  },
  Medium: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    icon: ShieldAlert,
    bars: 2,
  },
  Low: {
    color: 'text-text-muted',
    bg: 'bg-white/5',
    border: 'border-border-glass',
    icon: ShieldX,
    bars: 1,
  },
};

export const ConfidenceBadge: React.FC<Props> = ({ level, showLabel = true, size = 'sm' }) => {
  const cfg = CONFIG[level];
  const Icon = cfg.icon;
  const isLg = size === 'md';

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <Icon className={`${isLg ? 'w-3.5 h-3.5' : 'w-3 h-3'} ${cfg.color}`} />
      {/* Signal bars */}
      <div className="flex items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={`rounded-sm transition-colors ${isLg ? 'w-1' : 'w-0.5'}`}
            style={{
              height: isLg ? `${bar * 5}px` : `${bar * 3}px`,
              backgroundColor: bar <= cfg.bars ? (cfg.color.replace('text-', '').includes('green') ? '#00FF94' : cfg.color.includes('yellow') ? '#FBBF24' : '#6B7280') : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
      {showLabel && (
        <span className={`${isLg ? 'text-[11px]' : 'text-[10px]'} font-bold ${cfg.color}`}>
          {level} Confidence
        </span>
      )}
    </div>
  );
};
