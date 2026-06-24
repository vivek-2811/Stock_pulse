import React from 'react';

export const LoadingChart: React.FC = () => {
  return (
    <div className="glass-card border border-border-glass rounded-xl p-4 animate-pulse flex flex-col gap-4 w-full h-[220px]">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-white/10 rounded" />
        <div className="h-4 w-12 bg-white/5 rounded" />
      </div>
      
      {/* Mock wave chart lines */}
      <div className="flex-1 flex items-end gap-1.5 pt-4">
        {[25, 45, 30, 60, 50, 75, 55, 90, 80, 65, 85, 95].map((h, i) => (
          <div 
            key={i} 
            className="flex-1 bg-white/5 rounded-t-sm transition-all duration-300"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingChart;
