import React from 'react';

export const CardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-5 animate-pulse space-y-3">
    <div className="h-2.5 w-24 bg-white/10 rounded-full" />
    <div className="h-6 w-36 bg-white/15 rounded-full" />
    <div className="h-2.5 w-16 bg-white/10 rounded-full" />
  </div>
);

export const ChartPlaceholderSkeleton: React.FC<{ type: 'donut' | 'line' }> = ({ type }) => {
  if (type === 'donut') {
    return (
      <div className="glass-card rounded-2xl p-6 border border-border-glass flex flex-col items-center justify-center min-h-[300px] animate-pulse">
        <div className="h-3.5 w-32 bg-white/10 rounded-full mb-8 self-start" />
        <div className="relative w-40 h-40 rounded-full border-12 border-white/5 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-white/10" />
        </div>
        <div className="flex gap-4 mt-8">
          <div className="h-2.5 w-12 bg-white/10 rounded-full" />
          <div className="h-2.5 w-12 bg-white/10 rounded-full" />
          <div className="h-2.5 w-12 bg-white/10 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-border-glass animate-pulse space-y-6 min-h-[320px]">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-3.5 w-40 bg-white/10 rounded-full" />
          <div className="h-2.5 w-60 bg-white/5 rounded-full" />
        </div>
        <div className="h-8 w-24 bg-white/10 rounded-xl" />
      </div>
      <div className="h-44 w-full flex items-end gap-1.5 pt-4">
        {Array.from({ length: 24 }).map((_, i) => {
          const height = 20 + Math.sin(i * 0.5) * 15 + Math.cos(i * 0.8) * 10 + 20; // synthetic wave shape
          return (
            <div
              key={i}
              className="flex-1 bg-white/5 rounded-t"
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl overflow-hidden border border-border-glass animate-pulse">
    <div className="p-5 border-b border-border-glass flex justify-between items-center">
      <div className="h-3 w-40 bg-white/10 rounded-full" />
      <div className="h-7 w-20 bg-white/10 rounded-lg" />
    </div>
    <div className="p-5 space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0">
          <div className="space-y-1.5">
            <div className="h-3 w-16 bg-white/15 rounded-full" />
            <div className="h-2.5 w-12 bg-white/5 rounded-full" />
          </div>
          <div className="h-3 w-12 bg-white/10 rounded-full" />
          <div className="h-3 w-20 bg-white/10 rounded-full" />
          <div className="h-3.5 w-8 bg-white/10 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export const DrawdownChartSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl p-6 border border-border-glass animate-pulse space-y-6 min-h-[220px]">
    <div className="space-y-2">
      <div className="h-3.5 w-32 bg-white/10 rounded-full" />
      <div className="h-2.5 w-52 bg-white/5 rounded-full" />
    </div>
    <div className="h-28 w-full flex items-start gap-1.5 pt-4">
      {Array.from({ length: 24 }).map((_, i) => {
        // Drawdown goes downwards
        const height = 10 + Math.sin(i * 0.3) * 12 + Math.random() * 8; 
        return (
          <div
            key={i}
            className="flex-1 bg-red-500/5 rounded-b"
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  </div>
);
