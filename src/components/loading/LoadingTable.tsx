import React from 'react';

interface LoadingTableProps {
  rows?: number;
  cols?: number;
}

export const LoadingTable: React.FC<LoadingTableProps> = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="glass-card border border-border-glass rounded-xl p-4 animate-pulse flex flex-col gap-3.5 w-full">
      {/* Table Head */}
      <div className="flex gap-4 pb-2 border-b border-border-glass">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-3.5 bg-white/10 rounded-md" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-1.5 border-b border-white/[0.02]">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="flex-1 h-3 bg-white/5 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingTable;
