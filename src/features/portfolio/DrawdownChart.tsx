import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioAnalyticsStore } from '../../store/usePortfolioAnalyticsStore';

interface DrawdownChartProps {
  dates: string[];
  portfolioReturns: number[];
  isLoading?: boolean;
}

export const DrawdownChart: React.FC<DrawdownChartProps> = ({
  dates,
  portfolioReturns,
  isLoading = false,
}) => {
  const { 
    hoverIdx, 
    setHoverIdx, 
    setIsHovering 
  } = usePortfolioAnalyticsStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  useEffect(() => {
    setAnimationTrigger(prev => prev + 1);
  }, [portfolioReturns]);

  // Handle window resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 10;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (dates.length < 2 || portfolioReturns.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-border-glass h-[180px] flex items-center justify-center text-xs text-text-muted">
        Insufficient historical data to calculate drawdowns.
      </div>
    );
  }

  // 1. Calculate Peak-to-Valley Drawdowns
  // V[t] = 100 + return[t]
  let currentPeak = -Infinity;
  const drawdowns = portfolioReturns.map((cumulativeReturn) => {
    const val = 100 + cumulativeReturn;
    if (val > currentPeak) {
      currentPeak = val;
    }
    const dd = ((val - currentPeak) / currentPeak) * 100;
    return Number(dd.toFixed(2));
  });

  // Calculate scales
  const minDrawdown = Math.min(...drawdowns, -5.0); // minimum scale limit to -5% to prevent flattening
  const maxDrawdown = 0; // drawdowns are always <= 0
  const range = maxDrawdown - minDrawdown || 1;

  // X/Y coordinate conversion
  const getX = (index: number) => {
    return paddingLeft + (index / (dates.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    // value is a negative number (e.g. -4.5).
    // If value is 0, it should be at the top of the chart (paddingTop)
    // If value is minDrawdown, it should be at the bottom (paddingTop + chartHeight)
    return paddingTop + ((value - maxDrawdown) / (minDrawdown - maxDrawdown)) * chartHeight;
  };

  // Generate SVG paths
  let linePath = '';
  let areaPath = '';

  drawdowns.forEach((dd, idx) => {
    const x = getX(idx);
    const y = getY(dd);
    if (idx === 0) {
      linePath = `M ${x} ${y}`;
      areaPath = `M ${x} ${y}`;
    } else {
      linePath += ` L ${x} ${y}`;
      areaPath += ` L ${x} ${y}`;
    }
  });

  if (drawdowns.length > 0) {
    const startX = getX(0);
    const endX = getX(drawdowns.length - 1);
    const topY = getY(0); // Area rises up to the 0% water-mark
    areaPath += ` L ${endX} ${topY} L ${startX} ${topY} Z`;
  }

  // Derived coordinate from shared index
  const cursorX = hoverIdx !== null ? getX(hoverIdx) : null;

  // Handle cursor move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - paddingLeft;
    const relativeX = Math.max(0, Math.min(chartWidth, mouseX));
    const index = Math.round((relativeX / chartWidth) * (dates.length - 1));

    setHoverIdx(index);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
    setIsHovering(false);
  };

  // Y axis ticks (from 0% down to minDrawdown)
  const ticksCount = 3;
  const yTicks: number[] = [];
  for (let i = 0; i <= ticksCount; i++) {
    yTicks.push(maxDrawdown - (range / ticksCount) * i);
  }

  // X axis ticks
  const xTicksCount = 5;
  const xTickIndices: number[] = [];
  const xStep = Math.floor((dates.length - 1) / (xTicksCount - 1)) || 1;
  for (let i = 0; i < xTicksCount - 1; i++) {
    xTickIndices.push(i * xStep);
  }
  xTickIndices.push(dates.length - 1);

  return (
    <div
      className="glass-card rounded-2xl p-6 border border-border-glass flex flex-col min-h-[260px] relative select-none"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Historical Drawdown Curve
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Measures peak-to-valley percentage drops (portfolio risk profile).
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-app-red/10 text-app-red border border-app-red/20 font-mono">
          Max Drawdown: {Math.min(...drawdowns).toFixed(2)}%
        </span>
      </div>

      <div className="relative flex-1" style={{ height: `${height}px` }}>
        <svg width="100%" height={height} className="overflow-visible">
          <defs>
            {/* Red fade gradient for drawdown area fill */}
            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF3B5C" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#FF3B5C" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* Grid lines (Horizontal) */}
          {yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#8A8F98"
                  fontSize="8"
                  fontWeight="600"
                  className="font-mono"
                >
                  {val.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Drawdown Area Fill */}
          <motion.path
            key={`dd-area-${animationTrigger}`}
            d={areaPath}
            fill="url(#drawdownGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : { duration: 0.8, delay: 0.3 }}
          />

          {/* Drawdown Boundary Line */}
          <motion.path
            key={`dd-line-${animationTrigger}`}
            d={linePath}
            fill="none"
            stroke="#FF3B5C"
            strokeWidth="1.8"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : { duration: 1.2, ease: 'easeOut' }}
          />

          {/* Horizontal date labels */}
          {xTickIndices.map((idx) => {
            const x = getX(idx);
            const label = dates[idx];
            return (
              <text
                key={idx}
                x={x}
                y={height - 5}
                textAnchor="middle"
                fill="#8A8F98"
                fontSize="8"
                fontWeight="600"
              >
                {label}
              </text>
            );
          })}

          {/* Interactive vertical cursor line */}
          {cursorX !== null && (
            <line
              x1={cursorX}
              y1={paddingTop}
              x2={cursorX}
              y2={paddingTop + chartHeight}
              stroke="#FF3B5C"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.8"
            />
          )}

          {/* Cursor active dot hover indicator */}
          {hoverIdx !== null && drawdowns[hoverIdx] !== undefined && (
            <circle
              cx={cursorX || 0}
              cy={getY(drawdowns[hoverIdx])}
              r="5.5"
              fill="#FF3B5C"
              stroke="#0A0E14"
              strokeWidth="1.5"
              style={{ filter: 'drop-shadow(0 0 6px #FF3B5C)' }}
            />
          )}
        </svg>

        {/* Hover Tooltip display card */}
        <AnimatePresence>
          {hoverIdx !== null && dates[hoverIdx] && (
            <motion.div
              className="absolute pointer-events-none z-50 glass-card px-3 py-2.5 rounded-2xl border border-white/10 text-xs shadow-2xl bg-[#10141a]/95 backdrop-blur-xl flex flex-col gap-1 min-w-[130px] font-sans"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                left: Math.max(10, Math.min(width - 150, (cursorX || 0) - 65))
              }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{ top: '10px' }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            >
              <div className="font-bold text-white border-b border-white/10 pb-1.5 mb-1 text-[10px] uppercase tracking-wider text-text-muted">
                {dates[hoverIdx]}
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-text-muted">Drawdown:</span>
                <span className={`font-bold ${drawdowns[hoverIdx] === 0 ? 'text-white' : 'text-app-red'}`}>
                  {drawdowns[hoverIdx].toFixed(2)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
