import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import type { Holding } from '../../store/usePortfolioStore';
import { useMarketStore } from '../../store/useMarketStore';
import { usePortfolioAnalyticsStore } from '../../store/usePortfolioAnalyticsStore';
import type { PrecomputedSnapshot } from '../../store/usePortfolioAnalyticsStore';
import { useAssistantStore } from '../../store/useAssistantStore';
import { mockDataEngine } from '../../services/mockDataEngine';
import { LiveTickText } from '../../components/LiveTickText';
import { analyticsEngine } from '../../services/analyticsEngine';
import type { BacktestResult } from '../../services/analyticsEngine';
import { 
  Briefcase, 
  Edit2, 
  Check, 
  X, 
  Trash2, 
  Plus,
  Play,
  TrendingUp,
  Percent,
  Sliders,
  Activity,
  Shield,
  HelpCircle,
  Terminal,
  RefreshCw,
  TrendingDown,
  Info,
  Sparkles,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import custom SVG charts and skeletons
import { AllocationChart } from './AllocationChart';
import { PortfolioGrowthChart } from './PortfolioGrowthChart';
import { DrawdownChart } from './DrawdownChart';
import { 
  CardSkeleton, 
  ChartPlaceholderSkeleton, 
  TableSkeleton, 
  DrawdownChartSkeleton 
} from './PortfolioSkeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
  }
};

const sectorColors = ['#00FF94', '#0EA5E9', '#6366F1', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981', '#EF4444'];

export const PortfolioPage: React.FC = () => {
  const { holdings, realizedPnL, buyStock, sellStock, updateHolding, removeHolding, clearPortfolio } = usePortfolioStore();
  const { stocks: allStocks, triggerFailure, connectionStatus } = useMarketStore();
  const { messages, addMessage, generateResponse } = useAssistantStore();
  const location = useLocation();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'holdings' | 'backtester'>('analytics');

  // AI Analyst Drawer state
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiDrawerTyping, setAiDrawerTyping] = useState(false);
  const [aiDrawerInput, setAiDrawerInput] = useState('');
  const aiChatBottomRef = React.useRef<HTMLDivElement>(null);

  // Simulated Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [demoControlsOpen, setDemoControlsOpen] = useState(false);

  // Target Allocations for Drift analysis (persisted in local state)
  const [targetAllocations, setTargetAllocations] = useState<{ [symbol: string]: number }>({});
  
  // Quick Trade Modal
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [buySymbol, setBuySymbol] = useState('AAPL');
  const [buyQty, setBuyQty] = useState(10);
  const [buyPrice, setBuyPrice] = useState(0);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  // Performance Alert State
  const [lastTopPerformer, setLastTopPerformer] = useState<string | null>(null);
  const [topPerformerAlert, setTopPerformerAlert] = useState<{
    symbol: string;
    returnPct: number;
    prevSymbol: string | null;
  } | null>(null);

  // Tooltip visibility state
  const [varTooltipOpen, setVarTooltipOpen] = useState(false);
  const [sharpeTooltipOpen, setSharpeTooltipOpen] = useState(false);
  const [betaTooltipOpen, setBetaTooltipOpen] = useState(false);
  const [hhiTooltipOpen, setHhiTooltipOpen] = useState(false);
  const [volTooltipOpen, setVolTooltipOpen] = useState(false);
  const [healthTooltipOpen, setHealthTooltipOpen] = useState(false);
  const [ddTooltipOpen, setDdTooltipOpen] = useState(false);

  // Backtester weights configuration (local state)
  const [backtestWeights, setBacktestWeights] = useState<{ [sym: string]: number }>({
    AAPL: 40,
    MSFT: 30,
    NVDA: 30
  });
  const [backtestTimeframe, setBacktestTimeframe] = useState<'1M' | '3M' | '6M'>('6M');
  const [backtestResults, setBacktestResults] = useState<BacktestResult | null>(null);
  const [newWeightSym, setNewWeightSym] = useState('KO');
  const [newWeightVal, setNewWeightVal] = useState(0);

  // Quick edit position states
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);

  // Pulse animation states to trigger glow effects on price updates
  const [pnlPulse, setPnlPulse] = useState(false);

  // Update default buy price when stock updates
  useEffect(() => {
    const selectedStock = allStocks.find(s => s.symbol === buySymbol);
    if (selectedStock) {
      setBuyPrice(selectedStock.price);
    }
  }, [buySymbol, allStocks]);

  // Scroll drawer chat on updates
  useEffect(() => {
    if (aiDrawerOpen) {
      aiChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiDrawerOpen, aiDrawerTyping, messages]);

  // URL Query Action Parser
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action')?.toUpperCase();
    const symbol = params.get('symbol')?.toUpperCase();
    
    if (symbol && (action === 'BUY' || action === 'SELL')) {
      const stockExists = allStocks.some(s => s.symbol === symbol);
      if (stockExists) {
        setBuySymbol(symbol);
        setTradeType(action as 'BUY' | 'SELL');
        setBuyModalOpen(true);
        setActiveTab('holdings');
      }
    } else if (action === 'ANALYZE' || action === 'RISK' || action === 'REBALANCE') {
      setAiDrawerOpen(true);
      
      const triggerAssistant = async () => {
        setAiDrawerTyping(true);
        let query = '';
        if (action === 'ANALYZE') {
          query = symbol ? `/analyze ${symbol}` : '/portfolio';
        } else if (action === 'RISK') {
          query = '/risk';
        } else if (action === 'REBALANCE') {
          query = '/portfolio';
        }
        
        addMessage('user', query);
        await generateResponse(query);
        setAiDrawerTyping(false);
      };
      
      triggerAssistant();
    }
  }, [location.search, allStocks]);

  // Initialize backtester results
  useEffect(() => {
    handleRunBacktest();
  }, []);

  // Sync initial target allocations if not present
  useEffect(() => {
    if (holdings.length > 0) {
      const equalWeight = Math.round(100 / holdings.length);
      const updated: { [sym: string]: number } = {};
      holdings.forEach(h => {
        updated[h.symbol] = targetAllocations[h.symbol] !== undefined 
          ? targetAllocations[h.symbol] 
          : equalWeight;
      });
      setTargetAllocations(updated);
    }
  }, [holdings]);

  // Run a loading sequence simulation
  const triggerLoadingSequence = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  // Demo holdings configuration resets
  const loadDemoHoldings = (mode: 'balanced' | 'tech-concentrated' | 'empty') => {
    clearPortfolio();
    setIsLoading(true);
    setTimeout(() => {
      if (mode === 'balanced') {
        buyStock('AAPL', 20, 175.50);
        buyStock('MSFT', 15, 410.20);
        buyStock('NVDA', 25, 850.00);
        buyStock('KO', 60, 59.80);
        setTargetAllocations({ AAPL: 25, MSFT: 25, NVDA: 25, KO: 25 });
      } else if (mode === 'tech-concentrated') {
        buyStock('NVDA', 80, 910.00);
        buyStock('TSLA', 15, 180.50);
        setTargetAllocations({ NVDA: 80, TSLA: 20 });
      }
      setIsLoading(false);
    }, 800);
  };

  // Run backtester strategy
  const handleRunBacktest = () => {
    const res = analyticsEngine.runBacktest(backtestWeights, backtestTimeframe);
    setBacktestResults(res);
  };

  // Clicked risk insights expansions state
  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});

  const toggleInsight = (key: string) => {
    setExpandedInsights(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Extract Zustand Analytics selectors
  const { 
    hoverIdx, 
    isHovering, 
    precomputedSnapshots, 
    setPrecomputedSnapshots,
    selectedBenchmark 
  } = usePortfolioAnalyticsStore();

  // Helper: standard deviation and Sharpe Ratio calculation
  const calculateVolAndSharpe = (dailyReturns: number[], riskFreeRate = 4.5) => {
    if (dailyReturns.length < 2) return { volatility: 0, sharpe: 0 };
    const avg = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / dailyReturns.length;
    const std = Math.sqrt(variance);
    const annualizedVol = std * Math.sqrt(252) * 100;
    const annualizedReturn = avg * 252 * 100;
    const sharpe = annualizedVol === 0 ? 0 : (annualizedReturn - riskFreeRate) / Math.max(1.0, annualizedVol);
    return {
      volatility: Number(annualizedVol.toFixed(2)),
      sharpe: Number(sharpe.toFixed(2))
    };
  };

  // Base dynamic calculations for mapping live holdings
  let totalCost = 0;
  let currentValue = 0;
  let todaysPnl = 0;

  const holdingsWithLive = holdings.map(h => {
    const liveStock = allStocks.find(s => s.symbol === h.symbol);
    const stockPrice = liveStock ? liveStock.price : h.avgBuyPrice;
    const stockChange = liveStock ? liveStock.change : 0;
    const beta = liveStock?.beta ?? 1.0;
    
    const cost = h.quantity * h.avgBuyPrice;
    const value = h.quantity * stockPrice;
    const pnl = value - cost;
    const returnPercent = cost === 0 ? 0 : (pnl / cost) * 100;
    const dayPnl = h.quantity * stockChange;

    totalCost += cost;
    currentValue += value;
    todaysPnl += dayPnl;

    return {
      ...h,
      currentPrice: stockPrice,
      currentValue: value,
      pnl,
      returnPercent,
      dayPnl,
      beta,
      sector: liveStock?.sector || 'Unknown'
    };
  });

  const totalPnl = currentValue - totalCost;
  const totalReturnPercent = totalCost === 0 ? 0 : (totalPnl / totalCost) * 100;

  // Pulse P&L cards briefly on live stock tick values changes
  useEffect(() => {
    if (currentValue > 0) {
      setPnlPulse(true);
      const timer = setTimeout(() => setPnlPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [todaysPnl]);

  // Compute Active Portfolio Weights Map for actual active backtest metrics
  const activeWeights: { [symbol: string]: number } = {};
  if (holdings.length > 0) {
    holdingsWithLive.forEach(h => {
      activeWeights[h.symbol] = currentValue === 0 ? 0 : (h.currentValue / currentValue) * 100;
    });
  } else {
    activeWeights['AAPL'] = 40;
    activeWeights['MSFT'] = 30;
    activeWeights['NVDA'] = 30;
  }

  // Calculate live backtest equity curve representing CURRENT holdings weights and selected benchmark
  const activeBacktest = analyticsEngine.runBacktest(activeWeights, '6M', selectedBenchmark);

  // PRECOMPUTE HISTORICAL SNAPSHOTS ON INITIAL LOAD & UPDATE
  useEffect(() => {
    if (holdings.length === 0) {
      setPrecomputedSnapshots([]);
      return;
    }

    // 1. Load historical datasets for all holdings
    const historicalStockData: Record<string, any[]> = {};
    holdings.forEach(h => {
      historicalStockData[h.symbol] = mockDataEngine.getHistoricalData(h.symbol, '6M').slice(-130);
    });

    // We use S&P 500 or NASDAQ to align index dates
    const benchmarkSymbol = selectedBenchmark === 'NASDAQ' ? 'NASDAQ' : 'S&P 500';
    const baseTimeline = mockDataEngine.getHistoricalData(benchmarkSymbol, '6M').slice(-130);
    
    const minLength = Math.min(
      ...holdings.map(h => historicalStockData[h.symbol]?.length || 0),
      baseTimeline.length
    );

    if (minLength === 0) return;

    const snapshots: PrecomputedSnapshot[] = [];
    let prevPortVal = 0;
    let maxHistoricalVal = -Infinity;
    const dailyReturnsList: number[] = [];



    for (let t = 0; t < minLength; t++) {
      const rawDate = new Date(baseTimeline[t].time * 1000);
      const dateStr = rawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });

      let portfolioValueAtT = 0;
      let costBasisAtT = 0;
      let betaAtT = 0;

      const dailyAssets: { symbol: string; value: number; sector: string; beta: number; target: number }[] = [];

      holdings.forEach(h => {
        const histData = historicalStockData[h.symbol];
        const price = histData[t]?.close || h.avgBuyPrice;
        const val = h.quantity * price;
        portfolioValueAtT += val;
        costBasisAtT += h.quantity * h.avgBuyPrice;
        
        const liveStock = allStocks.find(s => s.symbol === h.symbol);
        const beta = liveStock?.beta ?? 1.0;
        betaAtT += beta * val;

        dailyAssets.push({
          symbol: h.symbol,
          value: val,
          sector: liveStock?.sector || 'Unknown',
          beta,
          target: targetAllocations[h.symbol] || 0
        });
      });

      const dayTotalPnl = portfolioValueAtT - costBasisAtT;
      const dayReturnPercent = costBasisAtT === 0 ? 0 : (dayTotalPnl / costBasisAtT) * 100;

      let dayTodayPnl = 0;
      if (t > 0) {
        dayTodayPnl = portfolioValueAtT - prevPortVal;
        dailyReturnsList.push(prevPortVal === 0 ? 0 : (portfolioValueAtT - prevPortVal) / prevPortVal);
      }
      prevPortVal = portfolioValueAtT;

      const { volatility, sharpe } = calculateVolAndSharpe(dailyReturnsList);

      if (portfolioValueAtT > maxHistoricalVal) {
        maxHistoricalVal = portfolioValueAtT;
      }
      const maxDrawdown = maxHistoricalVal === 0 ? 0 : ((maxHistoricalVal - portfolioValueAtT) / maxHistoricalVal) * 100;
      const weightedBeta = portfolioValueAtT === 0 ? 1.0 : betaAtT / portfolioValueAtT;

      // HHI Diversification score
      let hhi = 0;
      if (portfolioValueAtT > 0) {
        dailyAssets.forEach(asset => {
          const w = asset.value / portfolioValueAtT;
          hhi += w * w;
        });
      } else {
        hhi = 1.0;
      }
      const diversificationScore = Math.round((1 - hhi) * 100);

      // Composite health
      const sharpeScore = Math.max(0, Math.min(100, sharpe * 50));
      const ddScore = Math.max(0, 100 - maxDrawdown * 4);
      const betaScore = Math.max(0, 100 - Math.abs(1 - weightedBeta) * 50);
      const healthScore = Math.round(
        0.30 * diversificationScore + 
        0.30 * sharpeScore + 
        0.25 * ddScore + 
        0.15 * betaScore
      );

      // Risk Label
      let riskLabel: 'LOW RISK' | 'MODERATE RISK' | 'HIGH RISK' = 'MODERATE RISK';
      if (weightedBeta > 1.25 || volatility > 22 || maxDrawdown > 15) {
        riskLabel = 'HIGH RISK';
      } else if (weightedBeta < 0.8 && volatility < 12 && maxDrawdown < 8) {
        riskLabel = 'LOW RISK';
      }

      // Value at Risk (VaR)
      const dailyVol = volatility / Math.sqrt(252) / 100;
      const valueAtRisk95 = portfolioValueAtT * 1.645 * dailyVol;

      // Allocations by Sector
      const sectorMap: Record<string, number> = {};
      const sectorColorsMap: Record<string, string> = {};
      
      dailyAssets.forEach((asset, idx) => {
        sectorMap[asset.sector] = (sectorMap[asset.sector] || 0) + asset.value;
        if (!sectorColorsMap[asset.sector]) {
          sectorColorsMap[asset.sector] = sectorColors[idx % sectorColors.length];
        }
      });

      const allocations = Object.keys(sectorMap).map(sector => {
        const val = sectorMap[sector];
        const percentage = portfolioValueAtT === 0 ? 0 : (val / portfolioValueAtT) * 100;
        
        let sectorTarget = 0;
        dailyAssets.forEach(asset => {
          if (asset.sector === sector) {
            sectorTarget += asset.target;
          }
        });

        const drift = percentage - sectorTarget;

        return {
          label: sector,
          value: val,
          color: sectorColorsMap[sector],
          targetWeight: sectorTarget,
          drift
        };
      }).sort((a, b) => b.value - a.value);

      // Drift calculation
      const holdingsDrift = dailyAssets.map(asset => {
        const currentWeight = portfolioValueAtT === 0 ? 0 : (asset.value / portfolioValueAtT) * 100;
        return {
          symbol: asset.symbol,
          currentWeight,
          targetWeight: asset.target,
          deviationPct: currentWeight - asset.target
        };
      });

      snapshots.push({
        date: dateStr,
        portfolioValue: portfolioValueAtT,
        todaysPnl: dayTodayPnl,
        totalPnl: dayTotalPnl,
        totalReturnPercent: dayReturnPercent,
        healthScore,
        sharpeRatio: sharpe,
        maxDrawdown,
        volatility,
        beta: weightedBeta,
        valueAtRisk95,
        riskLabel,
        allocations,
        holdingsDrift
      });
    }

    setPrecomputedSnapshots(snapshots);
  }, [holdings, targetAllocations, allStocks, selectedBenchmark]);

  const liveDailyVol = (activeBacktest?.metrics?.volatility ?? 0) / Math.sqrt(252) / 100;
  const valueAtRisk95 = currentValue * 1.645 * liveDailyVol;

  // Extract properties from the current active snapshot (scrubbing snapshot OR live current)
  const activeSnapshot = (isHovering && hoverIdx !== null && precomputedSnapshots[hoverIdx])
    ? precomputedSnapshots[hoverIdx]
    : (precomputedSnapshots.length > 0 ? precomputedSnapshots[precomputedSnapshots.length - 1] : null);

  // Aligned current parameters mapping from active snapshot
  const activeValue = activeSnapshot ? activeSnapshot.portfolioValue : currentValue;
  const activeTodayPnl = activeSnapshot ? activeSnapshot.todaysPnl : todaysPnl;
  const activeTotalPnl = activeSnapshot ? activeSnapshot.totalPnl : totalPnl;
  const activeReturnPercent = activeSnapshot ? activeSnapshot.totalReturnPercent : totalReturnPercent;
  const activeHealthScore = activeSnapshot ? activeSnapshot.healthScore : 0;
  const activeSharpe = activeSnapshot ? activeSnapshot.sharpeRatio : activeBacktest.metrics.sharpeRatio;
  const activeBeta = activeSnapshot ? activeSnapshot.beta : activeBacktest.metrics.beta;
  const activeVol = activeSnapshot ? activeSnapshot.volatility : activeBacktest.metrics.volatility;
  const activeDrawdown = activeSnapshot ? activeSnapshot.maxDrawdown : activeBacktest.metrics.maxDrawdown;
  const activeVar95 = activeSnapshot ? activeSnapshot.valueAtRisk95 : valueAtRisk95;
  const activeRiskLabel = activeSnapshot ? activeSnapshot.riskLabel : (activeBacktest.metrics.beta > 1.2 ? 'HIGH RISK' : activeBacktest.metrics.beta < 0.8 ? 'LOW RISK' : 'MODERATE RISK');
  
  const activeSectorsMap: Record<string, number> = {};
  holdingsWithLive.forEach(h => {
    activeSectorsMap[h.sector] = (activeSectorsMap[h.sector] || 0) + h.currentValue;
  });

  const liveAllocations = Object.keys(activeSectorsMap).map((sector, index) => {
    const val = activeSectorsMap[sector];
    const percentage = currentValue === 0 ? 0 : (val / currentValue) * 100;
    
    let sectorTarget = 0;
    holdingsWithLive.forEach(h => {
      if (h.sector === sector) {
        sectorTarget += targetAllocations[h.symbol] || 0;
      }
    });
    
    const drift = percentage - sectorTarget;

    return {
      label: sector,
      value: val,
      color: sectorColors[index % sectorColors.length],
      targetWeight: sectorTarget,
      drift
    };
  }).sort((a, b) => b.value - a.value);

  const activeAllocations = activeSnapshot ? activeSnapshot.allocations : liveAllocations;

  // Diversification calculation label from HHI
  let activeHhi = 0;
  if (activeAllocations.length > 0 && activeValue > 0) {
    activeAllocations.forEach(alloc => {
      const weight = alloc.value / activeValue;
      activeHhi += weight * weight;
    });
  } else {
    activeHhi = 1.0;
  }
  const activeDiversificationScore = Math.round((1 - activeHhi) * 100);

  let diversificationLabel = 'Concentrated';
  let diversificationColor = 'text-app-red';
  if (activeDiversificationScore >= 70) {
    diversificationLabel = 'Highly Diversified';
    diversificationColor = 'text-app-green';
  } else if (activeDiversificationScore >= 40) {
    diversificationLabel = 'Moderate';
    diversificationColor = 'text-blue-400';
  }

  // ── Backward-compatible aliases so existing JSX renders from the active (replay-aware) snapshot ──
  const healthScore = activeHealthScore;
  const sharpe = activeSharpe;
  const beta = activeBeta;
  const maxDd = activeDrawdown;
  const allocationData = activeAllocations;
  const diversificationScore = activeDiversificationScore;

  // Extract analytical insight cards
  let bestPerformer = null;
  let worstPerformer = null;
  let largestPosition = null;
  let highestRiskAsset = null;

  if (holdingsWithLive.length > 0) {
    const sortedReturns = [...holdingsWithLive].sort((a, b) => b.returnPercent - a.returnPercent);
    bestPerformer = sortedReturns[0];

    const sortedWorst = [...holdingsWithLive].sort((a, b) => a.returnPercent - b.returnPercent);
    worstPerformer = sortedWorst[0];

    const sortedSize = [...holdingsWithLive].sort((a, b) => b.currentValue - a.currentValue);
    largestPosition = sortedSize[0];

    const sortedBeta = [...holdingsWithLive].sort((a, b) => b.beta - a.beta);
    highestRiskAsset = sortedBeta[0];
  }

  // Rolling Performance Window helper
  const calculatePeriodMetrics = (numDays: number) => {
    if (activeBacktest.portfolioReturns.length < 2) {
      return { returnPct: 0, benchPct: 0, volatility: 0, sharpe: 0 };
    }
    
    const sliceLen = Math.min(numDays, activeBacktest.portfolioReturns.length);
    const pReturnsSlice = activeBacktest.portfolioReturns.slice(-sliceLen);
    
    const pStartVal = 100 + (activeBacktest.portfolioReturns[activeBacktest.portfolioReturns.length - sliceLen] || 0);
    const pEndVal = 100 + activeBacktest.portfolioReturns[activeBacktest.portfolioReturns.length - 1];
    const returnPct = ((pEndVal - pStartVal) / (pStartVal || 1)) * 100;
    
    const bStartVal = 100 + (activeBacktest.benchmarkReturns[activeBacktest.benchmarkReturns.length - sliceLen] || 0);
    const bEndVal = 100 + activeBacktest.benchmarkReturns[activeBacktest.benchmarkReturns.length - 1];
    const benchPct = ((bEndVal - bStartVal) / (bStartVal || 1)) * 100;
    
    const dailyReturns: number[] = [];
    for (let i = 1; i < sliceLen; i++) {
      const prevVal = 100 + pReturnsSlice[i - 1];
      const curVal = 100 + pReturnsSlice[i];
      dailyReturns.push((curVal - prevVal) / (prevVal || 1));
    }
    
    const meanDaily = dailyReturns.reduce((sum, r) => sum + r, 0) / (dailyReturns.length || 1);
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanDaily, 2), 0) / (dailyReturns.length || 1);
    const sliceDailyVol = Math.sqrt(variance);
    const annualizedVol = sliceDailyVol * Math.sqrt(252) * 100;
    
    const riskFreeRate = 4.5;
    const annualizedPct = returnPct * (252 / sliceLen);
    const sharpe = annualizedVol === 0 ? 0 : (annualizedPct - riskFreeRate) / Math.max(1, annualizedVol);
    
    return {
      returnPct: Number(returnPct.toFixed(2)),
      benchPct: Number(benchPct.toFixed(2)),
      volatility: Number(annualizedVol.toFixed(2)),
      sharpe: Number(sharpe.toFixed(2))
    };
  };

  const rollingMetrics = {
    '7D': calculatePeriodMetrics(7),
    '30D': calculatePeriodMetrics(30),
    '90D': calculatePeriodMetrics(90),
    '6M': {
      returnPct: activeBacktest.metrics.portfolioFinalReturn,
      benchPct: activeBacktest.metrics.benchmarkFinalReturn,
      volatility: activeBacktest.metrics.volatility,
      sharpe: activeBacktest.metrics.sharpeRatio
    }
  };

  // Historical Portfolio Milestones Calculations
  let peakReturn = 0;
  let peakDate = 'N/A';
  let worstDd = 0;
  let worstDdDate = 'N/A';
  let bestDailyGain = 0;
  let bestDailyGainDate = 'N/A';

  if (activeBacktest.portfolioReturns.length > 0) {
    let maxRet = -Infinity;
    activeBacktest.portfolioReturns.forEach((ret, idx) => {
      if (ret > maxRet) {
        maxRet = ret;
        peakDate = activeBacktest.dates[idx];
      }
    });
    peakReturn = maxRet;

    let peakVal = -Infinity;
    let maxDd = 0;
    activeBacktest.portfolioReturns.forEach((ret, idx) => {
      const val = 100 + ret;
      if (val > peakVal) peakVal = val;
      const dd = ((peakVal - val) / peakVal) * 100;
      if (dd > maxDd) {
        maxDd = dd;
        worstDdDate = activeBacktest.dates[idx];
      }
    });
    worstDd = maxDd;

    let maxDailyReturn = -Infinity;
    for (let i = 1; i < activeBacktest.portfolioReturns.length; i++) {
      const prevVal = 100 + activeBacktest.portfolioReturns[i - 1];
      const curVal = 100 + activeBacktest.portfolioReturns[i];
      const dayReturn = (curVal - prevVal) / (prevVal || 1);
      if (dayReturn > maxDailyReturn) {
        maxDailyReturn = dayReturn;
        bestDailyGainDate = activeBacktest.dates[i];
      }
    }
    bestDailyGain = maxDailyReturn * 100;
  }

  // Top Performer Alert Trigger Effect
  useEffect(() => {
    if (bestPerformer) {
      if (lastTopPerformer && lastTopPerformer !== bestPerformer.symbol) {
        setTopPerformerAlert({
          symbol: bestPerformer.symbol,
          returnPct: bestPerformer.returnPercent,
          prevSymbol: lastTopPerformer
        });
        const timer = setTimeout(() => setTopPerformerAlert(null), 6000);
        return () => clearTimeout(timer);
      }
      setLastTopPerformer(bestPerformer.symbol);
    } else {
      setLastTopPerformer(null);
    }
  }, [bestPerformer?.symbol]);

  // Rebalancing suggestions generator with smart action layout description
  const rebalancingSuggestions = holdingsWithLive.map(h => {
    const currentWeight = currentValue === 0 ? 0 : (h.currentValue / currentValue) * 100;
    const targetWeight = targetAllocations[h.symbol] || 0;
    const deviationPct = currentWeight - targetWeight;
    
    const targetVal = currentValue * (targetWeight / 100);
    const deviationVal = targetVal - h.currentValue;
    const sharesDifference = Number((deviationVal / h.currentPrice).toFixed(2));
    
    return {
      symbol: h.symbol,
      currentWeight,
      targetWeight,
      deviationPct,
      deviationVal,
      sharesDifference,
      currentPrice: h.currentPrice
    };
  });

  // Update target allocation slider value
  const updateTargetWeight = (symbol: string, val: number) => {
    setTargetAllocations(prev => ({
      ...prev,
      [symbol]: val
    }));
  };

  const targetWeightsSum = Object.values(targetAllocations).reduce((sum, w) => sum + w, 0);

  const startEdit = (holding: Holding) => {
    setEditingSymbol(holding.symbol);
    setEditQty(holding.quantity);
    setEditPrice(holding.avgBuyPrice);
  };

  const saveEdit = () => {
    if (editingSymbol) {
      updateHolding(editingSymbol, editQty, editPrice);
      setEditingSymbol(null);
    }
  };

  const handleQuickTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (tradeType === 'BUY') {
      buyStock(buySymbol, buyQty, buyPrice);
    } else {
      sellStock(buySymbol, buyQty, buyPrice);
    }
    setBuyModalOpen(false);
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Dynamic ambient glow pulse behind dashboard */}
      <div 
        className={`absolute -top-40 left-1/3 w-96 h-96 rounded-full blur-[160px] opacity-25 pointer-events-none transition-colors duration-1000 -z-10 ${
          currentValue === 0 
            ? 'bg-blue-500/30' 
            : totalPnl >= 0 
              ? 'bg-app-green/15' 
              : 'bg-app-red/15'
        }`}
      />

      {/* 1. Header & Actions Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border-glass">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Institutional Portfolio Analytics</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">Evaluate risk factors, diversification (HHI), targets drift, and drawdown curves.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Collapsible Demo console toggle */}
          <button
            onClick={() => setDemoControlsOpen(!demoControlsOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-glass border border-border-glass text-text-muted hover:text-white transition-colors text-xs font-semibold cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Demo Console</span>
          </button>

          <button
            onClick={() => {
              setTradeType('BUY');
              setBuyModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center gap-2 btn-primary font-bold text-xs shadow-md transition-all duration-200 shadow-app-green/10 justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Transaction
          </button>
        </div>
      </div>

      {/* Collapsible Demo console */}
      <AnimatePresence>
        {demoControlsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-2xl border border-white/10 p-5 bg-surface-lowest/70 backdrop-blur-md space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-xs font-bold text-app-green font-mono flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  Terminal Dev Tools
                </span>
                <span className="text-[10px] text-text-muted font-semibold">Simulate Recruiter Scenarios</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-text-muted font-bold block uppercase">Load Demo Scenarios</span>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => loadDemoHoldings('balanced')}
                      className="text-left text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-2 rounded-xl text-white font-semibold transition-colors flex items-center justify-between"
                    >
                      <span>1. Core Balanced Strategy</span>
                      <span className="text-[9px] bg-app-green/10 text-app-green px-1.5 py-0.5 rounded">High Health</span>
                    </button>
                    <button
                      onClick={() => loadDemoHoldings('tech-concentrated')}
                      className="text-left text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-2 rounded-xl text-white font-semibold transition-colors flex items-center justify-between"
                    >
                      <span>2. Tech Concentrated</span>
                      <span className="text-[9px] bg-app-red/10 text-app-red px-1.5 py-0.5 rounded">Risk Peak</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-text-muted font-bold block uppercase">Simulation Checks</span>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={triggerLoadingSequence}
                      className="text-left text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-2 rounded-xl text-white font-semibold transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Simulate Skeletons Load</span>
                    </button>
                    <button
                      onClick={triggerFailure}
                      className="text-left text-xs bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-2 rounded-xl text-white font-semibold transition-colors flex items-center gap-2"
                    >
                      <Shield className="w-3.5 h-3.5 text-app-red" />
                      <span>Simulate Feed Failure</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 text-[11px] leading-relaxed text-text-muted space-y-1.5">
                  <div className="font-bold text-white flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-app-green" />
                    Recruiter Insight
                  </div>
                  <p>
                    Switching between **Core Balanced** and **Tech Concentrated** automatically calculates and animates:
                  </p>
                  <ul className="list-disc pl-3.5 space-y-0.5">
                    <li>Diversification HHI Score</li>
                    <li>Health composite score</li>
                    <li>Allocation Drift badges</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Institutional Tabs Controller */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex border-b border-border-glass text-xs font-bold text-text-muted w-full md:w-fit gap-1 bg-surface-low/30 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'analytics' ? 'bg-surface-high text-white shadow-sm' : 'hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analytics Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('holdings')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'holdings' ? 'bg-surface-high text-white shadow-sm' : 'hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Holdings & Drift</span>
          </button>
          <button
            onClick={() => setActiveTab('backtester')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'backtester' ? 'bg-surface-high text-white shadow-sm' : 'hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Backtester Lab</span>
          </button>
        </div>

        {/* Risk Level Badge — live, replay-aware */}
        {holdings.length > 0 && (
          <motion.div
            key={activeRiskLabel}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider ${
              activeRiskLabel === 'HIGH RISK'
                ? 'bg-app-red/10 border-app-red/30 text-app-red'
                : activeRiskLabel === 'LOW RISK'
                ? 'bg-app-green/10 border-app-green/30 text-app-green'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              activeRiskLabel === 'HIGH RISK' ? 'bg-app-red' : activeRiskLabel === 'LOW RISK' ? 'bg-app-green' : 'bg-blue-400'
            }`} />
            {activeRiskLabel}
            <span className="opacity-60 font-normal">| β {beta.toFixed(2)}</span>
          </motion.div>
        )}
      </div>

      {/* MAIN CONTAINER VIEWPORTS */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + (isLoading ? '-loading' : '-loaded')}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {isLoading ? (
            /* Pulsing skeleton loaders */
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ChartPlaceholderSkeleton type="line" />
                </div>
                <div className="lg:col-span-1">
                  <ChartPlaceholderSkeleton type="donut" />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DrawdownChartSkeleton />
                <TableSkeleton />
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: ANALYTICS DASHBOARD */}
              {/* TAB 1: ANALYTICS DASHBOARD */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  
                  {/* Performance Change Alert Toast */}
                  <AnimatePresence>
                    {topPerformerAlert && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="bg-app-green/10 border border-app-green/20 p-4 rounded-xl flex items-center justify-between text-xs font-semibold text-white shadow-glow-green-sm mb-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-app-green/15 flex items-center justify-center border border-app-green/25 text-app-green">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[#00FF94] font-bold uppercase tracking-wider block text-[9px] font-mono">Performance Update</span>
                            <p className="text-xs mt-0.5">
                              <span className="font-bold text-white">{topPerformerAlert.symbol}</span> (+{topPerformerAlert.returnPct.toFixed(1)}%) is now your top performer, overtaking <span className="text-text-muted">{topPerformerAlert.prevSymbol}</span>.
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setTopPerformerAlert(null)}
                          className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-white transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Staggered Metrics Cards */}
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
                  >
                    
                    {/* 1. Portfolio Value Card */}
                    <motion.div 
                      variants={itemVariants}
                      className={`glass-card card-hover-lift rounded-2xl p-5 border relative overflow-hidden ${
                        activeValue > 0 
                          ? activeTotalPnl >= 0 
                            ? 'animate-pulse-emerald' 
                            : 'animate-pulse-crimson'
                          : 'border-border-glass'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Portfolio Value</span>
                      <span className="text-lg font-bold tracking-tight text-white mt-1.5 block font-mono">
                        {isHovering ? (
                          `$${activeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : currentValue > 0 ? (
                          `$${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          '$0.00'
                        )}
                      </span>
                      <span className="text-[10px] text-text-muted mt-1 block font-mono">Cost: ${Math.round(totalCost).toLocaleString()}</span>
                    </motion.div>
 
                    {/* 2. Today P&L Card */}
                    <motion.div 
                      variants={itemVariants}
                      className="glass-card card-hover-lift rounded-2xl p-5 border border-border-glass"
                    >
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Today's P&L</span>
                      <span className={`text-lg font-bold tracking-tight mt-1.5 block font-mono ${activeTodayPnl >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                        {isHovering ? (
                          `${activeTodayPnl >= 0 ? '+' : ''}$${activeTodayPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : currentValue > 0 ? (
                          `${todaysPnl >= 0 ? '+' : ''}$${todaysPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          '$0.00'
                        )}
                      </span>
                      <span className="text-[10px] text-text-muted mt-1 block">Daily fluctuation</span>
                    </motion.div>
 
                    {/* 3. Total Return Card */}
                    <motion.div 
                      variants={itemVariants}
                      className={`glass-card card-hover-lift rounded-2xl p-5 border relative overflow-hidden ${
                        activeValue > 0 
                          ? activeTotalPnl >= 0 
                            ? 'animate-pulse-emerald' 
                            : 'animate-pulse-crimson'
                          : 'border-border-glass'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Total Return</span>
                      <span className={`text-lg font-bold tracking-tight mt-1.5 block font-mono ${activeTotalPnl >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                        {isHovering ? (
                          `${activeTotalPnl >= 0 ? '+' : ''}$${activeTotalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : currentValue > 0 ? (
                          `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          '$0.00'
                        )}
                      </span>
                      <span className={`text-[10px] mt-1 block font-bold ${activeTotalPnl >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                        {activeTotalPnl >= 0 ? '+' : ''}{activeReturnPercent.toFixed(2)}%
                      </span>
                    </motion.div>

                    {/* 4. Best Performer Card */}
                    <motion.div 
                      variants={itemVariants}
                      className="glass-card card-hover-lift rounded-2xl p-5 border border-border-glass"
                    >
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Best Performer</span>
                      {bestPerformer ? (
                        <>
                          <div className="flex items-baseline justify-between mt-1.5">
                            <span className="text-lg font-bold text-white">{bestPerformer.symbol}</span>
                            <span className="text-xs font-bold text-app-green font-mono flex items-center gap-0.5">
                              <TrendingUp className="w-3 h-3" />
                              +{bestPerformer.returnPercent.toFixed(1)}%
                            </span>
                          </div>
                          <span className="text-[9px] text-text-muted mt-1 block truncate">{bestPerformer.sector}</span>
                        </>
                      ) : (
                        <span className="text-xs text-text-muted mt-3 block italic">No assets</span>
                      )}
                    </motion.div>

                    {/* 5. Worst Performer Card */}
                    <motion.div 
                      variants={itemVariants}
                      className="glass-card card-hover-lift rounded-2xl p-5 border border-border-glass"
                    >
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Worst Performer</span>
                      {worstPerformer ? (
                        <>
                          <div className="flex items-baseline justify-between mt-1.5">
                            <span className="text-lg font-bold text-white">{worstPerformer.symbol}</span>
                            <span className="text-xs font-bold text-app-red font-mono flex items-center gap-0.5">
                              <TrendingDown className="w-3 h-3" />
                              {worstPerformer.returnPercent.toFixed(1)}%
                            </span>
                          </div>
                          <span className="text-[9px] text-text-muted mt-1 block truncate">{worstPerformer.sector}</span>
                        </>
                      ) : (
                        <span className="text-xs text-text-muted mt-3 block italic">No assets</span>
                      )}
                    </motion.div>
 
                    {/* 6. Health Score Card */}
                    <motion.div 
                      variants={itemVariants}
                      className="glass-card card-hover-lift rounded-2xl p-5 border border-border-glass flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Portfolio Health</span>
                            <div className="relative inline-block leading-none">
                              <button 
                                onMouseEnter={() => setHealthTooltipOpen(true)}
                                onMouseLeave={() => setHealthTooltipOpen(false)}
                                className="text-text-muted hover:text-white transition-colors cursor-help"
                              >
                                <Info className="w-3.5 h-3.5 align-middle" />
                              </button>
                              <AnimatePresence>
                                {healthTooltipOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute bottom-5 left-0 z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-[9px] text-[#dfe2eb] bg-[#10141a]/95 backdrop-blur-xl w-56 shadow-2xl leading-normal font-sans"
                                  >
                                    <strong>Composite Health Score Weightings:</strong><br />
                                    • Diversification (HHI): 30%<br />
                                    • Sharpe Ratio: 30%<br />
                                    • Drawdown Containment: 25%<br />
                                    • Systematic Beta: 15%
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                          {holdings.length > 0 && (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono border ${
                              activeRiskLabel === 'LOW RISK'
                                ? 'bg-app-green/10 text-app-green border-app-green/20'
                                : activeRiskLabel === 'HIGH RISK'
                                  ? 'bg-app-red/10 text-app-red border-app-red/20'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                              {activeRiskLabel}
                            </span>
                          )}
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white mt-1.5 block font-mono">
                          {holdings.length > 0 ? `${activeHealthScore} / 100` : '0 / 100'}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full mt-2.5 overflow-hidden">
                        <motion.div 
                          className="h-full bg-app-green"
                          initial={{ width: 0 }}
                          animate={{ width: `${holdings.length > 0 ? activeHealthScore : 0}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </motion.div>
 
                  </motion.div>
 
                  {/* Portfolio Growth Line Chart, Allocation Donut & Sector Performance Heatmap */}
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-6"
                  >
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                      <PortfolioGrowthChart 
                        dates={activeBacktest.dates}
                        portfolioReturns={activeBacktest.portfolioReturns}
                        benchmarkReturns={activeBacktest.benchmarkReturns}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="lg:col-span-1">
                      <AllocationChart 
                        data={activeAllocations}
                        totalValue={activeValue}
                      />
                    </motion.div>
                    <motion.div variants={itemVariants} className="lg:col-span-1">
                      {/* Sector Heatmap Blocks Card */}
                      {(() => {
                        const sectorPerformanceMap: Record<string, { totalChange: number; count: number }> = {};
                        allStocks.forEach(s => {
                          if (s.sector) {
                            if (!sectorPerformanceMap[s.sector]) {
                              sectorPerformanceMap[s.sector] = { totalChange: 0, count: 0 };
                            }
                            sectorPerformanceMap[s.sector].totalChange += s.change;
                            sectorPerformanceMap[s.sector].count += 1;
                          }
                        });
                        const sectorPerformances = Object.keys(sectorPerformanceMap).map(sector => {
                          const avgChange = sectorPerformanceMap[sector].totalChange / sectorPerformanceMap[sector].count;
                          return {
                            sector,
                            change: avgChange
                          };
                        }).sort((a, b) => b.change - a.change);

                        const topSector = sectorPerformances.length > 0 ? sectorPerformances[0] : null;
                        const worstSector = sectorPerformances.length > 0 ? sectorPerformances[sectorPerformances.length - 1] : null;

                        return (
                          <div className="glass-card rounded-2xl p-6 border border-border-glass flex flex-col justify-between min-h-[300px] h-full">
                            <div className="space-y-4">
                              <div className="border-b border-border-glass pb-2 flex justify-between items-center">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                  Sector Performance
                                </h3>
                                <span className="text-[9px] bg-white/5 text-text-muted px-2 py-0.5 rounded font-mono font-semibold">Live Heatmap</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                {sectorPerformances.slice(0, 6).map((sp) => {
                                  const isPos = sp.change >= 0;
                                  let blockClass = 'bg-white/5 border-white/10 text-white';
                                  if (sp.change > 1.0) {
                                    blockClass = 'bg-app-green/20 border-app-green/40 text-app-green font-bold shadow-glow-green-sm';
                                  } else if (sp.change > 0) {
                                    blockClass = 'bg-app-green/10 border-app-green/20 text-app-green font-semibold';
                                  } else if (sp.change < -1.0) {
                                    blockClass = 'bg-app-red/20 border-app-red/40 text-app-red font-bold shadow-glow-red-sm';
                                  } else if (sp.change < 0) {
                                    blockClass = 'bg-app-red/10 border-app-red/20 text-app-red font-semibold';
                                  }

                                  return (
                                    <div 
                                      key={sp.sector} 
                                      className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-150 hover:scale-102 cursor-default ${blockClass}`}
                                    >
                                      <span className="text-[9px] text-text-muted truncate block font-sans font-bold uppercase">{sp.sector}</span>
                                      <span className="text-xs font-mono mt-1 block">
                                        {isPos ? '+' : ''}{sp.change.toFixed(2)}%
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Top / Worst sectors banner */}
                            <div className="pt-3 border-t border-border-glass mt-4 space-y-1 text-[10px]">
                              {topSector && (
                                <div className="flex justify-between items-center">
                                  <span className="text-text-muted font-bold">Top Sector:</span>
                                  <span className="text-app-green font-bold font-mono">{topSector.sector} (+{topSector.change.toFixed(1)}%)</span>
                                </div>
                              )}
                              {worstSector && (
                                <div className="flex justify-between items-center">
                                  <span className="text-text-muted font-bold">Worst Sector:</span>
                                  <span className="text-app-red font-bold font-mono">{worstSector.sector} ({worstSector.change.toFixed(1)}%)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  </motion.div>
 
                  {/* Drawdown Curve & Risk Analytics Card */}
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                      <DrawdownChart 
                        dates={activeBacktest.dates}
                        portfolioReturns={activeBacktest.portfolioReturns}
                      />
                    </motion.div>
 
                    {/* Risk Analytics Card */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border border-border-glass space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted border-b border-border-glass pb-2">
                          Risk Analytics Dashboard
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          {/* Sharpe Ratio */}
                          <div className="bg-white/2 p-3 rounded-xl border border-white/5 font-mono relative">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-text-muted block font-sans uppercase">Sharpe Ratio</span>
                              <div className="relative inline-block leading-none">
                                <button 
                                  onMouseEnter={() => setSharpeTooltipOpen(true)}
                                  onMouseLeave={() => setSharpeTooltipOpen(false)}
                                  className="text-text-muted hover:text-white transition-colors cursor-help"
                                >
                                  <Info className="w-3 h-3 align-middle" />
                                </button>
                                <AnimatePresence>
                                  {sharpeTooltipOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute bottom-5 left-0 z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-[9px] text-[#dfe2eb] bg-[#10141a]/95 backdrop-blur-xl w-56 shadow-2xl leading-normal font-sans font-normal"
                                    >
                                      <strong>Sharpe Ratio (Annualized):</strong><br />
                                      Measures risk-adjusted performance. It evaluates excess return per unit of volatility. Institutional thresholds:<br />
                                      {'• > 1.0: Good'}<br />
                                      {'• > 2.0: Very Good'}<br />
                                      {'• > 3.0: Outstanding'}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-white block mt-0.5">{activeSharpe.toFixed(2)}</span>
                            <span className="text-[8px] text-text-muted block">Reward-to-risk index</span>
                          </div>
                          
                          {/* Portfolio Beta */}
                          <div className="bg-white/2 p-3 rounded-xl border border-white/5 font-mono relative">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-text-muted block font-sans uppercase">Portfolio Beta</span>
                              <div className="relative inline-block leading-none">
                                <button 
                                  onMouseEnter={() => setBetaTooltipOpen(true)}
                                  onMouseLeave={() => setBetaTooltipOpen(false)}
                                  className="text-text-muted hover:text-white transition-colors cursor-help"
                                >
                                  <Info className="w-3 h-3 align-middle" />
                                </button>
                                <AnimatePresence>
                                  {betaTooltipOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute bottom-5 left-0 z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-[9px] text-[#dfe2eb] bg-[#10141a]/95 backdrop-blur-xl w-56 shadow-2xl leading-normal font-sans font-normal"
                                    >
                                      <strong>Systematic Market Beta:</strong><br />
                                      Measures volatility sensitivity relative to the S&P 500:<br />
                                      {'• Beta = 1.0: Tracks market exactly.'}<br />
                                      {'• Beta > 1.0: High systematic risk/growth.'}<br />
                                      {'• Beta < 1.0: Defensive/non-correlated.'}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-white block mt-0.5">{activeBeta.toFixed(2)}</span>
                            <span className="text-[8px] text-text-muted block">Systematic volatility</span>
                          </div>

                          {/* Annual Volatility */}
                          <div className="bg-white/2 p-3 rounded-xl border border-white/5 font-mono relative">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-text-muted block font-sans uppercase">Annual Volatility</span>
                              <div className="relative inline-block leading-none">
                                <button 
                                  onMouseEnter={() => setVolTooltipOpen(true)}
                                  onMouseLeave={() => setVolTooltipOpen(false)}
                                  className="text-text-muted hover:text-white transition-colors cursor-help"
                                >
                                  <Info className="w-3 h-3 align-middle" />
                                </button>
                                <AnimatePresence>
                                  {volTooltipOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute bottom-5 left-0 z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-[9px] text-[#dfe2eb] bg-[#10141a]/95 backdrop-blur-xl w-56 shadow-2xl leading-normal font-sans font-normal"
                                    >
                                      <strong>Annualized Volatility:</strong><br />
                                      The annualized standard deviation of daily asset returns. It measures historical pricing variance. Higher values indicate wider swing amplitudes.
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-white block mt-0.5">{activeVol}%</span>
                            <span className="text-[8px] text-text-muted block">Daily standard dev rate</span>
                          </div>

                          {/* Value at Risk (VaR) */}
                          <div className="bg-white/2 p-3 rounded-xl border border-white/5 font-mono relative">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-text-muted block font-sans uppercase">Value at Risk (95%)</span>
                              <div className="relative inline-block leading-none">
                                <button 
                                  onMouseEnter={() => setVarTooltipOpen(true)}
                                  onMouseLeave={() => setVarTooltipOpen(false)}
                                  className="text-text-muted hover:text-white transition-colors cursor-help"
                                >
                                  <Info className="w-3 h-3 align-middle" />
                                </button>
                                <AnimatePresence>
                                  {varTooltipOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute bottom-5 right-0 md:-right-6 z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-[9px] text-[#dfe2eb] bg-[#10141a]/95 backdrop-blur-xl w-56 shadow-2xl leading-normal font-sans font-normal"
                                    >
                                      <strong>Value at Risk (1-Day, 95% Confidence):</strong><br />
                                      There is a 95% statistical confidence that the portfolio's maximum daily loss will not exceed <span className="text-app-red font-bold font-mono">${Math.round(activeVar95).toLocaleString()}</span> (based on current asset allocations and daily volatility).
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-app-red block mt-0.5 font-mono">
                              ${Math.round(activeVar95).toLocaleString()}
                            </span>
                            <span className="text-[8px] text-text-muted block">Estimated max daily loss</span>
                          </div>

                          {/* Diversification Score */}
                          <div className="bg-white/2 p-3 rounded-xl border border-white/5 font-mono relative">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-text-muted block font-sans uppercase">Diversification</span>
                              <div className="relative inline-block leading-none">
                                <button 
                                  onMouseEnter={() => setHhiTooltipOpen(true)}
                                  onMouseLeave={() => setHhiTooltipOpen(false)}
                                  className="text-text-muted hover:text-white transition-colors cursor-help"
                                >
                                  <Info className="w-3 h-3 align-middle" />
                                </button>
                                <AnimatePresence>
                                  {hhiTooltipOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute bottom-5 left-0 z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-[9px] text-[#dfe2eb] bg-[#10141a]/95 backdrop-blur-xl w-56 shadow-2xl leading-normal font-sans font-normal"
                                    >
                                      <strong>Diversification HHI Score:</strong><br />
                                      Derived from the Herfindahl-Hirschman Index (HHI) of holding weights. Higher score indicates a well-distributed portfolio that reduces idiosyncratic risk.
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-white block mt-0.5">{activeDiversificationScore}/100</span>
                            <span className="text-[8px] text-text-muted block">{diversificationLabel}</span>
                          </div>

                          {/* Max Drawdown */}
                          <div className="bg-white/2 p-3 rounded-xl border border-white/5 font-mono relative">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] font-bold text-text-muted block font-sans uppercase">Max Drawdown</span>
                              <div className="relative inline-block leading-none">
                                <button 
                                  onMouseEnter={() => setDdTooltipOpen(true)}
                                  onMouseLeave={() => setDdTooltipOpen(false)}
                                  className="text-text-muted hover:text-white transition-colors cursor-help"
                                >
                                  <Info className="w-3 h-3 align-middle" />
                                </button>
                                <AnimatePresence>
                                  {ddTooltipOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                      animate={{ opacity: 1, scale: 1, y: 0 }}
                                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                      className="absolute bottom-5 right-0 md:-right-6 z-50 glass-card px-3.5 py-2.5 rounded-2xl border border-white/10 text-[9px] text-[#dfe2eb] bg-[#10141a]/95 backdrop-blur-xl w-56 shadow-2xl leading-normal font-sans font-normal"
                                    >
                                      <strong>Max Drawdown (Historical):</strong><br />
                                      Measures the largest peak-to-trough decline in portfolio value. Containment thresholds:<br />
                                      {'• < 8%: Conservative'}<br />
                                      {'• < 15%: Moderate'}<br />
                                      {'• > 15%: Aggressive'}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-app-red block mt-0.5">
                              -{activeDrawdown.toFixed(2)}%
                            </span>
                            <span className="text-[8px] text-text-muted block">Peak-to-trough drop</span>
                          </div>
                        </div>

                        {/* Systematic Risk Profile Gauge */}
                        <div className="space-y-1.5 mt-4 pt-3.5 border-t border-white/5">
                          <div className="flex justify-between text-[10px] font-bold text-text-muted">
                            <span>Systematic Risk Profile</span>
                            <span className={`font-mono text-[10px] ${activeBeta > 1.2 ? 'text-app-red' : activeBeta < 0.8 ? 'text-app-green' : 'text-blue-400'}`}>
                              {activeBeta > 1.2 ? 'Aggressive' : activeBeta < 0.8 ? 'Conservative' : 'Moderate'}
                            </span>
                          </div>
                          {/* Color gradient spectrum bar */}
                          <div className="relative w-full h-1.5 rounded-full bg-gradient-to-r from-app-green via-blue-500 to-app-red overflow-visible mt-2">
                            {/* Indicator pointer */}
                            <motion.div 
                              className="absolute -top-1 w-1.5 h-3.5 bg-white rounded border border-black/40 shadow"
                              style={{ 
                                left: `${Math.min(98, Math.max(0, (activeBeta / 2.0) * 100))}%`,
                                transform: 'translateX(-50%)'
                              }}
                              animate={{ left: `${Math.min(98, Math.max(0, (activeBeta / 2.0) * 100))}%` }}
                              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-text-muted mt-1 font-mono uppercase">
                            <span>Conservative (0.0)</span>
                            <span>Moderate (1.0)</span>
                            <span>Aggressive (2.0+)</span>
                          </div>
                        </div>
                      </div>
 
                      {/* Health / Risk assessment note */}
                      {holdings.length > 0 && (
                        <div className="p-3 bg-white/2 rounded-xl border border-white/5 text-[9px] text-text-muted leading-relaxed flex items-start gap-2">
                          <HelpCircle className="w-3.5 h-3.5 text-app-green flex-shrink-0 mt-0.5" />
                          <p>
                            Risk parameters are derived from standard deviations of daily pricing feeds matched against S&P 500 benchmarks.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
 
                  {/* Rolling Windows & Insight Engine Section */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  >
                    {/* Rolling Window Metrics & Milestones */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-2xl p-6 border border-border-glass space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Rolling Performance Table */}
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Rolling Performance</h4>
                            <p className="text-[9px] text-text-muted mt-0.5">Key risk/reward indicators sliced across rolling timeframes.</p>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-white/5 text-[9px] font-bold text-text-muted uppercase font-sans">
                                  <th className="pb-2">Period</th>
                                  <th className="pb-2 text-right">Return %</th>
                                  <th className="pb-2 text-right">S&P 500</th>
                                  <th className="pb-2 text-right">Volatility</th>
                                  <th className="pb-2 text-right">Sharpe</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-mono text-[10px] text-on-surface">
                                {(Object.keys(rollingMetrics) as Array<keyof typeof rollingMetrics>).map((period) => {
                                  const metric = rollingMetrics[period];
                                  return (
                                    <tr key={period} className="hover:bg-white/2 transition-colors">
                                      <td className="py-2.5 font-bold font-sans text-white">{period}</td>
                                      <td className={`py-2.5 text-right font-bold ${metric.returnPct >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                                        {metric.returnPct >= 0 ? '+' : ''}{metric.returnPct}%
                                      </td>
                                      <td className={`py-2.5 text-right font-bold ${metric.benchPct >= 0 ? 'text-white' : 'text-app-red'}`}>
                                        {metric.benchPct >= 0 ? '+' : ''}{metric.benchPct}%
                                      </td>
                                      <td className="py-2.5 text-right text-text-muted">{metric.volatility}%</td>
                                      <td className="py-2.5 text-right font-bold text-white">{metric.sharpe}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Historical Milestones */}
                        <div className="space-y-3 md:border-l md:border-white/5 md:pl-6">
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Historical Milestones</h4>
                            <p className="text-[9px] text-text-muted mt-0.5">Key historical value benchmarks from active time series.</p>
                          </div>

                          {holdings.length > 0 ? (
                            <div className="space-y-3.5 pt-2">
                              {/* Milestone 1: Peak Value */}
                              <div className="flex gap-3 items-start">
                                <div className="w-7 h-7 rounded-lg bg-app-green/10 flex items-center justify-center border border-app-green/20 text-app-green mt-0.5">
                                  <TrendingUp className="w-3.5 h-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-text-muted uppercase block">All-Time Peak return</span>
                                  <span className="text-xs font-bold text-white block">
                                    +{peakReturn.toFixed(2)}% <span className="font-sans text-[10px] text-text-muted font-normal">on {peakDate}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Milestone 2: Max Drawdown */}
                              <div className="flex gap-3 items-start">
                                <div className="w-7 h-7 rounded-lg bg-app-red/10 flex items-center justify-center border border-app-red/20 text-app-red mt-0.5">
                                  <TrendingDown className="w-3.5 h-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-text-muted uppercase block">Peak Drawdown Drop</span>
                                  <span className="text-xs font-bold text-app-red block">
                                    -{worstDd.toFixed(2)}% <span className="font-sans text-[10px] text-text-muted font-normal">on {worstDdDate}</span>
                                  </span>
                                </div>
                              </div>

                              {/* Milestone 3: Best Single Day */}
                              <div className="flex gap-3 items-start">
                                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 mt-0.5">
                                  <Activity className="w-3.5 h-3.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-text-muted uppercase block">Largest single-day gain</span>
                                  <span className="text-xs font-bold text-white block">
                                    +{bestDailyGain.toFixed(2)}% <span className="font-sans text-[10px] text-text-muted font-normal">on {bestDailyGainDate}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="py-8 text-center text-xs text-text-muted italic">Add holdings to calculate milestones.</div>
                          )}
                        </div>

                      </div>
                    </motion.div>

                    {/* Insight Engine Card */}
                    <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 border border-border-glass flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-border-glass pb-2">
                          Institutional Risk Insights
                        </h3>
                        
                        {holdings.length > 0 ? (
                          <ul className="mt-4 space-y-3 text-xs text-[#b9cbbb] leading-normal font-sans">
                            {/* Insight 1: Diversification */}
                            <li 
                              onClick={() => toggleInsight('div')}
                              className="glass-card hover:bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl cursor-pointer transition-all duration-150 space-y-2 select-none"
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="text-xs flex-shrink-0 mt-0.5">
                                  {activeDiversificationScore < 40 ? '⚠️' : '✅'}
                                </span>
                                <div className="flex-1">
                                  <span className="font-bold text-white block">Diversification HHI Score</span>
                                  <span className="text-[11px] text-text-muted mt-0.5 block line-clamp-2">
                                    {activeDiversificationScore < 40 
                                      ? `Concentration alert: Portfolio HHI score is ${activeDiversificationScore}/100.` 
                                      : `Robust diversification: HHI score of ${activeDiversificationScore}/100.`}
                                  </span>
                                </div>
                              </div>
                              <AnimatePresence>
                                {expandedInsights['div'] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="text-[10px] text-text-muted pl-6 border-t border-white/5 pt-2 leading-relaxed"
                                  >
                                    {activeDiversificationScore < 40 
                                      ? `Your portfolio has a Herfindahl-Hirschman Index (HHI) score of ${activeDiversificationScore}/100, indicating high concentration in a few assets. A concentrated portfolio is highly sensitive to the performance of individual stocks. We recommend spreading capital across other sectors or index ETFs to lower unsystematic risk.`
                                      : `Your portfolio has a Herfindahl-Hirschman Index (HHI) score of ${activeDiversificationScore}/100, which reflects excellent diversification. Capital is balanced across multiple tickers, shielding you from significant losses if a single stock crashes. Keep monitoring to ensure weights don't drift too much.`}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </li>

                            {/* Insight 2: Sector Concentration */}
                            {activeAllocations.length > 0 && (
                              <li 
                                onClick={() => toggleInsight('sector')}
                                className="glass-card hover:bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl cursor-pointer transition-all duration-150 space-y-2 select-none"
                              >
                                <div className="flex items-start gap-2.5">
                                  <span className="text-xs flex-shrink-0 mt-0.5">
                                    {activeAllocations[0].value / activeValue > 0.40 ? '⚠️' : '✅'}
                                  </span>
                                  <div className="flex-1">
                                    <span className="font-bold text-white block">Sector Allocation Cap</span>
                                    <span className="text-[11px] text-text-muted mt-0.5 block line-clamp-2">
                                      {activeAllocations[0].value / activeValue > 0.40
                                        ? `Sector cap alert: ${activeAllocations[0].label} allocation is ${((activeAllocations[0].value / activeValue) * 100).toFixed(1)}% (exceeding recommended 40% target).`
                                        : `Balanced industry distribution: No single sector exceeds the institutional 40% concentration ceiling.`}
                                    </span>
                                  </div>
                                </div>
                                <AnimatePresence>
                                  {expandedInsights['sector'] && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="text-[10px] text-text-muted pl-6 border-t border-white/5 pt-2 leading-relaxed"
                                    >
                                      {activeAllocations[0].value / activeValue > 0.40
                                        ? `Your largest sector exposure is ${activeAllocations[0].label} at ${((activeAllocations[0].value / activeValue) * 100).toFixed(1)}%. Institutional risk rules advise capping any single sector at 40% to prevent industry-wide corrections from dragging down the entire portfolio. Consider trimming some shares to reallocate to other sectors.`
                                        : `Your largest sector exposure is ${activeAllocations[0].label} at ${((activeAllocations[0].value / activeValue) * 100).toFixed(1)}%, which is below the institutional 40% limit. This ensures that a sector-specific correction (like a tech selloff) will have a limited impact on your capital.`}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </li>
                            )}

                            {/* Insight 3: Market Beta Sensitivity */}
                            <li 
                              onClick={() => toggleInsight('beta')}
                              className="glass-card hover:bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl cursor-pointer transition-all duration-150 space-y-2 select-none"
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="text-xs flex-shrink-0 mt-0.5">
                                  {activeBeta > 1.2 ? '⚠️' : '✅'}
                                </span>
                                <div className="flex-1">
                                  <span className="font-bold text-white block">Systematic Beta Exposure</span>
                                  <span className="text-[11px] text-text-muted mt-0.5 block line-clamp-2">
                                    {activeBeta > 1.2
                                      ? `High beta profile: Portfolio beta is ${activeBeta.toFixed(2)}, meaning it is highly leveraged to macro market swings.`
                                      : activeBeta < 0.8
                                        ? `Defensive market exposure: Beta is ${activeBeta.toFixed(2)}, signaling strong downside protection.`
                                        : `Market matching risk: Beta is ${activeBeta.toFixed(2)}, tracking in tight alignment with the market.`}
                                  </span>
                                </div>
                              </div>
                              <AnimatePresence>
                                {expandedInsights['beta'] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="text-[10px] text-text-muted pl-6 border-t border-white/5 pt-2 leading-relaxed"
                                  >
                                    {activeBeta > 1.2
                                      ? `Your portfolio beta is ${activeBeta.toFixed(2)}, which means your portfolio is ${((activeBeta - 1) * 100).toFixed(0)}% more volatile than the S&P 500. While this can supercharge gains in a bull market, it exposes you to severe drops during market corrections. Adding low-beta stocks like consumer staples or healthcare will help stabilize performance.`
                                      : activeBeta < 0.8
                                        ? `Your portfolio beta is ${activeBeta.toFixed(2)}, indicating a defensive posture. It is expected to fall less than the S&P 500 during downturns, but will likely underperform during strong bull runs. This is typical for conservative income-focused or hedge portfolios.`
                                        : `Your portfolio beta is ${activeBeta.toFixed(2)}, showing systematic risk that closely tracks the broader market. Your volatility will move in line with major indexes like the S&P 500, offering balanced risk-adjusted market exposure.`}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </li>

                            {/* Insight 4: Capital Drawdowns */}
                            <li 
                              onClick={() => toggleInsight('drawdown')}
                              className="glass-card hover:bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl cursor-pointer transition-all duration-150 space-y-2 select-none"
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="text-xs flex-shrink-0 mt-0.5">
                                  {activeDrawdown > 15 ? '⚠️' : '✅'}
                                </span>
                                <div className="flex-1">
                                  <span className="font-bold text-white block">Historical Drawdown Limit</span>
                                  <span className="text-[11px] text-text-muted mt-0.5 block line-clamp-2">
                                    {activeDrawdown > 15
                                      ? `Elevated drawdown risk: Peak drop reached -${activeDrawdown.toFixed(1)}%.`
                                      : `Stable capital preservation: Historical drawdown is contained to -${activeDrawdown.toFixed(1)}%.`}
                                  </span>
                                </div>
                              </div>
                              <AnimatePresence>
                                {expandedInsights['drawdown'] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="text-[10px] text-text-muted pl-6 border-t border-white/5 pt-2 leading-relaxed"
                                  >
                                    {activeDrawdown > 15
                                      ? `Your portfolio's maximum historical drawdown reached -${activeDrawdown.toFixed(1)}%. This represents the peak-to-trough decline in portfolio value. A drawdown of this scale requires a ${((100 / (100 - activeDrawdown) - 1) * 100).toFixed(1)}% return just to break even. We suggest using stop-loss alerts or shifting capital to lower-volatility equities.`
                                      : `Your portfolio's maximum drawdown is restricted to -${activeDrawdown.toFixed(1)}%, which is well within conservative parameters. This demonstrates robust capital preservation during periods of market stress.`}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </li>
                          </ul>
                        ) : (
                          <div className="py-12 text-center text-xs text-text-muted italic">Add positions to generate risk reports.</div>
                        )}
                      </div>

                      <div className="p-3 bg-white/2 rounded-xl border border-white/5 text-[9px] text-text-muted mt-4 leading-normal flex items-start gap-2">
                        <Activity className="w-3.5 h-3.5 text-app-green flex-shrink-0 mt-0.5" />
                        <p>
                          Insights are auto-generated from daily correlation coefficients, HHI concentration sums, and historic backtest feeds.
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>

                </div>
              )}

              {/* TAB 2: HOLDINGS & DRIFT */}
              {activeTab === 'holdings' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Holdings Positions Table */}
                    <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden border border-border-glass flex flex-col justify-between">
                      <div>
                        <div className="p-5 border-b border-border-glass">
                          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Asset Holdings Manager</h2>
                        </div>

                        {holdings.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                              <thead>
                                <tr className="border-b border-border-glass bg-surface-lowest/50 text-[10px] font-bold text-text-muted uppercase tracking-wider font-sans">
                                  <th className="py-3 px-5">Symbol</th>
                                  <th className="py-3 px-5 text-right">Shares</th>
                                  <th className="py-3 px-5 text-right">Avg Price</th>
                                  <th className="py-3 px-5 text-right">Live Price</th>
                                  <th className="py-3 px-5 text-right">Cost Basis</th>
                                  <th className="py-3 px-5 text-right">Market Value</th>
                                  <th className="py-3 px-5 text-right">Gain / Loss</th>
                                  <th className="py-3 px-5 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border-glass font-mono text-xs">
                                {holdingsWithLive.map(h => {
                                  const isEditing = editingSymbol === h.symbol;
                                  const pos = h.pnl >= 0;

                                  return (
                                    <tr key={h.symbol} className="hover:bg-white/2 transition-colors">
                                      <td className="py-4 px-5">
                                        <span className="font-bold text-white block">{h.symbol}</span>
                                        <span className="text-[9px] text-text-muted font-sans block">{h.sector}</span>
                                      </td>

                                      <td className="py-4 px-5 text-right">
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            className="w-16 bg-surface-lowest text-right border border-border-glass rounded px-1.5 py-0.5 text-white font-bold"
                                            value={editQty}
                                            onChange={e => setEditQty(Math.max(1, parseInt(e.target.value) || 1))}
                                          />
                                        ) : (
                                          <span className="font-semibold">{h.quantity}</span>
                                        )}
                                      </td>

                                      <td className="py-4 px-5 text-right">
                                        {isEditing ? (
                                          <input
                                            type="number"
                                            step="0.01"
                                            className="w-20 bg-surface-lowest text-right border border-border-glass rounded px-1.5 py-0.5 text-white font-bold"
                                            value={editPrice}
                                            onChange={e => setEditPrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                                          />
                                        ) : (
                                          <span>${h.avgBuyPrice.toFixed(2)}</span>
                                        )}
                                      </td>

                                      <td className="py-4 px-5 text-right font-semibold text-white">
                                        <LiveTickText 
                                          value={h.currentPrice} 
                                          format={(val) => `$${val.toFixed(2)}`} 
                                          className="text-white font-semibold"
                                        />
                                      </td>

                                      <td className="py-4 px-5 text-right text-text-muted">
                                        ${(h.quantity * h.avgBuyPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </td>

                                      <td className="py-4 px-5 text-right font-semibold text-white">
                                        <LiveTickText 
                                          value={h.currentValue} 
                                          format={(val) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                                          className="text-white font-semibold"
                                        />
                                      </td>

                                      <td className={`py-4 px-5 text-right font-bold ${pos ? 'text-app-green' : 'text-app-red'}`}>
                                        <div className="flex flex-col items-end">
                                          <LiveTickText 
                                            value={h.pnl} 
                                            format={(val) => `${val >= 0 ? '+' : ''}$${val.toFixed(2)}`} 
                                            className={`font-bold ${pos ? 'text-app-green' : 'text-app-red'}`}
                                          />
                                          <span className="text-[9px] opacity-80">{pos ? '+' : ''}{h.returnPercent.toFixed(1)}%</span>
                                        </div>
                                      </td>

                                      <td className="py-4 px-5">
                                        <div className="flex items-center justify-center gap-1.5">
                                          {isEditing ? (
                                            <>
                                              <button
                                                onClick={saveEdit}
                                                className="p-1.5 rounded-lg bg-app-green/10 text-app-green hover:bg-app-green/20"
                                              >
                                                <Check className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={() => setEditingSymbol(null)}
                                                className="p-1.5 rounded-lg bg-white/5 text-text-muted hover:text-white"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => startEdit(h)}
                                                className="p-1.5 rounded bg-surface-glass border border-border-glass text-text-muted hover:text-white hover:border-app-green/45 transition-colors"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  if (confirm(`Remove position in ${h.symbol}?`)) {
                                                    removeHolding(h.symbol);
                                                  }
                                                }}
                                                className="p-1.5 rounded border border-red-500/10 text-app-red hover:bg-app-red/10 transition-colors"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-12 text-center text-text-muted flex flex-col justify-center items-center">
                            <Briefcase className="w-10 h-10 text-border-glass mb-2 text-app-green/80" />
                            <h3 className="text-sm font-bold text-white">No assets logged.</h3>
                            <p className="text-xs mt-1">Start building a virtual portfolio holdings.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setTradeType('BUY');
                                setBuyModalOpen(true);
                              }}
                              className="mt-5 px-5 py-2.5 btn-primary font-bold text-xs rounded-xl shadow-glow-green cursor-pointer"
                            >
                              Buy First Stock
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Target Allocation Drift Panel */}
                    <div className="glass-card rounded-2xl p-6 border border-border-glass flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="border-b border-border-glass pb-3">
                          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Allocation Drift Lab</h2>
                          <p className="text-[10px] text-[#8A8F98] mt-0.5">Configure target weights and analyze current allocation deviation.</p>
                        </div>

                        {holdings.length > 0 ? (
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                            {holdingsWithLive.map(h => {
                              const currentWeight = currentValue === 0 ? 0 : (h.currentValue / currentValue) * 100;
                              const targetWeight = targetAllocations[h.symbol] || 0;
                              const deviation = currentWeight - targetWeight;
                              
                              // Threshold check
                              let deviationBadge = 'Balanced';
                              let badgeColor = 'bg-white/5 text-text-muted border-white/5';
                              if (deviation > 2.5) {
                                deviationBadge = `+${deviation.toFixed(1)}% Overweight`;
                                badgeColor = 'bg-app-green/10 text-app-green border-app-green/20';
                              } else if (deviation < -2.5) {
                                deviationBadge = `${deviation.toFixed(1)}% Underweight`;
                                badgeColor = 'bg-app-red/10 text-app-red border-app-red/20';
                              }

                              return (
                                <div key={h.symbol} className="space-y-2 pb-2.5 border-b border-white/5 last:border-0 last:pb-0">
                                  <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-white">{h.symbol}</span>
                                      <span className="text-[9px] text-[#8A8F98] font-sans">({h.sector})</span>
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                      {deviationBadge}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="5"
                                      value={targetWeight}
                                      onChange={e => updateTargetWeight(h.symbol, parseInt(e.target.value) || 0)}
                                      className="flex-1 accent-app-green bg-surface-lowest h-1 rounded-lg cursor-pointer"
                                    />
                                    <span className="font-mono text-[10px] w-12 text-right text-text-muted font-bold">
                                      T: <span className="text-white">{targetWeight}%</span>
                                    </span>
                                    <span className="font-mono text-[10px] w-12 text-right text-text-muted font-bold">
                                      C: <span className="text-white">{Math.round(currentWeight)}%</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-12 text-center text-xs text-text-muted">
                            Add holdings to configure drift settings.
                          </div>
                        )}
                      </div>

                      {/* Drift constraints warnings */}
                      {holdings.length > 0 && (
                        <div className="pt-4 border-t border-border-glass mt-4 flex items-center justify-between text-[10px]">
                          <span className={targetWeightsSum === 100 ? 'text-app-green' : 'text-orange-400'}>
                            Target Sum: {targetWeightsSum}% {targetWeightsSum === 100 ? '✓' : '(!= 100%)'}
                          </span>
                          <span className="text-[#8A8F98] italic">
                            {targetWeightsSum !== 100 && 'Targets must equal 100%'}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Asset Rebalancing Suggestions Section */}
                  {holdings.length > 0 && (
                    <div className="glass-card rounded-2xl p-6 border border-border-glass space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Asset Rebalancing Suggestions</h3>
                        <p className="text-[10px] text-text-muted mt-0.5 font-medium">Calculated shares to buy/sell to align current holdings with configured Target Allocations.</p>
                      </div>
                      
                      {targetWeightsSum === 100 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-[9px] font-bold text-text-muted uppercase font-sans">
                                <th className="pb-2">Asset</th>
                                <th className="pb-2 text-right">Current Weight</th>
                                <th className="pb-2 text-right">Target Weight</th>
                                <th className="pb-2 text-right">Deviation</th>
                                <th className="pb-2 text-right">Rebalancing Action</th>
                                <th className="pb-2 text-right">Estimated Cash Flow</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 font-mono text-[10px] text-on-surface">
                              {rebalancingSuggestions.map((sug) => {
                                const dev = sug.deviationPct;
                                const absDev = Math.abs(dev);
                                const shares = sug.sharesDifference;
                                const absShares = Math.abs(shares);
                                const cashFlow = Math.abs(sug.deviationVal);
                                
                                // Suggestion description
                                let actionText = 'Maintain';
                                let actionClass = 'text-text-muted font-sans font-semibold';
                                if (dev > 2.0) {
                                  actionText = `Reduce ${sug.symbol} by ${absDev.toFixed(1)}% ($${Math.round(cashFlow).toLocaleString()})`;
                                  actionClass = 'text-app-red font-semibold';
                                } else if (dev < -2.0) {
                                  actionText = `Increase ${sug.symbol} by ${absDev.toFixed(1)}% ($${Math.round(cashFlow).toLocaleString()})`;
                                  actionClass = 'text-app-green font-semibold';
                                }
                                
                                return (
                                  <tr key={sug.symbol} className="hover:bg-white/2 transition-colors">
                                    <td className="py-2.5 font-bold font-sans text-white">{sug.symbol}</td>
                                    <td className="py-2.5 text-right">{sug.currentWeight.toFixed(1)}%</td>
                                    <td className="py-2.5 text-right">{sug.targetWeight}%</td>
                                    <td className={`py-2.5 text-right font-bold ${dev > 2.0 ? 'text-app-red' : dev < -2.0 ? 'text-app-green' : 'text-text-muted'}`}>
                                      {dev > 0 ? '+' : ''}{dev.toFixed(1)}%
                                    </td>
                                    <td className={`py-2.5 text-right ${actionClass}`}>
                                      {actionText}
                                    </td>
                                    <td className={`py-2.5 text-right font-semibold ${dev > 2.0 ? 'text-app-green' : dev < -2.0 ? 'text-app-red' : 'text-white'}`}>
                                      {dev > 2.0 ? '+' : dev < -2.0 ? '-' : ''}${Math.round(cashFlow).toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-text-muted italic flex items-center gap-2 justify-center bg-white/2 rounded-xl border border-white/5 p-4">
                          <Info className="w-4 h-4 text-orange-400" />
                          <span>Configure Target Weights to sum to exactly 100% in the Drift Lab to view rebalancing recommendations.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STRATEGY BACKTESTER LAB */}
              {activeTab === 'backtester' && (
                <div className="glass-card rounded-3xl p-6 border border-border-glass space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border-glass">
                    <div>
                      <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted">Quantitative Backtesting Lab</h2>
                      <p className="text-[10px] text-[#8A8F98] mt-0.5">Model historical allocations against the S&P 500 Index benchmark.</p>
                    </div>

                    {/* Timeframe selector */}
                    <div className="flex p-0.5 bg-surface-low border border-border-glass rounded-xl text-xs font-bold text-text-muted w-fit">
                      {(['1M', '3M', '6M'] as const).map(tf => (
                        <button
                          key={tf}
                          onClick={() => setBacktestTimeframe(tf)}
                          className={`px-3 py-1.5 rounded-lg transition-all ${
                            backtestTimeframe === tf ? 'bg-surface-high text-white shadow-sm' : 'hover:text-white'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Allocation controls */}
                    <div className="space-y-4 lg:col-span-1 bg-surface-lowest/40 p-4.5 rounded-2xl border border-border-glass/40 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold pb-2 border-b border-border-glass/40">
                          <span className="text-text-muted">Asset Weights Setup</span>
                          <span className={Object.values(backtestWeights).reduce((sum, w) => sum + w, 0) === 100 ? 'text-app-green' : 'text-app-red'}>
                            Sum: {Object.values(backtestWeights).reduce((sum, w) => sum + w, 0)}%
                          </span>
                        </div>

                        <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                          {Object.keys(backtestWeights).map(sym => (
                            <div key={sym} className="flex justify-between items-center gap-3">
                              <span className="font-bold text-xs text-white w-14">{sym}</span>
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={backtestWeights[sym]}
                                  onChange={e => {
                                    setBacktestWeights(prev => ({ ...prev, [sym]: parseInt(e.target.value) || 0 }));
                                  }}
                                  className="w-full accent-app-green bg-surface-lowest h-1.5 cursor-pointer appearance-none rounded-lg"
                                />
                                <span className="font-mono text-xs w-8 text-right text-white font-bold">{backtestWeights[sym]}%</span>
                              </div>
                              <button
                                onClick={() => {
                                  const updated = { ...backtestWeights };
                                  delete updated[sym];
                                  setBacktestWeights(updated);
                                }}
                                className="p-1 rounded text-text-muted hover:text-app-red transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Quick add ticker weight */}
                        <div className="flex gap-2 pt-3 border-t border-border-glass/40">
                          <select
                            value={newWeightSym}
                            onChange={e => setNewWeightSym(e.target.value)}
                            className="flex-1 bg-surface-lowest border border-border-glass rounded px-2 py-1.5 text-xs text-white outline-none focus:border-app-green font-bold"
                          >
                            {allStocks.map(s => (
                              <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="5"
                            placeholder="%"
                            className="w-14 bg-surface-lowest border border-border-glass rounded text-center text-xs text-white outline-none focus:border-app-green font-bold"
                            value={newWeightVal === 0 ? '' : newWeightVal}
                            onChange={e => setNewWeightVal(Math.max(0, parseInt(e.target.value) || 0))}
                          />
                          <button
                            onClick={() => {
                              if (!newWeightSym) return;
                              setBacktestWeights(prev => ({ ...prev, [newWeightSym]: newWeightVal || 10 }));
                              setNewWeightVal(0);
                            }}
                            className="p-1.5 rounded bg-surface-glass border border-border-glass hover:border-app-green/30 text-app-green"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleRunBacktest}
                        disabled={Object.values(backtestWeights).reduce((sum, w) => sum + w, 0) !== 100}
                        className="w-full py-3 rounded-xl bg-app-green text-black font-bold text-xs shadow-md hover:shadow-glow-green-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed mt-4 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" /> Run Allocation Backtest
                      </button>
                    </div>

                    {/* Returns Line Chart */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="relative">
                        {backtestResults ? (
                          <PortfolioGrowthChart 
                            dates={backtestResults.dates}
                            portfolioReturns={backtestResults.portfolioReturns}
                            benchmarkReturns={backtestResults.benchmarkReturns}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-[220px] text-xs text-text-muted">Configure weights to run.</div>
                        )}
                      </div>

                      {/* Strategic Metrics Cards */}
                      {backtestResults && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-surface-lowest/40 p-3.5 rounded-xl border border-border-glass/40 font-mono text-center">
                            <span className="text-[9px] font-bold text-text-muted uppercase block font-sans">Backtest Return</span>
                            <span className={`text-sm font-bold block mt-1 ${backtestResults.metrics.portfolioFinalReturn >= 0 ? 'text-app-green' : 'text-app-red'}`}>
                              {backtestResults.metrics.portfolioFinalReturn >= 0 ? '+' : ''}{backtestResults.metrics.portfolioFinalReturn}%
                            </span>
                            <span className="text-[9px] text-[#8A8F98] block font-sans">SPY: {backtestResults.metrics.benchmarkFinalReturn >= 0 ? '+' : ''}{backtestResults.metrics.benchmarkFinalReturn}%</span>
                          </div>

                          <div className="bg-surface-lowest/40 p-3.5 rounded-xl border border-border-glass/40 font-mono text-center">
                            <span className="text-[9px] font-bold text-text-muted uppercase block font-sans">Max Drawdown</span>
                            <span className="text-sm font-bold text-app-red block mt-1">
                              -{backtestResults.metrics.maxDrawdown}%
                            </span>
                            <span className="text-[9px] text-[#8A8F98] block font-sans">Strategy Peak drop</span>
                          </div>

                          <div className="bg-surface-lowest/40 p-3.5 rounded-xl border border-border-glass/40 font-mono text-center">
                            <span className="text-[9px] font-bold text-text-muted uppercase block font-sans">Volatility</span>
                            <span className="text-sm font-bold text-white block mt-1">
                              {backtestResults.metrics.volatility}%
                            </span>
                            <span className="text-[9px] text-[#8A8F98] block font-sans">Deviation rate</span>
                          </div>

                          <div className="bg-surface-lowest/40 p-3.5 rounded-xl border border-border-glass/40 font-mono text-center">
                            <span className="text-[9px] font-bold text-text-muted uppercase block font-sans">Alpha & Beta</span>
                            <span className="text-sm font-bold text-app-green block mt-1">
                              +{backtestResults.metrics.alpha}%
                            </span>
                            <span className="text-[9px] text-[#8A8F98] block font-sans">Beta: {backtestResults.metrics.beta}</span>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 3. Log transaction buy/sell modal */}
      <AnimatePresence>
        {buyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-card border border-border-glass shadow-2xl rounded-3xl p-6 overflow-hidden bg-[#10141a]/95 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-border-glass">
                <span className="font-bold text-sm text-white">Log {tradeType === 'BUY' ? 'Buy' : 'Sell'} Transaction</span>
                <button
                  onClick={() => setBuyModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {/* Trade Type selection */}
              <div className="flex p-0.5 bg-surface-low border border-border-glass rounded-xl text-[10px] font-bold text-text-muted my-4 w-full">
                <button
                  type="button"
                  onClick={() => setTradeType('BUY')}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                    tradeType === 'BUY' ? 'bg-app-green text-black font-bold shadow-sm' : 'hover:text-white'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => setTradeType('SELL')}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all cursor-pointer ${
                    tradeType === 'SELL' ? 'bg-app-red text-white font-bold shadow-sm' : 'hover:text-white'
                  }`}
                >
                  SELL
                </button>
              </div>

              <form onSubmit={handleQuickTrade} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-text-muted block">Asset Ticker</label>
                  <select
                    value={buySymbol}
                    onChange={(e) => setBuySymbol(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border-glass bg-surface-lowest text-xs focus:outline-none focus:ring-1 focus:ring-app-green text-white font-bold cursor-pointer"
                  >
                    {allStocks.map(s => (
                      <option key={s.symbol} value={s.symbol}>{s.symbol} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-text-muted block">Shares Quantity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="w-full px-3 py-2 rounded-xl border border-border-glass bg-surface-lowest text-xs font-semibold font-mono focus:outline-none focus:border-app-green text-white"
                      value={buyQty}
                      onChange={e => setBuyQty(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-text-muted block">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      className="w-full px-3 py-2 rounded-xl border border-border-glass bg-surface-lowest text-xs font-semibold font-mono focus:outline-none focus:border-app-green text-white"
                      value={buyPrice}
                      onChange={e => setBuyPrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    />
                  </div>
                </div>

                {/* Estimation logic */}
                {(() => {
                  const estValue = buyQty * buyPrice;
                  const fee = Math.max(0.99, Number((estValue * 0.0005).toFixed(2)));
                  const isBuy = tradeType === 'BUY';
                  const total = isBuy ? estValue + fee : estValue - fee;

                  return (
                    <div className="border-t border-white/5 pt-3.5 space-y-1.5 font-mono text-[10px] text-text-muted">
                      <div className="flex justify-between">
                        <span>Est Value</span>
                        <span className="text-white">${estValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Brokerage Fee (0.05%)</span>
                        <span className="text-white">${fee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold border-t border-white/5 pt-2 mt-1">
                        <span className="text-white">{isBuy ? 'Total Cost Basis' : 'Total Net Credit'}</span>
                        <span className={isBuy ? 'text-app-green' : 'text-app-red'}>
                          ${Math.max(0, total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all duration-200 cursor-pointer ${
                    tradeType === 'BUY' 
                      ? 'bg-app-green text-black hover:shadow-glow-green' 
                      : 'bg-app-red text-white hover:bg-red-700'
                  }`}
                >
                  Log Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. AI Analyst Drawer Panel */}
      <AnimatePresence>
        {aiDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setAiDrawerOpen(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md h-full bg-[#10141a]/95 border-l border-border-glass shadow-2xl backdrop-blur-xl flex flex-col justify-between"
            >
              <div className="p-5 border-b border-border-glass flex items-center justify-between bg-surface-lowest/50">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-app-green animate-pulse" />
                  <div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-wider">Copilot Analyst Drawer</h2>
                    <span className="text-[9px] text-text-muted">Live context-aware portfolio assistance.</span>
                  </div>
                </div>
                <button
                  onClick={() => setAiDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((msg) => {
                  const isAi = msg.role === 'assistant';
                  return (
                    <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed border ${
                        isAi 
                          ? 'bg-zinc-900 border-border-glass text-on-surface' 
                          : 'bg-app-green/10 border-app-green/20 text-white font-medium'
                      }`}>
                        <div className="flex items-center justify-between gap-6 mb-1 text-[8px] font-bold text-text-muted">
                          <span>{isAi ? 'AI CO-PILOT' : 'USER'}</span>
                          <span>{msg.timestamp}</span>
                        </div>
                        <div className="space-y-1.5 whitespace-pre-line">
                          {msg.content.split('\n').map((line, lIdx) => {
                            if (line.startsWith('### ')) {
                              return <h4 key={lIdx} className="font-bold text-white text-xs mt-2">{line.replace('### ', '')}</h4>;
                            }
                            if (line.startsWith('- ')) {
                              return <div key={lIdx} className="pl-2 relative before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-app-green">{line.replace('- ', '')}</div>;
                            }
                            if (line.includes('**')) {
                              const boldPart = line.match(/\*\*(.*?)\*\*/)?.[1];
                              if (boldPart) {
                                const replaced = line.replace(`**${boldPart}**`, '');
                                return <p key={lIdx}>{replaced}<strong className="text-app-green font-bold">{boldPart}</strong></p>;
                              }
                            }
                            return <p key={lIdx}>{line}</p>;
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {aiDrawerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-border-glass rounded-2xl px-4 py-2 flex items-center gap-1.5 text-xs text-text-muted">
                      <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={aiChatBottomRef} />
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!aiDrawerInput.trim()) return;
                  const query = aiDrawerInput;
                  setAiDrawerInput('');
                  setAiDrawerTyping(true);
                  addMessage('user', query);
                  await generateResponse(query);
                  setAiDrawerTyping(false);
                }}
                className="p-4 border-t border-border-glass bg-surface-lowest/30 flex gap-2"
              >
                <input
                  type="text"
                  className="flex-1 bg-surface-lowest text-xs border border-border-glass rounded-xl px-4 py-2.5 text-white placeholder-text-muted focus:outline-none focus:border-app-green"
                  placeholder="Ask follow-up or type command..."
                  value={aiDrawerInput}
                  onChange={(e) => setAiDrawerInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2.5 bg-app-green text-black rounded-xl hover:shadow-glow-green-sm hover:scale-[1.02] transition-all flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PortfolioPage;
