import type { Stock } from '../../services/mockDataEngine';

export interface HeatmapStock extends Stock {
  // Additional calculated fields if needed
}

export interface TreemapNode {
  id: string;
  name: string;
  symbol?: string; // only for leaf nodes (stocks)
  value: number; // marketCap (used by D3 treemap)
  changePercent?: number;
  price?: number;
  volume?: number;
  sector: string;
  children?: TreemapNode[];
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
}

export interface HeatmapFilters {
  marketCap: 'All' | 'Mega' | 'Large' | 'Mid' | 'Small';
  sector: string; // 'All' or a specific sector name
  performance: 'All' | 'Gainers' | 'Losers';
  volume: 'All' | 'High' | 'Medium' | 'Low'; // High (> 10M), Medium (1M - 10M), Low (< 1M)
  search: string;
}
