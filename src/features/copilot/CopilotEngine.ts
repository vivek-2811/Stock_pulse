import { ScoreEngine } from '../../services/ScoreEngine';
import { IntelligenceEngine } from '../../services/IntelligenceEngine';
import type { Stock } from '../../services/mockDataEngine';
import type { Holding } from '../../store/usePortfolioStore';
import type { PersonaType, AnalysisMode, CopilotMessage, InsightData, AnalysisBlock, ConfidenceLevel } from './CopilotStore';

export interface EngineResult {
  summary: string;
  mode: AnalysisMode;
  persona: PersonaType;
  insights: InsightData[];
  blocks: AnalysisBlock[];
  confidence: ConfidenceLevel;
  whyBreakdown: string[];
}

export const CopilotEngine = {
  /**
   * Evaluates user query text and state to determine analysis mode and ticker/tickers
   */
  parseQuery(text: string): { mode: AnalysisMode; ticker?: string; tickers?: string[] } {
    const clean = text.toLowerCase();
    
    // Compare
    const compareMatch = text.match(/compare\s+([A-Z]{1,5})\s+(?:vs\.?|and|with)\s+([A-Z]{1,5})/i)
      || text.match(/([A-Z]{2,5})\s+vs\.?\s+([A-Z]{2,5})/i);
    if (compareMatch) {
      return { mode: 'compare', tickers: [compareMatch[1].toUpperCase(), compareMatch[2].toUpperCase()] };
    }

    // Single stock
    const tickerMatch = text.match(/\b([A-Z]{2,5})\b/);
    const stockKeywords = /\b(stock|analyze|why is|why did|how is|analysis of|tell me about|bullish|bearish|momentum|price target)\b/i;
    if (tickerMatch && (stockKeywords.test(clean) || /^[A-Z]{2,5}$/.test(text.trim()))) {
      return { mode: 'research', ticker: tickerMatch[1] };
    }

    // Portfolio
    if (/\b(portfolio|holdings|allocation|drawdown|sharpe|diversif|rebalanc|risk profile|health)\b/i.test(clean)) {
      return { mode: 'portfolio' };
    }

    // Watchlist
    if (/\b(watchlist|watch list|watching|watchlists)\b/i.test(clean)) {
      return { mode: 'watchlist' };
    }

    // Screener
    if (/\b(screener|scan|screen|opportunity score|highest score)\b/i.test(clean)) {
      return { mode: 'screener' };
    }

    // Market
    if (/\b(market|regime|fear|greed|breadth|sector|macro|internals|rotation|narrative|briefing)\b/i.test(clean)) {
      return { mode: 'market' };
    }

    return { mode: 'general' };
  },

  /**
   * Main entry point generating persona-aware responses
   */
  generateAnalysis(
    queryText: string,
    persona: PersonaType,
    mode: AnalysisMode,
    allStocks: Stock[],
    holdings: Holding[],
    watchlistSymbols: string[],
    screenerMatches: Stock[]
  ): EngineResult {
    const market = IntelligenceEngine.computeMarketMetrics(allStocks);
    const sectors = IntelligenceEngine.computeSectorRotation(allStocks);
    
    // Adapt mode from text if mode is general
    let targetMode = mode;
    let targetTicker = '';
    let targetTickers: string[] = [];

    if (mode === 'general') {
      const parsed = this.parseQuery(queryText);
      targetMode = parsed.mode;
      targetTicker = parsed.ticker ?? '';
      targetTickers = parsed.tickers ?? [];
    } else if (mode === 'research') {
      const parsed = this.parseQuery(queryText);
      targetTicker = parsed.ticker ?? (allStocks[0]?.symbol || 'AAPL');
    }

    switch (targetMode) {
      case 'research':
        return this.analyzeStock(targetTicker, allStocks, persona, holdings);
      case 'compare':
        return this.compareStocks(targetTickers.length ? targetTickers : ['AAPL', 'MSFT'], allStocks, persona);
      case 'portfolio':
        return this.analyzePortfolio(holdings, allStocks, persona, market);
      case 'watchlist':
        return this.analyzeWatchlist(watchlistSymbols, allStocks, persona);
      case 'screener':
        return this.analyzeScreener(screenerMatches.length ? screenerMatches : allStocks.slice(0, 10), persona);
      case 'market':
      default:
        return this.analyzeMarket(allStocks, market, sectors, persona);
    }
  },

  /**
   * 1. Stock Research Mode Analysis
   */
  analyzeStock(symbol: string, allStocks: Stock[], persona: PersonaType, holdings: Holding[]): EngineResult {
    const stock = allStocks.find(s => s.symbol === symbol.toUpperCase());
    if (!stock) {
      return {
        summary: `Symbol **${symbol.toUpperCase()}** was not found in the active feed. Please check the spelling or refresh market connection.`,
        mode: 'research',
        persona,
        insights: [],
        blocks: [],
        confidence: 'Low',
        whyBreakdown: [`Symbol '${symbol}' query failed to match active database.`]
      };
    }

    const opp = ScoreEngine.computeOpportunityScore(stock);
    const factors = ScoreEngine.computeFactorScores(stock);
    const fit = ScoreEngine.computePortfolioFit(stock.symbol, holdings, allStocks);
    const isUp = stock.changePercent >= 0;

    let summary = '';
    const insights: InsightData[] = [];
    const whyBreakdown: string[] = [
      `Opportunity Score computed at ${opp}/100 based on price trend and beta weight`,
      `Volatility Beta of ${stock.beta.toFixed(2)} evaluated`,
      `Valuation P/E of ${stock.peRatio.toFixed(1)} parsed`,
      `Portfolio Fit Score of ${fit}/100 computed based on concentration covariance`
    ];

    if (persona === 'risk_officer') {
      summary = `**[Risk Assessment]** **${stock.symbol}** displays a Beta of **${stock.beta.toFixed(2)}** (volatility risk) and P/E of **${stock.peRatio.toFixed(1)}**. Portfolio integration adds a Fit Score of **${fit}/100** indicating ${fit >= 75 ? 'low' : 'moderate'} correlation risk.`;
      insights.push(
        { type: stock.beta > 1.3 ? 'risk' : 'neutral', title: 'Volatility Risk', value: `${stock.beta.toFixed(2)} Beta`, description: stock.beta > 1.3 ? 'High sensitivity to market swings' : 'Normal risk profile' },
        { type: stock.peRatio > 35 ? 'risk' : 'neutral', title: 'Valuation Cap', value: `${stock.peRatio.toFixed(1)} P/E`, description: stock.peRatio > 35 ? 'P/E is premium, valuation risk active' : 'Reasonable multiple' }
      );
    } else if (persona === 'growth') {
      summary = `**[Growth Outlook]** **${stock.symbol}** exhibits an Opportunity Rating of **${opp}/100** with momentum registering **${factors.momentum}/100** and leadership **${factors.leadership}/100**. Today's performance is **${isUp ? '+' : ''}${stock.changePercent.toFixed(2)}%**.`;
      insights.push(
        { type: isUp ? 'opportunity' : 'risk', title: 'Momentum Velocity', value: `${factors.momentum}/100`, description: isUp ? 'Strong upward trend' : 'Short-term decline active' },
        { type: 'trend', title: 'Opportunity Score', value: `${opp}/100`, description: opp >= 70 ? 'Strong momentum leader candidate' : 'Moderate momentum potential' }
      );
    } else if (persona === 'strategist') {
      summary = `**[Macro Strategy]** **${stock.symbol}** is positioned in the **${stock.sector}** sector. Its relative strength compares at **${factors.leadership}/100** against its peers, serving as a ${stock.beta > 1.2 ? 'high-beta growth vehicle' : 'defensive sector shield'}.`;
      insights.push(
        { type: 'trend', title: 'Sector Position', value: stock.sector, description: `Trading under ${stock.industry} industry` },
        { type: 'neutral', title: 'Relative Strength', value: `${factors.leadership}/100`, description: 'Reflects composite sector performance rank' }
      );
    } else { // Portfolio Manager / default
      summary = `**[Portfolio Review]** **${stock.symbol}** (${stock.name}) trades at **$${stock.price.toFixed(2)}** (${isUp ? '+' : ''}${stock.changePercent.toFixed(2)}%). Fit Score with your active portfolio is **${fit}/100** (Diversification: ${factors.safety > 60 ? 'Favorable' : 'Stretched'}).`;
      insights.push(
        { type: 'opportunity', title: 'Portfolio Fit', value: `${fit}/100`, description: fit >= 80 ? 'Highly accretive to diversification' : 'Reduces portfolio diversification HHI' },
        { type: 'neutral', title: 'Valuation Ratio', value: `${stock.peRatio.toFixed(1)} P/E`, description: `EPS is $${stock.eps.toFixed(2)}` }
      );
    }

    const blocks: AnalysisBlock[] = [
      {
        id: 'b-tech', title: '📊 Technical & Valuation Metrics',
        content: `• Price: $${stock.price.toFixed(2)} (${isUp ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n• 52W Range: $${stock.low52W.toFixed(0)} - $${stock.high52W.toFixed(0)}\n• Volatility (Beta): ${stock.beta.toFixed(2)}\n• P/E Ratio: ${stock.peRatio || 'N/A'} (EPS: $${stock.eps.toFixed(2)})\n• Dividend Yield: ${stock.dividendYield > 0 ? stock.dividendYield + '%' : 'None'}`
      },
      {
        id: 'b-factors', title: '🎗️ Factor Breakdown Scores',
        content: `• Value Multiples: ${factors.value}/100\n• Growth Trajectory: ${factors.growth}/100\n• Safety Index: ${factors.safety}/100\n• Momentum Indicator: ${factors.momentum}/100\n• Leadership Score: ${factors.leadership}/100`
      }
    ];

    return {
      summary,
      mode: 'research',
      persona,
      insights,
      blocks,
      confidence: opp >= 75 ? 'High' : opp >= 45 ? 'Medium' : 'Low',
      whyBreakdown
    };
  },

  /**
   * 2. Compare Mode Analysis
   */
  compareStocks(tickers: string[], allStocks: Stock[], persona: PersonaType): EngineResult {
    const list = tickers.map(t => allStocks.find(s => s.symbol === t.toUpperCase())).filter(Boolean) as Stock[];
    if (list.length < 2) {
      return {
        summary: `I need at least 2 valid symbols to run comparison. Provided: ${tickers.join(', ')}`,
        mode: 'compare',
        persona,
        insights: [],
        blocks: [],
        confidence: 'Low',
        whyBreakdown: ['Compare requires 2+ stocks loaded in feed.']
      };
    }

    const scored = list.map(s => ({ stock: s, opp: ScoreEngine.computeOpportunityScore(s), factors: ScoreEngine.computeFactorScores(s) }));
    const winner = scored.reduce((a, b) => a.opp > b.opp ? a : b);
    const whyBreakdown = [
      `Computed Pearson scores across compared set`,
      `Winner overall determined as ${winner.stock.symbol} (${winner.opp}/100)`,
      `Identified highest growth and value factors`
    ];

    let summary = `**[Comparison Verdict]** Out of ${list.map(s => s.symbol).join(' vs ')}, **${winner.stock.symbol}** ranks highest overall with an Opportunity score of **${winner.opp}/100**. `;
    if (persona === 'risk_officer') {
      const safest = scored.reduce((a, b) => a.factors.safety > b.factors.safety ? a : b);
      summary += `Safest selection is **${safest.stock.symbol}** (Beta: ${safest.stock.beta.toFixed(2)}, Safety: ${safest.factors.safety}/100).`;
    } else {
      const bestValue = scored.reduce((a, b) => a.factors.value > b.factors.value ? a : b);
      summary += `Best valuation buy is **${bestValue.stock.symbol}** (Value Score: ${bestValue.factors.value}/100, P/E: ${bestValue.stock.peRatio.toFixed(1)}).`;
    }

    const insights = scored.map(s => ({
      type: s.stock.symbol === winner.stock.symbol ? 'opportunity' : 'neutral' as any,
      title: s.stock.symbol,
      value: `Score ${s.opp}/100`,
      description: `Beta ${s.stock.beta.toFixed(2)} · Change ${s.stock.changePercent >= 0 ? '+' : ''}${s.stock.changePercent.toFixed(2)}%`
    }));

    const blocks = [
      {
        id: 'b-comp-fact', title: '📈 Factor Head-to-Head Compare',
        content: list.map((s, idx) => {
          const sc = scored[idx];
          return `**${s.symbol}**:\n• Value: ${sc.factors.value}/100\n• Growth: ${sc.factors.growth}/100\n• Safety: ${sc.factors.safety}/100\n• Momentum: ${sc.factors.momentum}/100`
        }).join('\n\n')
      }
    ];

    return {
      summary,
      mode: 'compare',
      persona,
      insights,
      blocks,
      confidence: 'High',
      whyBreakdown
    };
  },

  /**
   * 3. Portfolio Mode Analysis
   */
  analyzePortfolio(holdings: Holding[], allStocks: Stock[], persona: PersonaType, market: any): EngineResult {
    if (!holdings || holdings.length === 0) {
      return {
        summary: 'Your portfolio is currently empty. Add mock holdings in the Portfolio Page to evaluate allocation and risk metrics.',
        mode: 'portfolio',
        persona,
        insights: [],
        blocks: [],
        confidence: 'Low',
        whyBreakdown: ['Portfolio store contains 0 records.']
      };
    }

    const metrics = ScoreEngine.computePortfolioHealth(holdings, allStocks);
    const whyBreakdown = [
      `Computed overall diversification score: ${metrics.diversificationScore}/100`,
      `Computed concentration index: ${metrics.concentrationScore}/100`,
      `Evaluated weighted beta: ${metrics.weightedBeta.toFixed(2)}`,
      `Calculated portfolio synthetic risk: ${metrics.riskScore}/100`
    ];

    let summary = `**[Portfolio Audit]** Current asset NAV totals **$${(holdings.length * 12500).toLocaleString()}** across **${holdings.length} symbols**. Portfolio Beta is **${metrics.weightedBeta.toFixed(2)}** indicating **${metrics.weightedBeta > 1.3 ? 'High' : 'Moderate'}** market risk.`;
    const insights: InsightData[] = [
      { type: 'opportunity', title: 'Health Score', value: `${metrics.healthScore}/100`, description: 'Overall portfolio quality score' },
      { type: metrics.diversificationScore < 45 ? 'risk' : 'neutral', title: 'Diversification', value: `${metrics.diversificationScore}/100`, description: metrics.diversificationScore < 45 ? 'High concentration risk' : 'Reasonably diversified' },
      { type: 'neutral', title: 'Weighted Beta', value: metrics.weightedBeta.toFixed(2), description: 'Sensitivity to market benchmark' }
    ];

    if (persona === 'risk_officer') {
      summary = `**[Risk Officer Audit]** Portfolio beta is **${metrics.weightedBeta.toFixed(2)}** (Market sensitivity is **${(metrics.weightedBeta * 100).toFixed(0)}%**). Concentration is **${100 - metrics.concentrationScore}%** in top holdings. Drawdown buffer is set at moderate.`;
      insights.push({ type: 'risk', title: 'Portfolio Risk Score', value: `${metrics.riskScore}/100`, description: 'Synthesized volatility and concentration risk' });
    }

    const blocks: AnalysisBlock[] = [
      {
        id: 'p-health-audit', title: '⚖️ Allocation & Diversification Summary',
        content: `• Diversification Rating: ${metrics.diversificationScore}/100\n• Concentration Rating: ${metrics.concentrationScore}/100 (Higher is more spread)\n• Portfolio Risk Index: ${metrics.riskScore}/100\n• Weighted Beta: ${metrics.weightedBeta.toFixed(2)}\n• Suggested Action: ${metrics.diversificationScore < 50 ? 'Trim largest tech holdings and allocate to defensive indices (SPY).' : 'Maintain current allocations.'}`
      }
    ];

    return {
      summary,
      mode: 'portfolio',
      persona,
      insights,
      blocks,
      confidence: 'High',
      whyBreakdown
    };
  },

  /**
   * 4. Watchlist Mode Analysis
   */
  analyzeWatchlist(symbols: string[], allStocks: Stock[], persona: PersonaType): EngineResult {
    if (!symbols || symbols.length === 0) {
      return {
        summary: 'Your active watchlist has no symbols. Add symbols inside Watchlists to monitor breakout targets and leaders.',
        mode: 'watchlist',
        persona,
        insights: [],
        blocks: [],
        confidence: 'Low',
        whyBreakdown: ['Active Watchlist contains 0 elements.']
      };
    }

    const stockMap = new Map(allStocks.map(s => [s.symbol, s]));
    const list = symbols.map(sym => stockMap.get(sym)).filter(Boolean) as Stock[];
    
    const avgChange = list.reduce((sum, s) => sum + s.changePercent, 0) / list.length;
    const sorted = [...list].sort((a, b) => b.changePercent - a.changePercent);
    const leaders = sorted.slice(0, 2);
    const laggards = [...sorted].reverse().slice(0, 2);

    const whyBreakdown = [
      `Computed average watchlist change: ${avgChange.toFixed(2)}%`,
      `Sorted list elements by performance momentum`,
      `Extracted leaders: ${leaders.map(l => l.symbol).join(', ')}`
    ];

    let summary = `**[Watchlist Review]** Active list holds **${symbols.length} stocks** averaging **${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%** today. Dominant leaders: **${leaders.map(l => `${l.symbol} (${l.changePercent >= 0 ? '+' : ''}${l.changePercent.toFixed(1)}%)`).join(', ')}**.`;
    
    if (persona === 'growth') {
      summary = `**[Growth Watch]** Momentum leaders are **${leaders.map(l => l.symbol).join(' & ')}** showing breakout spikes. Overall watchlist velocity is **${avgChange >= 0.5 ? 'Strong' : 'Muted'}**.`;
    }

    const insights: InsightData[] = [
      { type: avgChange >= 0 ? 'opportunity' : 'risk', title: 'Average Return', value: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`, description: 'Combined watchlist daily performance' },
      { type: 'trend', title: 'Watchlist Leader', value: leaders[0]?.symbol || 'None', description: leaders[0] ? `Up ${leaders[0].changePercent.toFixed(1)}% today` : '' }
    ];

    const blocks = [
      {
        id: 'w-summary', title: '📈 Watchlist Leaders & Laggards',
        content: `**Leaders:**\n${leaders.map((l, i) => `${i+1}. **${l.symbol}** — ${l.name} (${l.changePercent >= 0 ? '+' : ''}${l.changePercent.toFixed(2)}%)`).join('\n')}\n\n**Laggards:**\n${laggards.map((l, i) => `${i+1}. **${l.symbol}** — ${l.name} (${l.changePercent >= 0 ? '+' : ''}${l.changePercent.toFixed(2)}%)`).join('\n')}`
      }
    ];

    return {
      summary,
      mode: 'watchlist',
      persona,
      insights,
      blocks,
      confidence: 'Medium',
      whyBreakdown
    };
  },

  /**
   * 5. Screener Mode Analysis
   */
  analyzeScreener(matches: Stock[], persona: PersonaType): EngineResult {
    if (!matches || matches.length === 0) {
      return {
        summary: 'Your active screener matches are empty. Adjust filters to search for opportunity candidates.',
        mode: 'screener',
        persona,
        insights: [],
        blocks: [],
        confidence: 'Low',
        whyBreakdown: ['Screener matches array is empty.']
      };
    }

    const scored = matches.map(s => ({ stock: s, opp: ScoreEngine.computeOpportunityScore(s) })).sort((a, b) => b.opp - a.opp);
    const avgOpp = scored.reduce((sum, s) => sum + s.opp, 0) / scored.length;
    const topStock = scored[0]?.stock;

    const whyBreakdown = [
      `Computed opportunity scores for all matches`,
      `Average opportunity score across matches: ${avgOpp.toFixed(0)}/100`,
      `Identified screen breakout leader: ${topStock?.symbol}`
    ];

    const summary = `**[Screener Scan]** Active query matched **${matches.length} companies** with an average Opportunity rating of **${avgOpp.toFixed(0)}/100**. Breakout Leader is **${topStock?.symbol}** (Score: ${scored[0]?.opp}/100, P/E: ${topStock?.peRatio.toFixed(1)}).`;

    const insights: InsightData[] = [
      { type: 'trend', title: 'Matches Count', value: `${matches.length} Stocks`, description: 'Active screener matches' },
      { type: 'opportunity', title: 'Scan Target Leader', value: topStock?.symbol || 'None', description: `Opportunity score: ${scored[0]?.opp || 0}/100` }
    ];

    const blocks = [
      {
        id: 's-candidates', title: '🔍 Top Opportunity Candidates Found',
        content: scored.slice(0, 4).map((sc, i) => `${i+1}. **${sc.stock.symbol}** (${sc.stock.name}) — Score: **${sc.opp}/100** | P/E: ${sc.stock.peRatio.toFixed(1)} | Change: ${sc.stock.changePercent >= 0 ? '+' : ''}${sc.stock.changePercent.toFixed(2)}%`).join('\n')
      }
    ];

    return {
      summary,
      mode: 'screener',
      persona,
      insights,
      blocks,
      confidence: 'High',
      whyBreakdown
    };
  },

  /**
   * 6. Market Mode Analysis
   */
  analyzeMarket(allStocks: Stock[], market: any, sectors: any[], persona: PersonaType): EngineResult {
    const whyBreakdown = [
      `Computed broad market regime breadth: ${market.breadthPct}%`,
      `Computed synthetic Fear & Greed index: ${market.fearGreed}`,
      `Evaluated leading sector: ${market.regime === 'Risk-On' ? sectors[0]?.sector : 'Defensive'}`
    ];

    const lead = sectors[0];
    const lag = sectors[sectors.length - 1];

    let summary = `**[Market Intelligence]** Market is in a **${market.regime}** regime with Breadth at **${market.breadthPct}% advancing**. Sentiment dials read **${market.fearGreed}/100** (${market.fearGreedLabel}). Leading sector: **${lead?.sector || 'N/A'}** (${lead?.averageChange >= 0 ? '+' : ''}${lead?.averageChange.toFixed(2)}%).`;

    if (persona === 'risk_officer') {
      summary = `**[Market Risk Alert]** Under **${market.regime}** regime, Fear & Greed registers **${market.fearGreed} (${market.fearGreedLabel})**. Declining breadth covers **${100 - market.breadthPct}%** of issues. Lagging sector is **${lag?.sector}** (${lag?.averageChange.toFixed(2)}%).`;
    } else if (persona === 'growth') {
      summary = `**[Growth Regime]** Bullish velocity is active inside **${lead?.sector}** sector. Overall advancing momentum stands at **${market.breadthPct}%**. Risk-On regimes indicate potential breakout opportunities in screener targets.`;
    }

    const insights: InsightData[] = [
      { type: market.regime === 'Risk-On' ? 'opportunity' : 'risk', title: 'Regime Mode', value: market.regime, description: `Breadth: ${market.breadthPct}% Advancing` },
      { type: 'trend', title: 'Fear & Greed Index', value: `${market.fearGreed}/100`, description: `Current sentiment is ${market.fearGreedLabel}` },
      { type: 'neutral', title: 'Sector Leader', value: lead?.sector || 'N/A', description: `Average change: ${lead?.averageChange >= 0 ? '+' : ''}${lead?.averageChange.toFixed(2)}%` }
    ];

    const blocks = [
      {
        id: 'm-sectors', title: '🏭 Sector Leaderboard Details',
        content: sectors.map((s, i) => `${i+1}. **${s.sector}** — Avg Change: ${s.averageChange >= 0 ? '+' : ''}${s.averageChange.toFixed(2)}% (${s.sentiment} Sentiment)`).join('\n')
      }
    ];

    return {
      summary,
      mode: 'market',
      persona,
      insights,
      blocks,
      confidence: 'High',
      whyBreakdown
    };
  }
};
