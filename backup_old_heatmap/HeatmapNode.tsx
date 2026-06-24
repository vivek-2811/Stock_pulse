import React from 'react';
import { useMarketStore } from '../../store/useMarketStore';
import { motion } from 'framer-motion';
import { getStockColor } from './heatmap.utils';

interface HeatmapNodeProps {
  symbol: string;
  width: number;
  height: number;
  top: number;
  left: number;
  onClick: () => void;
  onHover: (e: React.MouseEvent, stock: any | null) => void;
  isSearchedMatch: boolean;
  hasSearchQuery: boolean;
  isRegimeHighlighted: boolean;
  showRegimeOverlay: boolean;
}

export const HeatmapNode: React.FC<HeatmapNodeProps> = React.memo(({
  symbol,
  width,
  height,
  top,
  left,
  onClick,
  onHover,
  isSearchedMatch,
  hasSearchQuery,
  isRegimeHighlighted,
  showRegimeOverlay
}) => {
  // O(1) Zustand subscription selector
  const stock = useMarketStore(state => state.stocksBySymbol[symbol]);

  if (!stock) return null;

  // Determine active visual opacity & borders based on search & regime overlays
  let opacity = 1.0;
  let isDimmed = false;
  let isGlowing = false;
  let glowColor = '';

  if (hasSearchQuery) {
    if (isSearchedMatch) {
      opacity = 1.0;
      isGlowing = true;
      glowColor = stock.changePercent >= 0 ? 'rgba(0, 255, 148, 0.7)' : 'rgba(255, 59, 92, 0.7)';
    } else {
      opacity = 0.15;
      isDimmed = true;
    }
  } else if (showRegimeOverlay) {
    if (isRegimeHighlighted) {
      opacity = 1.0;
      isGlowing = true;
      glowColor = 'rgba(0, 255, 148, 0.4)';
    } else {
      opacity = 0.2;
      isDimmed = true;
    }
  }

  const bgColor = getStockColor(stock.changePercent);
  const isPositive = stock.changePercent >= 0;

  // Conditional text rendering based on pixel dimensions
  const showSymbol = width > 35 && height > 22;
  const showPercent = width > 52 && height > 38;
  const showPrice = width > 75 && height > 55;
  const showName = width > 105 && height > 72;

  // Custom styling incorporating absolute positioning and smooth transitions
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: bgColor,
    color: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.25)',
    boxShadow: isGlowing ? `0 0 14px ${glowColor}` : 'none',
    opacity,
    transition: 'background-color 0.4s ease, opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
    pointerEvents: isDimmed ? 'none' : 'auto'
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    onHover(e, stock);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    onHover(e, stock);
  };

  const handleMouseLeave = () => {
    onHover(null as any, null);
  };

  return (
    <motion.div
      style={style}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`rounded-lg cursor-pointer flex flex-col justify-between p-1.5 select-none overflow-hidden group border-box`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity,
        scale: isGlowing && hasSearchQuery ? [1, 1.025, 1] : 1
      }}
      transition={{
        scale: isGlowing && hasSearchQuery 
          ? { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
          : { duration: 0.2 }
      }}
      whileHover={{ 
        scale: 1.02, 
        zIndex: 10,
        boxShadow: isPositive 
          ? '0 0 15px rgba(16, 185, 129, 0.45)' 
          : '0 0 15px rgba(239, 68, 68, 0.45)'
      }}
    >
      {/* Stock Symbol & Percent Change */}
      <div className="flex justify-between items-start w-full gap-1">
        {showSymbol && (
          <span className="font-extrabold text-[11px] sm:text-xs leading-none tracking-tight">
            {stock.symbol}
          </span>
        )}
        {showPercent && (
          <span className="font-bold text-[9px] sm:text-[10px] leading-none font-mono">
            {isPositive ? '+' : ''}{stock.changePercent.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Optional Company Name (Large Nodes) */}
      {showName && (
        <div className="text-[9px] text-white/70 font-semibold truncate leading-none my-1">
          {stock.name}
        </div>
      )}

      {/* Optional Price & Market Cap */}
      <div className="flex justify-between items-end w-full leading-none">
        {showPrice && (
          <span className="font-bold text-[10px] font-mono leading-none">
            ${stock.price.toFixed(2)}
          </span>
        )}
        {width > 65 && height > 32 && (
          <span className="text-[8px] opacity-60 font-mono leading-none">
            ${(stock.marketCap / 1000000000).toFixed(0)}B
          </span>
        )}
      </div>
    </motion.div>
  );
});

HeatmapNode.displayName = 'HeatmapNode';
