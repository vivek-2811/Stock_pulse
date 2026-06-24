import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Search,
  Scale,
  Star,
  Play,
  Pause,
  X,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Eye,
  RotateCcw,
  Sliders,
  Check,
  Plus,
  Zap,
  BarChart2,
  TrendingDown
} from 'lucide-react';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useMarketStore } from '../../store/useMarketStore';
import { useAlertStore } from '../../store/useAlertStore';
import { useDashboardLayoutStore } from '../../store/useDashboardLayoutStore';
import type { DashboardPreset } from '../../store/useDashboardLayoutStore';
import { mockDataEngine } from '../../services/mockDataEngine';
import type { NewsItem } from '../../services/mockDataEngine';
import { SparklineSkeleton, ChartSkeleton, TableSkeleton } from '../../components/LoadingState';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';

// Chart.js components
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  ChartTooltip,
  Filler
);

// Framer Motion staggered entrance configurations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
};

// 1. Magnetic Card Effect Component
const MagneticCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    const factor = 0.035; // Subtle movement
    setPosition({ x: x * factor, y: y * factor });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 120, damping: 15 }}
      onClick={onClick}
      className={`glass-card p-5 flex flex-col justify-between ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
};

// 2. Animated Counter Component (Counts from 0 to value on mount, direct DOM mutation to prevent React lag)
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => 
    latest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, ease: 'easeOut' });
    return () => controls.stop();
  }, [value]);

  useEffect(() => {
    return rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `$${latest}`;
      }
    });
  }, [rounded]);

  return <span ref={ref} className="font-mono tabular-nums text-white">$0.00</span>;
};

// 3. Live Price Update Flasher Component
const LivePriceFlash: React.FC<{ price: number }> = ({ price }) => {
  const prevPriceRef = useRef(price);
  const [flashClass, setFlashClass] = useState<'flash-green' | 'flash-red' | null>(null);

  useEffect(() => {
    if (price > prevPriceRef.current) {
      setFlashClass('flash-green');
      const timer = setTimeout(() => setFlashClass(null), 850);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    } else if (price < prevPriceRef.current) {
      setFlashClass('flash-red');
      const timer = setTimeout(() => setFlashClass(null), 850);
      prevPriceRef.current = price;
      return () => clearTimeout(timer);
    }
  }, [price]);

  return (
    <span className={`transition-all duration-300 num-data font-semibold ${
      flashClass === 'flash-green' 
        ? 'text-app-green bg-app-green/10 px-1 rounded' 
        : flashClass === 'flash-red' 
        ? 'text-app-red bg-app-red/10 px-1 rounded' 
        : 'text-white'
    }`}>
      ${price.toFixed(2)}
    </span>
  );
};

// 4. Sparkline SVG Renderer Component
const MiniSparkline: React.FC<{ data: number[]; isPositive: boolean; width?: number; height?: number }> = ({ 
  data, 
  isPositive,
  width = 80,
  height = 24
}) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={isPositive ? '#00FF94' : '#FF3B5C'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

// ══════════════════════════════════════════════════════
// 5. Market Intelligence Bar — scrolling live sector strip
// ══════════════════════════════════════════════════════
const MarketIntelligenceBar: React.FC<{ stocks: any[]; indices: any[] }> = ({ stocks, indices }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute sector performance map
  const sectorMap: Record<string, { totalChange: number; count: number }> = {};
  stocks.forEach(s => {
    if (!sectorMap[s.sector]) sectorMap[s.sector] = { totalChange: 0, count: 0 };
    sectorMap[s.sector].totalChange += s.changePercent;
    sectorMap[s.sector].count++;
  });
  const sectorPerf = Object.entries(sectorMap).map(([sector, data]) => ({
    sector,
    avgChange: data.totalChange / data.count
  })).sort((a, b) => b.avgChange - a.avgChange);

  const topGainerStock = [...stocks].sort((a, b) => b.changePercent - a.changePercent)[0];
  const topLoserStock = [...stocks].sort((a, b) => a.changePercent - b.changePercent)[0];
  const bestSector = sectorPerf[0];
  const worstSector = sectorPerf[sectorPerf.length - 1];

  // Auto-scroll animation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animFrame: number;
    let pos = 0;
    const speed = 0.4;
    const scroll = () => {
      pos += speed;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      animFrame = requestAnimationFrame(scroll);
    };
    animFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animFrame);
  }, [stocks]);

  // Build ticker items: all stocks duplicated for seamless loop
  const tickerItems = [...stocks, ...stocks];

  return (
    <div className="relative overflow-hidden border border-border-glass bg-[#0A0E14]/80 rounded-2xl" style={{ background: 'linear-gradient(90deg, #0A0E14 0%, #0f1520 50%, #0A0E14 100%)' }}>
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #0A0E14, transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(-90deg, #0A0E14, transparent)' }} />

      {/* Sector narrative bar (static above ticker) */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-border-glass/40 text-[10px] font-bold overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Zap className="w-3 h-3 text-app-green animate-pulse" />
          <span className="text-text-muted uppercase tracking-wider">Market Intel</span>
        </div>
        <div className="w-px h-3 bg-border-glass/60" />
        {bestSector && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <TrendingUp className="w-3 h-3 text-app-green" />
            <span className="text-text-muted">Best:</span>
            <span className="text-app-green font-bold">{bestSector.sector}</span>
            <span className="text-app-green font-mono">+{bestSector.avgChange.toFixed(2)}%</span>
          </div>
        )}
        {worstSector && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <TrendingDown className="w-3 h-3 text-app-red" />
            <span className="text-text-muted">Lagging:</span>
            <span className="text-app-red font-bold">{worstSector.sector}</span>
            <span className="text-app-red font-mono">{worstSector.avgChange.toFixed(2)}%</span>
          </div>
        )}
        <div className="w-px h-3 bg-border-glass/60" />
        {topGainerStock && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <ArrowUpRight className="w-3 h-3 text-app-green" />
            <span className="text-text-muted">Top Mover:</span>
            <span className="text-white font-bold">{topGainerStock.symbol}</span>
            <span className="text-app-green font-mono">+{topGainerStock.changePercent.toFixed(2)}%</span>
          </div>
        )}
        {topLoserStock && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <ArrowDownRight className="w-3 h-3 text-app-red" />
            <span className="text-text-muted">Bottom:</span>
            <span className="text-white font-bold">{topLoserStock.symbol}</span>
            <span className="text-app-red font-mono">{topLoserStock.changePercent.toFixed(2)}%</span>
          </div>
        )}
        <div className="w-px h-3 bg-border-glass/60" />
        {indices.map(idx => (
          <div key={idx.symbol} className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-text-muted">{idx.name}:</span>
            <span className="text-white font-mono">{idx.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <span className={`font-mono ${idx.changePercent >= 0 ? 'text-app-green' : 'text-app-red'}`}>
              {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>

      {/* Live price scrolling ticker */}
      <div
        ref={scrollRef}
        className="flex items-center gap-6 py-2 px-4 overflow-x-hidden whitespace-nowrap"
        style={{ userSelect: 'none' }}
      >
        {tickerItems.map((stock, i) => {
          const isPos = stock.changePercent >= 0;
          return (
            <div key={`${stock.symbol}-${i}`} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-bold text-white">{stock.symbol}</span>
              <span className={`text-[10px] font-mono font-bold ${isPos ? 'text-app-green' : 'text-app-red'}`}>
                ${stock.price.toFixed(2)}
              </span>
              <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                isPos ? 'bg-app-green/10 text-app-green' : 'bg-app-red/10 text-app-red'
              }`}>
                {isPos ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
              <span className="text-border-glass/50 text-[9px]">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Connect to global market store state
  const {
    stocks,
    indices,
    isReplayMode,
    connectionStatus,
    msgsPerSec,
    playbackState,
    currentSpeed,
    tickIndex,
    bufferSize,
    setReplayMode,
    playReplay,
    pauseReplay,
    setReplaySpeed,
    stepForward,
    stepBackward,
    triggerFailure,
    lastConnectedAt,
    lastDisconnectedAt
  } = useMarketStore();

  const {
    widgets,
    activePreset,
    editMode,
    setEditMode,
    reorderWidget,
    toggleWidgetVisibility,
    applyPreset,
    resetLayout
  } = useDashboardLayoutStore();

  const { alerts } = useAlertStore();

  const { holdings, buyStock, sellStock } = usePortfolioStore();
  const activeWatchlistId = useWatchlistStore(state => state.activeListId);
  const watchlists = useWatchlistStore(state => state.watchlists);

  // Uptime tracking state & effect
  const [uptimeStr, setUptimeStr] = useState('');
  useEffect(() => {
    let intervalId: any;

    const updateUptime = () => {
      if (isReplayMode) {
        setUptimeStr('');
        return;
      }
      if (connectionStatus === 'CONNECTED' && lastConnectedAt) {
        const diffMs = Date.now() - new Date(lastConnectedAt).getTime();
        const diffSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        const hrs = Math.floor(mins / 60);
        
        if (hrs > 0) {
          setUptimeStr(`Connected for ${hrs}h ${mins % 60}m ${secs}s`);
        } else if (mins > 0) {
          setUptimeStr(`Connected for ${mins}m ${secs}s`);
        } else {
          setUptimeStr(`Connected for ${secs}s`);
        }
      } else if (lastDisconnectedAt) {
        const timeStr = new Date(lastDisconnectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setUptimeStr(`Offline since ${timeStr}`);
      } else {
        setUptimeStr('Offline');
      }
    };

    updateUptime();
    if (connectionStatus === 'CONNECTED') {
      intervalId = setInterval(updateUptime, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [connectionStatus, lastConnectedAt, lastDisconnectedAt, isReplayMode]);

  // Last Sync / Tick Time
  const [lastTickTime, setLastTickTime] = useState<string | null>(null);
  useEffect(() => {
    if (stocks && stocks.length > 0) {
      setLastTickTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }
  }, [stocks]);

  const [news] = useState<NewsItem[]>(() => mockDataEngine.getNews());
  const [isMarketOpen, setIsMarketOpen] = useState(() => mockDataEngine.isMarketOpen());
  const data = { stocks, indices, isMarketOpen };

  // Keep isMarketOpen in sync with ticks
  useEffect(() => {
    const unsubscribe = mockDataEngine.subscribe((latest) => {
      setIsMarketOpen(latest.isMarketOpen);
    });
    return unsubscribe;
  }, []);

  // Quick Trade Modal States
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeSymbol, setTradeSymbol] = useState('AAPL');
  const [tradeQty, setTradeQty] = useState(10);
  const [tradePrice, setTradePrice] = useState(0);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  // Update transaction price when symbol changes
  useEffect(() => {
    const selected = stocks.find(s => s.symbol === tradeSymbol);
    if (selected) {
      setTradePrice(selected.price);
    }
  }, [tradeSymbol, stocks]);

  // If live data has not synced yet, render skeleton layouts
  if (!stocks || !indices) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SparklineSkeleton />
          <SparklineSkeleton />
          <SparklineSkeleton />
          <SparklineSkeleton />
        </div>
        <ChartSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSkeleton rows={5} />
          <TableSkeleton rows={5} />
        </div>
      </div>
    );
  }

  // Calculate live portfolio values
  let portfolioCost = 0;
  let portfolioValue = 0;
  let portfolioTodaysReturn = 0;

  const holdingsWithLiveVal = holdings.map(h => {
    const liveStock = data.stocks.find(s => s.symbol === h.symbol);
    const price = liveStock ? liveStock.price : h.avgBuyPrice;
    const change = liveStock ? liveStock.change : 0;
    const cost = h.quantity * h.avgBuyPrice;
    const currentVal = h.quantity * price;
    const dailyReturn = h.quantity * change;

    portfolioCost += cost;
    portfolioValue += currentVal;
    portfolioTodaysReturn += dailyReturn;

    return {
      ...h,
      currentValue: currentVal,
      sector: liveStock?.sector || 'Unknown'
    };
  });

  const portfolioDailyReturnPercent = portfolioValue - portfolioTodaysReturn === 0 
    ? 0 
    : (portfolioTodaysReturn / (portfolioValue - portfolioTodaysReturn)) * 100;

  const portfolioTotalReturnPercent = portfolioCost === 0 
    ? 0 
    : ((portfolioValue - portfolioCost) / portfolioCost) * 100;

  // Compile allocation breakdown by Sector
  const sectorAllocationMap: { [sec: string]: number } = {};
  holdingsWithLiveVal.forEach(h => {
    sectorAllocationMap[h.sector] = (sectorAllocationMap[h.sector] || 0) + h.currentValue;
  });
  const sectorAllocation = Object.keys(sectorAllocationMap).map(sector => ({
    sector,
    value: sectorAllocationMap[sector],
    percentage: portfolioValue === 0 ? 0 : Math.round((sectorAllocationMap[sector] / portfolioValue) * 100)
  })).sort((a, b) => b.value - a.value);

  // Compute live gainers and losers (Top 5)
  const sortedByChange = [...data.stocks].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sortedByChange.slice(0, 5);
  const losers = [...data.stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  // Dispatch custom keyboard event to trigger command palette open in Layout
  const triggerCommandPalette = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  const handleQuickTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tradeType === 'BUY') {
      buyStock(tradeSymbol, tradeQty, tradePrice);
    } else {
      sellStock(tradeSymbol, tradeQty, tradePrice);
    }
    setTradeModalOpen(false);
  };

  const triggerTradeModal = (type: 'BUY' | 'SELL', symbol = 'AAPL') => {
    setTradeType(type);
    setTradeSymbol(symbol);
    const stock = data.stocks.find(s => s.symbol === symbol);
    if (stock) setTradePrice(stock.price);
    setTradeQty(10);
    setTradeModalOpen(true);
  };

  // Mock Trend History values for Portfolio chart
  const portfolioChartData = {
    labels: ['10:00 AM', '11:00 AM', '12:05 PM', '1:10 PM', '2:15 PM', '3:30 PM', 'Live'],
    datasets: [
      {
        fill: true,
        data: [
          portfolioValue * 0.965,
          portfolioValue * 0.982,
          portfolioValue * 0.978,
          portfolioValue * 0.991,
          portfolioValue * 0.985,
          portfolioValue * 0.994,
          portfolioValue
        ],
        borderColor: '#00FF94',
        borderWidth: 2,
        backgroundColor: 'rgba(0, 255, 148, 0.03)',
        tension: 0.25,
        pointBackgroundColor: '#00FF94',
        pointHoverRadius: 6,
      }
    ]
  };

  const portfolioChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8A8F98', font: { family: 'Inter', size: 9 } } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#8A8F98', font: { family: 'Inter', size: 9 } } }
    }
  };

  const renderWidgetContent = (id: string) => {
    switch (id) {
      case 'indices':
        return (
          <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-4 pb-3 md:pb-0 scrollbar-none scroll-smooth snap-x w-full">
            {indices.map(idx => {
              const isPositive = idx.change >= 0;
              return (
                <div key={idx.symbol} className="min-w-[220px] md:min-w-0 snap-start flex-1">
                  <MagneticCard className="h-32">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">
                          {idx.name}
                        </span>
                        <span className="text-base font-bold text-white mt-1 block font-mono">
                          {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isPositive ? 'price-chip-positive' : 'price-chip-negative'
                      }`}>
                        {isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <span className="text-[10px] text-text-muted font-mono font-medium">
                        {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)}
                      </span>
                      <MiniSparkline data={idx.sparkline} isPositive={isPositive} />
                    </div>
                  </MagneticCard>
                </div>
              );
            })}
          </div>
        );

      case 'portfolio':
        return (
          <div className="glass-card rounded-3xl p-6 border border-border-glass flex flex-col justify-between min-h-[360px] h-full">
            {holdings.length > 0 ? (
              <>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                      Total Account Balance
                    </h2>
                    <div className="text-3xl font-extrabold tracking-tight mt-1">
                      <AnimatedCounter value={portfolioValue} />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className={`font-semibold num-data flex items-center ${portfolioDailyReturnPercent >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                        {portfolioDailyReturnPercent >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {portfolioDailyReturnPercent >= 0 ? '+' : ''}{portfolioDailyReturnPercent.toFixed(2)}% Today
                      </span>
                      <span className="text-text-muted">•</span>
                      <span className="text-text-muted">
                        Total Returns: <span className={portfolioValue - portfolioCost >= 0 ? 'text-app-green font-semibold' : 'text-app-red font-semibold'}>
                          {portfolioValue - portfolioCost >= 0 ? '+' : ''}${Math.abs(portfolioValue - portfolioCost).toFixed(2)} ({portfolioTotalReturnPercent.toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <button 
                      type="button"
                      onClick={() => triggerTradeModal('BUY')}
                      className="flex items-center gap-1.5 btn-primary text-xs font-semibold px-4 py-2 cursor-pointer shadow-glow-green-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Quick Trade
                    </button>
                  </div>
                </div>

                {/* Sparkline chart history */}
                <div className="flex-1 min-h-[190px] mt-6">
                  <Line data={portfolioChartData} options={portfolioChartOptions} />
                </div>
              </>
            ) : (
              // Empty State
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-14 h-14 rounded-full bg-zinc-900 border border-border-glass flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-text-muted" />
                </div>
                <h3 className="text-base font-bold text-white font-sans">You don't own any assets yet.</h3>
                <p className="text-xs text-text-muted mt-1 max-w-sm font-sans">
                  Start building a virtual portfolio. Log your transactions to allocate mock capital.
                </p>
                <button 
                  type="button"
                  onClick={() => triggerTradeModal('BUY')}
                  className="mt-5 px-5 py-2.5 btn-primary font-bold text-xs rounded-xl shadow-glow-green cursor-pointer"
                >
                  Buy Your First Stock
                </button>
              </div>
            )}
          </div>
        );

      case 'allocations':
        return (
          <div className="glass-card rounded-3xl p-6 border border-border-glass flex flex-col justify-between min-h-[360px] h-full">
            <div>
              <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider pb-3 border-b border-border-glass/40">
                Sector Allocations
              </h2>
              
              {holdings.length > 0 ? (
                <div className="space-y-4 mt-5">
                  {sectorAllocation.slice(0, 4).map(item => (
                    <div key={item.sector} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white">{item.sector}</span>
                        <span className="num-data font-semibold text-white">
                          {item.percentage}% <span className="text-text-muted text-[10px]">(${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })})</span>
                        </span>
                      </div>
                      <div className="w-full bg-surface-lowest h-1.5 rounded-full overflow-hidden border border-border-glass/20">
                        <div 
                          className="h-full bg-app-green rounded-full shadow-glow-green-sm transition-all duration-500" 
                          style={{ width: `${item.percentage}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-text-muted">
                  Allocate capital to stocks to view sector splits.
                </div>
              )}
            </div>

            {holdings.length > 0 && (
              <div className="pt-4 border-t border-border-glass/40 text-[10px] text-text-muted flex justify-between">
                <span>Primary Currency: USD</span>
                <button type="button" onClick={() => navigate('/portfolio')} className="hover:text-white font-semibold flex items-center gap-0.5 cursor-pointer">
                  Analyze Allocations →
                </button>
              </div>
            )}
          </div>
        );

      case 'tickers':
        return (
          <div className="glass-card rounded-3xl p-6 border border-border-glass flex flex-col justify-between min-h-[440px] h-full">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-border-glass/40 mb-4">
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-app-green" /> Live Market Tickers
                </h2>
                <span className="text-[10px] text-text-muted">Sorted by volatility</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Gainers List */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-app-green flex items-center gap-1">
                    ▲ Top Gainers
                  </h3>
                  <div className="divide-y divide-border-glass/20 space-y-2">
                    {gainers.map(stock => (
                      <div 
                        key={stock.symbol}
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                        className="flex items-center justify-between pt-2 cursor-pointer hover:bg-white/2 rounded px-1.5 -mx-1.5 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">{stock.symbol}</span>
                          <span className="text-[10px] text-text-muted block truncate max-w-[80px]">{stock.name}</span>
                        </div>
                        <div className="text-right">
                          <LivePriceFlash price={stock.price} />
                          <span className="block text-[10px] text-app-green font-semibold font-mono mt-0.5">
                            +{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers List */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-app-red flex items-center gap-1">
                    ▼ Top Losers
                  </h3>
                  <div className="divide-y divide-border-glass/20 space-y-2">
                    {losers.map(stock => (
                      <div 
                        key={stock.symbol}
                        onClick={() => navigate(`/stock/${stock.symbol}`)}
                        className="flex items-center justify-between pt-2 cursor-pointer hover:bg-white/2 rounded px-1.5 -mx-1.5 transition-colors"
                      >
                        <div>
                          <span className="font-bold text-xs text-white block">{stock.symbol}</span>
                          <span className="text-[10px] text-text-muted block truncate max-w-[80px]">{stock.name}</span>
                        </div>
                        <div className="text-right">
                          <LivePriceFlash price={stock.price} />
                          <span className="block text-[10px] text-app-red font-semibold font-mono mt-0.5">
                            {stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-glass/40 text-[10px] text-text-muted flex justify-between">
              <span>Prices refresh automatically</span>
              <button type="button" onClick={() => navigate('/markets')} className="hover:text-white font-semibold cursor-pointer">
                View All Equities →
              </button>
            </div>
          </div>
        );

      case 'news':
        return (
          <div className="glass-card rounded-3xl p-6 border border-border-glass flex flex-col justify-between min-h-[440px] h-full">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-border-glass/40 mb-4">
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Financial News Wire
                </h2>
                <span className="text-[10px] text-text-muted bg-surface-glass border border-border-glass/40 px-2 py-0.5 rounded-md font-bold">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {news.slice(0, 4).map(item => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ duration: 0.4 }}
                    className="p-3 bg-surface-lowest/30 rounded-xl border border-border-glass/20 hover:border-border-glass/60 hover:bg-surface-lowest/50 transition-all cursor-pointer flex gap-3"
                  >
                    {item.thumbnail && (
                      <img 
                        src={item.thumbnail} 
                        alt="thumbnail" 
                        className="w-14 h-10 rounded-lg object-cover bg-zinc-800 flex-shrink-0 border border-border-glass/35"
                      />
                    )}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center gap-2 mb-1">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-app-green/10 text-app-green font-semibold border border-app-green/10 font-mono">
                          {item.category.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-text-muted font-medium">{item.date}</span>
                      </div>
                      <h3 className="font-bold text-xs text-white leading-snug truncate hover:text-app-green transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-text-muted mt-1 truncate">{item.summary}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border-glass/40 text-[10px] text-text-muted flex justify-between">
              <span>Aggregated from Reuters & CNBC</span>
              <button type="button" onClick={() => navigate('/news')} className="hover:text-white font-semibold cursor-pointer">
                Browse News Feed →
              </button>
            </div>
          </div>
        );

      case 'heatmap':
        return (
          <div className="glass-card rounded-3xl p-6 border border-border-glass flex flex-col justify-between min-h-[260px] h-full">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-border-glass/40 mb-4">
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Simulation Sector Heatmap
                </h2>
                <span className="text-[10px] text-text-muted">Relative volatility matrix</span>
              </div>

              {/* Grid of stock symbols colored by price change */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {stocks.slice(0, 15).map(s => {
                  const isPos = s.changePercent >= 0;
                  const brightness = Math.min(0.9, Math.max(0.15, Math.abs(s.changePercent) / 3));
                  return (
                    <div
                      key={s.symbol}
                      onClick={() => navigate(`/stock/${s.symbol}`)}
                      className="h-10 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all border border-border-glass/10 text-[10px] font-bold hover:scale-105"
                      style={{
                        backgroundColor: isPos 
                          ? `rgba(0, 255, 148, ${brightness})` 
                          : `rgba(255, 59, 92, ${brightness})`,
                        color: brightness > 0.5 ? '#000000' : '#ffffff'
                      }}
                      title={`${s.symbol}: ${isPos ? '+' : ''}${s.changePercent.toFixed(2)}%`}
                    >
                      <span>{s.symbol}</span>
                      <span className="text-[8px] font-medium opacity-80">{isPos ? '+' : ''}{s.changePercent.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-border-glass/40 text-[10px] text-text-muted flex justify-between">
              <span>Color intensity represents delta magnitude</span>
              <button type="button" onClick={() => navigate('/heatmap')} className="hover:text-white font-semibold cursor-pointer">
                Open Full Heatmap →
              </button>
            </div>
          </div>
        );

      case 'actions':
        return (
          <div className="glass-card rounded-3xl p-6 border border-border-glass flex flex-col justify-between min-h-[260px] h-full">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-border-glass/40 mb-4">
                <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Operator & Telemetry Panel
                </h2>
                <span className="text-[10px] text-text-muted">System Diagnostics</span>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button 
                  type="button"
                  onClick={triggerCommandPalette}
                  className="flex items-center justify-center gap-2 p-2.5 bg-surface-lowest/40 hover:bg-surface-lowest/80 border border-border-glass/30 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-app-green animate-pulse" />
                  <span>Cmd Palette</span>
                </button>

                <button 
                  type="button"
                  onClick={() => mockDataEngine.toggleMarketStatus()}
                  className="flex items-center justify-center gap-2 p-2.5 bg-surface-lowest/40 hover:bg-surface-lowest/80 border border-border-glass/30 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  {isMarketOpen ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-app-red animate-pulse" />
                      <span>Pause Ticker</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-app-green animate-pulse" />
                      <span>Start Ticker</span>
                    </>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={triggerFailure}
                  className="flex items-center justify-center gap-2 p-2.5 bg-surface-lowest/40 hover:bg-surface-lowest/80 border border-border-glass/30 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                  title="Simulate network disconnect/reconnect sequence"
                >
                  <Activity className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                  <span>Simulate Drop</span>
                </button>

                <button 
                  type="button"
                  onClick={() => navigate('/compare')}
                  className="flex items-center justify-center gap-2 p-2.5 bg-surface-lowest/40 hover:bg-surface-lowest/80 border border-border-glass/30 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Scale className="w-3.5 h-3.5 text-app-green" />
                  <span>Compare Page</span>
                </button>
              </div>

              {/* Diagnostics Stats */}
              <div className="space-y-2 border-t border-border-glass/30 pt-4">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">System Telemetry</h3>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <div className="bg-surface-lowest/25 border border-border-glass/20 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] text-text-muted">SOCKET STATUS</span>
                    <span className={`text-xs mt-1 font-bold ${connectionStatus === 'CONNECTED' ? 'text-app-green' : connectionStatus === 'RECONNECTING' ? 'text-yellow-500 animate-pulse' : 'text-text-muted'}`}>
                      {isReplayMode ? 'OFFLINE (REPLAY)' : connectionStatus}
                    </span>
                  </div>

                  <div className="bg-surface-lowest/25 border border-border-glass/20 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] text-text-muted">THROUGHPUT</span>
                    <span className="text-xs mt-1 text-white font-bold font-mono">
                      {isReplayMode ? '0' : msgsPerSec} msgs/sec
                    </span>
                  </div>

                  <div className="bg-surface-lowest/25 border border-border-glass/20 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] text-text-muted">MEMORY BUFFER</span>
                    <span className="text-xs mt-1 text-white font-bold font-mono">
                      {tickIndex} / {bufferSize} ticks
                    </span>
                  </div>

                  <div className="bg-surface-lowest/25 border border-border-glass/20 p-2.5 rounded-xl flex flex-col justify-between">
                    <span className="text-[9px] text-text-muted">ACTIVE ALERTS</span>
                    <span className="text-xs mt-1 text-app-green font-bold font-mono">
                      {alerts.length} configured
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-glass/40 text-[10px] text-text-muted flex justify-between font-mono mt-4 font-sans">
              <span>Mode: {isReplayMode ? `REPLAY (${currentSpeed}x)` : 'LIVE WEBSOCKET'}</span>
              <span className="text-white">Telemetry: ONLINE</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Market Status and Replay Controls Panel */}
      {/* 1. Market Status and Replay Controls Panel */}
      <div className="glass-card rounded-2xl p-4 border border-border-glass flex flex-col xl:flex-row justify-between items-center gap-4 bg-surface-lowest/40 text-xs font-semibold">
        
        {/* Toggle Mode */}
        <div className="flex items-center gap-3 w-full xl:w-auto">
          <span className="text-xs text-text-muted font-semibold uppercase">Feed Mode:</span>
          <div className="flex p-0.5 rounded-xl bg-surface-low border border-border-glass text-[11px] font-bold text-text-muted">
            <button
              onClick={() => setReplayMode(false)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                !isReplayMode ? 'bg-app-green text-black shadow-glow-green-sm' : 'hover:text-white'
              }`}
            >
              Live WS Stream
            </button>
            <button
              onClick={() => setReplayMode(true)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isReplayMode ? 'bg-app-green text-black shadow-glow-green-sm' : 'hover:text-white'
              }`}
            >
              Replay Engine
            </button>
          </div>
        </div>

        {/* Replay Timing Control Bar (visible only in Replay Mode) */}
        {isReplayMode ? (
          <div className="flex items-center gap-4 bg-surface-lowest border border-border-glass/40 px-4 py-1.5 rounded-2xl w-full xl:w-auto justify-around sm:justify-center">
            {/* Speed selection */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-text-muted mr-1 font-bold">SPEED:</span>
              {([1, 2, 5, 10] as const).map(sp => (
                <button
                  key={sp}
                  onClick={() => setReplaySpeed(sp)}
                  className={`w-6.5 h-6.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    currentSpeed === sp 
                      ? 'bg-app-green text-black border-app-green' 
                      : 'border-border-glass text-text-muted hover:text-white'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>

            {/* Play/Pause controls */}
            <div className="flex items-center gap-2 border-l border-r border-border-glass/40 px-3">
              <button
                onClick={stepBackward}
                className="p-1 rounded text-text-muted hover:text-white cursor-pointer"
                title="Step Backward"
              >
                <span>◀</span>
              </button>
              
              {playbackState === 'playing' ? (
                <button
                  onClick={pauseReplay}
                  className="p-1.5 rounded-full bg-white/5 border border-border-glass hover:bg-white/10 text-white cursor-pointer"
                  title="Pause Replay"
                >
                  <Pause className="w-3.5 h-3.5 fill-white text-white" />
                </button>
              ) : (
                <button
                  onClick={playReplay}
                  className="p-1.5 rounded-full bg-app-green text-black hover:scale-105 transition-transform cursor-pointer"
                  title="Play Replay"
                >
                  <Play className="w-3.5 h-3.5 fill-black text-black" />
                </button>
              )}

              <button
                onClick={stepForward}
                className="p-1 rounded text-text-muted hover:text-white cursor-pointer"
                title="Step Forward"
              >
                <span>▶</span>
              </button>
            </div>

            {/* Tick status */}
            <span className="font-mono text-[10px] text-text-muted">
              TICK: <strong className="text-white">{tickIndex}</strong>/1000
            </span>
          </div>
        ) : (
          /* Live Stream Status Indicator */
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-text-muted font-medium w-full xl:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider">Feed:</span>
              <span className={`font-bold ${connectionStatus === 'CONNECTED' ? 'text-app-green' : 'text-yellow-500 animate-pulse'}`}>
                {connectionStatus}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-app-green animate-pulse" />
              <span className="text-white font-bold">{uptimeStr}</span>
            </div>

            {lastTickTime && (
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <span>Last Tick:</span>
                <span className="text-white font-bold">{lastTickTime}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <span>Rate:</span>
              <span className="text-white font-bold font-mono">{msgsPerSec} msg/sec</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Market:</span>
              <span className={isMarketOpen ? 'text-app-green font-bold' : 'text-text-muted'}>
                {isMarketOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>
          </div>
        )}

        {/* Customize Layout Button */}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`w-full xl:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-[11px] font-bold uppercase transition-all cursor-pointer ${
            editMode 
              ? 'bg-app-green text-black border-app-green shadow-glow-green-sm' 
              : 'border-border-glass text-text-muted hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Customize Layout</span>
        </button>
      </div>

      {/* 1.1 Customization Panel Editor */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-card p-5 border border-app-green/30 bg-app-green/5 rounded-2xl flex flex-col gap-4 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-app-green animate-pulse" />
                  <span className="font-bold text-sm text-white">Dashboard Layout Customize Mode</span>
                </div>
                <p className="text-[10px] text-text-muted mt-0.5 font-medium">Select presets, reorder widgets using the arrow controls, or hide unwanted sections.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={resetLayout} 
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 bg-surface-low border border-border-glass rounded-xl text-xs font-bold text-text-muted hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Default
                </button>
                <button 
                  onClick={() => setEditMode(false)} 
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-4 py-1.5 bg-app-green text-black rounded-xl text-xs font-bold shadow-glow-green-sm hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save & Exit
                </button>
              </div>
            </div>

            {/* Layout Preset previews selector */}
            <div className="border-t border-border-glass/40 pt-3">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block mb-2">Select Layout Preset</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { 
                    id: 'default', 
                    label: 'Default Layout', 
                    desc: 'All widgets visible', 
                    icon: (
                      <span className="inline-flex gap-[2px] border border-white/10 p-0.5 rounded bg-zinc-950/40">
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                      </span>
                    )
                  },
                  { 
                    id: 'trader', 
                    label: 'Trader Focus', 
                    desc: 'News and heatmap active', 
                    icon: (
                      <span className="inline-flex gap-[2px] border border-white/10 p-0.5 rounded bg-zinc-950/40">
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                      </span>
                    )
                  },
                  { 
                    id: 'analytics', 
                    label: 'Analytics Focus', 
                    desc: 'Portfolio summary & beta', 
                    icon: (
                      <span className="inline-flex gap-[2px] border border-white/10 p-0.5 rounded bg-zinc-950/40">
                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-zinc-800 rounded-[1px]" />
                      </span>
                    )
                  },
                  { 
                    id: 'minimal', 
                    label: 'Minimalist', 
                    desc: 'Indices & portfolio value', 
                    icon: (
                      <span className="inline-flex gap-[2px] border border-white/10 p-0.5 rounded bg-zinc-950/40">
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-zinc-850 rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-zinc-850 rounded-[1px]" />
                        <span className="w-1.5 h-1.5 bg-app-green rounded-[1px]" />
                      </span>
                    )
                  }
                ] as const).map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20 cursor-pointer ${
                      activePreset === p.id 
                        ? 'bg-app-green/10 border-app-green text-white shadow-glow-green-sm' 
                        : 'bg-surface-lowest/40 border-border-glass/40 hover:border-border-glass/80 text-text-muted hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="font-bold text-xs">{p.label}</span>
                      {p.icon}
                    </div>
                    <span className="text-[9px] text-text-muted font-normal block truncate mt-1">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Restore hidden widgets buttons block */}
            {widgets.filter(w => !w.visible).length > 0 && (
              <div className="border-t border-border-glass/40 pt-3 flex flex-wrap items-center gap-2">
                <span className="text-text-muted font-bold text-[10px] uppercase tracking-wider mr-1">Hidden Widgets:</span>
                {widgets.filter(w => !w.visible).map(w => (
                  <button 
                    type="button"
                    key={w.id} 
                    onClick={() => toggleWidgetVisibility(w.id, true)} 
                    className="px-2.5 py-1 bg-surface-low hover:bg-surface-medium border border-border-glass rounded-lg text-text-muted hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-[10px] font-bold"
                  >
                    <Eye className="w-3 h-3 text-app-green" /> {w.title}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1.5 Market Intelligence Bar */}
      <MarketIntelligenceBar stocks={stocks} indices={indices} />

      {/* 2. Dynamic Widget Render Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {widgets.filter(w => w.visible).map((widget, idx) => {
          // Determine the correct grid col-span class
          const colSpan = 
            widget.id === 'indices' 
              ? 'lg:col-span-6 col-span-1' 
              : widget.id === 'portfolio' 
              ? 'lg:col-span-4 col-span-1' 
              : widget.id === 'allocations' 
              ? 'lg:col-span-2 col-span-1' 
              : 'lg:col-span-3 col-span-1';

          return (
            <motion.div
              layout
              key={widget.id}
              className={`${colSpan} relative group`}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {/* Overlay edit controls */}
              {editMode && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-zinc-950/95 border border-border-glass rounded-xl p-1 shadow-2xl backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => reorderWidget(widget.id, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-text-muted hover:text-white disabled:opacity-30 hover:bg-white/5 cursor-pointer"
                    title="Move Up / Left"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderWidget(widget.id, 'down')}
                    disabled={idx === widgets.filter(w => w.visible).length - 1}
                    className="p-1.5 rounded-lg text-text-muted hover:text-white disabled:opacity-30 hover:bg-white/5 cursor-pointer"
                    title="Move Down / Right"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWidgetVisibility(widget.id, false)}
                    className="p-1.5 rounded-lg text-app-red hover:bg-app-red/10 hover:text-red-400 cursor-pointer"
                    title="Hide Widget"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {renderWidgetContent(widget.id)}
            </motion.div>
          );
        })}
      </div>

      {/* 6. Quick Buy/Sell Modal Dialog */}
      <AnimatePresence>
        {tradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-card border border-border-glass shadow-2xl rounded-3xl p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-border-glass">
                <span className="font-bold text-base text-white">Log {tradeType === 'BUY' ? 'Buy' : 'Sell'} Transaction</span>
                <button
                  onClick={() => setTradeModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5 text-text-muted" />
                </button>
              </div>

              {/* Trade Type Selection Switch */}
              <div className="flex p-0.5 bg-surface-low border border-border-glass rounded-xl text-xs font-bold text-text-muted my-4 w-full">
                <button
                  type="button"
                  onClick={() => setTradeType('BUY')}
                  className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                    tradeType === 'BUY' ? 'bg-app-green text-black font-bold shadow-sm' : 'hover:text-white'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setTradeType('SELL')}
                  className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                    tradeType === 'SELL' ? 'bg-app-red text-white font-bold shadow-sm' : 'hover:text-white'
                  }`}
                >
                  SELL
                </button>
              </div>

              <form onSubmit={handleQuickTradeSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted block">Asset Ticker</label>
                  <select
                    value={tradeSymbol}
                    onChange={(e) => {
                      const sym = e.target.value;
                      setTradeSymbol(sym);
                      const selected = data.stocks.find(s => s.symbol === sym);
                      if (selected) {
                        setTradePrice(selected.price);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs focus:outline-none focus:ring-1 focus:ring-app-green text-white font-bold cursor-pointer"
                  >
                    {data.stocks.map(s => (
                      <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted block">Shares Quantity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs font-semibold font-mono focus:outline-none focus:border-app-green text-white"
                      value={tradeQty}
                      onChange={e => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted block">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs font-semibold font-mono focus:outline-none focus:border-app-green text-white"
                      value={tradePrice}
                      onChange={e => setTradePrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    />
                  </div>
                </div>

                {/* Estimate */}
                {(() => {
                  const estValue = tradeQty * tradePrice;
                  const fee = Math.max(0.99, Number((estValue * 0.0005).toFixed(2)));
                  const isBuy = tradeType === 'BUY';
                  const total = isBuy ? estValue + fee : estValue - fee;

                  return (
                    <div className="border-t border-border-glass/40 pt-3.5 space-y-2 font-mono text-xs text-text-muted">
                      <div className="flex justify-between">
                        <span>Est Value</span>
                        <span className="text-white">${estValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Brokerage Fee (0.05%)</span>
                        <span className="text-white">${fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-border-glass/20 pt-2">
                        <span className="text-white">{isBuy ? 'Est Total Cost' : 'Est Net Credit'}</span>
                        <span className={isBuy ? 'text-app-green' : 'text-app-red'}>
                          ${Math.max(0, total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 cursor-pointer ${
                    tradeType === 'BUY' 
                      ? 'bg-app-green text-black hover:shadow-glow-green' 
                      : 'bg-app-red text-white hover:bg-red-700'
                  }`}
                >
                  Log {tradeType === 'BUY' ? 'Buy' : 'Sell'} Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default Dashboard;
