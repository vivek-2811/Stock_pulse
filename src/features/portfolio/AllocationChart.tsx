import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AllocationItem {
  label: string;
  value: number;
  color: string;
  targetWeight?: number;
  drift?: number;
}

interface AllocationChartProps {
  data: AllocationItem[];
  totalValue: number;
  isLoading?: boolean;
}

export const AllocationChart: React.FC<AllocationChartProps> = ({ data, totalValue, isLoading = false }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  // Re-trigger load animation if data changes or reloading is simulated
  useEffect(() => {
    setAnimationTrigger(prev => prev + 1);
  }, [data]);

  // Handle mouse move to position the springy tooltip
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Offset the tooltip slightly above and to the right of the cursor
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 50,
    });
  };

  // Safe division check
  const total = totalValue || data.reduce((sum, item) => sum + item.value, 0) || 1;

  // Compute angles for slices
  let accumulatedAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angleSize = (item.value / total) * 360;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angleSize;
    accumulatedAngle = endAngle;

    // Center angle for separation vector
    const bisectorAngle = startAngle + angleSize / 2;
    const bisectorRad = ((bisectorAngle - 90) * Math.PI) / 180;
    
    // Translation vector on hover
    const hoverOffset = 10; // px
    const dx = Math.cos(bisectorRad) * hoverOffset;
    const dy = Math.sin(bisectorRad) * hoverOffset;

    return {
      ...item,
      index,
      startAngle,
      endAngle,
      percentage,
      dx,
      dy,
      bisectorAngle,
    };
  });

  // SVG parameters
  const cx = 130;
  const cy = 130;
  const rOuter = 95;
  const rInner = 60;

  // Helper to generate SVG Arc Path
  const getArcPath = (
    startX: number, startY: number,
    endX: number, endY: number,
    innerStartX: number, innerStartY: number,
    innerEndX: number, innerEndY: number,
    largeArcFlag: number
  ) => {
    return `
      M ${startX} ${startY}
      A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${endX} ${endY}
      L ${innerEndX} ${innerEndY}
      A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}
      Z
    `;
  };

  const getSlicePath = (startAngle: number, endAngle: number) => {
    // Math for coordinates
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const startOuterX = cx + rOuter * Math.cos(startRad);
    const startOuterY = cy + rOuter * Math.sin(startRad);
    const endOuterX = cx + rOuter * Math.cos(endRad);
    const endOuterY = cy + rOuter * Math.sin(endRad);

    const startInnerX = cx + rInner * Math.cos(startRad);
    const startInnerY = cy + rInner * Math.sin(startRad);
    const endInnerX = cx + rInner * Math.cos(endRad);
    const endInnerY = cy + rInner * Math.sin(endRad);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    // Edge case for 100% single slice
    if (endAngle - startAngle >= 359.99) {
      return `
        M ${cx} ${cy - rOuter}
        A ${rOuter} ${rOuter} 0 1 1 ${cx - 0.01} ${cy - rOuter}
        Z
        M ${cx} ${cy - rInner}
        A ${rInner} ${rInner} 0 1 0 ${cx - 0.01} ${cy - rInner}
        Z
      `;
    }

    return getArcPath(
      startOuterX, startOuterY,
      endOuterX, endOuterY,
      startInnerX, startInnerY,
      endInnerX, endInnerY,
      largeArcFlag
    );
  };

  return (
    <div 
      className="glass-card rounded-2xl p-6 border border-border-glass flex flex-col md:flex-row gap-6 items-center min-h-[300px] relative overflow-hidden"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* Left side: Animated Donut */}
      <div className="relative w-[260px] h-[260px] flex-shrink-0 flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-center text-xs text-text-muted">No allocation data</div>
        ) : (
          <svg width="260" height="260" className="overflow-visible">
            <g>
              {slices.map((slice) => {
                const isHovered = hoveredIndex === slice.index;
                const path = getSlicePath(slice.startAngle, slice.endAngle);

                return (
                  <motion.path
                    key={`${slice.label}-${animationTrigger}`}
                    d={path}
                    fill={slice.color}
                    stroke="#0a0e14"
                    strokeWidth={1.5}
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      cursor: 'pointer',
                      filter: isHovered ? `drop-shadow(0 0 8px ${slice.color}44)` : 'none',
                    }}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ 
                      scale: 1, 
                      rotate: 0,
                      x: isHovered ? slice.dx : 0,
                      y: isHovered ? slice.dy : 0 
                    }}
                    transition={{
                      scale: { type: 'spring', stiffness: 120, damping: 14, delay: slice.index * 0.05 },
                      rotate: { type: 'spring', stiffness: 80, damping: 16, delay: slice.index * 0.05 },
                      x: { type: 'spring', stiffness: 280, damping: 18 },
                      y: { type: 'spring', stiffness: 280, damping: 18 },
                    }}
                    onMouseEnter={() => setHoveredIndex(slice.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </g>

            {/* Middle text for Total Value */}
            <motion.g
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                fill="#8A8F98"
                fontSize="9"
                fontWeight="700"
                className="uppercase tracking-wider font-sans"
              >
                Total Value
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="16"
                fontWeight="700"
                className="font-mono"
              >
                ${Math.round(totalValue).toLocaleString()}
              </text>
            </motion.g>
          </svg>
        )}
      </div>

      {/* Right side: Sector Exposure Breakdown */}
      <div className="flex-1 w-full space-y-3.5 self-center">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-glass pb-2">
          Sector Exposure
        </h3>
        <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index;
            return (
              <div 
                key={slice.label} 
                className={`space-y-1.5 transition-all duration-150 p-1.5 rounded-lg ${
                  isHovered ? 'bg-white/5 shadow-glow-green-sm' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: slice.color }} 
                    />
                    <span className="font-semibold text-white truncate max-w-[120px] md:max-w-none">
                      {slice.label}
                    </span>
                    {slice.drift !== undefined && slice.drift !== 0 && Math.abs(slice.drift) > 0.05 && (
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md border font-mono ${
                        slice.drift > 2.5 
                          ? 'bg-app-green/10 text-app-green border-app-green/20' 
                          : slice.drift < -2.5 
                            ? 'bg-app-red/10 text-app-red border-app-red/20' 
                            : 'bg-white/5 text-text-muted border-white/5'
                      }`}
                      title={`Target: ${slice.targetWeight?.toFixed(1)}% | Drift: ${slice.drift > 0 ? '+' : ''}${slice.drift.toFixed(1)}%`}
                      >
                        {slice.drift > 0 ? '+' : ''}{slice.drift.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-right flex items-baseline gap-1.5">
                    <span className="text-white font-bold">${Math.round(slice.value).toLocaleString()}</span>
                    <span className="text-[10px] text-text-muted">({slice.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ backgroundColor: slice.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${slice.percentage}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 12, delay: slice.index * 0.05 + 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Springy Tooltip Portal */}
      <AnimatePresence>
        {hoveredIndex !== null && slices[hoveredIndex] && (
          <motion.div
            className="absolute pointer-events-none z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-xs shadow-2xl bg-[#10141a]/95 backdrop-blur-xl flex flex-col gap-1 min-w-[130px] font-sans"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: tooltipPos.x,
              y: tooltipPos.y
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ 
              x: { type: 'spring', damping: 18, stiffness: 220 },
              y: { type: 'spring', damping: 18, stiffness: 220 },
              default: { duration: 0.1 }
            }}
          >
            <div className="flex items-center gap-1.5 font-bold text-white border-b border-white/10 pb-1.5 mb-1">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: slices[hoveredIndex].color }} 
              />
              <span>{slices[hoveredIndex].label}</span>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-text-muted">
              <span>Value:</span>
              <span className="text-white font-bold">${slices[hoveredIndex].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-mono text-[10px] text-text-muted">
              <span>Exposure:</span>
              <span className="text-app-green font-bold">{slices[hoveredIndex].percentage.toFixed(2)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
