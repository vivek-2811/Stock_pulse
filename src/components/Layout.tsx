import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
  BarChart3, 
  Star, 
  BriefcaseBusiness, 
  Scale, 
  Settings, 
  Search, 
  Bell, 
  Menu, 
  X, 
  Activity,
  History,
  Filter,
  Layers,
  Globe,
  Cpu,
  LogOut,
  Compass,
  Zap,
  Bot,
  Newspaper,
  Sliders
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAlertStore } from '../store/useAlertStore';
import { useMarketStore } from '../store/useMarketStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { mockDataEngine } from '../services/mockDataEngine';
import { GlobalSearch } from './GlobalSearch';
import { PageTransition } from './PageTransition';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { RecruiterDemoOverlay } from './RecruiterDemoOverlay';
import { motion, AnimatePresence } from 'framer-motion';


export const Layout: React.FC = () => {
  const { density } = useSettingsStore();
  const { notifications, markAllAsRead, clearNotifications } = useAlertStore();
  const { 
    connectionStatus, 
    isReplayMode, 
    connectSocket, 
    reconnectAttempts, 
    maxReconnectAttempts 
  } = useMarketStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State variables
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Portfolio hover preview state
  const [portfolioHovered, setPortfolioHovered] = useState(false);

  // NYSE countdown timer states
  const [marketTimeRemaining, setMarketTimeRemaining] = useState('3h 24m remaining');
  const [marketOpen, setMarketOpen] = useState(true);

  // Portfolio details calculations
  const { holdings } = usePortfolioStore();
  const { stocks } = useMarketStore();

  let currentValue = 0;
  let totalCost = 0;
  let todaysPnl = 0;
  holdings.forEach(h => {
    const liveStock = stocks.find(s => s.symbol === h.symbol);
    const price = liveStock ? liveStock.price : h.avgBuyPrice;
    const change = liveStock ? liveStock.change : 0;
    currentValue += h.quantity * price;
    totalCost += h.quantity * h.avgBuyPrice;
    todaysPnl += h.quantity * change;
  });
  const totalReturnPct = totalCost === 0 ? 0 : ((currentValue - totalCost) / totalCost) * 100;
  const todaysPct = (currentValue - todaysPnl) === 0 ? 0 : (todaysPnl / (currentValue - todaysPnl)) * 100;
  const pnlIsPositive = todaysPnl >= 0;

  // Mini sparkline data — last 7 relative portfolio value points simulated from holdings
  const miniSparkData = holdings.length > 0
    ? [0.982, 0.978, 0.985, 0.991, 0.988, 0.994, 1.0].map(f => currentValue * f)
    : [];

  useEffect(() => {
    const checkMarket = () => {
      const isOpen = mockDataEngine.isMarketOpen();
      setMarketOpen(isOpen);
    };
    checkMarket();
    const interval = setInterval(checkMarket, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!marketOpen) return;
    let secondsLeft = 3 * 3600 + 24 * 60; // 3h 24m simulated starting point
    const timer = setInterval(() => {
      if (secondsLeft <= 0) {
        secondsLeft = 6.5 * 3600;
      }
      secondsLeft--;
      const h = Math.floor(secondsLeft / 3600);
      const m = Math.floor((secondsLeft % 3600) / 60);
      const s = secondsLeft % 60;
      setMarketTimeRemaining(`${h}h ${m}m ${s}s remaining`);
    }, 1000);
    return () => clearInterval(timer);
  }, [marketOpen]);


  // Connection success recovery animation transition state
  const [prevStatus, setPrevStatus] = useState(connectionStatus);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  useEffect(() => {
    if ((prevStatus === 'RECONNECTING' || prevStatus === 'CONNECTING') && connectionStatus === 'CONNECTED') {
      setShowSuccessBanner(true);
      const timer = setTimeout(() => setShowSuccessBanner(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevStatus(connectionStatus);
  }, [connectionStatus, prevStatus]);
  
  // Keyboard shortcuts (Ctrl+K and G sequence)
  useEffect(() => {
    let lastKey = '';
    let timeoutId: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
        return;
      }

      // Bypass shortcuts if the user is typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = e.key.toLowerCase();

      if (lastKey === 'g') {
        e.preventDefault();
        lastKey = '';
        if (key === 'd') navigate('/dashboard');
        else if (key === 'p') navigate('/portfolio');
        else if (key === 'w') navigate('/watchlist');
        else if (key === 's') navigate('/screener-pro');
        else if (key === 'i') navigate('/intelligence');
        else if (key === 'm') navigate('/compare');
        else if (key === 'n') navigate('/news');
        else if (key === 'c') navigate('/copilot');
        else if (key === 'h') navigate('/system-status');
        else if (key === 't') navigate('/system-status');
        else if (key === 'b') navigate('/backtest');
        else if (key === 'a') navigate('/showcase');
        else if (key === 'o') navigate('/settings');
        else if (key === 'f') navigate('/horizon');
      } else if (key === 'g') {

        lastKey = 'g';
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastKey = '';
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, [navigate]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Markets', icon: BarChart3, path: '/markets' },
    { name: 'AI Copilot', icon: Bot, path: '/copilot' },
    { name: 'News', icon: Newspaper, path: '/news' },
    { name: 'Screener Pro', icon: Zap, path: '/screener-pro' },
    { name: 'Screener', icon: Filter, path: '/screener' },
    { name: 'Heatmap', icon: Layers, path: '/markets/heatmap' },
    { name: '3D Globe', icon: Globe, path: '/globe' },
    { name: 'Portfolio', icon: BriefcaseBusiness, path: '/portfolio' },
    { name: 'Backtest Sandbox', icon: Sliders, path: '/backtest' },
    { name: 'Transactions', icon: History, path: '/transactions' },
    { name: 'Horizon Finance', icon: History, path: '/horizon' },
    { name: 'Watchlist', icon: Star, path: '/watchlist' },

    { name: 'Compare', icon: Scale, path: '/compare' },
    { name: 'Showcase', icon: Compass, path: '/showcase' },
    { name: 'System Status', icon: Activity, path: '/system-status' },
    { name: 'Assistant', icon: Cpu, path: '/assistant' },
    { name: 'Settings', icon: Settings, path: '/settings' }
  ];

  return (
    <div className="min-h-screen flex bg-[#0A0E14] text-[#dfe2eb] font-sans antialiased">
      <div className="noise-overlay" />
      
      {/* 1. Sidebar Navigation (Desktop only) */}
      <aside className={`hidden md:flex flex-col fixed inset-y-0 left-0 z-20 border-r border-border-glass bg-[#0A0E14]/90 backdrop-blur-glass transition-all duration-300 ${
        density === 'compact' ? 'w-56' : 'w-60'
      }`}>
        {/* Header/Logo */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-border-glass">
          <div className="w-8 h-8 rounded-xl bg-app-green/10 flex items-center justify-center border border-app-green/30">
            <Activity className="w-4.5 h-4.5 text-app-green animate-pulse" />
          </div>
          <span className="font-bold text-base text-white tracking-tight">StockPulse</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-app-green/15 text-app-green border border-app-green/25 font-mono">
            v1.2
          </span>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            const isPortfolio = item.name === 'Portfolio';
            return (
              <div 
                key={item.name}
                className="relative"
                onMouseEnter={() => isPortfolio && setPortfolioHovered(true)}
                onMouseLeave={() => isPortfolio && setPortfolioHovered(false)}
              >
                <Link
                  to={item.path}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-text-muted hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSidebar"
                      className="absolute inset-0 border-l-4 border-app-green bg-app-green/5 shadow-glow-green-sm rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 z-10 ${isActive ? 'text-app-green' : 'text-text-muted'}`} />
                  <span className="z-10">{item.name}</span>
                </Link>

                {/* Portfolio Hover Preview Glass Card */}
                {isPortfolio && portfolioHovered && (
                  <div className="absolute left-full ml-3 top-0 z-50 w-52 p-4 rounded-xl glass-card border border-white/10 bg-[#10141a]/95 backdrop-blur-xl shadow-2xl space-y-2 pointer-events-none">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase font-bold text-text-muted">Portfolio Value</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${totalReturnPct >= 0 ? 'bg-app-green/10 text-app-green' : 'bg-app-red/10 text-app-red'}`}>
                        {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white font-mono">
                      ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                      <span className="text-[9px] text-text-muted">6M Trend</span>
                      <svg width="80" height="18" className="overflow-visible">
                        <polyline
                          fill="none"
                          stroke={totalReturnPct >= 0 ? '#00FF94' : '#FF3B5C'}
                          strokeWidth="1.5"
                          points={(() => {
                            const points = [100, 103, 102, 106, 105, 109, 108, 114, 112, 115, 115 + (totalReturnPct / 5)];
                            const minVal = Math.min(...points);
                            const maxVal = Math.max(...points);
                            const range = maxVal - minVal || 1;
                            return points.map((p, i) => {
                              const x = (i / (points.length - 1)) * 80;
                              const y = 18 - ((p - minVal) / range) * 18;
                              return `${x},${y}`;
                            }).join(' ');
                          })()}
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Portfolio Pulse Footer */}
        <div className="p-4 border-t border-border-glass space-y-3">
          {holdings.length > 0 ? (
            <div className="glass-card p-3 rounded-xl border border-border-glass/40 bg-surface-lowest/30">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider">Portfolio Pulse</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                  pnlIsPositive
                    ? 'bg-app-green/10 text-app-green border-app-green/20'
                    : 'bg-app-red/10 text-app-red border-app-red/20'
                }`}>
                  {pnlIsPositive ? '▲' : '▼'} Today
                </span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-sm font-bold text-white font-mono">
                    ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <div className={`text-[9px] font-bold font-mono mt-0.5 ${
                    pnlIsPositive ? 'text-app-green' : 'text-app-red'
                  }`}>
                    {pnlIsPositive ? '+' : ''}{todaysPnl.toFixed(0)} ({todaysPct.toFixed(2)}% today)
                  </div>
                </div>
                {/* Mini Sparkline */}
                {miniSparkData.length > 1 && (
                  <svg width="56" height="22" className="overflow-visible">
                    <polyline
                      fill="none"
                      stroke={pnlIsPositive ? '#00FF94' : '#FF3B5C'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={(() => {
                        const mn = Math.min(...miniSparkData);
                        const mx = Math.max(...miniSparkData);
                        const rng = mx - mn || 1;
                        return miniSparkData.map((v, i) => {
                          const x = (i / (miniSparkData.length - 1)) * 56;
                          const y = 22 - ((v - mn) / rng) * 20;
                          return `${x},${y}`;
                        }).join(' ');
                      })()}
                    />
                  </svg>
                )}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-white/5 flex justify-between text-[8px] text-text-muted font-mono">
                <span>Total Return:</span>
                <span className={totalReturnPct >= 0 ? 'text-app-green font-bold' : 'text-app-red font-bold'}>
                  {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}%
                </span>
              </div>
            </div>
          ) : null}

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-app-green to-blue-500 flex items-center justify-center font-bold text-black text-xs shadow-md">
              JD
            </div>
            <div className="overflow-hidden flex-1">
              <div className="font-semibold text-xs text-white truncate">John Doe</div>
              <div className="text-[10px] text-text-muted truncate">john@stockpulse.ai</div>
            </div>
            <Link to="/" className="text-text-muted hover:text-white" title="Return to Landing Page">
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* 2. Main content container */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        density === 'compact' ? 'md:pl-56' : 'md:pl-60'
      }`}>
        
        {/* Top Header sticky */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 border-b border-border-glass bg-[#0A0E14]/80 backdrop-blur-glass">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-white/5 text-text-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
              <span className="text-text-muted uppercase tracking-wider">StockPulse Terminal</span>
              <span className="text-border-glass">/</span>
              <span className="text-white font-bold capitalize">
                {navItems.find(item => item.path === location.pathname)?.name || 'Finance Station'}
              </span>
            </div>

            {/* NYSE countdown status badge */}
            <div className="hidden md:flex items-center gap-3 ml-4 pl-4 border-l border-border-glass text-xs font-semibold">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                marketOpen ? 'bg-app-green/10 text-app-green border border-app-green/20' : 'bg-app-red/10 text-app-red border border-app-red/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? 'bg-app-green animate-pulse' : 'bg-app-red'}`} />
                {marketOpen ? '● NYSE OPEN' : '● NYSE CLOSED'}
              </span>
              {marketOpen && (
                <span className="text-text-muted font-mono text-[10px] tracking-wide">
                  NYSE • {marketTimeRemaining}
                </span>
              )}
            </div>

          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Search Box Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border-glass bg-surface-glass text-text-muted hover:border-app-green/30 transition-all duration-200 text-xs text-left w-36 sm:w-44 cursor-pointer"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">Command Palette</span>
              <kbd className="hidden sm:inline-block font-mono text-[9px] bg-surface-lowest border border-border-glass px-1 py-0.5 rounded">
                Ctrl+K
              </kbd>
            </button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2.5 rounded-xl border border-border-glass bg-surface-glass hover:bg-white/5 transition-colors text-text-muted hover:text-white cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-app-green animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-80 max-w-[calc(100vw-32px)] rounded-2xl glass-card border border-border-glass shadow-2xl p-4.5 z-50 bg-[#10141a]/95 backdrop-blur-xl"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-border-glass">
                        <span className="font-bold text-xs text-white">Alert Logs</span>
                        <div className="flex gap-2 text-[10px] font-bold">
                          {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-app-green hover:underline cursor-pointer">Mark read</button>
                          )}
                          <button onClick={clearNotifications} className="text-text-muted hover:text-white cursor-pointer">Clear</button>
                        </div>
                      </div>

                      <div className="mt-2 divide-y divide-border-glass/40 max-h-60 overflow-y-auto pr-1">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className="py-2.5 flex items-start gap-2 text-xs leading-normal">
                              <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-app-green'}`} />
                              <div className="flex-1">
                                <p className="text-on-surface">{n.message}</p>
                                <span className="text-[9px] text-text-muted mt-0.5 block">{n.timestamp}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-xs text-text-muted">No alerts triggered yet.</div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Connection Status Banners */}
        <AnimatePresence>
          {showSuccessBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-app-green/10 border-b border-app-green/20 px-6 py-2.5 flex items-center justify-between text-xs font-semibold text-app-green"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-app-green" />
                <span>Connection Restored! Restoring streams...</span>
              </div>
              <span className="text-[10px] font-mono opacity-80 text-app-green font-bold">ONLINE</span>
            </motion.div>
          )}

          {!isReplayMode && connectionStatus === 'RECONNECTING' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-app-red/10 border-b border-app-red/20 px-6 py-2.5 flex items-center justify-between text-xs font-semibold text-app-red"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-app-red animate-ping" />
                <span>Connection Lost. Attempting reconnection... (Retry {reconnectAttempts} of {maxReconnectAttempts})</span>
              </div>
              <span className="text-[10px] font-mono opacity-80">Reconnecting...</span>
            </motion.div>
          )}

          {!isReplayMode && connectionStatus === 'DISCONNECTED' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-zinc-850/30 border-b border-border-glass px-6 py-2.5 flex items-center justify-between text-xs font-semibold text-text-muted"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-app-red" />
                <span>Market Feed Offline. Live price simulation paused.</span>
              </div>
              <button 
                onClick={connectSocket}
                className="px-2.5 py-1 rounded bg-app-green/10 hover:bg-app-green/20 text-app-green font-bold text-[9px] uppercase tracking-wider border border-app-green/20 transition-all cursor-pointer"
              >
                Reconnect Feed
              </button>
            </motion.div>
          )}

          {!isReplayMode && connectionStatus === 'CONNECTING' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-2.5 flex items-center justify-between text-xs font-semibold text-blue-400"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>Connecting to live WebSocket data stream...</span>
              </div>
              <span className="text-[10px] font-mono opacity-85">Connecting...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content viewport */}
        <main className="flex-1 p-6 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>

      </div>

      {/* 3. Mobile Navigation Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-64 z-50 bg-[#0A0E14] border-r border-border-glass flex flex-col p-6 md:hidden"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-glass">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-app-green/10 flex items-center justify-center text-app-green">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <span className="font-bold text-base text-white tracking-tight">StockPulse</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 text-text-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'text-white font-bold'
                          : 'text-text-muted hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarMobile"
                          className="absolute inset-0 border-l-4 border-app-green bg-app-green/5 rounded-xl -z-10"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                      <Icon className={`w-4.5 h-4.5 z-10 ${isActive ? 'text-app-green' : 'text-text-muted'}`} />
                      <span className="z-10">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 mt-4 border-t border-border-glass flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-app-green to-blue-500 flex items-center justify-center font-bold text-black text-xs">
                  JD
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-xs text-white truncate">John Doe</div>
                  <div className="text-[10px] text-text-muted truncate">john@stockpulse.ai</div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Global Search Palette */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <KeyboardShortcutsModal />
      <RecruiterDemoOverlay />
    </div>
  );
};
export default Layout;
