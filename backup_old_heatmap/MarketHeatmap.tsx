import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMarketStore } from '../../store/useMarketStore';
import { useTreemap } from './useTreemap';
import { HeatmapNode } from './HeatmapNode';
import { HeatmapTooltip } from './HeatmapTooltip';
import { HeatmapControls } from './HeatmapControls';
import { HeatmapBreadcrumb } from './HeatmapBreadcrumb';
import { calculateMarketRegime, GROWTH_SECTORS, DEFENSIVE_SECTORS } from './heatmap.utils';
import type { HeatmapFilters } from './heatmap.types';
import type { Stock } from '../../services/mockDataEngine';
import { RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MarketHeatmap: React.FC = () => {
  const { stocks, connectionStatus, triggerFailure } = useMarketStore();

  // 1. Local UI States
  const [zoomSector, setZoomSector] = useState<string | null>(null);
  const [showRegimeOverlay, setShowRegimeOverlay] = useState(false);
  const [hoveredStock, setHoveredStock] = useState<Stock | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const [filters, setFilters] = useState<HeatmapFilters>({
    marketCap: 'All',
    sector: 'All',
    performance: 'All',
    volume: 'All',
    search: ''
  });

  // 2. Ref & Dimensions for Treemap
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(500, window.innerHeight - 340) // Responsive height
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 3. Sync controls dropdown with treemap click-zoom
  const handleResetZoom = useCallback(() => {
    setZoomSector(null);
    setFilters(f => ({ ...f, sector: 'All' }));
  }, []);

  const handleSectorClick = useCallback((sectorName: string) => {
    setZoomSector(sectorName);
    setFilters(f => ({ ...f, sector: sectorName }));
  }, []);

  const handleChangeFilters = useCallback((newFilters: HeatmapFilters) => {
    setFilters(newFilters);
    // If user changed sector dropdown, update the treemap zoom
    if (newFilters.sector === 'All') {
      setZoomSector(null);
    } else {
      setZoomSector(newFilters.sector);
    }
  }, []);

  // 4. Calculate Market Regime (derived from all stocks)
  const regimeInfo = useMemo(() => calculateMarketRegime(stocks), [stocks]);

  // 5. Filter Stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      // Market Cap filter
      if (filters.marketCap !== 'All') {
        const cap = stock.marketCap;
        if (filters.marketCap === 'Mega' && cap < 200000000000) return false;
        if (filters.marketCap === 'Large' && (cap < 10000000000 || cap >= 200000000000)) return false;
        if (filters.marketCap === 'Mid' && (cap < 2000000000 || cap >= 10000000000)) return false;
        if (filters.marketCap === 'Small' && cap >= 2000000000) return false;
      }

      // Sector filter (ignored if clicked-zoom overrides it)
      const activeSector = zoomSector || filters.sector;
      if (activeSector !== 'All' && stock.sector !== activeSector) return false;

      // Performance filter
      if (filters.performance === 'Gainers' && stock.changePercent <= 0) return false;
      if (filters.performance === 'Losers' && stock.changePercent >= 0) return false;

      // Volume filter
      if (filters.volume !== 'All') {
        const vol = stock.volume;
        if (filters.volume === 'High' && vol < 10000000) return false;
        if (filters.volume === 'Medium' && (vol < 1000000 || vol >= 10000000)) return false;
        if (filters.volume === 'Low' && vol >= 1000000) return false;
      }

      // Search filter
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchSymbol = stock.symbol.toLowerCase().includes(query);
        const matchName = stock.name.toLowerCase().includes(query);
        if (!matchSymbol && !matchName) return false;
      }

      return true;
    });
  }, [stocks, filters, zoomSector]);

  // 6. Compute Treemap Layout via Custom Hook
  const { leafNodes, sectorNodes } = useTreemap({
    stocks: filteredStocks,
    width: dimensions.width,
    height: dimensions.height,
    zoomSector
  });

  // Distinct sectors present in all stocks for filter select
  const distinctSectors = useMemo(() => {
    return Array.from(new Set(stocks.map(s => s.sector))).sort();
  }, [stocks]);

  // 7. Search Highlights & Auto-Zoom
  const searchQueryUpper = filters.search.trim().toUpperCase();
  const hasSearchQuery = searchQueryUpper.length > 0;

  useEffect(() => {
    if (searchQueryUpper.length >= 2) {
      // Find if there is an exact matching stock symbol
      const exactMatch = stocks.find(s => s.symbol === searchQueryUpper);
      if (exactMatch) {
        setZoomSector(exactMatch.sector);
        setFilters(f => ({ ...f, sector: exactMatch.sector }));
      }
    }
  }, [searchQueryUpper, stocks]);

  // Calculate center coordinates of exact search match to overlay tooltip automatically
  const exactSearchMatchNode = useMemo(() => {
    if (!searchQueryUpper) return null;
    return leafNodes.find(node => node.symbol === searchQueryUpper) || null;
  }, [searchQueryUpper, leafNodes]);

  useEffect(() => {
    if (exactSearchMatchNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = rect.left + ((exactSearchMatchNode.x0 || 0) + (exactSearchMatchNode.x1 || 0)) / 2;
      const y = rect.top + ((exactSearchMatchNode.y0 || 0) + (exactSearchMatchNode.y1 || 0)) / 2;
      
      const matchedStock = stocks.find(s => s.symbol === exactSearchMatchNode.symbol);
      if (matchedStock) {
        setHoveredStock(matchedStock);
        setMousePos({ x, y });
      }
    } else if (!hasSearchQuery) {
      setHoveredStock(null);
    }
  }, [exactSearchMatchNode, stocks, hasSearchQuery]);

  // 8. Hover tooltip tracker callbacks
  const handleHoverNode = useCallback((e: React.MouseEvent, stock: Stock | null) => {
    if (!e || !stock) {
      setHoveredStock(null);
      return;
    }
    setMousePos({ x: e.clientX, y: e.clientY });
    setHoveredStock(stock);
  }, []);

  // Determine if a stock sector should be dimmed/highlighted in Regime Overlay mode
  const isRegimeHighlighted = useCallback((sector: string) => {
    if (!showRegimeOverlay) return true;
    if (regimeInfo.status === 'Risk-On') {
      return GROWTH_SECTORS.includes(sector);
    }
    if (regimeInfo.status === 'Risk-Off') {
      return DEFENSIVE_SECTORS.includes(sector);
    }
    return true;
  }, [showRegimeOverlay, regimeInfo.status]);

  // Handler for retry when network is failed
  const handleRetry = () => {
    // This reconnects the store socket
    useMarketStore.getState().connectSocket();
  };

  // Rendering States
  const isFailed = connectionStatus === 'FAILED' || stocks.length === 0;

  return (
    <div className="space-y-5">
      {/* Heatmap Toolbars */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <HeatmapBreadcrumb zoomSector={zoomSector} onReset={handleResetZoom} />
        {connectionStatus === 'FAILED' && (
          <div className="flex items-center gap-2 px-3 py-1 bg-app-red/10 border border-app-red/35 rounded-xl text-xs text-app-red font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulated feed error active.</span>
          </div>
        )}
      </div>

      <HeatmapControls
        filters={filters}
        onChangeFilters={handleChangeFilters}
        sectors={distinctSectors}
        regime={regimeInfo}
        showRegimeOverlay={showRegimeOverlay}
        onToggleRegimeOverlay={() => setShowRegimeOverlay(prev => !prev)}
      />

      {/* Main Treemap Canvas */}
      <div className="relative w-full overflow-hidden" ref={containerRef}>
        <AnimatePresence mode="wait">
          {isFailed ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-[500px] glass-card border border-border-glass rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-4"
            >
              <AlertTriangle className="w-12 h-12 text-app-red animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Market Feed Disconnected</h3>
                <p className="text-xs text-text-muted max-w-xs font-semibold">
                  We are unable to reach the live quotation engine. Reset the simulated network failure to reconnect.
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-app-green hover:bg-app-green/90 text-black text-xs font-bold transition-all shadow-md shadow-app-green/10 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect Data Engine
              </button>
            </motion.div>
          ) : dimensions.width === 0 ? (
            <motion.div
              key="skeleton"
              className="w-full h-[500px] glass-card border border-border-glass rounded-3xl animate-pulse flex items-center justify-center bg-[#0e131b]/30"
            >
              <div className="flex items-center gap-2 text-text-muted text-xs font-bold">
                <Layers className="w-5 h-5 animate-spin" />
                <span>Computing hierarchical D3 treemap layout...</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="treemap-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ width: dimensions.width, height: dimensions.height }}
              className="relative rounded-3xl border border-border-glass bg-[#06080d]/60 shadow-inner overflow-hidden select-none"
            >
              {/* 1. Render Sector Boundaries (only in full market view) */}
              {!zoomSector &&
                sectorNodes.map(node => {
                  const w = (node.x1 || 0) - (node.x0 || 0);
                  const h = (node.y1 || 0) - (node.y0 || 0);
                  const showHeaderLabel = w > 60 && h > 28;

                  return (
                    <div
                      key={node.id}
                      style={{
                        position: 'absolute',
                        left: `${node.x0}px`,
                        top: `${node.y0}px`,
                        width: `${w}px`,
                        height: `${h}px`,
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: 'rgba(255, 255, 255, 0.015)'
                      }}
                      className="rounded-xl overflow-hidden pointer-events-none"
                    >
                      {/* Sector Name Banner */}
                      {showHeaderLabel && (
                        <div
                          style={{ height: '22px' }}
                          className="w-full pl-2.5 pt-1.5 text-[10px] font-extrabold uppercase text-text-muted/65 tracking-wider truncate flex justify-between pr-3"
                        >
                          <span>{node.name}</span>
                          <span className="font-mono text-[9px] opacity-75">
                            ({((node.value / stocks.reduce((a, s) => a + s.marketCap, 0)) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* 2. Render Stock Nodes */}
              {leafNodes.map(node => {
                const w = (node.x1 || 0) - (node.x0 || 0);
                const h = (node.y1 || 0) - (node.y0 || 0);
                const top = node.y0 || 0;
                const left = node.x0 || 0;
                const symbol = node.symbol!;

                // Highlight status checks
                const isSearchedMatch = hasSearchQuery && symbol === searchQueryUpper;
                const regimeHighlighted = isRegimeHighlighted(node.sector);

                return (
                  <HeatmapNode
                    key={node.id}
                    symbol={symbol}
                    width={w}
                    height={h}
                    top={top}
                    left={left}
                    isSearchedMatch={isSearchedMatch}
                    hasSearchQuery={hasSearchQuery}
                    isRegimeHighlighted={regimeHighlighted}
                    showRegimeOverlay={showRegimeOverlay}
                    onHover={handleHoverNode}
                    onClick={() => handleSectorClick(node.sector)}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Cursor Tooltip */}
      <HeatmapTooltip stock={hoveredStock} x={mousePos.x} y={mousePos.y} />
    </div>
  );
};
export default MarketHeatmap;
