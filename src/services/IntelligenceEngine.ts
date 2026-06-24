import type { Stock } from './mockDataEngine';

export interface MarketMetrics {
  regime: 'Risk-On' | 'Risk-Off' | 'Neutral';
  fearGreed: number;
  fearGreedLabel: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  breadthPct: number;
  advancingCount: number;
  decliningCount: number;
  averageMarketChange: number;
}

export interface SectorPerf {
  sector: string;
  averageChange: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

export interface ScenarioReturns {
  bullReturn: number;
  neutralReturn: number;
  bearReturn: number;
}

export const IntelligenceEngine = {
  /**
   * Computes broad market statistics and Fear & Greed levels
   */
  computeMarketMetrics(stocks: Stock[]): MarketMetrics {
    if (!stocks || stocks.length === 0) {
      return {
        regime: 'Neutral',
        fearGreed: 50,
        fearGreedLabel: 'Neutral',
        breadthPct: 0,
        advancingCount: 0,
        decliningCount: 0,
        averageMarketChange: 0
      };
    }

    const advancingCount = stocks.filter(s => s.changePercent > 0).length;
    const decliningCount = stocks.filter(s => s.changePercent < 0).length;
    const breadthPct = Math.round((advancingCount / stocks.length) * 100);
    const averageMarketChange = stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length;

    const regime = breadthPct > 55 ? 'Risk-On' : breadthPct < 45 ? 'Risk-Off' : 'Neutral';

    // Compute synthetic Fear & Greed score (0 to 100)
    // Weighted between market breadth (60%) and price change trend (40%)
    const trendFactor = Math.max(0, Math.min(100, ((averageMarketChange + 3) / 6) * 100));
    const fearGreed = Math.round((breadthPct * 0.6) + (trendFactor * 0.4));

    const fearGreedLabel =
      fearGreed >= 75 ? 'Extreme Greed' :
      fearGreed >= 55 ? 'Greed' :
      fearGreed >= 45 ? 'Neutral' :
      fearGreed >= 25 ? 'Fear' : 'Extreme Fear';

    return {
      regime,
      fearGreed,
      fearGreedLabel,
      breadthPct,
      advancingCount,
      decliningCount,
      averageMarketChange
    };
  },

  /**
   * Evaluates performance and sentiment of all sectors
   */
  computeSectorRotation(stocks: Stock[]): SectorPerf[] {
    if (!stocks || stocks.length === 0) return [];

    const sectorGroups: Record<string, number[]> = {};
    stocks.forEach(s => {
      if (!sectorGroups[s.sector]) sectorGroups[s.sector] = [];
      sectorGroups[s.sector].push(s.changePercent);
    });

    return Object.entries(sectorGroups).map(([sector, changes]) => {
      const averageChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      const sentiment = (averageChange > 0.4 ? 'Bullish' : averageChange < -0.4 ? 'Bearish' : 'Neutral') as 'Bullish' | 'Bearish' | 'Neutral';
      return { sector, averageChange, sentiment };
    }).sort((a, b) => b.averageChange - a.averageChange);
  },

  /**
   * Runs a scenario analysis for a list of stocks
   * Simulates expected returns under different market conditions
   */
  computeScenarioAnalysis(selectedStocks: Stock[], marketRegime: 'Risk-On' | 'Risk-Off' | 'Neutral'): ScenarioReturns {
    if (selectedStocks.length === 0) return { bullReturn: 0, neutralReturn: 0, bearReturn: 0 };

    // Bull Market simulation: base 5% market rise, beta amplified
    // Neutral Market simulation: base 1.5% market rise, stock changes scaled
    // Bear Market simulation: base -6% market decline, beta amplified
    let avgBull = 0;
    let avgNeutral = 0;
    let avgBear = 0;

    selectedStocks.forEach(s => {
      const beta = s.beta ?? 1.0;
      const opportunityBonus = s.changePercent > 0 ? 0.02 : -0.01; // active stock factor

      // Bull: market returns +4% to +8% based on regime
      const baseBull = marketRegime === 'Risk-On' ? 7.5 : 5.0;
      avgBull += (baseBull * beta) + (opportunityBonus * 100);

      // Neutral
      avgNeutral += (1.5 * beta) + (s.changePercent * 0.4);

      // Bear: market returns -5% to -8%
      const baseBear = marketRegime === 'Risk-Off' ? -8.0 : -6.0;
      avgBear += (baseBear * beta);
    });

    return {
      bullReturn: Number((avgBull / selectedStocks.length).toFixed(2)),
      neutralReturn: Number((avgNeutral / selectedStocks.length).toFixed(2)),
      bearReturn: Number((avgBear / selectedStocks.length).toFixed(2))
    };
  }
};
