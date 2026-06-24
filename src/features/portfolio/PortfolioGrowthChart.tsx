import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioAnalyticsStore } from '../../store/usePortfolioAnalyticsStore';

interface PortfolioGrowthChartProps {
  dates: string[];
  portfolioReturns: number[];
  benchmarkReturns: number[];
  isLoading?: boolean;
}

export const PortfolioGrowthChart: React.FC<PortfolioGrowthChartProps> = ({
  dates,
  portfolioReturns,
  benchmarkReturns,
  isLoading = false,
}) => {
  const { 
    hoverIdx, 
    setHoverIdx, 
    setIsHovering,
    selectedBenchmark,
    setSelectedBenchmark
  } = usePortfolioAnalyticsStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Re-trigger animations when dataset changes
  useEffect(() => {
    setAnimationTrigger(prev => prev + 1);
  }, [portfolioReturns, benchmarkReturns]);

  // Handle window resizing to make chart responsive
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

  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  if (dates.length < 2 || portfolioReturns.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-border-glass h-[220px] flex items-center justify-center text-xs text-text-muted">
        Insufficient historical data. Run allocation backtest.
      </div>
    );
  }

  // Find min and max across both datasets
  const allValues = [...portfolioReturns, ...benchmarkReturns];
  const minVal = Math.min(...allValues) - 2;
  const maxVal = Math.max(...allValues) + 2;
  const valRange = maxVal - minVal || 1;

  // Coordinate conversion helpers
  const getX = (index: number) => {
    return paddingLeft + (index / (dates.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return paddingTop + chartHeight - ((value - minVal) / valRange) * chartHeight;
  };

  // Generate SVG Line Paths
  let portfolioPath = '';
  let benchmarkPath = '';
  let areaPath = '';

  portfolioReturns.forEach((val, idx) => {
    const x = getX(idx);
    const y = getY(val);
    if (idx === 0) {
      portfolioPath = `M ${x} ${y}`;
      areaPath = `M ${x} ${y}`;
    } else {
      portfolioPath += ` L ${x} ${y}`;
      areaPath += ` L ${x} ${y}`;
    }
  });

  // Complete area path to bottom of chart
  if (portfolioReturns.length > 0) {
    const startX = getX(0);
    const endX = getX(portfolioReturns.length - 1);
    const bottomY = paddingTop + chartHeight;
    areaPath += ` L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  }

  benchmarkReturns.forEach((val, idx) => {
    const x = getX(idx);
    const y = getY(val);
    if (idx === 0) {
      benchmarkPath = `M ${x} ${y}`;
    } else {
      benchmarkPath += ` L ${x} ${y}`;
    }
  });

  // Derived coordinate from shared index
  const cursorX = hoverIdx !== null ? getX(hoverIdx) : null;

  // Handle cursor tracking
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

  // Select key indices for sequential dots (max 8 points to avoid clutter)
  const dotStep = Math.max(1, Math.floor(dates.length / 8));
  const dotIndices: number[] = [];
  for (let i = 0; i < dates.length; i += dotStep) {
    dotIndices.push(i);
  }
  if (dotIndices[dotIndices.length - 1] !== dates.length - 1) {
    dotIndices.push(dates.length - 1);
  }

  // Generate Y axis ticks
  const ticksCount = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= ticksCount; i++) {
    yTicks.push(minVal + (valRange / ticksCount) * i);
  }

  // Generate X axis ticks (approx 5 dates)
  const xTicksCount = 5;
  const xTickIndices: number[] = [];
  const xStep = Math.floor((dates.length - 1) / (xTicksCount - 1)) || 1;
  for (let i = 0; i < xTicksCount - 1; i++) {
    xTickIndices.push(i * xStep);
  }
  xTickIndices.push(dates.length - 1);

  return (
    <div 
      className="glass-card rounded-2xl p-6 border border-border-glass flex flex-col min-h-[300px] relative select-none"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Performance Growth
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">Cumulative percentage return versus benchmark.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Benchmark Selector Segmented Buttons */}
          <div className="flex items-center gap-1 p-0.5 bg-surface-low border border-border-glass rounded-lg text-[9px] font-bold text-text-muted">
            {(['SP500', 'NASDAQ', 'NONE'] as const).map(bench => (
              <button
                key={bench}
                type="button"
                onClick={() => setSelectedBenchmark(bench)}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  selectedBenchmark === bench ? 'bg-surface-high text-white shadow-sm font-bold' : 'hover:text-white'
                }`}
              >
                {bench === 'SP500' ? 'S&P 500' : bench === 'NASDAQ' ? 'NASDAQ' : 'NO BENCH'}
              </button>
            ))}
          </div>

          {/* Legends */}
          <div className="flex items-center gap-4 text-[10px] font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-app-green rounded-full shadow-glow-green-sm" />
              <span className="text-white">Active Portfolio</span>
            </div>
            {selectedBenchmark !== 'NONE' && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-[#8A8F98]" />
                <span className="text-text-muted">
                  {selectedBenchmark === 'SP500' ? 'S&P 500 Index' : 'NASDAQ Index'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex-1" style={{ height: `${height}px` }}>
        <svg width="100%" height={height} className="overflow-visible">
          <defs>
            {/* Emerald fade gradient for portfolio growth fill */}
            <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00FF94" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#00FF94" stopOpacity="0.0" />
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
                  {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Benchmark Line */}
          {selectedBenchmark !== 'NONE' && (
            <motion.path
              key={`bench-${animationTrigger}-${selectedBenchmark}`}
              d={benchmarkPath}
              fill="none"
              stroke="#8A8F98"
              strokeWidth="1.5"
              strokeDasharray="5,5"
              opacity="0.65"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : { duration: 1.2, ease: 'easeOut' }}
            />
          )}

          {/* Portfolio Growth Area Fill */}
          <motion.path
            key={`area-${animationTrigger}`}
            d={areaPath}
            fill="url(#growthGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : { duration: 0.8, delay: 0.4 }}
          />

          {/* Portfolio Growth Line */}
          <motion.path
            key={`port-${animationTrigger}`}
            d={portfolioPath}
            fill="none"
            stroke="#00FF94"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={window.matchMedia('(prefers-reduced-motion: reduce)').matches ? { duration: 0 } : { duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Sequential Dots on Load */}
          {dotIndices.map((idx, seqIdx) => {
            const val = portfolioReturns[idx];
            if (val === undefined) return null;
            const x = getX(idx);
            const y = getY(val);

            return (
              <motion.circle
                key={`dot-${idx}-${animationTrigger}`}
                cx={x}
                cy={y}
                r="3"
                fill="#00FF94"
                stroke="#0A0E14"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 15,
                  delay: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : (idx / (dates.length - 1)) * 1.2,
                }}
              />
            );
          })}

          {/* Horizontal Date labels */}
          {xTickIndices.map((idx) => {
            const x = getX(idx);
            const label = dates[idx];
            return (
              <text
                key={idx}
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="#8A8F98"
                fontSize="8"
                fontWeight="600"
              >
                {label}
              </text>
            );
          })}

          {/* Interactive Cursor Line */}
          {cursorX !== null && (
            <line
              x1={cursorX}
              y1={paddingTop}
              x2={cursorX}
              y2={paddingTop + chartHeight}
              stroke="#00FF94"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.8"
            />
          )}

          {/* Cursor active dot hover indicator */}
          {hoverIdx !== null && portfolioReturns[hoverIdx] !== undefined && (
            <circle
              cx={cursorX || 0}
              cy={getY(portfolioReturns[hoverIdx])}
              r="5.5"
              fill="#00FF94"
              stroke="#0A0E14"
              strokeWidth="1.5"
              style={{ filter: 'drop-shadow(0 0 6px #00FF94)' }}
            />
          )}
        </svg>

        {/* Hover Tooltip display card */}
        <AnimatePresence>
          {hoverIdx !== null && dates[hoverIdx] && (
            <motion.div
              className="absolute pointer-events-none z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-xs shadow-2xl bg-[#10141a]/95 backdrop-blur-xl flex flex-col gap-1 min-w-[155px] font-sans"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                left: Math.max(10, Math.min(width - 170, (cursorX || 0) - 75))
              }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{ top: '10px' }}
              transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            >
              <div className="font-bold text-white border-b border-white/10 pb-1.5 mb-1 text-[10px] uppercase tracking-wider text-text-muted">
                {dates[hoverIdx]}
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-text-muted">Portfolio:</span>
                <span className={`font-bold ${portfolioReturns[hoverIdx] >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                  {portfolioReturns[hoverIdx] >= 0 ? '+' : ''}{portfolioReturns[hoverIdx].toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-text-muted">S&P 500 Index:</span>
                <span className={`font-bold ${benchmarkReturns[hoverIdx] >= 0 ? 'text-white' : 'text-app-red'}`}>
                  {benchmarkReturns[hoverIdx] >= 0 ? '+' : ''}{benchmarkReturns[hoverIdx].toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between font-mono text-[9px] text-[#8A8F98] border-t border-white/5 pt-1 mt-0.5">
                <span>Outperformance:</span>
                <span className={`font-bold ${portfolioReturns[hoverIdx] - benchmarkReturns[hoverIdx] >= 0 ? 'text-app-green' : 'text-[#8A8F98]'}`}>
                  {(portfolioReturns[hoverIdx] - benchmarkReturns[hoverIdx]) >= 0 ? '+' : ''}
                  {(portfolioReturns[hoverIdx] - benchmarkReturns[hoverIdx]).toFixed(2)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
