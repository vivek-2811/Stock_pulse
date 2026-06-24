import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Holding {
  symbol: string;
  quantity: number;
  avgBuyPrice: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee: number;
  date: string;
  realizedPnL?: number;
}

interface PortfolioState {
  holdings: Holding[];
  transactions: Transaction[];
  realizedPnL: number;
  
  buyStock: (symbol: string, quantity: number, price: number) => void;
  sellStock: (symbol: string, quantity: number, price: number) => void;
  updateHolding: (symbol: string, quantity: number, avgBuyPrice: number) => void;
  removeHolding: (symbol: string) => void;
  clearPortfolio: () => void;
}

const DEFAULT_HOLDINGS: Holding[] = [
  { symbol: 'AAPL', quantity: 15, avgBuyPrice: 175.50 },
  { symbol: 'NVDA', quantity: 20, avgBuyPrice: 850.00 },
  { symbol: 'MSFT', quantity: 10, avgBuyPrice: 410.20 },
  { symbol: 'KO', quantity: 50, avgBuyPrice: 59.80 }
];

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 't-1', symbol: 'AAPL', type: 'BUY', quantity: 15, price: 175.50, fee: 1.32, date: '2026-05-15T10:30:00Z' },
  { id: 't-2', symbol: 'NVDA', type: 'BUY', quantity: 20, price: 850.00, fee: 8.50, date: '2026-05-20T14:15:00Z' },
  { id: 't-3', symbol: 'MSFT', type: 'BUY', quantity: 10, price: 410.20, fee: 2.05, date: '2026-06-01T09:45:00Z' },
  { id: 't-4', symbol: 'KO', type: 'BUY', quantity: 50, price: 59.80, fee: 1.49, date: '2026-06-10T11:00:00Z' }
];

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: DEFAULT_HOLDINGS,
      transactions: DEFAULT_TRANSACTIONS,
      realizedPnL: 125.40, // initial simulated realized gains

      buyStock: (symbol, quantity, price) => set((state) => {
        const totalCost = quantity * price;
        const fee = Math.max(0.99, Number((totalCost * 0.0005).toFixed(2))); // 0.05% fee, min $0.99
        
        const existing = state.holdings.find(h => h.symbol === symbol);
        let newHoldings: Holding[];

        if (existing) {
          const newQty = existing.quantity + quantity;
          const newAvg = (existing.quantity * existing.avgBuyPrice + quantity * price) / newQty;
          newHoldings = state.holdings.map(h =>
            h.symbol === symbol
              ? { symbol, quantity: newQty, avgBuyPrice: Number(newAvg.toFixed(2)) }
              : h
          );
        } else {
          newHoldings = [...state.holdings, { symbol, quantity, avgBuyPrice: price }];
        }

        const newTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          symbol,
          type: 'BUY',
          quantity,
          price,
          fee,
          date: new Date().toISOString()
        };

        return {
          holdings: newHoldings,
          transactions: [newTx, ...state.transactions]
        };
      }),

      sellStock: (symbol, quantity, price) => set((state) => {
        const existing = state.holdings.find(h => h.symbol === symbol);
        if (!existing) return {}; // not owned

        const totalRevenue = quantity * price;
        const fee = Math.max(0.99, Number((totalRevenue * 0.0005).toFixed(2)));
        
        const soldCost = quantity * existing.avgBuyPrice;
        const profit = totalRevenue - soldCost - fee;

        let newHoldings: Holding[];
        const remainingQty = existing.quantity - quantity;

        if (remainingQty <= 0) {
          newHoldings = state.holdings.filter(h => h.symbol !== symbol);
        } else {
          newHoldings = state.holdings.map(h =>
            h.symbol === symbol
              ? { ...h, quantity: remainingQty }
              : h
          );
        }

        const newTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          symbol,
          type: 'SELL',
          quantity,
          price,
          fee,
          date: new Date().toISOString(),
          realizedPnL: Number(profit.toFixed(2))
        };

        return {
          holdings: newHoldings,
          transactions: [newTx, ...state.transactions],
          realizedPnL: Number((state.realizedPnL + profit).toFixed(2))
        };
      }),

      updateHolding: (symbol, quantity, avgBuyPrice) => set((state) => {
        if (quantity <= 0) {
          return { holdings: state.holdings.filter(h => h.symbol !== symbol) };
        }
        return {
          holdings: state.holdings.map(h =>
            h.symbol === symbol ? { symbol, quantity, avgBuyPrice } : h
          )
        };
      }),

      removeHolding: (symbol) => set((state) => ({
        holdings: state.holdings.filter(h => h.symbol !== symbol)
      })),

      clearPortfolio: () => set({ holdings: [], transactions: [], realizedPnL: 0 })
    }),
    {
      name: 'stockpulse-portfolio-storage',
      partialize: (state) => ({
        holdings: state.holdings,
        transactions: state.transactions,
        realizedPnL: state.realizedPnL
      })
    }
  )
);
