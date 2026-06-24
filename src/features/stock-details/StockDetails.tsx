import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useMarketStore } from '../../store/useMarketStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useAlertStore } from '../../store/useAlertStore';
import { TradingViewChartWrapper } from './components/TradingViewChartWrapper';
import { ChartSkeleton } from '../../components/LoadingState';
import { mockEconomicEvents } from '../markets/mockEconomicEvents';
import { mockDataEngine } from '../../services/mockDataEngine';
import type { CandlestickData } from '../../services/mockDataEngine';
import { replayEngine } from '../../services/replayEngine';
import { calculateRSI, calculateMACD } from '../../utils/indicators';
import {
  Star, 
  ArrowLeft, 
  Scale, 
  CheckCircle2,
  X,
  Plus,
  Calendar,
  AlertTriangle,
  Share2,
  Play,
  Pause,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Chart.js components
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const StockDetails: React.FC = () => {
  const { symbol = 'AAPL' } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  // Stores
  const { 
    stocks, 
    isReplayMode,
    playbackState,
    currentSpeed,
    tickIndex,
    playReplay,
    pauseReplay,
    setReplaySpeed,
    stepForward,
    stepBackward,
    seekReplay
  } = useMarketStore();
  
  const { activeListId, addToWatchlist, removeFromWatchlist, watchlists } = useWatchlistStore();
  const { holdings, buyStock, sellStock } = usePortfolioStore();
  const { createAlert } = useAlertStore();

  const activeWatchlist = watchlists.find(wl => wl.id === activeListId);
  const isWatched = activeWatchlist?.symbols.includes(symbol) || false;
  const currentHolding = holdings.find(h => h.symbol === symbol);

  // States initialized from URL params first (Snapshot Sharing)
  const [compareSymbol, setCompareSymbol] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('compare') || null;
  });

  const [benchmarkSymbol, setBenchmarkSymbol] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('benchmark') || null;
  });

  const [relativeMode, setRelativeMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('relative') === 'true';
  });

  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tfParam = params.get('tf');
    if (tfParam) return tfParam as any;
    return '1D';
  });

  const [chartType, setChartType] = useState<'line' | 'candlestick' | 'area'>(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    if (typeParam === 'line' || typeParam === 'candlestick' || typeParam === 'area') return typeParam;
    const saved = localStorage.getItem('stockpulse_chart_type');
    return (saved as any) || 'area';
  });

  const [showVolume, setShowVolume] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const volParam = params.get('volume');
    if (volParam === 'false') return false;
    if (volParam === 'true') return true;
    const saved = localStorage.getItem('stockpulse_chart_show_volume');
    return saved !== null ? saved === 'true' : true;
  });

  const [indicators, setIndicators] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const indsParam = params.get('indicators');
      if (indsParam) {
        const list = indsParam.split(',');
        return {
          sma: list.includes('sma'),
          ema: list.includes('ema'),
          bbands: list.includes('bbands'),
          rsi: list.includes('rsi'),
          macd: list.includes('macd')
        };
      }
      const saved = localStorage.getItem('stockpulse_chart_indicators');
      return saved ? JSON.parse(saved) : { sma: false, ema: false, bbands: false, rsi: false, macd: false };
    } catch {
      return { sma: false, ema: false, bbands: false, rsi: false, macd: false };
    }
  });

  const [notes, setNotes] = useState<any[]>([]);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  // Saved Layouts presets state
  const [savedLayouts, setSavedLayouts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('stockpulse_chart_layouts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeLayoutId, setActiveLayoutId] = useState('default');

  // Keep localStorage updated on basic adjustments
  useEffect(() => {
    localStorage.setItem('stockpulse_chart_type', chartType);
  }, [chartType]);

  useEffect(() => {
    localStorage.setItem('stockpulse_chart_show_volume', String(showVolume));
  }, [showVolume]);

  // Snapshot sharing: Update URL with chart parameters on changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (compareSymbol) params.set('compare', compareSymbol);
    if (benchmarkSymbol) params.set('benchmark', benchmarkSymbol);
    if (timeframe) params.set('tf', timeframe);
    if (chartType) params.set('type', chartType);
    if (showVolume === false) params.set('volume', 'false');
    if (relativeMode) params.set('relative', 'true');
    
    const activeIndicators = Object.entries(indicators)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key)
      .join(',');
    if (activeIndicators) params.set('indicators', activeIndicators);

    const queryStr = params.toString();
    const newUrl = `${window.location.pathname}${queryStr ? '?' + queryStr : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [compareSymbol, benchmarkSymbol, timeframe, chartType, showVolume, relativeMode, indicators]);

  // Saved layouts management handlers
  const handleSelectLayout = (layoutId: string) => {
    if (layoutId === 'default') {
      setActiveLayoutId('default');
      setChartType('area');
      setIndicators({ sma: false, ema: false, bbands: false, rsi: false, macd: false });
      setShowVolume(true);
      setTimeframe('1D');
      setCompareSymbol(null);
      setBenchmarkSymbol(null);
      setRelativeMode(false);
      setNotes([]);
      return;
    }

    const layout = savedLayouts.find(l => l.id === layoutId);
    if (!layout) return;

    setActiveLayoutId(layoutId);
    setChartType(layout.chartType);
    setIndicators(layout.indicators);
    setShowVolume(layout.showVolume);
    setTimeframe(layout.timeframe as any);
    setCompareSymbol(layout.compareSymbol);
    setBenchmarkSymbol(layout.benchmarkSymbol);
    setRelativeMode(layout.relativeMode);
    setNotes(layout.notes || []);

    if (layout.drawings) {
      localStorage.setItem(`stockpulse_drawings_${symbol}`, JSON.stringify(layout.drawings));
    }
  };

  const handleSaveNewLayout = () => {
    const name = prompt("Enter a name for the new chart layout:");
    if (!name || !name.trim()) return;

    let currentDrawings = { trendlines: [], horizontals: [] };
    const savedDrawings = localStorage.getItem(`stockpulse_drawings_${symbol}`);
    if (savedDrawings) {
      currentDrawings = JSON.parse(savedDrawings);
    }

    const newLayout = {
      id: Math.random().toString(),
      name: name.trim(),
      chartType,
      indicators,
      showVolume,
      timeframe,
      compareSymbol,
      benchmarkSymbol,
      relativeMode,
      drawings: currentDrawings,
      notes
    };

    const updated = [...savedLayouts, newLayout];
    setSavedLayouts(updated);
    localStorage.setItem('stockpulse_chart_layouts', JSON.stringify(updated));
    setActiveLayoutId(newLayout.id);
  };

  const handleDeleteLayout = (layoutId: string) => {
    if (layoutId === 'default') return;
    if (!confirm("Are you sure you want to delete this layout?")) return;

    const updated = savedLayouts.filter(l => l.id !== layoutId);
    setSavedLayouts(updated);
    localStorage.setItem('stockpulse_chart_layouts', JSON.stringify(updated));
    handleSelectLayout('default');
  };

  // Auto-save changes to active layout
  useEffect(() => {
    if (activeLayoutId === 'default') return;

    let currentDrawings = { trendlines: [], horizontals: [] };
    const savedDrawings = localStorage.getItem(`stockpulse_drawings_${symbol}`);
    if (savedDrawings) {
      currentDrawings = JSON.parse(savedDrawings);
    }

    setSavedLayouts(prev => {
      const idx = prev.findIndex(l => l.id === activeLayoutId);
      if (idx === -1) return prev;

      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        chartType,
        indicators,
        showVolume,
        timeframe,
        compareSymbol,
        benchmarkSymbol,
        relativeMode,
        drawings: currentDrawings,
        notes
      };
      localStorage.setItem('stockpulse_chart_layouts', JSON.stringify(updated));
      return updated;
    });
  }, [chartType, indicators, showVolume, timeframe, compareSymbol, benchmarkSymbol, relativeMode, notes, activeLayoutId, symbol]);

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setShareStatus('Copied!');
        setTimeout(() => setShareStatus(null), 2000);
      })
      .catch(() => {
        setShareStatus('Failed');
        setTimeout(() => setShareStatus(null), 2000);
      });
  };

  // Toggles helper
  const toggleIndicator = (key: keyof typeof indicators) => {
    setIndicators((prev: any) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('stockpulse_chart_indicators', JSON.stringify(next));
      return next;
    });
  };

  // Custom Alert Trigger Modal state
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertType, setAlertType] = useState<'PRICE_ABOVE' | 'PRICE_BELOW'>('PRICE_ABOVE');
  const [alertValue, setAlertValue] = useState(0);

  // Trade modal state
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState<number>(10);
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState<string | null>(null);

  // Financial Chart tab selection
  const [financialTab, setFinancialTab] = useState<'revenue' | 'earnings' | 'margins'>('revenue');

  // Floating alerts visibility toggle states
  const [rsiAlertDismissed, setRsiAlertDismissed] = useState(false);
  const [macdAlertDismissed, setMacdAlertDismissed] = useState(false);

  // Find active stock metadata in useMarketStore live list
  const stock = stocks.find(s => s.symbol === symbol);

  // Set default alert value when stock details load
  useEffect(() => {
    if (stock) {
      setAlertValue(Number(stock.price.toFixed(2)));
    }
  }, [stock?.symbol]);

  // Reset dismissed alert states on symbol or timeframe change
  useEffect(() => {
    setRsiAlertDismissed(false);
    setMacdAlertDismissed(false);
  }, [symbol, timeframe]);

  // Query historical candlestick data
  const { data: chartData, isLoading } = useQuery<CandlestickData[]>({
    queryKey: ['stockHistory', symbol, timeframe, isReplayMode],
    queryFn: () => mockDataEngine.getHistoricalData(symbol, timeframe),
    refetchInterval: isReplayMode ? false : 10000,
  });

  // Query compare stock history
  const { data: compareQueryData } = useQuery<CandlestickData[]>({
    queryKey: ['stockHistory', compareSymbol, timeframe, isReplayMode],
    queryFn: () => {
      if (!compareSymbol) return [];
      return mockDataEngine.getHistoricalData(compareSymbol, timeframe);
    },
    enabled: !!compareSymbol && !isReplayMode
  });

  // Query benchmark index history
  const { data: benchmarkQueryData } = useQuery<CandlestickData[]>({
    queryKey: ['stockHistory', benchmarkSymbol, timeframe, isReplayMode],
    queryFn: () => {
      if (!benchmarkSymbol) return [];
      return mockDataEngine.getHistoricalData(benchmarkSymbol, timeframe);
    },
    enabled: !!benchmarkSymbol && !isReplayMode
  });

  // Replay data candlestick grouping
  const replayCandles = useMemo(() => {
    if (!isReplayMode) return [];
    const buffer = replayEngine.getBuffer().slice(0, tickIndex + 1);
    const candles: CandlestickData[] = [];
    const ticksPerCandle = 10;
    
    for (let i = 0; i < buffer.length; i += ticksPerCandle) {
      const chunk = buffer.slice(i, i + ticksPerCandle);
      const stockTicks = chunk.map(t => t.stocks.find(s => s.symbol === symbol)).filter(Boolean);
      if (stockTicks.length === 0) continue;
      
      const prices = stockTicks.map(st => st!.price);
      const open = prices[0];
      const close = prices[prices.length - 1];
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const time = Math.floor(chunk[0].timestamp / 1000);
      
      candles.push({
        time,
        open,
        high,
        low,
        close,
        volume: Math.floor(stockTicks.reduce((sum, st) => sum + (st!.volume || 1000), 0) / 10)
      });
    }
    return candles;
  }, [isReplayMode, tickIndex, symbol]);

  const compareReplayCandles = useMemo(() => {
    if (!isReplayMode || !compareSymbol) return [];
    const buffer = replayEngine.getBuffer().slice(0, tickIndex + 1);
    const candles: CandlestickData[] = [];
    const ticksPerCandle = 10;
    
    for (let i = 0; i < buffer.length; i += ticksPerCandle) {
      const chunk = buffer.slice(i, i + ticksPerCandle);
      const stockTicks = chunk.map(t => t.stocks.find(s => s.symbol === compareSymbol)).filter(Boolean);
      if (stockTicks.length === 0) continue;
      
      const prices = stockTicks.map(st => st!.price);
      const open = prices[0];
      const close = prices[prices.length - 1];
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const time = Math.floor(chunk[0].timestamp / 1000);
      
      candles.push({ time, open, high, low, close });
    }
    return candles;
  }, [isReplayMode, tickIndex, compareSymbol]);

  const benchmarkReplayCandles = useMemo(() => {
    if (!isReplayMode || !benchmarkSymbol) return [];
    const buffer = replayEngine.getBuffer().slice(0, tickIndex + 1);
    const candles: CandlestickData[] = [];
    const ticksPerCandle = 10;
    
    for (let i = 0; i < buffer.length; i += ticksPerCandle) {
      const chunk = buffer.slice(i, i + ticksPerCandle);
      const indexTicks = chunk.map(t => t.indices.find(idx => idx.symbol === benchmarkSymbol)).filter(Boolean);
      if (indexTicks.length === 0) continue;
      
      const prices = indexTicks.map(idx => idx!.price);
      const open = prices[0];
      const close = prices[prices.length - 1];
      const high = Math.max(...prices);
      const low = Math.min(...prices);
      const time = Math.floor(chunk[0].timestamp / 1000);
      
      candles.push({ time, open, high, low, close });
    }
    return candles;
  }, [isReplayMode, tickIndex, benchmarkSymbol]);

  const activeChartData = isReplayMode ? replayCandles : chartData;
  const activeCompareData = isReplayMode ? compareReplayCandles : compareQueryData;
  const activeBenchmarkData = isReplayMode ? benchmarkReplayCandles : benchmarkQueryData;

  // Compute latest RSI & MACD values for floating alert cards
  const indicatorAlerts = useMemo(() => {
    if (!activeChartData || activeChartData.length < 30) return null;
    const closes = activeChartData.map(d => d.close);
    
    // 1. RSI Alert
    const rsiVals = calculateRSI(closes, 14);
    const latestRsi = rsiVals[rsiVals.length - 1];
    
    let rsiAlert = null;
    if (latestRsi !== null && latestRsi !== undefined) {
      if (latestRsi > 70) {
        rsiAlert = {
          type: 'OVERBOUGHT' as const,
          value: latestRsi,
          message: `RSI is at ${latestRsi.toFixed(1)} (Overbought). High risk of price pullback.`
        };
      } else if (latestRsi < 30) {
        rsiAlert = {
          type: 'OVERSOLD' as const,
          value: latestRsi,
          message: `RSI is at ${latestRsi.toFixed(1)} (Oversold). Potential buy/rebound opportunity.`
        };
      }
    }
    
    // 2. MACD Crossover Alert
    const macdData = calculateMACD(closes);
    const latestMacd = macdData.macd[macdData.macd.length - 1];
    const latestSignal = macdData.signal[macdData.signal.length - 1];
    const prevMacd = macdData.macd[macdData.macd.length - 2];
    const prevSignal = macdData.signal[macdData.signal.length - 2];
    
    let macdAlert = null;
    if (latestMacd !== null && latestSignal !== null && prevMacd !== null && prevSignal !== null) {
      const crossedAbove = prevMacd <= prevSignal && latestMacd > latestSignal;
      const crossedBelow = prevMacd >= prevSignal && latestMacd < latestSignal;
      
      if (crossedAbove) {
        macdAlert = {
          type: 'BULLISH' as const,
          message: 'MACD line crossed above Signal line. Bullish crossover.'
        };
      } else if (crossedBelow) {
        macdAlert = {
          type: 'BEARISH' as const,
          message: 'MACD line crossed below Signal line. Bearish crossover.'
        };
      }
    }
    
    return { rsiAlert, macdAlert };
  }, [activeChartData]);

  if (!stock) {
    return (
      <div className="py-24 text-center text-text-muted flex flex-col justify-center items-center gap-3 glass-card rounded-3xl p-8 border border-border-glass max-w-md mx-auto mt-12">
        <AlertTriangle className="w-10 h-10 text-app-red animate-pulse" />
        <span className="text-sm font-semibold text-white">Stock Symbol "{symbol}" Not Found</span>
        <span className="text-xs">The requested asset might not be loaded in our live databases.</span>
        <button 
          onClick={() => navigate('/markets')} 
          className="mt-4 px-4.5 py-2.5 rounded-xl bg-surface-glass border border-border-glass text-xs font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          Return to Markets
        </button>
      </div>
    );
  }

  const isPositive = stock.changePercent >= 0;

  const handleToggleWatchlist = () => {
    if (!activeListId) return;
    if (isWatched) {
      removeFromWatchlist(activeListId, symbol);
    } else {
      addToWatchlist(activeListId, symbol);
    }
  };

  const handleCreateAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert(symbol, alertType, alertValue);
    setAlertModalOpen(false);
  };

  const handleTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    if (tradeType === 'BUY') {
      buyStock(symbol, quantity, stock.price);
      setTradeSuccessMsg(`Purchased ${quantity} shares of ${symbol} at $${stock.price.toFixed(2)}`);
    } else {
      if (!currentHolding || currentHolding.quantity < quantity) {
        alert("Insufficient shares.");
        return;
      }
      sellStock(symbol, quantity, stock.price);
      setTradeSuccessMsg(`Sold ${quantity} shares of ${symbol} at $${stock.price.toFixed(2)}`);
    }

    setTimeout(() => {
      setTradeModalOpen(false);
      setTradeSuccessMsg(null);
    }, 2000);
  };

  // Generate financial profiles
  const years = ['2022', '2023', '2024', '2025 (Est)'];
  let revData = [120, 145, 172, 205];
  let earnData = [25, 34, 42, 54];
  let marginData = [20.8, 23.4, 24.4, 26.3];

  if (symbol === 'AAPL') {
    revData = [394.3, 383.2, 391.0, 412.5];
    earnData = [99.8, 97.0, 100.3, 108.2];
    marginData = [25.3, 24.5, 25.6, 26.2];
  } else if (symbol === 'MSFT') {
    revData = [198.3, 211.9, 245.1, 278.4];
    earnData = [72.7, 72.4, 88.1, 101.3];
    marginData = [36.7, 34.2, 35.9, 36.4];
  } else if (symbol === 'NVDA') {
    revData = [27.0, 60.9, 96.3, 135.0];
    earnData = [4.4, 29.8, 53.0, 78.4];
    marginData = [16.2, 48.9, 55.0, 58.1];
  }

  const chartDataJS = {
    labels: years,
    datasets: [
      {
        data: financialTab === 'revenue' ? revData : financialTab === 'earnings' ? earnData : marginData,
        backgroundColor: 'rgba(0, 255, 148, 0.75)',
        borderColor: '#00FF94',
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  };

  const chartOptionsJS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8A8F98', font: { family: 'Inter' } } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#8A8F98', font: { family: 'Inter' } } }
    }
  };

  const pe = stock.peRatio || 0;
  const ratingPct = pe > 60 ? 85 : pe > 30 ? 55 : 25;
  const ratingText = pe > 60 ? 'Sell / Underperform' : pe > 30 ? 'Hold / Market Perform' : 'Buy / Outperform';
  const filteredEvents = mockEconomicEvents.slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Back navigations & share buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Terminal Dashboard
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-glass bg-surface-glass text-xs font-bold hover:bg-white/5 text-white cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-app-green" /> {shareStatus || 'Share Layout'}
          </button>
          <button
            onClick={() => setAlertModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-glass bg-surface-glass text-xs font-bold hover:bg-white/5 text-app-green cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Create Alert Trigger
          </button>
          <button
            onClick={() => navigate(`/compare?symbol=${symbol}`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-glass bg-surface-glass text-xs font-bold hover:bg-white/5 text-white"
          >
            <Scale className="w-3.5 h-3.5" /> Compare Page
          </button>
        </div>
      </div>

      {/* 1. Hero Summary Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-app-green/10 text-app-green flex items-center justify-center font-bold text-xl border border-app-green/20">
            {stock.symbol.slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white !my-0">{stock.name}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-lowest text-text-muted border border-border-glass">{stock.symbol}</span>
            </div>
            <p className="text-[10px] text-text-muted mt-1 font-semibold">{stock.sector} • {stock.industry}</p>
          </div>
        </div>

        <div className="flex flex-col md:items-end font-mono">
          <div className="text-2xl sm:text-3xl font-bold text-white">${stock.price.toFixed(2)}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`flex items-center gap-0.5 text-xs font-bold ${isPositive ? 'text-app-green' : 'text-app-red'}`}>
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
            <span className="w-1 h-1 rounded-full bg-border-glass" />
            <span className="text-[9px] text-[#8A8F98] uppercase font-bold tracking-wider">Feed Live</span>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleToggleWatchlist}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4.5 py-3 rounded-xl border text-xs font-bold transition-colors ${
              isWatched ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-500' : 'border-border-glass text-text-muted hover:bg-white/5'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isWatched ? 'fill-yellow-500' : ''}`} />
            {isWatched ? 'Watched' : 'Watch'}
          </button>
          
          <button
            onClick={() => { setTradeType('BUY'); setTradeModalOpen(true); }}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-app-green text-black text-xs font-bold hover:shadow-glow-green-sm"
          >
            Order Shares
          </button>
        </div>
      </div>

      {/* 2. Interactive Charts & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-glass">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Price Chart</h2>
              <span className="text-[9px] text-[#8A8F98] mt-0.5 block">Double click to add chart notes. Eraser erases notes & trendlines.</span>
            </div>

            {/* Toolbar options */}
            <div className="flex flex-wrap gap-2.5 items-center">
              
              {/* Layout Manager */}
              <div className="flex items-center gap-1 bg-surface-low border border-border-glass rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-text-muted">
                <span>Layout:</span>
                <select
                  value={activeLayoutId}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === 'SAVE_NEW') {
                      handleSaveNewLayout();
                    } else if (val === 'DELETE_CURRENT') {
                      handleDeleteLayout(activeLayoutId);
                    } else {
                      handleSelectLayout(val);
                    }
                  }}
                  className="bg-transparent text-white outline-none border-none cursor-pointer font-bold"
                >
                  <option value="default" className="bg-zinc-950">Default Layout</option>
                  {savedLayouts.map(lay => (
                    <option key={lay.id} value={lay.id} className="bg-zinc-950">{lay.name}</option>
                  ))}
                  <option value="SAVE_NEW" className="bg-zinc-950 text-app-green font-bold">+ Save Current...</option>
                  {activeLayoutId !== 'default' && (
                    <option value="DELETE_CURRENT" className="bg-zinc-950 text-app-red font-bold">🗑️ Delete Current</option>
                  )}
                </select>
              </div>

              {/* Compare Stock */}
              <div className="flex items-center gap-1.5 bg-surface-low border border-border-glass rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-text-muted">
                <span>Compare:</span>
                <select
                  value={compareSymbol || ''}
                  onChange={e => setCompareSymbol(e.target.value || null)}
                  className="bg-transparent text-white outline-none border-none cursor-pointer font-bold"
                >
                  <option value="" className="bg-zinc-950">None</option>
                  {stocks.filter(s => s.symbol !== symbol).map(s => (
                    <option key={s.symbol} value={s.symbol} className="bg-zinc-950">{s.symbol}</option>
                  ))}
                </select>
              </div>

              {/* Benchmark Index */}
              <div className="flex items-center gap-1.5 bg-surface-low border border-border-glass rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-text-muted">
                <span>Index:</span>
                <select
                  value={benchmarkSymbol || ''}
                  onChange={e => setBenchmarkSymbol(e.target.value || null)}
                  className="bg-transparent text-white outline-none border-none cursor-pointer font-bold"
                >
                  <option value="" className="bg-zinc-950">None</option>
                  <option value="S&P 500" className="bg-zinc-950">S&P 500</option>
                  <option value="NASDAQ" className="bg-zinc-950">NASDAQ</option>
                  <option value="DOW JONES" className="bg-zinc-950">DOW JONES</option>
                  <option value="Russell 2000" className="bg-zinc-950">Russell 2000</option>
                </select>
              </div>

              {/* Relative Mode Toggle */}
              {(compareSymbol || benchmarkSymbol) && (
                <button
                  onClick={() => setRelativeMode(!relativeMode)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                    relativeMode 
                      ? 'border-app-green/30 bg-app-green/10 text-app-green shadow-glow-green-sm' 
                      : 'border-border-glass bg-surface-glass text-text-muted hover:text-white'
                  }`}
                >
                  % Relative
                </button>
              )}

              {/* Chart Type */}
              <div className="flex p-0.5 bg-surface-low border border-border-glass rounded-xl text-[10px] font-bold text-text-muted w-fit">
                {(['candlestick', 'area', 'line'] as const).map(ct => (
                  <button
                    key={ct}
                    onClick={() => setChartType(ct)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                      chartType === ct ? 'bg-surface-high text-white shadow-sm' : 'hover:text-white'
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>

              {/* Volume Toggle */}
              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                  showVolume 
                    ? 'border-app-green/30 bg-app-green/10 text-app-green shadow-glow-green-sm' 
                    : 'border-border-glass bg-surface-glass text-text-muted hover:text-white'
                }`}
              >
                Vol
              </button>

              {/* Timeframes */}
              <div className="flex p-0.5 bg-surface-low border border-border-glass rounded-xl text-[10px] font-bold text-text-muted w-fit">
                {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      timeframe === tf ? 'bg-surface-high text-white shadow-sm' : 'hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Indicator toggles badge line */}
          <div className="flex flex-wrap gap-2 text-[10px] font-bold text-text-muted">
            <span className="self-center mr-1">INDICATORS:</span>
            {[
              { key: 'sma', label: 'SMA (20)' },
              { key: 'ema', label: 'EMA (12)' },
              { key: 'bbands', label: 'Bollinger' },
              { key: 'rsi', label: 'RSI' },
              { key: 'macd', label: 'MACD' }
            ].map(ind => {
              const active = indicators[ind.key as keyof typeof indicators];
              return (
                <button
                  key={ind.key}
                  disabled={relativeMode}
                  onClick={() => toggleIndicator(ind.key as any)}
                  className={`px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-30 ${
                    active 
                      ? 'border-app-green/30 bg-app-green/10 text-app-green shadow-glow-green-sm' 
                      : 'border-border-glass bg-surface-glass hover:text-white'
                  }`}
                >
                  {ind.label}
                </button>
              );
            })}
          </div>

          {/* Replay Control Bar */}
          {isReplayMode && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-zinc-950/60 border border-border-glass rounded-2xl text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted font-bold uppercase">Speed:</span>
                {([1, 2, 5, 10] as const).map(sp => (
                  <button
                    key={sp}
                    onClick={() => setReplaySpeed(sp)}
                    className={`w-6.5 h-6.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      currentSpeed === sp 
                        ? 'bg-app-green text-black border-app-green shadow-glow-green-sm' 
                        : 'border-border-glass text-text-muted hover:text-white'
                    }`}
                  >
                    {sp}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5 px-3">
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

              <div className="flex-1 min-w-[120px] flex items-center gap-2">
                <span className="text-[10px] text-text-muted font-bold font-mono">TICK:</span>
                <input
                  type="range"
                  min="0"
                  max="999"
                  value={tickIndex}
                  onChange={e => seekReplay(parseInt(e.target.value))}
                  className="flex-1 accent-app-green h-1 rounded-lg cursor-pointer appearance-none outline-none"
                  style={{
                    background: `linear-gradient(to right, #00FF94 0%, #00FF94 ${tickIndex / 9.99}%, #1f2937 ${tickIndex / 9.99}%, #1f2937 100%)`
                  }}
                />
              </div>

              <div className="text-right text-[10px] font-mono text-text-muted">
                Time: <span className="text-white font-bold">{
                  (() => {
                    const ts = replayEngine.getBuffer()[tickIndex]?.timestamp;
                    return ts ? new Date(ts).toLocaleString() : '--';
                  })()
                }</span>
              </div>
            </div>
          )}

          {/* Chart Wrapper Canvas */}
          <div className="relative">
            {/* Floating indicator alert cards */}
            <div className="absolute top-4 left-4 z-30 flex flex-col gap-2.5 max-w-[280px]">
              <AnimatePresence>
                {indicators.rsi && indicatorAlerts?.rsiAlert && !rsiAlertDismissed && (
                  <motion.div
                    initial={{ opacity: 0, x: -15, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -15, scale: 0.95 }}
                    className="p-3.5 rounded-2xl glass-card border border-border-glass bg-[#10141a]/95 backdrop-blur-xl shadow-2xl flex items-start gap-2.5 text-xs text-white"
                  >
                    <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-bold text-[9px] uppercase tracking-wider text-text-muted">RSI Indicator Alert</span>
                        <button 
                          onClick={() => setRsiAlertDismissed(true)} 
                          className="p-0.5 rounded text-text-muted hover:text-white transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="mt-1 leading-normal font-semibold text-[#dfe2eb]">{indicatorAlerts.rsiAlert.message}</p>
                    </div>
                  </motion.div>
                )}

                {indicators.macd && indicatorAlerts?.macdAlert && !macdAlertDismissed && (
                  <motion.div
                    initial={{ opacity: 0, x: -15, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -15, scale: 0.95 }}
                    className="p-3.5 rounded-2xl glass-card border border-border-glass bg-[#10141a]/95 backdrop-blur-xl shadow-2xl flex items-start gap-2.5 text-xs text-white"
                  >
                    <TrendingUp className="w-4 h-4 text-app-green flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-4">
                        <span className="font-bold text-[9px] uppercase tracking-wider text-text-muted">MACD Trend Crossover</span>
                        <button 
                          onClick={() => setMacdAlertDismissed(true)} 
                          className="p-0.5 rounded text-text-muted hover:text-white transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="mt-1 leading-normal font-semibold text-[#dfe2eb]">{indicatorAlerts.macdAlert.message}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isLoading || !activeChartData ? (
              <ChartSkeleton />
            ) : (
              <TradingViewChartWrapper 
                data={activeChartData} 
                type={chartType} 
                showVolume={showVolume}
                timeframe={timeframe}
                indicators={indicators}
                compareSymbol={compareSymbol}
                compareData={activeCompareData}
                benchmarkSymbol={benchmarkSymbol}
                benchmarkData={activeBenchmarkData}
                relativeMode={relativeMode}
                activeLayoutId={activeLayoutId}
                notes={notes}
                onNotesChanged={setNotes}
              />
            )}
          </div>
        </div>

        {/* Sidebar details */}
        <div className="space-y-6 lg:col-span-1">
          {currentHolding ? (
            <div className="glass-card rounded-3xl p-6 bg-app-green/[0.02] border border-app-green/15">
              <h2 className="text-xs font-bold text-app-green uppercase tracking-wider mb-4">Current Position</h2>
              <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <span className="text-[9px] text-[#8A8F98] block">Shares Owned</span>
                  <span className="font-bold text-white text-sm">{currentHolding.quantity}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#8A8F98] block">Avg Buy Price</span>
                  <span className="font-bold text-white text-sm">${currentHolding.avgBuyPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#8A8F98] block">Total Cost Basis</span>
                  <span className="font-bold text-white text-sm">${(currentHolding.quantity * currentHolding.avgBuyPrice).toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#8A8F98] block">Current Value</span>
                  <span className="font-bold text-white text-sm">${(currentHolding.quantity * stock.price).toFixed(0)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-6 text-center text-text-muted flex flex-col justify-center h-40 border border-dashed border-border-glass">
              <span className="text-xs font-semibold text-white block">No active holdings</span>
              <span className="text-[10px] mt-1">Submit purchase trades to list this ticker asset in your portfolio.</span>
            </div>
          )}

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Valuation Metrics</h2>
            
            <div className="divide-y divide-border-glass/40 font-mono text-[11px] text-text-muted space-y-0.5">
              <div className="flex justify-between py-2">
                <span>Market Cap</span>
                <span className="font-bold text-white">${(stock.marketCap / 1000000000).toFixed(1)}B</span>
              </div>
              <div className="flex justify-between py-2">
                <span>P/E Ratio</span>
                <span className="font-bold text-white">{stock.peRatio || '--'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Beta (Volatility)</span>
                <span className="font-bold text-white">{stock.beta || 1.0}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>EPS (TTM)</span>
                <span className="font-bold text-white">${stock.eps.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Dividend Yield</span>
                <span className="font-bold text-white">{stock.dividendYield > 0 ? `${stock.dividendYield}%` : '--'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>52W High / Low</span>
                <span className="font-bold text-white">${stock.low52W} - ${stock.high52W}</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">Analyst Recommendation</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-white">
                <span>Underperform</span>
                <span>Market Perform</span>
                <span>Outperform</span>
              </div>
              <div className="h-2 w-full bg-surface-low rounded-full relative overflow-hidden border border-border-glass">
                <div 
                  className="absolute top-0 bottom-0 w-2.5 bg-app-green rounded-full shadow-glow-green-sm transition-all"
                  style={{ left: `${ratingPct}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted block text-center font-bold">Consensus: <strong className="text-app-green">{ratingText}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Overview details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted pb-3 border-b border-border-glass mb-4">Company Overview</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              {stock.name} is a global leader operating within the {stock.sector} sector, primarily focused on {stock.industry}. Headquartered in the United States, the firm develops, builds, and distributes advanced technical solutions, consumer applications, and strategic infrastructure assets to millions of clients worldwide.
            </p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 flex flex-col min-h-[300px] lg:col-span-1">
          <div className="flex justify-between items-center pb-3 border-b border-border-glass mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Financial Overview</h2>
            <select
              value={financialTab}
              onChange={e => setFinancialTab(e.target.value as any)}
              className="bg-transparent text-xs text-app-green outline-none border-none cursor-pointer font-bold"
            >
              <option value="revenue">Revenue</option>
              <option value="earnings">Earnings</option>
              <option value="margins">Margins %</option>
            </select>
          </div>
          <div className="flex-1 relative min-h-[160px]">
            <Bar data={chartDataJS} options={chartOptionsJS} />
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted pb-3 border-b border-border-glass mb-4 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-app-green animate-pulse" /> Economic Calendar Releases
            </h2>
            <div className="space-y-3">
              {filteredEvents.map(ev => (
                <div key={ev.id} className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white block">{ev.title}</span>
                    <span className="text-[9px] text-[#8A8F98] block mt-0.5">{ev.date} ({ev.country})</span>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    ev.impact === 'High' ? 'bg-[#FF3B5C]/15 text-[#FF3B5C]' : ev.impact === 'Medium' ? 'bg-yellow-500/15 text-yellow-550' : 'bg-app-green/15 text-app-green'
                  }`}>
                    {ev.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Trigger alert Modal */}
      <AnimatePresence>
        {alertModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-card border border-border-glass shadow-2xl rounded-3xl p-6"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-border-glass">
                <span className="font-bold text-base text-white">Create Price Trigger Alert</span>
                <button onClick={() => setAlertModalOpen(false)} className="p-1 rounded hover:bg-white/5 text-text-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAlertSubmit} className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted block">Alert Type</label>
                  <select
                    value={alertType}
                    onChange={e => setAlertType(e.target.value as any)}
                    className="w-full bg-surface-lowest border border-border-glass rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-app-green font-bold cursor-pointer"
                  >
                    <option value="PRICE_ABOVE">Crosses Above ($)</option>
                    <option value="PRICE_BELOW">Crosses Below ($)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted block">Trigger Threshold Price</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-surface-lowest border border-border-glass rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-app-green"
                    value={alertValue}
                    onChange={e => setAlertValue(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                  />
                  <span className="text-[10px] text-text-muted block mt-0.5">Live current price: ${stock.price.toFixed(2)}</span>
                </div>

                <button type="submit" className="w-full py-3 rounded-xl bg-app-green text-black font-bold text-xs shadow-md">
                  Set Trigger Alert
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Trade modal */}
      <AnimatePresence>
        {tradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-card border border-border-glass shadow-2xl rounded-3xl p-6"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-border-glass">
                <span className="font-bold text-base text-white">Order Ticker: {symbol}</span>
                <button onClick={() => setTradeModalOpen(false)} className="p-1 rounded hover:bg-white/5 text-text-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {tradeSuccessMsg ? (
                <div className="py-8 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-app-green mx-auto animate-bounce" />
                  <p className="font-bold text-sm text-white">Order Settled Successfully</p>
                  <p className="text-xs text-text-muted px-4">{tradeSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleTradeSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-low border border-border-glass font-bold text-xs">
                    <button
                      type="button"
                      onClick={() => setTradeType('BUY')}
                      className={`py-2 rounded-lg transition-all ${tradeType === 'BUY' ? 'bg-surface-high text-white shadow-sm' : 'text-text-muted'}`}
                    >
                      Buy Order
                    </button>
                    <button
                      type="button"
                      disabled={!currentHolding}
                      onClick={() => setTradeType('SELL')}
                      className="py-2 rounded-lg transition-all text-text-muted disabled:opacity-40"
                    >
                      Sell Order
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-muted block">Quantity Shares</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="w-full bg-surface-lowest border border-border-glass rounded-xl px-3 py-2.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-app-green"
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    {tradeType === 'SELL' && currentHolding && (
                      <span className="text-[10px] text-text-muted block mt-1">Available to Sell: {currentHolding.quantity} shares</span>
                    )}
                  </div>

                  <button type="submit" className="w-full py-3 rounded-xl bg-app-green text-black font-bold text-xs shadow-md">
                    Execute Trade
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default StockDetails;
