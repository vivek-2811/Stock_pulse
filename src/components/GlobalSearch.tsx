import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, X, Clock, Star, ArrowRight, CornerDownLeft, Sparkles,
  LayoutDashboard, Briefcase, BarChart3, Filter, Layers, Globe, 
  Scale, Cpu, Settings, Pause, Play, Sun, Moon, Zap, Bot, Newspaper, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useMarketStore } from '../store/useMarketStore';
import { mockDataEngine } from '../services/mockDataEngine';
import type { Stock } from '../services/mockDataEngine';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { LiveTickText } from './LiveTickText';
import { AnimatePresence, motion } from 'framer-motion';


interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandAction {
  id: string;
  name: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

interface CommandItem {
  id: string;
  name: string;
  subtitle: string;
  shortcut?: string;
  icon: React.ComponentType<any>;
  type: 'command';
  action: () => void;
}

interface StockItem extends Stock {
  type: 'stock';
}

type PaletteItem = CommandItem | StockItem;

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const theme = useSettingsStore(state => state.theme);
  const setTheme = useSettingsStore(state => state.setTheme);
  const [query, setQuery] = useState('');
  const [stockResults, setStockResults] = useState<Stock[]>([]);
  const [commandResults, setCommandResults] = useState<CommandAction[]>([]);
  const [recent, setRecent] = useState<string[]>(() => {
    const saved = localStorage.getItem('recent_searches');
    return saved ? JSON.parse(saved) : ['AAPL', 'NVDA', 'TSLA'];
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { stocks } = useMarketStore();
  const activeWatchlistId = useWatchlistStore(state => state.activeListId);
  const addToWatchlist = useWatchlistStore(state => state.addToWatchlist);
  const watchlists = useWatchlistStore(state => state.watchlists);
  const activeWatchlist = watchlists.find(wl => wl.id === activeWatchlistId);

  // Command palette routes
  const commands: CommandAction[] = React.useMemo(() => [
    { id: 'c-1', name: 'Open Terminal Dashboard', category: 'Navigation', shortcut: 'G + D', action: () => navigate('/dashboard') },
    { id: 'c-2', name: 'Open Global Markets Page', category: 'Navigation', shortcut: 'G + M', action: () => navigate('/markets') },
    { id: 'c-3', name: 'Open Quantitative Screener', category: 'Navigation', shortcut: 'G + S', action: () => navigate('/screener') },
    { id: 'c-4', name: 'Open Sector Treemap Heatmap', category: 'Navigation', shortcut: 'G + H', action: () => navigate('/heatmap') },
    { id: 'c-5', name: 'Open 3D Liquidity Globe', category: 'Navigation', shortcut: 'G + G', action: () => navigate('/globe') },
    { id: 'c-6', name: 'Open Portfolio Hub', category: 'Navigation', shortcut: 'G + P', action: () => navigate('/portfolio') },
    { id: 'c-7', name: 'Open Transaction Audit Ledger', category: 'Navigation', shortcut: 'G + T', action: () => navigate('/transactions') },
    { id: 'c-8', name: 'Open AI Copilot Analyst', category: 'Navigation', shortcut: 'G + C', action: () => navigate('/copilot') },
    { id: 'c-10', name: 'Open Backtesting Sandbox', category: 'Navigation', shortcut: 'G + B', action: () => navigate('/backtest') },
    { id: 'c-11', name: 'Open System Status Center', category: 'Navigation', shortcut: 'G + T', action: () => navigate('/system-status') },
    { id: 'c-12', name: 'Open Recruiter Showcase', category: 'Navigation', shortcut: 'G + A', action: () => navigate('/showcase') },
    { id: 'c-9', name: 'Clear All Local Cache Data', category: 'System', action: () => { localStorage.clear(); window.location.reload(); } }
  ], [navigate]);

  // Filter stocks & commands based on input
  useEffect(() => {
    setSelectedIndex(0);
    
    if (!query) {
      setStockResults([]);
      setCommandResults([]);
      return;
    }

    const cleanQuery = query.toLowerCase();

    // 1. Stock searches
    const matchStocks = stocks.filter(
      s => s.symbol.toLowerCase().includes(cleanQuery) || s.name.toLowerCase().includes(cleanQuery)
    );
    setStockResults(matchStocks.slice(0, 4));

    // 2. Command searches
    if (cleanQuery.startsWith('> ') || cleanQuery.startsWith('>')) {
      const commandQuery = cleanQuery.replace('>', '').trim();
      const matchCommands = commands.filter(
        c => c.name.toLowerCase().includes(commandQuery) || c.category.toLowerCase().includes(commandQuery)
      );
      setCommandResults(matchCommands);
    } else {
      const matchCommands = commands.filter(
        c => c.name.toLowerCase().includes(cleanQuery) || c.category.toLowerCase().includes(cleanQuery)
      );
      setCommandResults(matchCommands.slice(0, 3));
    }
  }, [query, stocks, commands]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  // Define static commands
  const staticCommands: CommandItem[] = [
    {
      id: 'cmd-ai',
      name: 'Analyze Portfolio',
      subtitle: 'Generate portfolio diagnostics, HHI metrics, and rebalancing recommendations',
      shortcut: 'Ctrl+K > Enter',
      icon: Sparkles,
      type: 'command',
      action: () => { navigate('/portfolio?aiAnalysis=true'); onClose(); }
    },
    {
      id: 'cmd-dashboard',
      name: 'Go to Dashboard',
      subtitle: 'Navigate to the main dashboard overview',
      shortcut: 'G D',
      icon: LayoutDashboard,
      type: 'command',
      action: () => { navigate('/dashboard'); onClose(); }
    },
    {
      id: 'cmd-portfolio',
      name: 'Go to Portfolio Hub',
      subtitle: 'View your simulated holdings and balance statistics',
      shortcut: 'G P',
      icon: Briefcase,
      type: 'command',
      action: () => { navigate('/portfolio'); onClose(); }
    },
    {
      id: 'cmd-watchlist',
      name: 'Go to Watchlist',
      subtitle: 'Manage and track your customized watchlists',
      shortcut: 'G W',
      icon: Star,
      type: 'command',
      action: () => { navigate('/watchlist'); onClose(); }
    },
    {
      id: 'cmd-markets',
      name: 'Go to Global Markets',
      subtitle: 'Explore index tickers and full stock listings',
      shortcut: 'G M',
      icon: BarChart3,
      type: 'command',
      action: () => { navigate('/markets'); onClose(); }
    },
    {
      id: 'cmd-screener',
      name: 'Open Screener',
      subtitle: 'Filter and screen stocks based on sector or performance',
      shortcut: 'G S',
      icon: Filter,
      type: 'command',
      action: () => { navigate('/screener'); onClose(); }
    },
    {
      id: 'cmd-screener-pro',
      name: 'Open Screener Pro',
      subtitle: 'Professional stock discovery platform with insights and scoring',
      icon: Zap,
      type: 'command',
      action: () => { navigate('/screener-pro'); onClose(); }
    },
    {
      id: 'cmd-screener-momentum',
      name: 'Run Momentum Scan',
      subtitle: 'High volume movers with strong price momentum',
      icon: Zap,
      type: 'command',
      action: () => { navigate('/screener-pro?preset=momentum'); onClose(); }
    },
    {
      id: 'cmd-screener-ai',
      name: 'Run AI Stocks Scan',
      subtitle: 'Large-cap technology sector leaders',
      icon: Zap,
      type: 'command',
      action: () => { navigate('/screener-pro?preset=ai'); onClose(); }
    },
    {
      id: 'cmd-screener-save',
      name: 'Save Current Screen',
      subtitle: 'Open Screener Pro and save the current filter set',
      icon: Zap,
      type: 'command',
      action: () => { navigate('/screener-pro?action=save'); onClose(); }
    },
    {
      id: 'cmd-copilot',
      name: 'Open AI Market Copilot',
      subtitle: 'Bloomberg × TradingView × Perplexity — your institutional intelligence layer',
      icon: Bot,
      type: 'command',
      action: () => { navigate('/copilot'); onClose(); }
    },
    {
      id: 'cmd-copilot-portfolio',
      name: 'Analyze My Portfolio',
      subtitle: 'Get AI risk, diversification and rebalancing analysis',
      icon: Bot,
      type: 'command',
      action: () => { navigate('/copilot?prompt=Analyze+my+portfolio+risk+and+diversification'); onClose(); }
    },
    {
      id: 'cmd-copilot-watchlist',
      name: 'Analyze My Watchlist',
      subtitle: 'AI analysis of watchlist performance vs the market',
      icon: Bot,
      type: 'command',
      action: () => { navigate('/copilot?prompt=How+is+my+watchlist+performing+vs+the+market'); onClose(); }
    },
    {
      id: 'cmd-copilot-market',
      name: 'Analyze Market Conditions',
      subtitle: 'Get market regime, breadth and sector leadership summary',
      icon: Bot,
      type: 'command',
      action: () => { navigate('/copilot?prompt=Summarize+the+current+market+regime+and+conditions'); onClose(); }
    },
    {
      id: 'cmd-copilot-compare',
      name: 'Compare Two Stocks',
      subtitle: 'AI side-by-side comparison with opportunity scores',
      icon: Bot,
      type: 'command',
      action: () => { navigate('/copilot?prompt=Compare+AAPL+vs+MSFT'); onClose(); }
    },
    {
      id: 'cmd-news',
      name: 'Open News Center',
      subtitle: 'Bloomberg-style news & catalyst intelligence platform',
      icon: Newspaper,
      type: 'command',
      action: () => { navigate('/news'); onClose(); }
    },
    {
      id: 'cmd-news-earnings',
      name: 'Open Earnings Calendar',
      subtitle: 'Upcoming earnings with EPS estimates and surprise analysis',
      icon: Newspaper,
      type: 'command',
      action: () => { navigate('/news?tab=earnings'); onClose(); }
    },
    {
      id: 'cmd-news-mynews',
      name: 'Open My News',
      subtitle: 'News filtered to your watchlist and portfolio holdings',
      icon: Newspaper,
      type: 'command',
      action: () => { navigate('/news?tab=news&cat=My+News'); onClose(); }
    },
    {
      id: 'cmd-news-trending',
      name: 'Open Trending Stocks',
      subtitle: 'Volume, momentum and news-based trending scores',
      icon: Newspaper,
      type: 'command',
      action: () => { navigate('/news'); onClose(); }
    },
    {
      id: 'cmd-heatmap',
      name: 'Open Market Heatmap',
      subtitle: 'Visualize market performance by sector weights',
      shortcut: 'G H',
      icon: Layers,
      type: 'command',
      action: () => { navigate('/heatmap'); onClose(); }
    },
    {
      id: 'cmd-globe',
      name: 'Open 3D World Markets',
      subtitle: 'Interact with global markets on a 3D globe',
      shortcut: 'G G',
      icon: Globe,
      type: 'command',
      action: () => { navigate('/globe'); onClose(); }
    },
    {
      id: 'cmd-compare',
      name: 'Compare Equities',
      subtitle: 'Perform side-by-side comparison of active equities',
      shortcut: 'G C',
      icon: Scale,
      type: 'command',
      action: () => { navigate('/compare'); onClose(); }
    },
    {
      id: 'cmd-copilot-panel',
      name: 'Open AI Market Copilot',
      subtitle: 'Talk to the AI Market Copilot cross-platform assistant',
      shortcut: 'G C',
      icon: Bot,
      type: 'command',
      action: () => { navigate('/copilot'); onClose(); }
    },
    {
      id: 'cmd-backtest',
      name: 'Open Backtesting Sandbox',
      subtitle: 'Simulate custom portfolio weight returns against SPY',
      shortcut: 'G B',
      icon: Briefcase,
      type: 'command',
      action: () => { navigate('/backtest'); onClose(); }
    },
    {
      id: 'cmd-system-status',
      name: 'Open System Status Center',
      subtitle: 'Examine Lighthouse scores and chunk telemetry parameters',
      shortcut: 'G T',
      icon: Activity,
      type: 'command',
      action: () => { navigate('/system-status'); onClose(); }
    },
    {
      id: 'cmd-showcase',
      name: 'Open Showcase Page',
      subtitle: 'Interactive presentation layout for recruiters',
      shortcut: 'G A',
      icon: Globe,
      type: 'command',
      action: () => { navigate('/showcase'); onClose(); }
    },
    {
      id: 'cmd-settings',
      name: 'Open Settings',
      subtitle: 'Configure dark/light theme and refresh intervals',
      shortcut: 'G ,',
      icon: Settings,
      type: 'command',
      action: () => { navigate('/settings'); onClose(); }
    },
    {
      id: 'cmd-toggle-simulation',
      name: 'Toggle Market Simulation',
      subtitle: mockDataEngine.isMarketOpen() ? 'Pause live price ticks' : 'Resume live price ticks',
      icon: mockDataEngine.isMarketOpen() ? Pause : Play,
      type: 'command',
      action: () => {
        mockDataEngine.toggleMarketStatus();
        onClose();
      }
    },
    {
      id: 'cmd-toggle-theme',
      name: 'Toggle Light/Dark Theme',
      subtitle: `Switch layout to ${theme === 'dark' ? 'light' : 'dark'} mode`,
      icon: theme === 'dark' ? Sun : Moon,
      type: 'command',
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        onClose();
      }
    }
  ];

  // Parse dynamic command inputs
  const getDynamicCommand = (): CommandItem | null => {
    const q = query.trim().toLowerCase();
    
    // Pattern: buy [symbol]
    if (q.startsWith('buy ')) {
      const symbol = q.substring(4).toUpperCase();
      const stock = mockDataEngine.getStocks().find(s => s.symbol === symbol);
      if (stock) {
        return {
          id: `cmd-buy-${symbol}`,
          name: `Buy ${symbol}`,
          subtitle: `Navigate to portfolio and buy shares of ${stock.name}`,
          icon: Briefcase,
          type: 'command',
          action: () => {
            navigate(`/portfolio?action=buy&symbol=${symbol}`);
            onClose();
          }
        };
      }
    }
    
    // Pattern: sell [symbol]
    if (q.startsWith('sell ')) {
      const symbol = q.substring(5).toUpperCase();
      const stock = mockDataEngine.getStocks().find(s => s.symbol === symbol);
      if (stock) {
        return {
          id: `cmd-sell-${symbol}`,
          name: `Sell ${symbol}`,
          subtitle: `Navigate to portfolio and sell shares of ${stock.name}`,
          icon: Briefcase,
          type: 'command',
          action: () => {
            navigate(`/portfolio?action=sell&symbol=${symbol}`);
            onClose();
          }
        };
      }
    }

    // Pattern: compare [sym1] [sym2]
    if (q.startsWith('compare ')) {
      const parts = q.substring(8).toUpperCase().split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        return {
          id: `cmd-compare-${parts.join('-')}`,
          name: `Compare ${parts.join(' vs ')}`,
          subtitle: `Navigate to compare page with symbols: ${parts.join(', ')}`,
          icon: Scale,
          type: 'command',
          action: () => {
            navigate(`/compare?symbols=${parts.join(',')}`);
            onClose();
          }
        };
      }
    }
    
    return null;
  };

  // Compile list of items to render
  const getPaletteItems = (): PaletteItem[] => {
    const items: PaletteItem[] = [];
    const q = query.trim().toLowerCase();

    // Check for dynamic command match
    const dynamicCmd = getDynamicCommand();
    if (dynamicCmd) {
      items.push(dynamicCmd);
    }

    if (!q) {
      // 1. Pinned Symbols at the top
      const pinned = ['AAPL', 'NVDA', 'MSFT'];
      pinned.forEach(symbol => {
        const stock = mockDataEngine.getStocks().find(s => s.symbol === symbol);
        if (stock) {
          items.push({ ...stock, type: 'stock' });
        }
      });

      // 2. Main static commands (including Analyze Portfolio)
      items.push(...staticCommands.slice(0, 5));

      // 3. Recent searches (excluding pinned)
      recent.forEach(symbol => {
        if (!pinned.includes(symbol)) {
          const stock = mockDataEngine.getStocks().find(s => s.symbol === symbol);
          if (stock) {
            items.push({ ...stock, type: 'stock' });
          }
        }
      });
    } else {
      // 1. Filter commands that match query (excluding already pushed dynamic cmd)
      const matchingCmds = staticCommands.filter(cmd => 
        (cmd.name.toLowerCase().includes(q) || cmd.subtitle.toLowerCase().includes(q)) &&
        (!dynamicCmd || cmd.id !== dynamicCmd.id)
      );
      items.push(...matchingCmds);

      // 2. Filter stocks that match query
      const matchingStocks = mockDataEngine.getStocks().filter(stock => 
        stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q)
      ).slice(0, 5).map(stock => ({ ...stock, type: 'stock' } as StockItem));
      items.push(...matchingStocks);
    }

    return items;
  };

  const allItems = getPaletteItems();

  // Reset index if allItems list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    const maxIndex = allItems.length - 1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        const item = allItems[selectedIndex];
        if (item.type === 'command') {
          item.action();
        } else {
          selectStock(item as Stock);
        }
      }
    }
  };

  const selectStock = (stock: Stock) => {
    // Add to recents
    const updatedRecent = [
      stock.symbol,
      ...recent.filter(s => s !== stock.symbol)
    ].slice(0, 5);
    setRecent(updatedRecent);
    localStorage.setItem('recent_searches', JSON.stringify(updatedRecent));
    
    onClose();
    navigate(`/stock/${stock.symbol}`);
  };

  const handleAddToWatchlist = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    if (activeWatchlistId) {
      addToWatchlist(activeWatchlistId, symbol);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-zinc-950/40 dark:bg-zinc-950/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            ref={modalRef}
            className="w-full max-w-xl md:max-w-4xl overflow-hidden rounded-2xl glass-card border border-border-glass shadow-2xl bg-[#0e1218]/95 backdrop-blur-2xl"
            onKeyDown={handleKeyDown}
          >
            {/* Search Input bar */}
            <div className="relative flex items-center border-b border-border-glass p-4">
              <Search className="w-5 h-5 text-text-muted mr-3 animate-pulse" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent text-white placeholder-text-muted focus:outline-none text-sm font-medium"
                placeholder="Type a command (e.g. > buy AAPL) or search stocks..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            {/* Split Screen Container */}
            <div className="flex divide-x divide-border-glass h-[350px]">
              
              {/* Left Column: Results List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {allItems.length > 0 ? (
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted px-3 py-1.5 flex justify-between items-center">
                      <span>{query ? 'Matched Commands & Stocks' : 'Quick Actions & Recents'}</span>
                      {!query && <span className="text-[9px] text-app-green font-bold">★ PINNED</span>}
                    </div>
                    <div className="space-y-0.5">
                      {allItems.map((item, idx) => {
                        const isSelected = idx === selectedIndex;

                        if (item.type === 'command') {
                          const Icon = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={item.action}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                                isSelected
                                  ? 'bg-app-green/10 text-white border-l-4 border-app-green shadow-glow-green-sm'
                                  : 'hover:bg-white/5 text-[#dfe2eb] border-l-4 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                                  isSelected ? 'bg-app-green/20 text-app-green' : 'bg-surface-glass border border-border-glass text-text-muted'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-semibold text-sm">{item.name}</div>
                                  <div className="text-xs text-text-muted">{item.subtitle}</div>
                                </div>
                              </div>
                              
                              {item.shortcut && (
                                <div className="bg-surface-glass border border-border-glass text-[9px] font-mono px-1.5 py-0.5 rounded text-text-muted font-bold">
                                  {item.shortcut}
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          const stock = item as StockItem;
                          const isPositive = stock.change >= 0;
                          const isAlreadyWatched = activeWatchlist?.symbols.includes(stock.symbol);

                          return (
                            <div
                              key={stock.symbol}
                              onClick={() => selectStock(stock)}
                              className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                                isSelected
                                  ? 'bg-app-green/10 text-white border-l-4 border-app-green shadow-glow-green-sm'
                                  : 'hover:bg-white/5 text-[#dfe2eb] border-l-4 border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-surface-glass border border-border-glass text-sm font-bold text-white">
                                  {stock.symbol.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{stock.symbol}</span>
                                    <span className="text-xs text-text-muted">• {stock.sector}</span>
                                  </div>
                                  <div className="text-xs text-text-muted truncate max-w-[150px] sm:max-w-[200px]">
                                    {stock.name}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="font-medium text-sm text-white">
                                    ${stock.price.toFixed(2)}
                                  </div>
                                  <div className={`text-xs font-semibold ${isPositive ? 'text-app-green' : 'text-app-red'}`}>
                                    {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => handleAddToWatchlist(e, stock.symbol)}
                                  disabled={isAlreadyWatched}
                                  className={`p-2 rounded-lg transition-all duration-200 ${
                                    isAlreadyWatched
                                      ? 'text-yellow-500 cursor-default'
                                      : 'text-text-muted hover:bg-white/10 hover:text-white'
                                  }`}
                                  title={isAlreadyWatched ? "In Active Watchlist" : "Add to Active Watchlist"}
                                >
                                  <Star className={`w-4 h-4 ${isAlreadyWatched ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                                </button>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-text-muted text-sm">
                    No matches for "<span className="font-semibold">{query}</span>"
                  </div>
                )}
              </div>

              {/* Right Column: Detailed Preview Panel (Hidden on mobile) */}
              <div className="hidden md:flex w-80 bg-[#0e1218]/40 p-4 flex-col justify-between overflow-y-auto select-none border-l border-border-glass">
                {(() => {
                  const selectedItem = allItems[selectedIndex];
                  if (!selectedItem) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center text-center text-text-muted p-4 space-y-2">
                        <Cpu className="w-8 h-8 opacity-40 animate-pulse text-app-green" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Select item to preview</span>
                      </div>
                    );
                  }

                  if (selectedItem.type === 'command') {
                    const isAiAnalyze = selectedItem.id === 'cmd-ai';
                    
                    if (isAiAnalyze) {
                      return (
                        <div className="flex-1 flex flex-col justify-between h-full">
                          <div className="space-y-3.5">
                            <div className="flex items-center gap-2 text-app-green font-bold text-xs">
                              <Sparkles className="w-4 h-4 animate-pulse text-[#00FF94]" />
                              <span>AI Analyst Diagnostics</span>
                            </div>
                            <div className="glass-card p-3 border border-white/5 space-y-1.5">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-text-muted">Diversification HHI</span>
                                <span className="text-app-green font-bold font-mono">78% Optimal</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-text-muted">Composite Health</span>
                                <span className="text-white font-mono font-bold">84 / 100</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-text-muted">Risk Profile</span>
                                <span className="text-blue-400 font-bold">Moderate Risk</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-text-muted block">Active Risk factors</span>
                              <ul className="text-[9px] text-[#b9cbbb] space-y-1 list-disc pl-3">
                                <li>Technology is overweight (+6.4% drift).</li>
                                <li>Beta factor of 1.15 shows index correlation.</li>
                              </ul>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-text-muted block">Rebalancing suggestion</span>
                              <div className="bg-app-green/5 border border-app-green/10 p-2 rounded text-[9px] font-semibold text-app-green space-y-0.5">
                                <p>• Reduce NVDA by 4% ($1,200)</p>
                                <p>• Increase Healthcare by 3% ($900)</p>
                              </div>
                            </div>
                          </div>
                          <span className="text-[8px] text-text-muted italic text-center font-medium block pt-2">
                            Press Enter to view full interactive lab.
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="flex-1 flex flex-col justify-between h-full">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-white font-bold text-xs">
                            <Cpu className="w-4 h-4 text-app-green animate-pulse" />
                            <span>Command Utility</span>
                          </div>
                          <div className="text-sm font-semibold text-white mt-2">
                            {selectedItem.name}
                          </div>
                          <p className="text-[10px] text-text-muted leading-relaxed">
                            {selectedItem.subtitle || 'System command utility helper.'}
                          </p>
                          <div className="pt-3 border-t border-white/5 space-y-1.5 text-[9px] font-mono">
                            <div className="flex justify-between">
                              <span className="text-text-muted">Category:</span>
                              <span className="text-white font-bold">Terminal Control</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-text-muted">State Sync:</span>
                              <span className="text-app-green font-bold">READY</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[8px] text-text-muted italic text-center block pt-2">
                          Press Enter to run command.
                        </span>
                      </div>
                    );
                  }

                  // Stock Preview Panel
                  const stock = selectedItem as StockItem;
                  const isPositive = stock.change >= 0;
                  const sparklineData = stock.sparkline;
                  const minSpark = Math.min(...sparklineData);
                  const maxSpark = Math.max(...sparklineData);
                  const sparkRange = maxSpark - minSpark || 1;
                  const sparkPoints = sparklineData.map((val, idx) => {
                    const x = (idx / (sparklineData.length - 1)) * 240; // width is 240
                    const y = 35 - ((val - minSpark) / sparkRange) * 30; // height is 35
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <div className="flex-1 flex flex-col justify-between h-full">
                      <div className="space-y-3.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-base font-bold text-white block">{stock.symbol}</span>
                            <span className="text-[9px] text-text-muted block truncate max-w-[150px]">{stock.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-white font-mono">
                              <LiveTickText value={stock.price} format={(v) => `$${v.toFixed(2)}`} />
                            </div>
                            <span className={`text-[9px] font-bold ${isPositive ? 'text-app-green' : 'text-app-red'}`}>
                              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                          </div>
                        </div>

                        {/* Sparkline chart */}
                        <div className="py-2 border-y border-white/5 space-y-1">
                          <span className="text-[8px] uppercase font-bold text-text-muted block">Sparkline Curve (6M)</span>
                          <svg width="240" height="36" className="overflow-visible mt-1">
                            <polyline
                              fill="none"
                              stroke={isPositive ? '#00FF94' : '#FF3B5C'}
                              strokeWidth="1.5"
                              points={sparkPoints}
                            />
                          </svg>
                        </div>

                        {/* Statistics Grid */}
                        <div className="space-y-2">
                          <span className="text-[8px] uppercase font-bold text-text-muted block">Equity Diagnostics</span>
                          <div className="grid grid-cols-2 gap-2 text-[8px] font-mono">
                            <div className="bg-white/2 p-2 rounded border border-white/5">
                              <span className="text-[8px] text-text-muted font-sans block uppercase">Sector</span>
                              <span className="text-white font-bold block truncate">{stock.sector}</span>
                            </div>
                            <div className="bg-white/2 p-2 rounded border border-white/5">
                              <span className="text-[8px] text-text-muted font-sans block uppercase">Risk Beta</span>
                              <span className="text-white font-bold block">{stock.beta.toFixed(2)}</span>
                            </div>
                            <div className="bg-white/2 p-2 rounded border border-white/5">
                              <span className="text-[8px] text-text-muted font-sans block uppercase">P/E Ratio</span>
                              <span className="text-white font-bold block">{stock.peRatio.toFixed(1)}</span>
                            </div>
                            <div className="bg-white/2 p-2 rounded border border-white/5">
                              <span className="text-[8px] text-text-muted font-sans block uppercase">52W Range</span>
                              <span className="text-white font-bold block truncate">${stock.low52W.toFixed(0)} - ${stock.high52W.toFixed(0)}</span>
                            </div>
                          </div>
                          <div className="bg-white/2 p-2 rounded border border-white/5 text-[9px] font-mono flex justify-between">
                            <span className="text-text-muted font-sans uppercase">Daily Volume:</span>
                            <span className="text-white font-bold">{stock.volume.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 pt-3 border-t border-white/5 text-[8px] text-text-muted">
                        <span className="text-center font-medium block">
                          Press Enter to load full details.
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>


            {/* Footer tips */}
            <div className="bg-gray-50/50 dark:bg-zinc-900/40 p-3 border-t border-gray-250/20 dark:border-zinc-800 text-[10px] text-text-muted flex justify-between font-medium">
              <span>Use <kbd className="bg-surface-lowest border border-border-glass px-1.5 py-0.5 rounded font-mono shadow-sm">↑↓</kbd> to navigate, <kbd className="bg-surface-lowest border border-border-glass px-1.5 py-0.5 rounded font-mono shadow-sm">Enter</kbd> to select</span>
              <span>Press <kbd className="bg-surface-lowest border border-border-glass px-1.5 py-0.5 rounded font-mono shadow-sm">Esc</kbd> to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default GlobalSearch;
