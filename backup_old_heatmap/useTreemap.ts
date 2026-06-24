import { useMemo } from 'react';
import * as d3 from 'd3';
import type { Stock } from '../../services/mockDataEngine';
import type { TreemapNode } from './heatmap.types';

interface UseTreemapParams {
  stocks: Stock[];
  width: number;
  height: number;
  zoomSector: string | null;
}

export function useTreemap({ stocks, width, height, zoomSector }: UseTreemapParams) {
  return useMemo(() => {
    if (width <= 0 || height <= 0 || stocks.length === 0) {
      return { leafNodes: [], sectorNodes: [] };
    }

    // Group stocks by sector
    const sectorsMap: Record<string, Stock[]> = {};
    stocks.forEach(stock => {
      if (!sectorsMap[stock.sector]) {
        sectorsMap[stock.sector] = [];
      }
      sectorsMap[stock.sector].push(stock);
    });

    let rootData: any;

    if (zoomSector) {
      // Zoomed view: only display the selected sector's stocks
      const sectorStocks = sectorsMap[zoomSector] || [];
      if (sectorStocks.length === 0) {
        return { leafNodes: [], sectorNodes: [] };
      }
      rootData = {
        name: zoomSector,
        children: sectorStocks.map(s => ({
          id: s.symbol,
          name: s.name,
          symbol: s.symbol,
          value: s.marketCap, // Size by market cap
          sector: s.sector,
          price: s.price,
          changePercent: s.changePercent,
          volume: s.volume
        }))
      };
    } else {
      // Full Market view: hierarchy is Market -> Sector -> Stocks
      const children: any[] = [];
      Object.keys(sectorsMap).forEach(sectorName => {
        const sectorStocks = sectorsMap[sectorName];
        if (sectorStocks.length > 0) {
          children.push({
            name: sectorName,
            sector: sectorName,
            children: sectorStocks.map(s => ({
              id: s.symbol,
              name: s.name,
              symbol: s.symbol,
              value: s.marketCap,
              sector: s.sector,
              price: s.price,
              changePercent: s.changePercent,
              volume: s.volume
            }))
          });
        }
      });
      rootData = {
        name: 'Market',
        children
      };
    }

    // Create D3 hierarchy
    const hierarchy = d3.hierarchy(rootData)
      .sum(d => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Configure treemap layout based on zoom view
    const treemapLayout = d3.treemap<any>()
      .size([width, height])
      .paddingOuter(zoomSector ? 0 : 3)
      .paddingTop(zoomSector ? 0 : 24) // reserve space for sector header label
      .paddingInner(2)
      .round(true);

    // Compute coordinates
    treemapLayout(hierarchy);

    const leafNodes: TreemapNode[] = [];
    const sectorNodes: TreemapNode[] = [];

    // Traverse hierarchy to separate leaf (stock) and sector group nodes
    hierarchy.descendants().forEach(node => {
      const nodeData = node.data;
      const treemapNode: TreemapNode = {
        id: nodeData.id || nodeData.name,
        name: nodeData.name,
        symbol: nodeData.symbol,
        value: node.value || 0,
        changePercent: nodeData.changePercent,
        price: nodeData.price,
        volume: nodeData.volume,
        sector: nodeData.sector,
        x0: (node as any).x0,
        y0: (node as any).y0,
        x1: (node as any).x1,
        y1: (node as any).y1
      };

      if (node.depth === 2 && !zoomSector) {
        // Full view: leaf node (stock) is at depth 2 (Root(0) -> Sector(1) -> Stock(2))
        leafNodes.push(treemapNode);
      } else if (node.depth === 1 && zoomSector) {
        // Zoomed view: leaf node is at depth 1 (Root/Sector(0) -> Stock(1))
        leafNodes.push(treemapNode);
      } else if (node.depth === 1 && !zoomSector) {
        // Full view: sector nodes are at depth 1
        sectorNodes.push(treemapNode);
      }
    });

    return { leafNodes, sectorNodes };
  }, [stocks, width, height, zoomSector]);
}
