import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { Stock } from '../../../services/mockDataEngine';

interface TreemapChartProps {
  stocks: Stock[];
  sizeBy: 'marketCap' | 'volume';
  colorTheme: 'classic' | 'neon' | 'mono';
  perfFilter: 'all' | 'gainers' | 'losers';
  currentSector: string | null;
  onSelectSector: (sector: string | null) => void;
  onSelectStock: (symbol: string) => void;
  searchSymbol: string;
  hoveredSymbol: string | null;
  onHoverSymbol: (symbol: string | null) => void;
  onShowTooltip: (stock: Stock | null, x: number, y: number) => void;
}

export const TreemapChart: React.FC<TreemapChartProps> = ({
  stocks,
  sizeBy,
  colorTheme,
  perfFilter,
  currentSector,
  onSelectSector,
  onSelectStock,
  searchSymbol,
  hoveredSymbol,
  onHoverSymbol,
  onShowTooltip,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const prevPricesRef = useRef<Record<string, number>>({});

  // Responsive resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(300, width),
          height: Math.max(350, height || 500),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Main rendering D3 hook
  useEffect(() => {
    if (!svgRef.current || stocks.length === 0) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear canvas for redraw

    // Filter stocks based on current zoom sector & performance filter
    let filtered = currentSector
      ? stocks.filter((s) => s.sector === currentSector)
      : stocks;

    if (perfFilter === 'gainers') {
      filtered = filtered.filter((s) => s.changePercent > 0);
    } else if (perfFilter === 'losers') {
      filtered = filtered.filter((s) => s.changePercent < 0);
    }

    if (filtered.length === 0) {
      // Show empty state inside SVG
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('class', 'text-xs font-semibold fill-text-muted')
        .text('No stocks match active filters.');
      return;
    }

    // Build hierarchy
    let hierarchyData: any;

    if (currentSector) {
      // Zoomed to a single sector: hierarchy is flat within this sector
      hierarchyData = {
        name: currentSector,
        children: filtered.map((s) => ({
          ...s,
          name: s.symbol,
          value: s[sizeBy] || s.marketCap,
        })),
      };
    } else {
      // Market overview: hierarchy grouped by sectors
      const grouped = d3.group(filtered, (d) => d.sector);
      hierarchyData = {
        name: 'Market',
        children: Array.from(grouped, ([sectorName, sectorStocks]) => ({
          name: sectorName,
          children: sectorStocks.map((s) => ({
            ...s,
            name: s.symbol,
            value: s[sizeBy] || s.marketCap,
          })),
        })),
      };
    }

    const root = d3.hierarchy<any>(hierarchyData)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Layout
    const treemapLayout = d3.treemap<any>()
      .size([width, height])
      .paddingOuter(4)
      .paddingTop(currentSector ? 4 : 24)
      .paddingInner(3);

    treemapLayout(root);

    // Color mapper helpers
    const getBaseColor = (changePercent: number) => {
      const isPos = changePercent > 0;
      const isNeg = changePercent < 0;

      if (colorTheme === 'neon') {
        if (isPos) return '#00E5FF'; // Neon Blue
        if (isNeg) return '#FF9100'; // Neon Orange
        return '#31353c';
      } else if (colorTheme === 'mono') {
        if (isPos) return '#E2E8F0'; // Slate White
        if (isNeg) return '#1E293B'; // Slate Dark
        return '#475569';
      } else {
        if (isPos) return '#00FF94'; // Neon Green
        if (isNeg) return '#FF3B5C'; // Neon Red
        return '#31353c';
      }
    };

    const getTileOpacity = (d: any) => {
      // If search is active, non-matching symbols are dimmed
      if (searchSymbol && d.symbol !== searchSymbol) {
        return 0.15;
      }
      
      const volRatio = d.volume / (d.avgVolume || 1);
      // Map volume activity ratio to opacity [0.45, 1.0]
      const activityOpacity = Math.min(1.0, Math.max(0.45, 0.45 + (volRatio - 0.5) * 0.55));
      
      // Map performance level to color alpha intensity [0.4, 1.0]
      const perfAlpha = Math.min(1.0, Math.max(0.4, Math.abs(d.changePercent) / 3.0));

      return perfAlpha * activityOpacity;
    };

    // 1. Draw Sector Boundary Headers (only in overview mode)
    if (!currentSector) {
      const sectors = root.descendants().filter((d: any) => d.depth === 1);
      
      const sectorGroups = svg.selectAll('g.sector-header')
        .data(sectors, (d: any) => d.data.name)
        .enter()
        .append('g')
        .attr('class', 'sector-header');

      // Sector Title label
      sectorGroups.append('text')
        .attr('x', (d: any) => d.x0 + 8)
        .attr('y', (d: any) => d.y0 + 16)
        .attr('font-size', '10px')
        .attr('font-weight', '800')
        .attr('fill', '#8A8F98')
        .attr('class', 'tracking-wider uppercase select-none cursor-pointer hover:fill-app-green hover:underline transition-colors')
        .text((d: any) => d.data.name)
        .on('click', (_event: any, d: any) => {
          onSelectSector(d.data.name);
        });

      // Sector Frame border
      sectorGroups.append('rect')
        .attr('x', (d: any) => d.x0)
        .attr('y', (d: any) => d.y0)
        .attr('width', (d: any) => d.x1 - d.x0)
        .attr('height', (d: any) => d.y1 - d.y0)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.04)')
        .attr('stroke-width', '1px')
        .attr('pointer-events', 'none');
    }

    // 2. Draw Leaf nodes (Stocks)
    const leaves = root.leaves();

    const cellGroups = svg.selectAll('g.cell')
      .data(leaves, (d: any) => d.data.symbol)
      .enter()
      .append('g')
      .attr('class', 'cell')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer');

    // Tile Rectangle
    cellGroups.append('rect')
      .attr('id', (d: any) => `rect-${d.data.symbol}`)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('rx', 4)
      .attr('ry', 4)
      .style('fill', (d: any) => getBaseColor(d.data.changePercent))
      .style('fill-opacity', (d: any) => getTileOpacity(d.data))
      .style('stroke', (d: any) => {
        if (searchSymbol && d.data.symbol === searchSymbol) {
          return colorTheme === 'neon' ? '#00E5FF' : '#00FF94';
        }
        return 'rgba(255, 255, 255, 0.08)';
      })
      .style('stroke-width', (d: any) => {
        if (searchSymbol && d.data.symbol === searchSymbol) {
          return '3px';
        }
        return '1px';
      })
      .style('transition', 'fill 0.5s ease');

    // Ticker Symbol Text Label
    cellGroups.append('text')
      .attr('x', 6)
      .attr('y', 16)
      .attr('font-size', (d: any) => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 40 || h < 25) return '0px'; // hide label if tile is too small
        if (w < 60) return '9px';
        return '11px';
      })
      .attr('font-weight', 'bold')
      .attr('fill', (d: any) => {
        // High lightness contrast for mono theme or neon backgrounds
        if (colorTheme === 'mono' && d.data.changePercent > 0) return '#000';
        return '#FFFFFF';
      })
      .attr('class', 'select-none')
      .text((d: any) => d.data.symbol);

    // Percentage Change Text Label
    cellGroups.append('text')
      .attr('x', 6)
      .attr('y', 28)
      .attr('font-size', (d: any) => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 50 || h < 38) return '0px';
        return '9px';
      })
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-weight', 'bold')
      .attr('fill', (d: any) => {
        if (colorTheme === 'mono' && d.data.changePercent > 0) return '#334155';
        return 'rgba(255,255,255,0.7)';
      })
      .attr('class', 'select-none')
      .text((d: any) => {
        const change = d.data.changePercent;
        return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
      });

    // Sub-title label (Company Name or Market Cap) if tile is very large
    cellGroups.append('text')
      .attr('x', 6)
      .attr('y', 42)
      .attr('font-size', '8px')
      .attr('fill', 'rgba(255,255,255,0.45)')
      .attr('class', 'select-none truncate')
      .attr('width', (d: any) => d.x1 - d.x0 - 12)
      .text((d: any) => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 85 || h < 55) return '';
        return `$${(d.data.marketCap / 1e9).toFixed(0)}B`;
      });

    // 3. Hover scale & details tooltip interactions
    cellGroups
      .on('mouseenter', function (event: any, d: any) {
        if (searchSymbol && d.data.symbol !== searchSymbol) return;
        
        // Raise group to draw on top of neighbors
        d3.select(this).raise();

        // Animate tile hover outline
        d3.select(this).select('rect')
          .transition()
          .duration(120)
          .style('stroke', colorTheme === 'neon' ? '#00E5FF' : '#00FF94')
          .style('stroke-width', '2px');

        onHoverSymbol(d.data.symbol);
        onShowTooltip(d.data, event.clientX, event.clientY);
      })
      .on('mousemove', function (event: any, d: any) {
        if (searchSymbol && d.data.symbol !== searchSymbol) return;
        onShowTooltip(d.data, event.clientX, event.clientY);
      })
      .on('mouseleave', function (_event: any, d: any) {
        if (searchSymbol && d.data.symbol === searchSymbol) return; // Keep search highlights

        d3.select(this).select('rect')
          .transition()
          .duration(150)
          .style('stroke', 'rgba(255, 255, 255, 0.08)')
          .style('stroke-width', '1px');

        onHoverSymbol(null);
        onShowTooltip(null, 0, 0);
      })
      .on('click', (_event: any, d: any) => {
        onSelectStock(d.data.symbol);
      });

    // Double-click to zoom into a sector if in overview mode
    if (!currentSector) {
      cellGroups.on('dblclick', (_event: any, d: any) => {
        onSelectSector(d.data.sector);
      });
    }

    // 4. Live Tick Flashing / Pulse Logic
    filtered.forEach((stock) => {
      const prevPrice = prevPricesRef.current[stock.symbol];
      if (prevPrice !== undefined && stock.price !== prevPrice) {
        const isUp = stock.price > prevPrice;
        const pulseColor = isUp
          ? (colorTheme === 'neon' ? '#00E5FF' : '#00FF94')
          : '#FF3B5C';

        const rect = svg.select(`#rect-${stock.symbol}`);
        if (!rect.empty()) {
          // Set bright stroke pulse
          rect
            .style('stroke', pulseColor)
            .style('stroke-width', '3px')
            .transition()
            .duration(800)
            .style('stroke', searchSymbol && stock.symbol === searchSymbol ? '3px' : 'rgba(255, 255, 255, 0.08)')
            .style('stroke-width', searchSymbol && stock.symbol === searchSymbol ? '3px' : '1px');
        }
      }
      // Record current price for next tick comparison
      prevPricesRef.current[stock.symbol] = stock.price;
    });

    // 5. Automatic search highlighting and zooming tooltip trigger
    if (searchSymbol) {
      const matchedNode = leaves.find((d: any) => d.data.symbol === searchSymbol);
      if (matchedNode) {
        const rectEl = document.getElementById(`rect-${searchSymbol}`);
        if (rectEl) {
          const bbox = rectEl.getBoundingClientRect();
          const tX = bbox.left + bbox.width / 2;
          const tY = bbox.top + bbox.height / 2;
          onShowTooltip(matchedNode.data, tX, tY);
        }
      }
    }

  }, [dimensions, stocks, sizeBy, colorTheme, perfFilter, currentSector, searchSymbol]);

  // Synchronize hover state from other elements (like highlights from StatsPanel)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('g.cell').each(function (d: any) {
      if (!d) return;
      const cell = d3.select(this);
      const isHovered = hoveredSymbol === d.data.symbol;
      
      if (isHovered) {
        cell.raise();
        cell.select('rect')
          .transition()
          .duration(120)
          .style('stroke', colorTheme === 'neon' ? '#00E5FF' : '#00FF94')
          .style('stroke-width', '2px');
      } else if (searchSymbol && d.data.symbol === searchSymbol) {
        // Retain search stroke
      } else {
        cell.select('rect')
          .transition()
          .duration(120)
          .style('stroke', 'rgba(255, 255, 255, 0.08)')
          .style('stroke-width', '1px');
      }
    });
  }, [hoveredSymbol, searchSymbol, colorTheme]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[420px] bg-surface-lowest rounded-2xl border border-border-glass overflow-hidden shadow-2xl relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full block"
      />
    </div>
  );
};

export default TreemapChart;
