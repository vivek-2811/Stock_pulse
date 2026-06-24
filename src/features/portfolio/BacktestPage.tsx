import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  AlertTriangle, 
  Play, 
  Plus, 
  Trash2, 
  HelpCircle, 
  RefreshCw, 
  Sliders, 
  PieChart, 
  ArrowUpRight, 
  Info, 
  ChevronRight, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { mockDataEngine } from '../../services/mockDataEngine';
import type { Stock } from '../../services/mockDataEngine';

interface Allocation {
  symbol: string;
  weight: number; // percentage (0-100)
}

interface BacktestResults {
  dates: string[];
  portfolioReturns: number[];
  benchmarkReturns: number[];
  portfolioValues: number[];
  benchmarkValues: number[];
  finalValue: number;
  totalReturn: number;
  benchmarkTotalReturn: number;
  sharpeRatio: number;
  benchmarkSharpeRatio: number;
  volatility: number;
  benchmarkVolatility: number;
  maxDrawdown: number;
  benchmarkMaxDrawdown: number;
}

const PRESETS = [
  {
    name: 'Magnificent Tech',
    description: 'High-growth tech leaders concentrated allocation',
    allocations: [
      { symbol: 'NVDA', weight: 40 },
      { symbol: 'MSFT', weight: 30 },
      { symbol: 'AAPL', weight: 30 }
    ]
  },
  {
    name: 'Defensive Value & Dividends',
    description: 'Low-beta, high-stability dividend payers',
    allocations: [
      { symbol: 'KO', weight: 40 },
      { symbol: 'WMT', weight: 30 },
      { symbol: 'JPM', weight: 30 }
    ]
  },
  {
    name: 'Diversified Giant Basket',
    description: 'Equal weight across index heavyweights',
    allocations: [
      { symbol: 'AAPL', weight: 20 },
      { symbol: 'MSFT', weight: 20 },
      { symbol: 'GOOGL', weight: 20 },
      { symbol: 'NVDA', weight: 20 },
      { symbol: 'AMZN', weight: 20 }
    ]
  },
  {
    name: 'Speculative High-Beta',
    description: 'High momentum and volatility allocation',
    allocations: [
      { symbol: 'TSLA', weight: 50 },
      { symbol: 'AMD', weight: 30 },
      { symbol: 'SQ', weight: 20 }
    ]
  }
];

export const BacktestPage: React.FC = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([
    { symbol: 'AAPL', weight: 40 },
    { symbol: 'MSFT', weight: 30 },
    { symbol: 'NVDA', weight: 30 }
  ]);
  const [timeframe, setTimeframe] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');
  const [startingBalance, setStartingBalance] = useState<number>(100000);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [results, setResults] = useState<BacktestResults | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [chartWidth, setChartWidth] = useState<number>(600);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Load stocks on mount
  useEffect(() => {
    setStocks(mockDataEngine.getStocks());
  }, []);

  // Update chart width on resize
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const handleResize = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.clientWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [results]);

  const totalWeight = allocations.reduce((sum, item) => sum + item.weight, 0);

  const handleAddStock = () => {
    const remaining = Math.max(0, 100 - totalWeight);
    const availableStocks = stocks.filter(s => !allocations.some(a => a.symbol === s.symbol));
    if (availableStocks.length === 0) return;
    
    setAllocations([...allocations, { symbol: availableStocks[0].symbol, weight: remaining > 0 ? remaining : 0 }]);
  };

  const handleRemoveStock = (index: number) => {
    setAllocations(allocations.filter((_, i) => i !== index));
  };

  const handleUpdateAllocation = (index: number, field: keyof Allocation, value: any) => {
    const updated = [...allocations];
    if (field === 'weight') {
      updated[index].weight = Math.max(0, Math.min(100, Number(value) || 0));
    } else {
      updated[index].symbol = value;
    }
    setAllocations(updated);
  };

  const handleAutoRebalance = () => {
    if (allocations.length === 0) return;
    const equalWeight = Math.floor(100 / allocations.length);
    const remainder = 100 - (equalWeight * allocations.length);
    const updated = allocations.map((item, idx) => ({
      ...item,
      weight: equalWeight + (idx === 0 ? remainder : 0)
    }));
    setAllocations(updated);
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setAllocations(preset.allocations.map(a => ({ ...a })));
  };

  const handleRunBacktest = () => {
    if (totalWeight !== 100) return;
    setIsSimulating(true);

    setTimeout(() => {
      // Fetch historical datasets for selected stocks and the benchmark S&P 500
      const stockHistories = allocations.map(a => {
        const hist = mockDataEngine.getHistoricalData(a.symbol, timeframe);
        return {
          symbol: a.symbol,
          weight: a.weight / 100,
          data: hist
        };
      });

      const spyHistory = mockDataEngine.getHistoricalData('S&P 500', timeframe);
      
      if (stockHistories.length === 0 || stockHistories[0].data.length === 0) {
        setIsSimulating(false);
        return;
      }

      const pointsCount = spyHistory.length;
      const dates: string[] = spyHistory.map(h => {
        const d = new Date(h.time * 1000);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      });

      // Compute weighted return series
      const portfolioValues: number[] = [];
      const benchmarkValues: number[] = [];
      const portfolioReturns: number[] = [];
      const benchmarkReturns: number[] = [];

      // Baseline values starting at startingBalance
      let currentPortValue = startingBalance;
      let currentSpyValue = startingBalance;

      portfolioValues.push(currentPortValue);
      benchmarkValues.push(currentSpyValue);
      portfolioReturns.push(0);
      benchmarkReturns.push(0);

      // Track daily returns to compute standard dev (volatility)
      const portDailyPctChanges: number[] = [];
      const spyDailyPctChanges: number[] = [];

      for (let i = 1; i < pointsCount; i++) {
        // Portfolio return for day i is the weighted sum of stock returns relative to index 0
        let portDailyRatio = 0;
        allocations.forEach(alloc => {
          const sHist = stockHistories.find(sh => sh.symbol === alloc.symbol);
          if (sHist && sHist.data[i] && sHist.data[i - 1]) {
            const stockPctChange = (sHist.data[i].close - sHist.data[i - 1].close) / sHist.data[i - 1].close;
            portDailyRatio += stockPctChange * (alloc.weight / 100);
          }
        });

        const spyPctChange = (spyHistory[i].close - spyHistory[i - 1].close) / spyHistory[i - 1].close;

        portDailyPctChanges.push(portDailyRatio);
        spyDailyPctChanges.push(spyPctChange);

        currentPortValue = currentPortValue * (1 + portDailyRatio);
        currentSpyValue = currentSpyValue * (1 + spyPctChange);

        portfolioValues.push(currentPortValue);
        benchmarkValues.push(currentSpyValue);

        const portCumReturn = ((currentPortValue - startingBalance) / startingBalance) * 100;
        const spyCumReturn = ((currentSpyValue - startingBalance) / startingBalance) * 100;

        portfolioReturns.push(portCumReturn);
        benchmarkReturns.push(spyCumReturn);
      }

      // 1. Calculate Sharpe and Volatility
      const calculateStats = (pctChanges: number[], cumReturnPct: number) => {
        const n = pctChanges.length;
        if (n === 0) return { vol: 0, sharpe: 0 };
        const mean = pctChanges.reduce((s, x) => s + x, 0) / n;
        const variance = pctChanges.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        // Annualize daily standard dev (assume 252 trading days)
        const annualizedVol = stdDev * Math.sqrt(252);
        
        // Annualize return
        const periodsPerYear = 252 / n;
        const annualizedReturn = Math.pow(1 + cumReturnPct / 100, periodsPerYear) - 1;
        
        // Sharpe = (Ann Return - Risk Free Rate 4.5%) / Ann Volatility
        const rf = 0.045;
        const sharpe = annualizedVol > 0 ? (annualizedReturn - rf) / annualizedVol : 0;

        return {
          vol: annualizedVol * 100,
          sharpe: Math.max(-2, Math.min(6, sharpe))
        };
      };

      const portCumReturnFinal = ((currentPortValue - startingBalance) / startingBalance) * 100;
      const spyCumReturnFinal = ((currentSpyValue - startingBalance) / startingBalance) * 100;

      const portStats = calculateStats(portDailyPctChanges, portCumReturnFinal);
      const spyStats = calculateStats(spyDailyPctChanges, spyCumReturnFinal);

      // 2. Calculate Max Drawdown
      const calculateMaxDD = (values: number[]) => {
        let peak = values[0];
        let maxDD = 0;
        values.forEach(v => {
          if (v > peak) peak = v;
          const dd = (v - peak) / peak;
          if (dd < maxDD) maxDD = dd;
        });
        return maxDD * 100;
      };

      const portMaxDD = calculateMaxDD(portfolioValues);
      const spyMaxDD = calculateMaxDD(benchmarkValues);

      setResults({
        dates,
        portfolioReturns,
        benchmarkReturns,
        portfolioValues,
        benchmarkValues,
        finalValue: Number(currentPortValue.toFixed(2)),
        totalReturn: Number(portCumReturnFinal.toFixed(2)),
        benchmarkTotalReturn: Number(spyCumReturnFinal.toFixed(2)),
        sharpeRatio: Number(portStats.sharpe.toFixed(2)),
        benchmarkSharpeRatio: Number(spyStats.sharpe.toFixed(2)),
        volatility: Number(portStats.vol.toFixed(2)),
        benchmarkVolatility: Number(spyStats.vol.toFixed(2)),
        maxDrawdown: Number(portMaxDD.toFixed(2)),
        benchmarkMaxDrawdown: Number(spyMaxDD.toFixed(2))
      });

      setIsSimulating(false);
    }, 800);
  };

  // Run automatically on first render once stocks are loaded
  useEffect(() => {
    if (stocks.length > 0 && !results) {
      handleRunBacktest();
    }
  }, [stocks]);

  // Chart plotting helper coordinates
  const height = 280;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const plotChart = () => {
    if (!results) return null;
    const { portfolioReturns, benchmarkReturns } = results;

    const allValues = [...portfolioReturns, ...benchmarkReturns];
    const minVal = Math.min(...allValues) - 2;
    const maxVal = Math.max(...allValues) + 2;
    const valRange = maxVal - minVal || 1;

    const w = chartWidth - paddingLeft - paddingRight;
    const h = height - paddingTop - paddingBottom;

    const getX = (idx: number) => paddingLeft + (idx / (results.dates.length - 1)) * w;
    const getY = (val: number) => paddingTop + h - ((val - minVal) / valRange) * h;

    let portPath = '';
    let spyPath = '';
    let portArea = '';

    portfolioReturns.forEach((val, idx) => {
      const cx = getX(idx);
      const cy = getY(val);
      if (idx === 0) {
        portPath = `M ${cx} ${cy}`;
        portArea = `M ${cx} ${getY(minVal)} L ${cx} ${cy}`;
      } else {
        portPath += ` L ${cx} ${cy}`;
        portArea += ` L ${cx} ${cy}`;
      }
    });
    if (portfolioReturns.length > 0) {
      portArea += ` L ${getX(portfolioReturns.length - 1)} ${getY(minVal)} Z`;
    }

    benchmarkReturns.forEach((val, idx) => {
      const cx = getX(idx);
      const cy = getY(val);
      if (idx === 0) {
        spyPath = `M ${cx} ${cy}`;
      } else {
        spyPath += ` L ${cx} ${cy}`;
      }
    });

    const yTicks = [
      minVal + valRange * 0.1,
      minVal + valRange * 0.5,
      minVal + valRange * 0.9
    ];

    const xTicks = [
      0,
      Math.floor((results.dates.length - 1) * 0.33),
      Math.floor((results.dates.length - 1) * 0.66),
      results.dates.length - 1
    ];

    return (
      <div className="relative">
        <svg width={chartWidth} height={height} className="overflow-visible font-mono">
          <defs>
            <linearGradient id="portGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00FF94" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00FF94" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((val, idx) => (
            <g key={idx}>
              <line 
                x1={paddingLeft} 
                y1={getY(val)} 
                x2={chartWidth - paddingRight} 
                y2={getY(val)} 
                stroke="rgba(255, 255, 255, 0.05)" 
                strokeDasharray="4"
              />
              <text 
                x={paddingLeft - 8} 
                y={getY(val) + 4} 
                fill="#8A8F98" 
                fontSize="10" 
                textAnchor="end"
              >
                {val >= 0 ? '+' : ''}{val.toFixed(1)}%
              </text>
            </g>
          ))}

          {/* X Axis dates */}
          {xTicks.map((idxVal) => (
            <text
              key={idxVal}
              x={getX(idxVal)}
              y={height - 15}
              fill="#8A8F98"
              fontSize="9"
              textAnchor="middle"
            >
              {results.dates[idxVal]}
            </text>
          ))}

          {/* Benchmark line */}
          <path 
            d={spyPath} 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.35)" 
            strokeWidth="1.5" 
            strokeDasharray="4 2"
          />

          {/* Portfolio Area & Line */}
          <path d={portArea} fill="url(#portGradient)" />
          <path 
            d={portPath} 
            fill="none" 
            stroke="#00FF94" 
            strokeWidth="2.5" 
            className="shadow-glow-green-sm"
          />

          {/* Hover tracker line */}
          {hoverIdx !== null && results.dates[hoverIdx] && (
            <>
              <line
                x1={getX(hoverIdx)}
                y1={paddingTop}
                x2={getX(hoverIdx)}
                y2={height - paddingBottom}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
              />
              <circle cx={getX(hoverIdx)} cy={getY(portfolioReturns[hoverIdx])} r="5" fill="#00FF94" stroke="#0A0E14" strokeWidth="1.5" />
              <circle cx={getX(hoverIdx)} cy={getY(benchmarkReturns[hoverIdx])} r="4" fill="#ffffff" stroke="#0A0E14" strokeWidth="1.5" />
            </>
          )}
        </svg>

        {/* Hover details overlay card */}
        {hoverIdx !== null && results.dates[hoverIdx] && (
          <div 
            className="absolute top-4 glass-card border border-white/10 rounded-xl p-3 bg-[#10141a]/95 text-xs flex flex-col gap-1 z-10 shadow-xl pointer-events-none"
            style={{ 
              left: getX(hoverIdx) > chartWidth / 2 ? `${getX(hoverIdx) - 150}px` : `${getX(hoverIdx) + 15}px` 
            }}
          >
            <span className="font-bold text-white font-mono">{results.dates[hoverIdx]}</span>
            <div className="flex justify-between gap-4 font-mono">
              <span className="text-text-muted">Portfolio:</span>
              <span className="text-[#00FF94] font-bold">
                ${(startingBalance * (1 + portfolioReturns[hoverIdx] / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({portfolioReturns[hoverIdx] >= 0 ? '+' : ''}{portfolioReturns[hoverIdx].toFixed(2)}%)
              </span>
            </div>
            <div className="flex justify-between gap-4 font-mono">
              <span className="text-text-muted">S&P 500:</span>
              <span className="text-white">
                ${(startingBalance * (1 + benchmarkReturns[hoverIdx] / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({benchmarkReturns[hoverIdx] >= 0 ? '+' : ''}{benchmarkReturns[hoverIdx].toFixed(2)}%)
              </span>
            </div>
          </div>
        )}

        <div 
          className="absolute inset-y-0" 
          style={{ left: paddingLeft, width: w }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = e.clientX - rect.left;
            const idx = Math.max(0, Math.min(results.dates.length - 1, Math.round((relX / w) * (results.dates.length - 1))));
            setHoverIdx(idx);
          }}
          onMouseLeave={() => setHoverIdx(null)}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12">
      {/* Title Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card border border-border-glass rounded-2xl p-6 relative overflow-hidden flex flex-col gap-2"
      >
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-app-green/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-center gap-2 text-app-green">
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Simulators & Backtesting</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Portfolio Backtesting Sandbox</h1>
        <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
          Construct custom portfolios by adjusting allocation weights. Compute volatility metrics, annualized Sharpe Ratios, and maximum drawdown risk variables mapped directly to historical index performance vectors.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Allocations Editor */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card border border-border-glass rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">Configure Allocation</h2>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                totalWeight === 100 
                  ? 'bg-app-green/15 text-app-green border-app-green/20' 
                  : 'bg-app-red/15 text-app-red border-app-red/20'
              }`}>
                Total: {totalWeight}%
              </span>
            </div>

            <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
              {allocations.map((alloc, idx) => (
                <div key={idx} className="surface-low border border-border-glass rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <select
                      value={alloc.symbol}
                      onChange={(e) => handleUpdateAllocation(idx, 'symbol', e.target.value)}
                      className="bg-surface-lowest border border-border-glass text-white text-xs font-bold px-2 py-1 rounded-lg outline-none focus:border-app-green/50 flex-1"
                    >
                      {stocks.map(s => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol} - {s.name}
                        </option>
                      ))}
                    </select>
                    
                    <button 
                      onClick={() => handleRemoveStock(idx)}
                      className="p-1.5 rounded-lg border border-border-glass hover:bg-app-red/10 hover:text-app-red text-text-muted transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={alloc.weight}
                      onChange={(e) => handleUpdateAllocation(idx, 'weight', e.target.value)}
                      className="accent-app-green flex-1 cursor-pointer h-1 rounded-lg"
                    />
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={alloc.weight}
                        onChange={(e) => handleUpdateAllocation(idx, 'weight', e.target.value)}
                        className="bg-surface-lowest border border-border-glass text-white text-xs font-mono font-bold text-center w-12 py-0.5 rounded-lg outline-none focus:border-app-green/50"
                      />
                      <span className="text-xs text-text-muted font-mono">%</span>
                    </div>
                  </div>
                </div>
              ))}

              {allocations.length === 0 && (
                <div className="text-center py-6 text-xs text-text-muted flex flex-col gap-2 items-center justify-center border border-dashed border-border-glass rounded-xl">
                  <PieChart className="w-5 h-5 opacity-40" />
                  No stock allocations added.
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                onClick={handleAddStock}
                disabled={allocations.length >= 6}
                className="py-2 rounded-xl border border-border-glass hover:bg-white/5 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Asset
              </button>
              <button
                onClick={handleAutoRebalance}
                className="py-2 rounded-xl border border-border-glass hover:bg-white/5 text-text-secondary text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Equal Weight
              </button>
            </div>

            <div className="pt-4 border-t border-border-glass flex flex-col gap-3">
              {/* Settings parameters */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-semibold">Time Horizon</span>
                <div className="flex rounded-lg border border-border-glass overflow-hidden">
                  {(['1M', '3M', '6M', '1Y'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 text-[10px] font-bold font-mono transition-colors ${
                        timeframe === tf 
                          ? 'bg-[#00FF94]/15 text-[#00FF94] border-r border-border-glass last:border-0' 
                          : 'bg-transparent text-text-muted hover:text-white border-r border-border-glass last:border-0'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted font-semibold">Initial Balance</span>
                <input 
                  type="number"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(Math.max(1000, Number(e.target.value) || 1000))}
                  className="bg-surface-lowest border border-border-glass text-white text-xs font-mono font-bold text-right px-2 py-1 rounded-lg outline-none focus:border-app-green/50 w-24"
                />
              </div>

              {totalWeight !== 100 && (
                <div className="p-3 bg-app-red/10 border border-app-red/25 rounded-xl flex gap-2 items-start text-app-red">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed">
                    Allocations sum to <b>{totalWeight}%</b>. Adjust weights to exactly <b>100%</b> before running simulated backtest indexes.
                  </p>
                </div>
              )}

              <button
                onClick={handleRunBacktest}
                disabled={totalWeight !== 100 || isSimulating}
                className="w-full py-2.5 rounded-xl bg-app-green hover:bg-app-green-hover text-black font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-glow-green disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Simulating Monte Carlo Vectors...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-black" />
                    RUN BACKTEST SIMULATION
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Output Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card border border-border-glass rounded-2xl p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-border-glass pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-app-green" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cumulative Performance Chart</h3>
              </div>

              {results && (
                <div className="flex items-center gap-4 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-app-green" />
                    <span className="text-white font-bold">Custom Portfolio ({results.totalReturn >= 0 ? '+' : ''}{results.totalReturn}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-0.5 bg-white/40 border-t border-dashed" />
                    <span className="text-text-muted">S&P 500 Benchmark ({results.benchmarkTotalReturn >= 0 ? '+' : ''}{results.benchmarkTotalReturn}%)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Performance line chart */}
            <div ref={chartContainerRef} className="w-full flex justify-center py-2 relative">
              {results ? plotChart() : (
                <div className="h-[280px] w-full flex flex-col gap-2 items-center justify-center text-text-muted text-xs font-mono">
                  <RefreshCw className="w-6 h-6 animate-spin text-app-green opacity-40 mb-1" />
                  Generating statistical matrices...
                </div>
              )}
            </div>

            {/* Statistics comparison grid */}
            {results && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 border-t border-border-glass pt-5">
                <div className="surface-low border border-border-glass rounded-xl p-3.5 flex flex-col justify-between gap-3 text-left">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider leading-none mb-1 block">
                      Cumulative Return
                    </span>
                    <p className="text-lg font-black text-white leading-tight font-mono">
                      ${results.finalValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/5">
                    <span className="text-[#00FF94] font-bold">+{results.totalReturn}%</span>
                    <span className="text-text-muted">SPY: +{results.benchmarkTotalReturn}%</span>
                  </div>
                </div>

                <div className="surface-low border border-border-glass rounded-xl p-3.5 flex flex-col justify-between gap-3 text-left">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider leading-none mb-1 block">
                      Annualized Volatility
                    </span>
                    <p className="text-lg font-black text-white leading-tight font-mono">
                      {results.volatility}%
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/5">
                    <span className={results.volatility <= results.benchmarkVolatility ? 'text-[#00FF94]' : 'text-orange-400'}>
                      {results.volatility <= results.benchmarkVolatility ? 'Lower Vol' : 'Higher Vol'}
                    </span>
                    <span className="text-text-muted">SPY: {results.benchmarkVolatility}%</span>
                  </div>
                </div>

                <div className="surface-low border border-border-glass rounded-xl p-3.5 flex flex-col justify-between gap-3 text-left">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider leading-none mb-1 block">
                      Sharpe Ratio (Rf=4.5%)
                    </span>
                    <p className="text-lg font-black text-white leading-tight font-mono">
                      {results.sharpeRatio}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/5">
                    <span className={results.sharpeRatio >= results.benchmarkSharpeRatio ? 'text-[#00FF94]' : 'text-orange-400'}>
                      {results.sharpeRatio >= results.benchmarkSharpeRatio ? 'Outperforming' : 'Underperforming'}
                    </span>
                    <span className="text-text-muted">SPY: {results.benchmarkSharpeRatio}</span>
                  </div>
                </div>

                <div className="surface-low border border-border-glass rounded-xl p-3.5 flex flex-col justify-between gap-3 text-left">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-text-muted tracking-wider leading-none mb-1 block">
                      Maximum Drawdown
                    </span>
                    <p className="text-lg font-black text-app-red leading-tight font-mono">
                      {results.maxDrawdown.toFixed(1)}%
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/5">
                    <span className={Math.abs(results.maxDrawdown) <= Math.abs(results.benchmarkMaxDrawdown) ? 'text-[#00FF94]' : 'text-orange-400'}>
                      {Math.abs(results.maxDrawdown) <= Math.abs(results.benchmarkMaxDrawdown) ? 'Better Buffer' : 'More Drawdown'}
                    </span>
                    <span className="text-text-muted">SPY: {results.benchmarkMaxDrawdown.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Presets Selection */}
          <div className="glass-card border border-border-glass rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-app-green" />
              Standard Backtesting Presets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESETS.map((preset, i) => (
                <div 
                  key={i} 
                  onClick={() => handleApplyPreset(preset)}
                  className="surface-low border border-border-glass rounded-xl p-3.5 flex flex-col justify-between gap-3 hover:border-[#00FF94]/30 hover:bg-[#00FF94]/5 transition-all cursor-pointer group text-left"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-app-green transition-colors">{preset.name}</h4>
                    <p className="text-[10px] text-text-muted mt-1 leading-relaxed">{preset.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {preset.allocations.map((a, idx) => (
                      <span key={idx} className="text-[9px] font-mono font-bold bg-white/5 border border-border-glass px-1.5 py-0.5 rounded text-white">
                        {a.symbol}: {a.weight}%
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacktestPage;
