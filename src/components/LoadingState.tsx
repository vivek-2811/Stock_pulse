import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-5 animate-pulse border border-gray-200/50 dark:border-zinc-800/80">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-gray-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-6 w-24 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-800 rounded-full" />
    </div>
  );
};

export const SparklineSkeleton: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-5 animate-pulse border border-gray-200/50 dark:border-zinc-800/80 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="h-3.5 w-20 bg-gray-200 dark:bg-zinc-800 rounded-full" />
          <div className="h-5 w-24 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <div className="h-4 w-12 bg-gray-200 dark:bg-zinc-800 rounded-full" />
      </div>
      <div className="h-10 w-full bg-gray-200/40 dark:bg-zinc-800/40 rounded-lg mt-3" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full glass-card rounded-2xl border border-gray-200/50 dark:border-zinc-800/80 overflow-hidden animate-pulse">
      <div className="h-12 bg-gray-100/55 dark:bg-zinc-850/50 border-b border-gray-200 dark:border-zinc-800" />
      <div className="divide-y divide-gray-100 dark:divide-zinc-800/70">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-16 flex items-center px-6 gap-4">
            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-16 bg-gray-200 dark:bg-zinc-800 rounded-full" />
              <div className="h-3 w-28 bg-gray-205 dark:bg-zinc-850 rounded-full" />
            </div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-800 rounded-full" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="glass-card bg-zinc-950/20 border border-zinc-900 backdrop-blur-md rounded-2xl p-6 flex flex-col justify-between h-[340px] overflow-hidden relative">
      {/* Shimmer background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

      <div className="flex justify-between items-center pb-4 border-b border-zinc-900 relative z-10">
        <div className="space-y-2 animate-pulse">
          <div className="h-4.5 w-32 bg-zinc-800 rounded-full" />
          <div className="h-3 w-48 bg-zinc-850 rounded-full" />
        </div>
        <div className="flex gap-2 animate-pulse">
          <div className="h-8 w-14 bg-zinc-800 rounded-lg" />
          <div className="h-8 w-10 bg-zinc-800 rounded-lg" />
          <div className="h-8 w-24 bg-zinc-800 rounded-lg" />
        </div>
      </div>

      {/* Grid lines layout representation */}
      <div className="absolute inset-x-6 top-24 bottom-6 flex flex-col justify-between pointer-events-none opacity-40">
        <div className="border-b border-dashed border-zinc-800/40 w-full" />
        <div className="border-b border-dashed border-zinc-800/40 w-full" />
        <div className="border-b border-dashed border-zinc-800/40 w-full" />
        <div className="border-b border-dashed border-zinc-800/40 w-full" />
      </div>

      <div className="flex-1 flex items-end gap-1.5 pt-12 pb-2 relative z-10">
        {Array.from({ length: 32 }).map((_, idx) => {
          const height = 15 + Math.sin(idx * 0.3) * 35 + Math.cos(idx * 0.7) * 20 + 30; // organic wave shape
          const delay = idx * 0.015;
          return (
            <div
              key={idx}
              className="flex-1 bg-zinc-850 rounded-t-sm opacity-0 animate-[revealUp_0.5s_ease-out_forwards]"
              style={{ 
                height: `${height}%`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
