import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useMarketStore } from '../../store/useMarketStore';
import { Layers } from 'lucide-react';
import type { Stock } from '../../services/mockDataEngine';

// Import modular components
import { Breadcrumbs } from './components/Breadcrumbs';
import { SectorStats } from './components/SectorStats';
import { StatsPanel } from './components/StatsPanel';
import { HeatmapControls } from './components/HeatmapControls';
import { HeatmapTooltip } from './components/HeatmapTooltip';
import { TreemapChart } from './components/TreemapChart';

export const MarketHeatmap: React.FC = () => {
  const navigate = useNavigate();
  const { stocks, isReplayMode } = useMarketStore();

  // Control and Filter States
  const [sizeBy, setSizeBy] = useState<'marketCap' | 'volume'>('marketCap');
  const [colorTheme, setColorTheme] = useState<'classic' | 'neon' | 'mono'>('classic');
  const [perfFilter, setPerfFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [searchSymbol, setSearchSymbol] = useState<string>('');
  const [snapshot, setSnapshot] = useState<'now' | '5m' | '15m' | '1h'>('now');
  const [currentSector, setCurrentSector] = useState<string | null>(null);

  // Hover and tooltip states
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    stock: Stock | null;
    x: number;
    y: number;
  }>({
    visible: false,
    stock: null,
    x: 0,
    y: 0,
  });

  // Calculate historical prices from stock sparklines for Time Machine lookup
  const getHistoricalPrice = (stock: Stock, timeSnapshot: 'now' | '5m' | '15m' | '1h') => {
    const spark = stock.sparkline;
    if (!spark || spark.length === 0 || timeSnapshot === 'now') return null;
    
    // sparkline length is typically 100 data points.
    // We simulate time offsets by index offsets:
    let offset = 0;
    if (timeSnapshot === '5m') offset = 10;
    if (timeSnapshot === '15m') offset = 30;
    if (timeSnapshot === '1h') offset = 70;
    
    const idx = Math.max(0, spark.length - 1 - offset);
    return spark[idx];
  };

  // Compute modified stock list based on Time Machine snapshot
  const snapshotStocks = useMemo(() => {
    if (snapshot === 'now') return stocks;
    return stocks.map((s) => {
      const histPrice = getHistoricalPrice(s, snapshot);
      if (histPrice === null) return s;
      const change = s.price - histPrice;
      const changePercent = (change / histPrice) * 100;
      return {
        ...s,
        change,
        changePercent,
      };
    });
  }, [stocks, snapshot]);

  // Handle navigating to stock details page on click
  const handleSelectStock = (symbol: string) => {
    navigate(`/stock/${symbol}`);
  };

  // Handle hover tooltips
  const handleShowTooltip = (stock: Stock | null, x: number, y: number) => {
    setTooltip({
      visible: !!stock,
      stock,
      x,
      y,
    });
  };

  return (
    <div className="space-y-5">
      {/* Breadcrumbs & Mode Indicator */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Breadcrumbs currentSector={currentSector} onReset={() => setCurrentSector(null)} />
        {isReplayMode && (
          <div className="flex items-center gap-2 px-3 py-1 bg-app-green/10 border border-app-green/30 rounded-xl text-[10px] text-app-green font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Replay Mode Active</span>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <SectorStats currentSector={currentSector} stocks={snapshotStocks} />

      {/* Controls Panel */}
      <HeatmapControls
        stocks={snapshotStocks}
        searchSymbol={searchSymbol}
        onSearchChange={setSearchSymbol}
        sizeBy={sizeBy}
        onSizeByChange={setSizeBy}
        colorTheme={colorTheme}
        onColorThemeChange={setColorTheme}
        perfFilter={perfFilter}
        onPerfFilterChange={setPerfFilter}
        selectedSnapshot={snapshot}
        onSnapshotChange={setSnapshot}
      />

      {/* Main Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Treemap Container */}
        <div className="lg:col-span-3 min-h-[500px] glass-card border border-border-glass rounded-3xl p-5 relative overflow-hidden bg-surface-low/10">
          {snapshot !== 'now' && (
            <div className="absolute top-4 right-4 z-10 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-3 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />
              <span>Historical snapshot ({snapshot})</span>
            </div>
          )}

          <TreemapChart
            stocks={snapshotStocks}
            sizeBy={sizeBy}
            colorTheme={colorTheme}
            perfFilter={perfFilter}
            currentSector={currentSector}
            onSelectSector={setCurrentSector}
            onSelectStock={handleSelectStock}
            searchSymbol={searchSymbol}
            hoveredSymbol={hoveredSymbol}
            onHoverSymbol={setHoveredSymbol}
            onShowTooltip={handleShowTooltip}
          />
        </div>

        {/* Live Sector Laggards & Leaders Sidebar */}
        <div className="lg:col-span-1">
          <StatsPanel
            currentSector={currentSector}
            stocks={snapshotStocks}
            onSelectStock={handleSelectStock}
            hoveredSymbol={hoveredSymbol}
            onHoverSymbol={setHoveredSymbol}
          />
        </div>
      </div>

      {/* Interactive Tooltip popup */}
      <HeatmapTooltip
        stock={tooltip.stock}
        x={tooltip.x}
        y={tooltip.y}
        visible={tooltip.visible}
      />
    </div>
  );
};

export default MarketHeatmap;
