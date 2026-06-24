import type { Stock } from './mockDataEngine';
import type { Holding } from '../store/usePortfolioStore';

export interface FactorScores {
  value: number;
  growth: number;
  safety: number;
  momentum: number;
  leadership: number;
}

export const ScoreEngine = {
  /**
   * Opportunity Score for a single stock (0 to 100)
   */
  computeOpportunityScore(stock: Stock): number {
    let score = 0;
    // 1. Momentum (up to 25 pts)
    const momentum = Math.max(-1, Math.min(1, stock.changePercent / 5));
    score += ((momentum + 1) / 2) * 25;

    // 2. Volume (up to 20 pts)
    const volRatio = stock.avgVolume > 0 ? Math.min(stock.volume / stock.avgVolume, 3) : 1;
    score += (volRatio / 3) * 20;

    // 3. 52-Week position (up to 20 pts)
    const range = stock.high52W - stock.low52W;
    const rs = range > 0 ? (stock.price - stock.low52W) / range : 0.5;
    score += Math.max(0, Math.min(1, rs)) * 20;

    // 4. Volatility Beta matching (up to 15 pts)
    const betaDist = Math.abs(stock.beta - 1.15);
    score += stock.beta >= 0.8 && stock.beta <= 1.5 ? 15 : Math.max(0, 15 - betaDist * 10);

    // 5. Market cap stability (up to 20 pts)
    score += stock.marketCap >= 10e9 ? 20 : stock.marketCap >= 2e9 ? 12 : 6;

    return Math.round(Math.max(0, Math.min(100, score)));
  },

  /**
   * Health & Diversification metrics for a portfolio
   */
  computePortfolioHealth(holdings: Holding[], allStocks: Stock[]): {
    healthScore: number;
    diversificationScore: number;
    riskScore: number;
    concentrationScore: number;
    weightedBeta: number;
  } {
    if (!holdings || holdings.length === 0) {
      return { healthScore: 0, diversificationScore: 0, riskScore: 0, concentrationScore: 0, weightedBeta: 0 };
    }

    const stockMap = new Map(allStocks.map(s => [s.symbol, s]));
    const totalValue = holdings.reduce((sum, h) => {
      const price = stockMap.get(h.symbol)?.price ?? h.avgBuyPrice;
      return sum + price * h.quantity;
    }, 0);

    if (totalValue === 0) {
      return { healthScore: 0, diversificationScore: 0, riskScore: 0, concentrationScore: 0, weightedBeta: 0 };
    }

    // 1. Sector Concentration (HHI)
    const sectorAlloc: Record<string, number> = {};
    const holdingWeights: Record<string, number> = {};

    holdings.forEach(h => {
      const stock = stockMap.get(h.symbol);
      const val = (stock?.price ?? h.avgBuyPrice) * h.quantity;
      const weight = val / totalValue;
      holdingWeights[h.symbol] = weight;

      const sector = stock?.sector ?? 'Other';
      sectorAlloc[sector] = (sectorAlloc[sector] || 0) + weight;
    });

    const hhiSectors = Object.values(sectorAlloc).reduce((sum, w) => sum + w * w, 0);
    const diversificationScore = Math.round((1 - hhiSectors) * 100);

    const maxSectorWeight = Math.max(...Object.values(sectorAlloc));
    const concentrationScore = Math.round(Math.max(0, 100 - maxSectorWeight * 100));

    // 2. Weighted Beta
    const weightedBeta = holdings.reduce((sum, h) => {
      const stock = stockMap.get(h.symbol);
      const weight = holdingWeights[h.symbol] ?? 0;
      return sum + (stock?.beta ?? 1.0) * weight;
    }, 0);

    // Risk score (0 to 100, where 100 is extremely high risk)
    const betaRisk = Math.min(100, Math.max(0, (weightedBeta / 2.0) * 100));
    const concentrationRisk = 100 - concentrationScore;
    const riskScore = Math.round((betaRisk * 0.6) + (concentrationRisk * 0.4));

    // 3. Overall Health Score
    // Balanced portfolio rewards diversification, low-to-moderate beta, and positive returns
    const costBasis = holdings.reduce((sum, h) => sum + h.avgBuyPrice * h.quantity, 0);
    const returnPct = costBasis > 0 ? ((totalValue - costBasis) / costBasis) * 100 : 0;
    const returnBonus = Math.min(25, Math.max(0, returnPct * 0.5)); // reward returns up to 50% gain

    const betaPenalty = Math.abs(weightedBeta - 1.15) > 0.4 ? 15 : 0;
    const baseHealth = (diversificationScore * 0.4) + (concentrationScore * 0.4) + (100 - riskScore) * 0.2;
    const healthScore = Math.round(Math.max(0, Math.min(100, baseHealth + returnBonus - betaPenalty)));

    return { healthScore, diversificationScore, riskScore, concentrationScore, weightedBeta };
  },

  /**
   * Determines how well a stock fits into an existing portfolio (0 to 100)
   */
  computePortfolioFit(stockSymbol: string, holdings: Holding[], allStocks: Stock[]): number {
    const stock = allStocks.find(s => s.symbol === stockSymbol);
    if (!stock) return 50; // Average default

    if (holdings.length === 0) return 85; // High fit since it starts the portfolio

    const currentHealth = this.computePortfolioHealth(holdings, allStocks);
    
    // Simulate adding stock to portfolio with a 15% weight
    const simulatedHoldings: Holding[] = [...holdings];
    const existingIndex = simulatedHoldings.findIndex(h => h.symbol === stockSymbol);
    
    if (existingIndex >= 0) {
      // Increase quantity by approx 15% value
      const existing = simulatedHoldings[existingIndex];
      simulatedHoldings[existingIndex] = {
        ...existing,
        quantity: Math.round(existing.quantity * 1.25)
      };
    } else {
      // Add new holding with representative average cost
      simulatedHoldings.push({
        symbol: stockSymbol,
        quantity: 100,
        avgBuyPrice: stock.price,
      });
    }

    const simulatedHealth = this.computePortfolioHealth(simulatedHoldings, allStocks);

    let fitScore = 70; // baseline
    // 1. Reward diversification enhancement
    const divDelta = simulatedHealth.diversificationScore - currentHealth.diversificationScore;
    fitScore += divDelta * 2;

    // 2. Penalty if risk goes too high
    if (simulatedHealth.weightedBeta > 1.4 && simulatedHealth.weightedBeta > currentHealth.weightedBeta) {
      fitScore -= 10;
    }

    // 3. Reward high opportunity stocks
    const opp = this.computeOpportunityScore(stock);
    fitScore += (opp - 50) * 0.2;

    return Math.round(Math.max(10, Math.min(99, fitScore)));
  },

  /**
   * Computes factor scores for comparison matrix
   */
  computeFactorScores(stock: Stock): FactorScores {
    // Value: PE inverted (PE of 10 = score 95, PE of 100 = score 20)
    const value = Math.max(10, Math.min(98, 100 - (stock.peRatio / 2.5)));

    // Growth: based on industry and positive momentum
    let growth = 55;
    if (stock.symbol === 'NVDA') growth = 98;
    else if (stock.symbol === 'MSFT') growth = 85;
    else if (stock.symbol === 'AAPL') growth = 75;
    else if (stock.symbol === 'AMD') growth = 90;
    else if (stock.sector === 'Technology') growth = 80;
    else if (stock.sector === 'Consumer Defensive') growth = 40;
    else if (stock.sector === 'Financial Services') growth = 50;

    // Safety: Inverted beta score (Beta of 0.5 = score 95, Beta of 2.0 = score 25)
    const safety = Math.max(15, Math.min(98, 110 - (stock.beta * 40)));

    // Momentum: Today's change percent relative to typical performance
    const momentum = Math.max(10, Math.min(98, 50 + (stock.changePercent * 10)));

    // Leadership: Composite opportunity and relative sector strength
    const leadership = Math.round((this.computeOpportunityScore(stock) * 0.7) + (stock.changePercent >= 0 ? 25 : 5));

    return { value, growth, safety, momentum, leadership };
  }
};
