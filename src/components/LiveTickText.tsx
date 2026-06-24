import React, { useEffect, useState, useRef } from 'react';

interface LiveTickTextProps {
  value: number;
  format?: (val: number) => string;
  className?: string;
}

export const LiveTickText: React.FC<LiveTickTextProps> = ({ 
  value, 
  format = (val) => val.toFixed(2), 
  className = '' 
}) => {
  const [flashType, setFlashType] = useState<'up' | 'down' | null>(null);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    // Check prefers-reduced-motion accessibility setting
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      prevValueRef.current = value;
      return;
    }

    if (value > prevValueRef.current) {
      setFlashType('up');
      const timer = setTimeout(() => setFlashType(null), 800);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    } else if (value < prevValueRef.current) {
      setFlashType('down');
      const timer = setTimeout(() => setFlashType(null), 800);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const flashClass = flashType === 'up' 
    ? 'bg-app-green/15 text-app-green scale-102 font-bold px-1 rounded transition-all duration-150' 
    : flashType === 'down'
      ? 'bg-app-red/15 text-app-red scale-102 font-bold px-1 rounded transition-all duration-150'
      : 'transition-all duration-300 px-1';

  return (
    <span className={`num-data font-mono tabular-nums inline-block ${flashClass} ${className}`}>
      {format(value)}
    </span>
  );
};
