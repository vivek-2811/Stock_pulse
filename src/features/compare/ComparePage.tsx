import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { mockDataEngine } from '../../services/mockDataEngine';
import type { Stock, CandlestickData } from '../../services/mockDataEngine';
import { Search, Scale, X, HelpCircle, Activity, Download, Clipboard, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScoreEngine } from '../../services/ScoreEngine';
import { IntelligenceEngine } from '../../services/IntelligenceEngine';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { CorrelationMatrix } from './CorrelationMatrix';
import { ComparisonVerdict } from './ComparisonVerdict';

// Chart.js components
import { Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

export const ComparePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { holdings } = usePortfolioStore();

  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [benchmark, setBenchmark] = useState<'NONE' | 'SPY' | 'QQQ' | 'DIA'>('NONE');
  const [chartMode, setChartMode] = useState<'RELATIVE' | 'PRICE'>('RELATIVE');
  const [exportedStatus, setExportedStatus] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Subscribe to real-time prices
  useEffect(() => {
    const unsubscribe = mockDataEngine.subscribe(({ stocks }) => {
      setAllStocks([...stocks]);
    });
    return unsubscribe;
  }, []);

  // Parse symbols from URL search parameters on mount
  useEffect(() => {
    const symbolsParam = searchParams.get('symbols');
    const symbolParam = searchParams.get('symbol'); // single compare request
    
    if (symbolsParam) {
      setSelectedSymbols(symbolsParam.split(',').slice(0, 4));
    } else if (symbolParam) {
      setSelectedSymbols([symbolParam, 'MSFT']); // compare with default Microsoft
    } else {
      setSelectedSymbols(['AAPL', 'MSFT']); // default comparison
    }
  }, [searchParams]);

  // Sync symbols back to URL search params
  const updateUrlParams = (symbols: string[]) => {
    if (symbols.length === 0) {
      searchParams.delete('symbols');
    } else {
      searchParams.set('symbols', symbols.join(','));
    }
    setSearchParams(searchParams);
  };

  const handleAddStock = (symbol: string) => {
    if (selectedSymbols.includes(symbol)) return;
    if (selectedSymbols.length >= 4) {
      alert("You can compare a maximum of 4 stocks simultaneously.");
      return;
    }
    const updated = [...selectedSymbols, symbol];
    setSelectedSymbols(updated);
    updateUrlParams(updated);
    setSearchQuery('');
    setDropdownOpen(false);
  };

  const handleRemoveStock = (symbol: string) => {
    const updated = selectedSymbols.filter(s => s !== symbol);
    setSelectedSymbols(updated);
    updateUrlParams(updated);
  };

  // Get active stock objects
  const activeStocks = useMemo(() => {
    return selectedSymbols
      .map(sym => allStocks.find(s => s.symbol === sym))
      .filter((s): s is Stock => s !== undefined);
  }, [selectedSymbols, allStocks]);

  // Fetch 1-month historical data for each selected stock
  const { data: comparisonHistoryData, isLoading } = useQuery<{ [key: string]: CandlestickData[] }>({
    queryKey: ['compareHistory', selectedSymbols],
    queryFn: async () => {
      const results: { [key: string]: CandlestickData[] } = {};
      for (const sym of selectedSymbols) {
        results[sym] = mockDataEngine.getHistoricalData(sym, '1M');
      }
      return results;
    },
    enabled: selectedSymbols.length > 0,
  });

  const availableDropdownStocks = allStocks.filter(
    s => 
      !selectedSymbols.includes(s.symbol) &&
      (s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  // Compute all scores and verdicts
  const comparisons = useMemo(() => {
    if (activeStocks.length === 0) return null;
    return activeStocks.map(s => {
      const oppScore = ScoreEngine.computeOpportunityScore(s);
      const factors = ScoreEngine.computeFactorScores(s);
      const fitScore = ScoreEngine.computePortfolioFit(s.symbol, holdings, allStocks);
      return { stock: s, oppScore, factors, fitScore };
    });
  }, [activeStocks, holdings, allStocks]);

  // Leaders
  const leaders = useMemo(() => {
    if (!comparisons || comparisons.length === 0) return null;
    const bestOverall = comparisons.reduce((a, b) => a.oppScore > b.oppScore ? a : b).stock.symbol;
    const bestValue = comparisons.reduce((a, b) => a.factors.value > b.factors.value ? a : b).stock.symbol;
    const lowestRisk = comparisons.reduce((a, b) => a.factors.safety > b.factors.safety ? a : b).stock.symbol;
    const bestGrowth = comparisons.reduce((a, b) => a.factors.growth > b.factors.growth ? a : b).stock.symbol;
    const bestMomentum = comparisons.reduce((a, b) => a.factors.momentum > b.factors.momentum ? a : b).stock.symbol;
    return { bestOverall, bestValue, lowestRisk, bestGrowth, bestMomentum };
  }, [comparisons]);

  // Market Scenario Simulation
  const scenarios = useMemo(() => {
    return IntelligenceEngine.computeScenarioAnalysis(activeStocks, 'Neutral');
  }, [activeStocks]);

  // Generate date/price datasets for Chart
  const lineData = useMemo(() => {
    if (!comparisonHistoryData || isLoading || activeStocks.length === 0) {
      return { labels: [], datasets: [] };
    }

    const firstSym = selectedSymbols[0];
    const firstHistory = comparisonHistoryData[firstSym] || [];
    const dates = firstHistory.map(d => {
      const date = new Date(d.time * 1000);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    });

    const chartColors = [
      '#0ea5e9', '#10b981', '#6366f1', '#f59e0b'
    ];

    const datasets: any[] = activeStocks.map((stock, idx) => {
      const history = comparisonHistoryData[stock.symbol] || [];
      if (history.length === 0) return { label: stock.symbol, data: [] };
      
      const firstClose = history[0].close || 1;
      const dataPoints = history.map(d => {
        if (chartMode === 'RELATIVE') {
          return Number((((d.close - firstClose) / firstClose) * 100).toFixed(2));
        } else {
          return d.close;
        }
      });

      return {
        label: stock.symbol,
        data: dataPoints,
        borderColor: chartColors[idx % chartColors.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.15
      };
    });

    // Handle Benchmarks (SPY, QQQ, DIA)
    if (benchmark !== 'NONE') {
      const dummyBenchmarkData = dates.map((_, i) => {
        const factor = benchmark === 'SPY' ? 0.08 : benchmark === 'QQQ' ? 0.12 : 0.05;
        const trend = (i / dates.length) * factor * 100;
        if (chartMode === 'RELATIVE') {
          return Number((trend + Math.sin(i * 0.4) * 1.5).toFixed(2));
        } else {
          return Number((100 + trend + Math.sin(i * 0.4) * 2).toFixed(2));
        }
      });

      datasets.push({
        label: `${benchmark} (Bench)`,
        data: dummyBenchmarkData,
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 3,
        borderDash: [5, 5],
        tension: 0.1
      });
    }

    return { labels: dates, datasets };
  }, [comparisonHistoryData, isLoading, activeStocks, selectedSymbols, chartMode, benchmark]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#8A8F98', font: { family: 'Inter', size: 10 } }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const val = context.raw;
            return ` ${context.dataset.label}: ${chartMode === 'RELATIVE' ? (val >= 0 ? '+' : '') + val + '%' : '$' + val}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8A8F98', font: { family: 'Inter', size: 9 }, maxRotation: 0 }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { 
          color: '#8A8F98', 
          font: { family: 'Inter', size: 9 },
          callback: (value: any) => chartMode === 'RELATIVE' ? `${value >= 0 ? '+' : ''}${value}%` : `$${value}`
        }
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeStocks.length === 0) return;
    let csv = 'Factor,';
    csv += activeStocks.map(s => s.symbol).join(',') + '\n';
    
    const rows = [
      ['Price', activeStocks.map(s => s.price.toFixed(2))],
      ['Daily Change %', activeStocks.map(s => s.changePercent.toFixed(2) + '%')],
      ['Market Cap ($B)', activeStocks.map(s => (s.marketCap / 1e9).toFixed(1))],
      ['P/E Ratio', activeStocks.map(s => s.peRatio)],
      ['Beta', activeStocks.map(s => s.beta)],
      ['Opportunity Score', comparisons?.map(c => c.oppScore) || []],
      ['Portfolio Fit', comparisons?.map(c => c.fitScore) || []]
    ];

    rows.forEach(r => {
      csv += r[0] + ',' + (r[1] as any[]).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StockPulse_Comparison_${selectedSymbols.join('_')}.csv`;
    a.click();

    setExportedStatus(true);
    setTimeout(() => setExportedStatus(false), 2000);
  };

  // Copy Summary
  const handleCopySummary = () => {
    if (!leaders) return;
    const txt = `StockPulse Comparison Summary:\nOverall Winner: ${leaders.bestOverall}\nBest Growth: ${leaders.bestGrowth}\nBest Value: ${leaders.bestValue}\nLowest Risk: ${leaders.lowestRisk}\n\nCompared symbols: ${selectedSymbols.join(', ')}`;
    navigator.clipboard.writeText(txt);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const getFitColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* 1. Sticky Comparison Snapshot Header (P0 Upgrade 1) */}
      {leaders && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 p-3 rounded-xl border border-border-glass bg-[#10141a]/90 backdrop-blur-xl flex flex-wrap gap-x-6 gap-y-2 justify-between items-center text-xs shadow-md"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-app-green font-mono uppercase">Snapshot Leaders:</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 font-mono text-[10.5px]">
            <span>🏆 Best Overall: <strong className="text-white">{leaders.bestOverall}</strong></span>
            <span>🏆 Best Value: <strong className="text-emerald-400">{leaders.bestValue}</strong></span>
            <span>🏆 Best Growth: <strong className="text-amber-400">{leaders.bestGrowth}</strong></span>
            <span>🏆 Lowest Risk: <strong className="text-blue-400">{leaders.lowestRisk}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => navigate(`/copilot?prompt=Compare ${selectedSymbols.join(' vs ')}`)}
              className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 font-bold transition-all text-[10px]"
            >
              Analyze in Copilot
            </button>
          </div>
        </motion.div>
      )}

      {/* 2. Top Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-glass/40">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Stock Comparison Station
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-app-green/10 border border-app-green/20 text-app-green font-black uppercase tracking-wider font-mono">Pro</span>
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">Compare core valuations, HHI fit ratings, correlation heatmaps, and scenarios.</p>
        </div>

        {/* Multi-Stock Search */}
        <div className="relative w-full sm:w-72">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-glass bg-transparent text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500 text-white"
              placeholder="Add stock to compare..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
            />
          </div>

          <AnimatePresence>
            {dropdownOpen && searchQuery && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 mt-1.5 rounded-xl glass-panel border border-border-glass shadow-xl p-1.5 z-40 max-h-56 overflow-y-auto bg-surface-lowest"
                >
                  {availableDropdownStocks.length > 0 ? (
                    availableDropdownStocks.map(stock => (
                      <div
                        key={stock.symbol}
                        onClick={() => handleAddStock(stock.symbol)}
                        className="flex justify-between items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors text-xs font-semibold"
                      >
                        <div>
                          <span className="text-white w-12 block sm:inline">{stock.symbol}</span>
                          <span className="text-text-muted font-normal truncate sm:ml-2">{stock.name}</span>
                        </div>
                        <span className="text-text-muted font-mono">${stock.price.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-3 text-center text-xs text-text-muted">
                      No matching stocks available
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Selected Tags Row & Export tools */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {activeStocks.map((stock, idx) => (
            <span
              key={stock.symbol}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-[#10141a]/60 border-border-glass text-white"
            >
              <span>{stock.symbol}</span>
              <span className="text-text-muted font-medium">({stock.name})</span>
              <button
                onClick={() => handleRemoveStock(stock.symbol)}
                className="p-0.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>

        {activeStocks.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-white/5 text-text-secondary hover:text-white text-xs font-bold transition-all"
            >
              <Clipboard className="w-3.5 h-3.5" />
              {copiedStatus ? 'Copied ✓' : 'Copy Summary'}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-white/5 text-text-secondary hover:text-white text-xs font-bold transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              {exportedStatus ? 'Exported ✓' : 'Export CSV'}
            </button>
          </div>
        )}
      </div>

      {/* 4. Head-to-Head Scorecard Section */}
      {comparisons && comparisons.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparisons.map((c, idx) => (
            <div key={idx} className="glass-card rounded-2xl p-4 border border-border-glass bg-white/[0.01]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-base font-bold font-mono text-white">{c.stock.symbol}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono`}>
                  Scorecard: {c.oppScore}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-text-secondary">
                <div className="flex justify-between">
                  <span>Portfolio Fit:</span>
                  <strong className={getFitColor(c.fitScore)}>{c.fitScore}/100</strong>
                </div>
                <div className="flex justify-between">
                  <span>PE Ratio:</span>
                  <strong className="text-white">{c.stock.peRatio.toFixed(1)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Beta:</span>
                  <strong className="text-white">{c.stock.beta.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Metrics Comparison Table with deltas and winners (P0 Upgrade 2 & Winner Badges) */}
      {activeStocks.length > 0 ? (
        <div className="glass-card rounded-2xl overflow-hidden border border-border-glass/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border-glass bg-[#10141a]/60 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3 px-6">Metric Category</th>
                  {activeStocks.map(stock => (
                    <th key={stock.symbol} className="py-3 px-6 text-right text-app-green font-mono">
                      {stock.symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-glass/40 font-mono text-xs">
                {/* 1. Price */}
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-3 px-6 font-semibold font-sans text-text-muted">Live Price</td>
                  {activeStocks.map(stock => (
                    <td key={stock.symbol} className="py-3 px-6 text-right font-semibold text-white">
                      ${stock.price.toFixed(2)}
                    </td>
                  ))}
                </tr>
                {/* 2. Daily Change */}
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-3 px-6 font-semibold font-sans text-text-muted">Daily Change</td>
                  {activeStocks.map(stock => {
                    const pos = stock.changePercent >= 0;
                    const isWin = leaders && leaders.bestMomentum === stock.symbol;
                    return (
                      <td key={stock.symbol} className={`py-3 px-6 text-right font-semibold ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isWin && <span className="text-[9px] mr-1 px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 font-sans">🏆 Top Momentum</span>}
                        {pos ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </td>
                    );
                  })}
                </tr>
                {/* 3. Market Cap */}
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-3 px-6 font-semibold font-sans text-text-muted">Market Capitalization</td>
                  {activeStocks.map(stock => {
                    // Compute delta vs average Cap
                    const avgCap = activeStocks.reduce((sum, s) => sum + s.marketCap, 0) / activeStocks.length;
                    const delta = ((stock.marketCap - avgCap) / avgCap) * 100;
                    return (
                      <td key={stock.symbol} className="py-3 px-6 text-right text-white">
                        <span>${(stock.marketCap / 1e9).toFixed(1)}B</span>
                        {activeStocks.length > 1 && (
                          <span className={`text-[9px] ml-1.5 ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ({delta >= 0 ? '+' : ''}{delta.toFixed(0)}% vs avg)
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                {/* 4. PE Ratio */}
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-3 px-6 font-semibold font-sans text-text-muted">P/E Ratio</td>
                  {activeStocks.map(stock => {
                    const isWin = leaders && leaders.bestValue === stock.symbol;
                    return (
                      <td key={stock.symbol} className="py-3 px-6 text-right text-white">
                        {isWin && <span className="text-[9px] mr-1 px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 font-sans">🏆 Lowest P/E</span>}
                        <span>{stock.peRatio.toFixed(1)}</span>
                      </td>
                    );
                  })}
                </tr>
                {/* 5. Beta */}
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-3 px-6 font-semibold font-sans text-text-muted">Beta (Sensitivity)</td>
                  {activeStocks.map(stock => {
                    const isWin = leaders && leaders.lowestRisk === stock.symbol;
                    return (
                      <td key={stock.symbol} className="py-3 px-6 text-right text-white">
                        {isWin && <span className="text-[9px] mr-1 px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20 font-sans">🏆 Lowest Risk</span>}
                        <span>{stock.beta.toFixed(2)}</span>
                      </td>
                    );
                  })}
                </tr>
                {/* 6. Diversification contribution (Portfolio Fit) */}
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-3 px-6 font-semibold font-sans text-text-muted">Portfolio Fit Contribution</td>
                  {comparisons?.map(c => (
                    <td key={c.stock.symbol} className={`py-3 px-6 text-right font-bold ${getFitColor(c.fitScore)}`}>
                      {c.fitScore}/100
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted border border-dashed border-border-glass flex flex-col justify-center items-center">
          <Scale className="w-10 h-10 text-border-glass mb-2 animate-pulse" />
          <p className="text-sm font-semibold">Stock comparison is empty</p>
          <p className="text-xs text-text-secondary mt-1">Search and select stocks above to map valuations and delta metrics.</p>
        </div>
      )}

      {/* 6. Visualizations Heatmap, Verdict and Historical Chart */}
      {activeStocks.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance chart with benchmark overlays */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col min-h-[340px] border border-border-glass bg-white/[0.01]">
            <div className="pb-3 mb-4 border-b border-border-glass/40 flex flex-wrap justify-between items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-sky-500 animate-pulse" /> Performance Comparison
              </h2>
              
              {/* Controls */}
              <div className="flex items-center gap-3 text-[10px]">
                {/* Benchmark overlay */}
                <div className="flex items-center gap-1.5">
                  <span className="text-text-muted font-bold font-mono uppercase">BENCHMARK:</span>
                  <select
                    value={benchmark}
                    onChange={(e) => setBenchmark(e.target.value as any)}
                    className="bg-[#10141a] border border-border-glass rounded px-2 py-0.5 text-white outline-none focus:border-app-green/50"
                  >
                    <option value="NONE">None</option>
                    <option value="SPY">SPY (S&P 500)</option>
                    <option value="QQQ">QQQ (Nasdaq 100)</option>
                    <option value="DIA">DIA (Dow 30)</option>
                  </select>
                </div>

                {/* Relative vs price mode */}
                <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded border border-white/5">
                  <button
                    onClick={() => setChartMode('RELATIVE')}
                    className={`px-2 py-0.5 rounded ${chartMode === 'RELATIVE' ? 'bg-[#0E1218] text-app-green' : 'text-text-muted'}`}
                  >
                    % Rel
                  </button>
                  <button
                    onClick={() => setChartMode('PRICE')}
                    className={`px-2 py-0.5 rounded ${chartMode === 'PRICE' ? 'bg-[#0E1218] text-app-green' : 'text-text-muted'}`}
                  >
                    $ Price
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 relative min-h-[220px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-xs text-text-muted">Loading historical data...</div>
              ) : (
                <Line data={lineData} options={lineOptions} />
              )}
            </div>
          </div>

          {/* Factor radar chart */}
          <div className="glass-card rounded-2xl p-6 flex flex-col min-h-[340px] border border-border-glass bg-white/[0.01]">
            <div className="pb-3 mb-4 border-b border-border-glass/40">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-500" /> Factor Analytics Comparison
              </h2>
            </div>
            <div className="flex-1 relative min-h-[220px]">
              <Radar
                data={{
                  labels: ['Value', 'Growth', 'Safety', 'Momentum', 'Leadership'],
                  datasets: activeStocks.map((stock, idx) => {
                    const sc = ScoreEngine.computeFactorScores(stock);
                    const colors = [
                      { border: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.08)' },
                      { border: '#10b981', bg: 'rgba(16, 185, 129, 0.08)' },
                      { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)' },
                      { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)' }
                    ];
                    const color = colors[idx % colors.length];
                    return {
                      label: stock.symbol,
                      data: [sc.value, sc.growth, sc.safety, sc.momentum, sc.leadership],
                      backgroundColor: color.bg,
                      borderColor: color.border,
                      borderWidth: 1.5,
                      pointBackgroundColor: color.border,
                      pointHoverRadius: 4
                    };
                  })
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: '#8A8F98', font: { size: 9 } } }
                  },
                  scales: {
                    r: {
                      angleLines: { color: 'rgba(255,255,255,0.04)' },
                      grid: { color: 'rgba(255,255,255,0.04)' },
                      pointLabels: { color: '#8A8F98', font: { size: 9, weight: 'bold' } },
                      ticks: { display: false },
                      min: 0,
                      max: 100
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. Heatmap and Verdicts cards row */}
      {activeStocks.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ComparisonVerdict stocks={activeStocks} />
          </div>
          <div>
            <CorrelationMatrix symbols={selectedSymbols} historyData={comparisonHistoryData} />
          </div>
        </div>
      )}

      {/* 8. Scenario Analysis Simulation Section (Bull / Bear / Neutral targets) */}
      {activeStocks.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-border-glass bg-white/[0.01]">
          <div className="pb-3 border-b border-border-glass/40 mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-app-green animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Scenario Analysis (Expected Performance)</h3>
            </div>
            <span className="text-[10px] text-text-muted font-mono">Calculated using IntelligenceEngine beta simulation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Bull Market Scenario</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">+{scenarios.bullReturn}%</span>
              <p className="text-[10px] text-text-muted mt-1.5">Expected set returns if market increases +5.0% under active momentum.</p>
            </div>

            <div className="p-4 rounded-xl border border-border-glass/80 bg-white/[0.02]">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Neutral Market Scenario</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">+{scenarios.neutralReturn}%</span>
              <p className="text-[10px] text-text-muted mt-1.5">Expected returns if market trends horizontal (+1.5%).</p>
            </div>

            <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5">
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Risk-Off Market Scenario</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">{scenarios.bearReturn}%</span>
              <p className="text-[10px] text-text-muted mt-1.5">Expected drawdown boundary if market declines -6.0%.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ComparePage;
