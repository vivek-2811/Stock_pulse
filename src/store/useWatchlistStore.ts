import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMarketStore } from './useMarketStore';

export interface WatchlistItemMetadata {
  addedAt: string;     // ISO Date string
  addedPrice: number;  // Price of the stock when added
  notes?: string;      // User notes per stock
  isPinned?: boolean;  // Pin state to keep stock at top
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
  itemsMetadata?: Record<string, WatchlistItemMetadata>;
}

export interface WatchlistState {
  watchlists: Watchlist[];
  activeListId: string;
  createWatchlist: (name: string) => void;
  deleteWatchlist: (id: string) => void;
  renameWatchlist: (id: string, name: string) => void;
  addToWatchlist: (listId: string, symbol: string) => void;
  removeFromWatchlist: (listId: string, symbol: string) => void;
  reorderSymbols: (listId: string, symbols: string[]) => void;
  setActiveListId: (id: string) => void;
  togglePinSymbol: (listId: string, symbol: string) => void;
  updateSymbolNote: (listId: string, symbol: string, note: string) => void;
}

const DEFAULT_LISTS: Watchlist[] = [
  { id: 'list-1', name: 'Tech Leaders', symbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'AMZN'] },
  { id: 'list-2', name: 'Defensive & Income', symbols: ['KO', 'PEP', 'WMT', 'JPM', 'V', 'DIS'] }
];

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      watchlists: DEFAULT_LISTS,
      activeListId: 'list-1',
      createWatchlist: (name) => set((state) => {
        const id = `list-${Date.now()}`;
        return {
          watchlists: [...state.watchlists, { id, name, symbols: [], itemsMetadata: {} }],
          activeListId: id
        };
      }),
      deleteWatchlist: (id) => set((state) => {
        const remaining = state.watchlists.filter(wl => wl.id !== id);
        return {
          watchlists: remaining,
          activeListId: state.activeListId === id ? (remaining[0]?.id || '') : state.activeListId
        };
      }),
      renameWatchlist: (id, name) => set((state) => ({
        watchlists: state.watchlists.map(wl => wl.id === id ? { ...wl, name } : wl)
      })),
      addToWatchlist: (listId, symbol) => set((state) => {
        const marketState = useMarketStore.getState();
        const stock = marketState.stocksBySymbol?.[symbol] || marketState.stocks.find(s => s.symbol === symbol);
        const addedPrice = stock ? stock.price : 0;
        const addedAt = new Date().toISOString();

        return {
          watchlists: state.watchlists.map(wl => {
            if (wl.id !== listId) return wl;
            if (wl.symbols.includes(symbol)) return wl;
            const itemsMetadata = wl.itemsMetadata || {};
            return {
              ...wl,
              symbols: [...wl.symbols, symbol],
              itemsMetadata: {
                ...itemsMetadata,
                [symbol]: {
                  addedAt,
                  addedPrice,
                  isPinned: false,
                  notes: ''
                }
              }
            };
          })
        };
      }),
      removeFromWatchlist: (listId, symbol) => set((state) => ({
        watchlists: state.watchlists.map(wl => {
          if (wl.id !== listId) return wl;
          const itemsMetadata = { ...(wl.itemsMetadata || {}) };
          delete itemsMetadata[symbol];
          return {
            ...wl,
            symbols: wl.symbols.filter(s => s !== symbol),
            itemsMetadata
          };
        })
      })),
      reorderSymbols: (listId, symbols) => set((state) => ({
        watchlists: state.watchlists.map(wl => wl.id === listId ? { ...wl, symbols } : wl)
      })),
      setActiveListId: (activeListId) => set({ activeListId }),
      togglePinSymbol: (listId, symbol) => set((state) => ({
        watchlists: state.watchlists.map(wl => {
          if (wl.id !== listId) return wl;
          const itemsMetadata = wl.itemsMetadata || {};
          const currentMeta = itemsMetadata[symbol] || { addedAt: new Date().toISOString(), addedPrice: 0 };
          return {
            ...wl,
            itemsMetadata: {
              ...itemsMetadata,
              [symbol]: {
                ...currentMeta,
                isPinned: !currentMeta.isPinned
              }
            }
          };
        })
      })),
      updateSymbolNote: (listId, symbol, note) => set((state) => ({
        watchlists: state.watchlists.map(wl => {
          if (wl.id !== listId) return wl;
          const itemsMetadata = wl.itemsMetadata || {};
          const currentMeta = itemsMetadata[symbol] || { addedAt: new Date().toISOString(), addedPrice: 0 };
          return {
            ...wl,
            itemsMetadata: {
              ...itemsMetadata,
              [symbol]: {
                ...currentMeta,
                notes: note
              }
            }
          };
        })
      }))
    }),
    {
      name: 'stockpulse-watchlist-storage',
    }
  )
);

