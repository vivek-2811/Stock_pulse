import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ScreenerFilterState {
  priceRange: string | null;
  marketCap: string | null;
  volume: string | null;
  performance: string | null;
  sectors: string[];
  beta: string | null;
  searchQuery: string;
}

export interface RunHistoryEntry {
  timestamp: string;
  matchCount: number;
}

export interface SavedScreen {
  id: string;
  name: string;
  filters: ScreenerFilterState;
  createdAt: string;
  lastRunAt: string | null;
  matchCount: number;
  topStock: string | null;
  runHistory: RunHistoryEntry[]; // last 10 runs
  hasAlert: boolean;
}

interface SavedScreensState {
  screens: SavedScreen[];
  saveScreen: (name: string, filters: ScreenerFilterState, matchCount: number, topStock: string | null) => void;
  deleteScreen: (id: string) => void;
  renameScreen: (id: string, name: string) => void;
  updateRunStats: (id: string, matchCount: number, topStock: string | null) => void;
  toggleAlert: (id: string) => void;
}

export const useSavedScreensStore = create<SavedScreensState>()(
  persist(
    (set) => ({
      screens: [],

      saveScreen: (name, filters, matchCount, topStock) => {
        const now = new Date().toISOString();
        const newScreen: SavedScreen = {
          id: `screen-${Date.now()}`,
          name,
          filters,
          createdAt: now,
          lastRunAt: now,
          matchCount,
          topStock,
          runHistory: [{ timestamp: now, matchCount }],
          hasAlert: false,
        };
        set((state) => ({ screens: [newScreen, ...state.screens] }));
      },

      deleteScreen: (id) =>
        set((state) => ({ screens: state.screens.filter((s) => s.id !== id) })),

      renameScreen: (id, name) =>
        set((state) => ({
          screens: state.screens.map((s) => (s.id === id ? { ...s, name } : s)),
        })),

      updateRunStats: (id, matchCount, topStock) =>
        set((state) => ({
          screens: state.screens.map((s) => {
            if (s.id !== id) return s;
            const now = new Date().toISOString();
            const newHistory = [{ timestamp: now, matchCount }, ...s.runHistory].slice(0, 10);
            return { ...s, lastRunAt: now, matchCount, topStock, runHistory: newHistory };
          }),
        })),

      toggleAlert: (id) =>
        set((state) => ({
          screens: state.screens.map((s) =>
            s.id === id ? { ...s, hasAlert: !s.hasAlert } : s
          ),
        })),
    }),
    { name: 'stockpulse-saved-screens' }
  )
);
