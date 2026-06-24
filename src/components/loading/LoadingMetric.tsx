import React from 'react';

export const LoadingMetric: React.FC = () => {
  return (
    <div className="flex flex-col gap-1.5 animate-pulse">
      <div className="h-3 w-16 bg-white/5 rounded" />
      <div className="h-6 w-24 bg-white/10 rounded font-mono" />
      <div className="h-3 w-12 bg-white/5 rounded" />
    </div>
  );
};

export default LoadingMetric;
