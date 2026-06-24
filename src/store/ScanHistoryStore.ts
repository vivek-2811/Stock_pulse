import { create } from 'zustand';
import type { ScreenerFilterState } from './SavedScreensStore';

export interface ScanHistoryEntry {
  id: string;
  timestamp: string;
  filters: ScreenerFilterState;
  matchCount: number;
  topStocks: Array<{ symbol: string; name: string; score: number }>;
}

interface ScanHistoryState {
  history: ScanHistoryEntry[];
  addToHistory: (entry: Omit<ScanHistoryEntry, 'id'>) => void;
  clearHistory: () => void;
}

export const useScanHistoryStore = create<ScanHistoryState>()((set) => ({
  history: [],

  addToHistory: (entry) =>
    set((state) => ({
      history: [
        { ...entry, id: `scan-${Date.now()}` },
        ...state.history,
      ].slice(0, 20),
    })),

  clearHistory: () => set({ history: [] }),
}));
