import React, { createContext, useContext } from 'react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { useAlertStore } from '../store/useAlertStore';
import { useSavedScreensStore } from '../store/SavedScreensStore';
import { useCopilotStore } from '../store/useCopilotStore';
import { useToast } from './toasts/ToastProvider';

interface DemoResetContextProps {
  resetDemoWorkspace: () => void;
}

const DemoResetContext = createContext<DemoResetContextProps | undefined>(undefined);

export const useDemoReset = () => {
  const context = useContext(DemoResetContext);
  if (!context) {
    throw new Error('useDemoReset must be used within a DemoResetProvider');
  }
  return context;
};

export const DemoResetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const resetDemoWorkspace = () => {
    // 1. Reset Portfolio Store to original mock holdings & realized PnL
    usePortfolioStore.setState({
      holdings: [
        { symbol: 'AAPL', quantity: 15, avgBuyPrice: 175.50 },
        { symbol: 'NVDA', quantity: 20, avgBuyPrice: 850.00 },
        { symbol: 'MSFT', quantity: 10, avgBuyPrice: 410.20 },
        { symbol: 'KO', quantity: 50, avgBuyPrice: 59.80 }
      ],
      transactions: [
        { id: 't-1', symbol: 'AAPL', type: 'BUY', quantity: 15, price: 175.50, fee: 1.32, date: '2026-05-15T10:30:00Z' },
        { id: 't-2', symbol: 'NVDA', type: 'BUY', quantity: 20, price: 850.00, fee: 8.50, date: '2026-05-20T14:15:00Z' },
        { id: 't-3', symbol: 'MSFT', type: 'BUY', quantity: 10, price: 410.20, fee: 2.05, date: '2026-06-01T09:45:00Z' },
        { id: 't-4', symbol: 'KO', type: 'BUY', quantity: 50, price: 59.80, fee: 1.49, date: '2026-06-10T11:00:00Z' }
      ],
      realizedPnL: 125.40
    });

    // 2. Reset Watchlists Store to original preset watchlists
    useWatchlistStore.setState({
      watchlists: [
        { id: 'list-1', name: 'Tech Leaders', symbols: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'AMZN'] },
        { id: 'list-2', name: 'Defensive & Income', symbols: ['KO', 'PEP', 'WMT', 'JPM', 'V', 'DIS'] }
      ],
      activeListId: 'list-1'
    });

    // 3. Reset Alerts and seed default notifications
    useAlertStore.setState({
      alerts: [],
      notifications: [
        {
          id: 'n-1',
          timestamp: new Date().toISOString(),
          title: 'Workspace Initialized',
          message: 'Workspace portfolio, watchlist, and screens reset to recruiter demo defaults.',
          isRead: false
        },
        {
          id: 'n-2',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          title: 'Macro Alert',
          message: 'Regime transitioned to Risk-On. Advanced index breadth registered at 71%.',
          isRead: false
        },
        {
          id: 'n-3',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          title: 'Ticker Watch',
          message: 'NVDA rose above $920, crossing your key tracking boundary.',
          isRead: true
        }
      ]
    });

    // 4. Reset Screener Pro Saved Screens
    useSavedScreensStore.setState({
      screens: [
        {
          id: 'screen-preset-1',
          name: 'AI & Cloud Breakouts',
          filters: {
            priceRange: '100+',
            marketCap: 'Large Cap',
            volume: 'High',
            performance: 'High Momentum',
            sectors: ['Technology', 'Communication'],
            beta: 'High Beta',
            searchQuery: '',
          },
          createdAt: new Date().toISOString(),
          lastRunAt: new Date().toISOString(),
          matchCount: 14,
          topStock: 'NVDA',
          runHistory: [{ timestamp: new Date().toISOString(), matchCount: 14 }],
          hasAlert: true,
        },
        {
          id: 'screen-preset-2',
          name: 'High Yield Dividend Anchors',
          filters: {
            priceRange: '10-50',
            marketCap: 'Mid Cap',
            volume: 'Medium',
            performance: 'Top Gainers',
            sectors: ['Utilities', 'Financials'],
            beta: 'Low Beta',
            searchQuery: '',
          },
          createdAt: new Date().toISOString(),
          lastRunAt: new Date().toISOString(),
          matchCount: 8,
          topStock: 'KO',
          runHistory: [{ timestamp: new Date().toISOString(), matchCount: 8 }],
          hasAlert: false,
        }
      ]
    });

    // 5. Reset Copilot history with a welcome message
    useCopilotStore.setState({
      chats: [
        {
          id: 'chat-welcome',
          title: 'Welcome Analyst',
          messages: [
            {
              id: 'msg-welcome',
              role: 'assistant',
              content: 'Hello, Recruiter! I am your AI Market Copilot. You can ask me to analyze your portfolio health, assess watchlist sentiment, or run a smart scan.',
              timestamp: new Date().toISOString()
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pinned: false,
          mode: 'general',
          persona: 'strategist'
        }
      ],
      activeChatId: 'chat-welcome'
    });

    // 6. Show success toast notification
    showToast('Demo workspace successfully reset to factory defaults.', 'success');
  };

  return (
    <DemoResetContext.Provider value={{ resetDemoWorkspace }}>
      {children}
    </DemoResetContext.Provider>
  );
};
