import type { Stock } from '../../services/mockDataEngine';
import type { ScreenerFilterState } from '../../store/SavedScreensStore';

// ─── Sector color map ────────────────────────────────────────────────────────
export const SECTOR_COLORS: Record<string, string> = {
  Technology: '#3B82F6',
  Financial: '#10B981',
  Healthcare: '#8B5CF6',
  Energy: '#F59E0B',
  Consumer: '#EC4899',
  Industrials: '#6366F1',
  'Communication Services': '#14B8A6',
  Utilities: '#F97316',
};

export const SECTOR_DISPLAY_NAMES: Record<string, string> = {
  Technology: 'Technology',
  Financial: 'Financials',
  Healthcare: 'Healthcare',
  Energy: 'Energy',
  Consumer: 'Consumer',
  Industrials: 'Industrials',
  'Communication Services': 'Communication',
  Utilities: 'Utilities',
};

// Reverse map: UI label → data value
export const SECTOR_UI_TO_DATA: Record<string, string> = {
  Technology: 'Technology',
  Financials: 'Financial',
  Healthcare: 'Healthcare',
  Energy: 'Energy',
  Consumer: 'Consumer',
  Industrials: 'Industrials',
  Communication: 'Communication Services',
  Utilities: 'Utilities',
};

// ─── Opportunity Score ───────────────────────────────────────────────────────
export function computeOpportunityScore(stock: Stock): number {
  let score = 0;

  // 1. Momentum (0–25 pts): normalize changePercent -5% to +5%
  const momentum = Math.max(-1, Math.min(1, stock.changePercent / 5));
  score += ((momentum + 1) / 2) * 25;

  // 2. Volume Ratio (0–20 pts): relative to avgVolume, cap at 3x
  const volRatio = stock.avgVolume > 0
    ? Math.min(stock.volume / stock.avgVolume, 3)
    : 1;
  score += (volRatio / 3) * 20;

  // 3. Relative Strength (0–20 pts): position in 52W range
  const range = stock.high52W - stock.low52W;
  const rs = range > 0 ? (stock.price - stock.low52W) / range : 0.5;
  score += Math.max(0, Math.min(1, rs)) * 20;

  // 4. Beta sweet spot (0–15 pts): ideal 0.8–1.5
  const betaDist = Math.abs(stock.beta - 1.15);
  const betaScore = stock.beta >= 0.8 && stock.beta <= 1.5
    ? 15
    : Math.max(0, 15 - betaDist * 10);
  score += betaScore;

  // 5. Market Cap stability (0–20 pts)
  const capScore = stock.marketCap >= 10e9 ? 20
    : stock.marketCap >= 2e9 ? 12
    : 6;
  score += capScore;

  return Math.round(Math.max(0, Math.min(100, score)));
}

// ─── Filter Application ──────────────────────────────────────────────────────
export function applyFilters(stocks: Stock[], filters: ScreenerFilterState): Stock[] {
  return stocks.filter((stock) => {
    // Search
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (!stock.symbol.toLowerCase().includes(q) && !stock.name.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Price
    if (filters.priceRange) {
      switch (filters.priceRange) {
        case 'under10':   if (stock.price >= 10) return false; break;
        case '10to50':    if (stock.price < 10 || stock.price > 50) return false; break;
        case '50to100':   if (stock.price <= 50 || stock.price > 100) return false; break;
        case '100plus':   if (stock.price <= 100) return false; break;
      }
    }

    // Market Cap
    if (filters.marketCap) {
      switch (filters.marketCap) {
        case 'small': if (stock.marketCap >= 2e9) return false; break;
        case 'mid':   if (stock.marketCap < 2e9 || stock.marketCap >= 10e9) return false; break;
        case 'large': if (stock.marketCap < 10e9) return false; break;
      }
    }

    // Volume
    if (filters.volume) {
      switch (filters.volume) {
        case 'low':    if (stock.volume >= 500_000) return false; break;
        case 'medium': if (stock.volume < 500_000 || stock.volume >= 5_000_000) return false; break;
        case 'high':   if (stock.volume < 5_000_000) return false; break;
      }
    }

    // Performance
    if (filters.performance) {
      switch (filters.performance) {
        case 'gainers':  if (stock.changePercent <= 0) return false; break;
        case 'losers':   if (stock.changePercent >= 0) return false; break;
        case 'momentum': if (stock.changePercent < 1.5) return false; break;
      }
    }

    // Sectors
    if (filters.sectors.length > 0) {
      const dataSectors = filters.sectors.map((s: string) => SECTOR_UI_TO_DATA[s] ?? s);
      if (!dataSectors.includes(stock.sector)) return false;
    }

    // Beta / Risk
    if (filters.beta) {
      switch (filters.beta) {
        case 'low':    if (stock.beta >= 0.8) return false; break;
        case 'medium': if (stock.beta < 0.8 || stock.beta > 1.3) return false; break;
        case 'high':   if (stock.beta <= 1.3) return false; break;
      }
    }

    return true;
  });
}

// ─── Smart Scan Presets ──────────────────────────────────────────────────────
export const EMPTY_FILTERS: ScreenerFilterState = {
  priceRange: null,
  marketCap: null,
  volume: null,
  performance: null,
  sectors: [],
  beta: null,
  searchQuery: '',
};

export const SMART_SCANS: Record<string, { label: string; emoji: string; description: string; filters: ScreenerFilterState }> = {
  momentum: {
    label: 'Momentum Stocks',
    emoji: '🚀',
    description: 'High volume movers with strong price momentum',
    filters: { ...EMPTY_FILTERS, volume: 'high', performance: 'momentum' },
  },
  growth: {
    label: 'Growth Stocks',
    emoji: '📈',
    description: 'Large cap tech & healthcare with positive returns',
    filters: { ...EMPTY_FILTERS, marketCap: 'large', performance: 'gainers', sectors: ['Technology', 'Healthcare'] },
  },
  ai: {
    label: 'AI Stocks',
    emoji: '🤖',
    description: 'Large-cap technology sector leaders',
    filters: { ...EMPTY_FILTERS, marketCap: 'large', sectors: ['Technology'] },
  },
  value: {
    label: 'Value Stocks',
    emoji: '💎',
    description: 'Dividend-paying, low-beta large caps',
    filters: { ...EMPTY_FILTERS, marketCap: 'large', beta: 'low' },
  },
  breakout: {
    label: 'High Volume Breakouts',
    emoji: '⚡',
    description: 'Unusual volume with positive price action',
    filters: { ...EMPTY_FILTERS, volume: 'high', performance: 'gainers' },
  },
  dividend: {
    label: 'Dividend Stocks',
    emoji: '💰',
    description: 'Income-generating stocks with yield > 1.5%',
    filters: { ...EMPTY_FILTERS, beta: 'low', marketCap: 'large' },
  },
  lowrisk: {
    label: 'Low Risk Stocks',
    emoji: '🛡️',
    description: 'Stable large caps with low beta',
    filters: { ...EMPTY_FILTERS, beta: 'low', marketCap: 'large' },
  },
};

// ─── Insights Engine ─────────────────────────────────────────────────────────
export function generateInsights(filtered: Stock[], allStocks: Stock[]): string[] {
  if (filtered.length === 0) return [];

  const insights: string[] = [];

  // 1. Sector dominance
  const sectorCounts: Record<string, number> = {};
  filtered.forEach((s: Stock) => { sectorCounts[s.sector] = (sectorCounts[s.sector] || 0) + 1; });
  const topSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
  if (topSector) {
    const pct = Math.round((topSector[1] / filtered.length) * 100);
    insights.push(`${SECTOR_DISPLAY_NAMES[topSector[0]] ?? topSector[0]} stocks dominate this scan, accounting for ${pct}% of all qualifying candidates.`);
  }

  // 2. Volume concentration
  const highVol = filtered.filter((s) => s.volume >= 5_000_000);
  if (highVol.length > 0) {
    const volSectors: Record<string, number> = {};
    highVol.forEach((s) => { volSectors[s.sector] = (volSectors[s.sector] || 0) + 1; });
    const topVolSector = Object.entries(volSectors).sort((a, b) => b[1] - a[1])[0];
    if (topVolSector) {
      insights.push(`High-volume activity is concentrated in ${SECTOR_DISPLAY_NAMES[topVolSector[0]] ?? topVolSector[0]}, with ${highVol.length} stocks trading above 5M shares.`);
    }
  }

  // 3. Risk profile
  const highBeta = filtered.filter((s) => s.beta > 1.3);
  const highBetaPct = Math.round((highBeta.length / filtered.length) * 100);
  if (highBetaPct > 30) {
    insights.push(`${highBetaPct}% of results carry elevated risk (beta > 1.3) — consider position sizing carefully.`);
  } else if (highBetaPct < 15) {
    insights.push(`This scan skews defensive: ${100 - highBetaPct}% of results have beta ≤ 1.3, suggesting lower volatility exposure.`);
  }

  // 4. Top performer
  const sorted = [...filtered].sort((a, b) => b.changePercent - a.changePercent);
  if (sorted[0] && sorted[0].changePercent > 0) {
    insights.push(`Top performer is ${sorted[0].symbol} (+${sorted[0].changePercent.toFixed(2)}%), leading the scan's momentum candidates.`);
  }

  // 5. vs overall market
  const allAvgChange = allStocks.reduce((s, x) => s + x.changePercent, 0) / (allStocks.length || 1);
  const filteredAvgChange = filtered.reduce((s, x) => s + x.changePercent, 0) / (filtered.length || 1);
  const diff = filteredAvgChange - allAvgChange;
  if (Math.abs(diff) > 0.2) {
    const dir = diff > 0 ? 'outperforming' : 'underperforming';
    insights.push(`Filtered results are ${dir} the broad market by ${Math.abs(diff).toFixed(2)}% on average today.`);
  }

  return insights.slice(0, 5);
}

// ─── Market Context ──────────────────────────────────────────────────────────
export function computeMarketContext(allStocks: Stock[]) {
  if (allStocks.length === 0) {
    return { regime: 'Neutral', fearGreed: 50, breadthPct: 50, sectorLeader: '—' };
  }

  const advancing = allStocks.filter((s) => s.changePercent > 0);
  const breadthPct = Math.round((advancing.length / allStocks.length) * 100);

  const regime =
    breadthPct > 55 ? 'Risk-On' :
    breadthPct < 45 ? 'Risk-Off' :
    'Neutral';

  // Synthetic Fear & Greed: blend of breadth + avg momentum
  const avgChange = allStocks.reduce((s, x) => s + x.changePercent, 0) / allStocks.length;
  const raw = breadthPct * 0.6 + Math.max(0, Math.min(100, (avgChange + 3) / 6 * 100)) * 0.4;
  const fearGreed = Math.round(Math.max(0, Math.min(100, raw)));

  // Sector leader: highest avg changePercent
  const sectorAvg: Record<string, number[]> = {};
  allStocks.forEach((s: Stock) => {
    if (!sectorAvg[s.sector]) sectorAvg[s.sector] = [];
    sectorAvg[s.sector].push(s.changePercent);
  });
  const sectorLeaderEntry = Object.entries(sectorAvg)
    .map(([sector, changes]) => ({
      sector,
      avg: changes.reduce((a, b) => a + b, 0) / changes.length,
    }))
    .sort((a, b) => b.avg - a.avg)[0];

  const sectorLeader = sectorLeaderEntry
    ? (SECTOR_DISPLAY_NAMES[sectorLeaderEntry.sector] ?? sectorLeaderEntry.sector)
    : '—';

  return { regime, fearGreed, breadthPct, sectorLeader };
}

// ─── Sector Distribution ─────────────────────────────────────────────────────
export function computeSectorDistribution(stocks: Stock[]) {
  const counts: Record<string, number> = {};
  stocks.forEach((s) => { counts[s.sector] = (counts[s.sector] || 0) + 1; });
  const total = stocks.length || 1;
  return Object.entries(counts)
    .map(([sector, count]) => ({
      sector,
      displayName: SECTOR_DISPLAY_NAMES[sector] ?? sector,
      count,
      pct: Math.round((count / total) * 100),
      color: SECTOR_COLORS[sector] ?? '#6B7280',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

// ─── Why This Passed ─────────────────────────────────────────────────────────
export function computeWhyPassed(stock: Stock, filters: ScreenerFilterState): string[] {
  const reasons: string[] = [];

  // Volume
  if (filters.volume === 'high' || (stock.avgVolume > 0 && stock.volume / stock.avgVolume > 1.5)) {
    const ratio = stock.avgVolume > 0 ? (stock.volume / stock.avgVolume).toFixed(1) : '—';
    reasons.push(`High Volume (${ratio}x avg)`);
  }

  // Momentum
  if (stock.changePercent >= 1.5) reasons.push(`Momentum +${stock.changePercent.toFixed(2)}%`);
  else if (stock.changePercent > 0) reasons.push(`Positive trend +${stock.changePercent.toFixed(2)}%`);

  // Market cap
  if (stock.marketCap >= 10e9) reasons.push(`Large Cap ($${(stock.marketCap / 1e12).toFixed(2)}T)`);
  else if (stock.marketCap >= 2e9) reasons.push(`Mid Cap ($${(stock.marketCap / 1e9).toFixed(1)}B)`);

  // Sector
  reasons.push(`${SECTOR_DISPLAY_NAMES[stock.sector] ?? stock.sector} Sector`);

  // Beta
  if (stock.beta < 0.8) reasons.push(`Low Beta (${stock.beta.toFixed(2)})`);
  else if (stock.beta > 1.3) reasons.push(`High Beta (${stock.beta.toFixed(2)})`);

  // Dividend
  if (stock.dividendYield > 1.5) reasons.push(`Dividend Yield ${stock.dividendYield.toFixed(2)}%`);

  return reasons.slice(0, 5);
}

// ─── Closest Match Scoring (for empty state) ─────────────────────────────────
export function findClosestMatches(
  allStocks: Stock[],
  filters: ScreenerFilterState,
  limit = 3
): Stock[] {
  const scoreMatch = (stock: Stock): number => {
    let score = 0;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q)) score++;
    }
    if (filters.priceRange) {
      switch (filters.priceRange) {
        case 'under10':  if (stock.price < 10) score++; break;
        case '10to50':   if (stock.price >= 10 && stock.price <= 50) score++; break;
        case '50to100':  if (stock.price > 50 && stock.price <= 100) score++; break;
        case '100plus':  if (stock.price > 100) score++; break;
      }
    }
    if (filters.marketCap) {
      switch (filters.marketCap) {
        case 'small': if (stock.marketCap < 2e9) score++; break;
        case 'mid':   if (stock.marketCap >= 2e9 && stock.marketCap < 10e9) score++; break;
        case 'large': if (stock.marketCap >= 10e9) score++; break;
      }
    }
    if (filters.volume) {
      switch (filters.volume) {
        case 'low':    if (stock.volume < 500_000) score++; break;
        case 'medium': if (stock.volume >= 500_000 && stock.volume < 5_000_000) score++; break;
        case 'high':   if (stock.volume >= 5_000_000) score++; break;
      }
    }
    if (filters.performance) {
      switch (filters.performance) {
        case 'gainers':  if (stock.changePercent > 0) score++; break;
        case 'losers':   if (stock.changePercent < 0) score++; break;
        case 'momentum': if (stock.changePercent >= 1.5) score++; break;
      }
    }
    if (filters.sectors.length > 0) {
      const dataSectors = filters.sectors.map((s: string) => SECTOR_UI_TO_DATA[s] ?? s);
      if (dataSectors.includes(stock.sector)) score++;
    }
    if (filters.beta) {
      switch (filters.beta) {
        case 'low':    if (stock.beta < 0.8) score++; break;
        case 'medium': if (stock.beta >= 0.8 && stock.beta <= 1.3) score++; break;
        case 'high':   if (stock.beta > 1.3) score++; break;
      }
    }

    return score;
  };

  return [...allStocks]
    .map((s) => ({ stock: s, score: scoreMatch(s) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.stock);
}

// ─── Suggested filter relaxation (for empty state) ────────────────────────────
export function suggestRelaxation(
  allStocks: Stock[],
  filters: ScreenerFilterState
): { filterLabel: string; gain: number } | null {
  const current = applyFilters(allStocks, filters).length;
  const candidates: { filterLabel: string; gain: number }[] = [];

  const filterKeys: Array<keyof ScreenerFilterState> = [
    'priceRange', 'marketCap', 'volume', 'performance', 'beta',
  ];

  for (const key of filterKeys) {
    const filterVal = filters[key];
    if (filterVal === null || filterVal === '' || filterVal === undefined) continue;
    const relaxed = { ...filters, [key]: null } as ScreenerFilterState;
    const count = applyFilters(allStocks, relaxed).length;
    candidates.push({ filterLabel: key as string, gain: count - current });
  }

  if (filters.sectors.length > 0) {
    const relaxed = { ...filters, sectors: [] };
    const count = applyFilters(allStocks, relaxed).length;
    candidates.push({ filterLabel: 'Sector', gain: count - current });
  }

  candidates.sort((a, b) => b.gain - a.gain);
  return candidates[0] ?? null;
}

// ─── Format helpers ──────────────────────────────────────────────────────────
export function fmtMarketCap(mc: number): string {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9)  return `$${(mc / 1e9).toFixed(1)}B`;
  if (mc >= 1e6)  return `$${(mc / 1e6).toFixed(1)}M`;
  return `$${mc.toLocaleString()}`;
}

export function fmtVolume(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return `${v}`;
}
