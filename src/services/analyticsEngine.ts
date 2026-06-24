import { mockDataEngine } from './mockDataEngine';
import type { CandlestickData } from './mockDataEngine';

export interface BacktestResult {
  dates: string[];
  portfolioReturns: number[]; // cumulative % return
  benchmarkReturns: number[]; // S&P 500 cumulative % return
  metrics: {
    portfolioFinalReturn: number;
    benchmarkFinalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
    alpha: number;
    beta: number;
  };
}

class AnalyticsEngine {
  // Standard deviation calculation
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  // Calculate Sharpe Ratio: (Annualized Return - Risk Free Rate) / Annualized Volatility
  public calculateSharpeRatio(returns: number[], riskFreeRate = 4.5): number {
    if (returns.length < 2) return 0;
    
    // Convert cumulative value stream to period returns
    const periodReturns: number[] = [];
    for (let i = 1; i < returns.length; i++) {
      const prev = returns[i - 1] === 0 ? 1 : returns[i - 1];
      periodReturns.push((returns[i] - returns[i - 1]) / prev);
    }

    const avgReturn = periodReturns.reduce((sum, r) => sum + r, 0) / periodReturns.length;
    const stdDev = this.calculateStdDev(periodReturns);

    if (stdDev === 0) return 0;

    // Annualize (assuming daily data for 252 trading days)
    const annualizedReturn = avgReturn * 252 * 100;
    const annualizedVol = stdDev * Math.sqrt(252) * 100;

    return Number(((annualizedReturn - riskFreeRate) / Math.max(0.1, annualizedVol)).toFixed(2));
  }

  // Backtests a custom allocation map over 6 months (180 days)
  public runBacktest(
    allocations: { [symbol: string]: number }, // e.g. { AAPL: 40, MSFT: 60 } (weights sum up to 100)
    timeframe: '1M' | '3M' | '6M' = '6M',
    benchmarkType: 'SP500' | 'NASDAQ' | 'NONE' = 'SP500'
  ): BacktestResult {
    const symbols = Object.keys(allocations);
    const weights = Object.values(allocations);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    // Normalize weights to sum up to 1.0
    const normalizedWeights = symbols.reduce((acc, sym) => {
      acc[sym] = allocations[sym] / (totalWeight || 1);
      return acc;
    }, {} as { [symbol: string]: number });

    // Get historical data for stocks
    const historicalStockData: { [symbol: string]: CandlestickData[] } = {};
    symbols.forEach(sym => {
      // simulate 1M, 3M, 6M based on timeframe
      historicalStockData[sym] = mockDataEngine.getHistoricalData(sym, timeframe === '6M' ? '1Y' : timeframe).slice(-130); // ~6 months of daily ticks
    });

    // Get Benchmark index historical data
    const benchmarkSymbol = benchmarkType === 'NASDAQ' ? 'NASDAQ' : 'S&P 500';
    const benchmarkData = mockDataEngine.getHistoricalData(benchmarkSymbol, timeframe === '6M' ? '1Y' : timeframe).slice(-130);

    const dates: string[] = [];
    const portfolioReturns: number[] = [];
    const benchmarkReturns: number[] = [];

    // Ticks count
    const minLength = Math.min(
      ...symbols.map(sym => historicalStockData[sym]?.length || 0),
      benchmarkData.length
    );

    if (minLength === 0) {
      return {
        dates: [],
        portfolioReturns: [],
        benchmarkReturns: [],
        metrics: { portfolioFinalReturn: 0, benchmarkFinalReturn: 0, sharpeRatio: 0, maxDrawdown: 0, volatility: 0, alpha: 0, beta: 1 }
      };
    }

    // Seed prices
    const seedStockPrices = symbols.reduce((acc, sym) => {
      acc[sym] = historicalStockData[sym][0].close;
      return acc;
    }, {} as { [symbol: string]: number });

    const seedBenchmarkPrice = benchmarkData[0].close;

    // Daily percentage changes list for Sharpe calculation
    const dailyPortfolioReturns: number[] = [];

    let prevPortfolioValue = 100;

    for (let t = 0; t < minLength; t++) {
      // Calculate date label
      const rawDate = new Date(benchmarkData[t].time * 1000);
      dates.push(rawDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }));

      // Calculate benchmark return rate
      const benchPrice = benchmarkData[t].close;
      const benchPct = ((benchPrice - seedBenchmarkPrice) / seedBenchmarkPrice) * 100;
      benchmarkReturns.push(Number(benchPct.toFixed(2)));

      // Calculate weighted portfolio return rate
      let portfolioPct = 0;
      symbols.forEach(sym => {
        const p = historicalStockData[sym][t].close;
        const pSeed = seedStockPrices[sym] || 1;
        const stockPct = (p - pSeed) / pSeed;
        portfolioPct += stockPct * normalizedWeights[sym];
      });

      const currentPortfolioVal = 100 * (1 + portfolioPct);
      portfolioReturns.push(Number((portfolioPct * 100).toFixed(2)));
      
      // Calculate daily returns
      if (t > 0) {
        dailyPortfolioReturns.push((currentPortfolioVal - prevPortfolioValue) / prevPortfolioValue);
      }
      prevPortfolioValue = currentPortfolioVal;
    }

    // Calculate maximum drawdown
    let peak = -Infinity;
    let maxDd = 0;
    portfolioReturns.forEach(ret => {
      const val = 100 + ret;
      if (val > peak) peak = val;
      const dd = ((peak - val) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    });

    // Calculate Portfolio Beta
    // Get live stock metadata to find individual beta values
    const allStocks = mockDataEngine.getStocks();
    let portfolioBeta = 0;
    symbols.forEach(sym => {
      const stockMeta = allStocks.find(s => s.symbol === sym);
      const beta = stockMeta ? (stockMeta.beta !== undefined ? stockMeta.beta : 1.0) : 1.0;
      portfolioBeta += beta * normalizedWeights[sym];
    });

    // Calculate annualized metrics
    const finalReturn = portfolioReturns[portfolioReturns.length - 1];
    const benchFinalReturn = benchmarkReturns[benchmarkReturns.length - 1];
    const dailyVolatility = this.calculateStdDev(dailyPortfolioReturns);
    const annualizedVol = dailyVolatility * Math.sqrt(252) * 100;
    
    // Sharpe Ratio
    const riskFreeRate = 4.5;
    const sharpe = annualizedVol === 0 ? 0 : (finalReturn - riskFreeRate) / Math.max(1, annualizedVol);

    // Alpha = Rp - [Rf + Beta * (Rm - Rf)]
    const alpha = finalReturn - (riskFreeRate + portfolioBeta * (benchFinalReturn - riskFreeRate));

    return {
      dates,
      portfolioReturns,
      benchmarkReturns,
      metrics: {
        portfolioFinalReturn: Number(finalReturn.toFixed(2)),
        benchmarkFinalReturn: Number(benchFinalReturn.toFixed(2)),
        sharpeRatio: Number(sharpe.toFixed(2)),
        maxDrawdown: Number(maxDd.toFixed(2)),
        volatility: Number(annualizedVol.toFixed(2)),
        alpha: Number(alpha.toFixed(2)),
        beta: Number(portfolioBeta.toFixed(2))
      }
    };
  }
}

export const analyticsEngine = new AnalyticsEngine();
export default analyticsEngine;
