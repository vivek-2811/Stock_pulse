import { create } from 'zustand';

export type BenchmarkType = 'SP500' | 'NASDAQ' | 'NONE';

export interface PrecomputedSnapshot {
  date: string;
  portfolioValue: number;
  todaysPnl: number;
  totalPnl: number;
  totalReturnPercent: number;
  healthScore: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  beta: number;
  valueAtRisk95: number;
  riskLabel: 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK';
  allocations: { label: string; value: number; color: string }[];
  holdingsDrift: { symbol: string; currentWeight: number; targetWeight: number; deviationPct: number }[];
}

interface PortfolioAnalyticsState {
  hoverIdx: number | null;
  isHovering: boolean;
  selectedBenchmark: BenchmarkType;
  precomputedSnapshots: PrecomputedSnapshot[];
  
  setHoverIdx: (idx: number | null) => void;
  setIsHovering: (hovering: boolean) => void;
  setSelectedBenchmark: (bench: BenchmarkType) => void;
  setPrecomputedSnapshots: (snapshots: PrecomputedSnapshot[]) => void;
}

export const usePortfolioAnalyticsStore = create<PortfolioAnalyticsState>((set) => ({
  hoverIdx: null,
  isHovering: false,
  selectedBenchmark: 'SP500',
  precomputedSnapshots: [],
  
  setHoverIdx: (hoverIdx) => set({ hoverIdx }),
  setIsHovering: (isHovering) => set({ isHovering }),
  setSelectedBenchmark: (selectedBenchmark) => set({ selectedBenchmark }),
  setPrecomputedSnapshots: (precomputedSnapshots) => set({ precomputedSnapshots }),
}));
