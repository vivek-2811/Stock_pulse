import React from 'react';

interface LoadingCardProps {
  className?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ className = '' }) => {
  return (
    <div className={`glass-card border border-border-glass rounded-xl p-4 animate-pulse flex flex-col gap-3 ${className}`}>
      <div className="h-4 w-1/3 bg-white/5 rounded-md" />
      <div className="h-8 w-2/3 bg-white/10 rounded-md" />
      <div className="h-3 w-full bg-white/5 rounded-md" />
      <div className="h-3 w-4/5 bg-white/5 rounded-md" />
    </div>
  );
};

export default LoadingCard;
