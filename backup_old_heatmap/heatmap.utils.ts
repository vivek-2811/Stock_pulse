import type { Stock } from '../../services/mockDataEngine';

// Color interpolation for Treemap Nodes matching requirements:
// Strong Gain: Dark Green
// Moderate Gain: Green
// Neutral: Gray
// Moderate Loss: Red
// Strong Loss: Dark Red
export function getStockColor(changePercent: number): string {
  if (changePercent >= 3.0) return 'rgb(6, 95, 70)'; // Dark Green
  if (changePercent <= -3.0) return 'rgb(127, 29, 29)'; // Dark Red
  
  if (changePercent > 0) {
    if (changePercent <= 1.0) {
      // Interpolate between Gray-ish rgb(31, 41, 55) and Green rgb(16, 185, 129)
      const t = changePercent;
      const r = Math.round(31 + (16 - 31) * t);
      const g = Math.round(41 + (185 - 41) * t);
      const b = Math.round(55 + (129 - 55) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Interpolate between Green rgb(16, 185, 129) and Dark Green rgb(6, 95, 70)
      const t = (changePercent - 1.0) / 2.0; // scale 1.0 to 3.0 -> 0.0 to 1.0
      const r = Math.round(16 + (6 - 16) * t);
      const g = Math.round(185 + (95 - 185) * t);
      const b = Math.round(129 + (70 - 129) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else if (changePercent < 0) {
    const absPct = Math.abs(changePercent);
    if (absPct <= 1.0) {
      // Interpolate between Gray-ish rgb(31, 41, 55) and Red rgb(239, 68, 68)
      const t = absPct;
      const r = Math.round(31 + (239 - 31) * t);
      const g = Math.round(41 + (68 - 41) * t);
      const b = Math.round(55 + (68 - 55) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Interpolate between Red rgb(239, 68, 68) and Dark Red rgb(127, 29, 29)
      const t = (absPct - 1.0) / 2.0; // scale 1.0 to 3.0 -> 0.0 to 1.0
      const r = Math.round(239 + (127 - 239) * t);
      const g = Math.round(68 + (29 - 68) * t);
      const b = Math.round(68 + (29 - 68) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  
  return 'rgb(31, 41, 55)'; // Neutral Flat Gray
}

// Format Market Cap to human-readable (e.g. $2.98T or $45.6B)
export function formatMarketCap(cap: number): string {
  if (cap >= 1000000000000) {
    return `$${(cap / 1000000000000).toFixed(2)}T`;
  }
  if (cap >= 1000000000) {
    return `$${(cap / 1000000000).toFixed(1)}B`;
  }
  if (cap >= 1000000) {
    return `$${(cap / 1000000).toFixed(1)}M`;
  }
  return `$${cap.toLocaleString()}`;
}

// Format Volume to human-readable (e.g. 52.4M or 452.1K)
export function formatVolume(vol: number): string {
  if (vol >= 1000000) {
    return `${(vol / 1000000).toFixed(1)}M`;
  }
  if (vol >= 1000) {
    return `${(vol / 1000).toFixed(0)}K`;
  }
  return vol.toString();
}

// Market Regime Classifications
export const GROWTH_SECTORS = ['Technology', 'Consumer', 'Financial', 'Communication Services'];
export const DEFENSIVE_SECTORS = ['Healthcare', 'Utilities', 'Energy', 'Industrials'];

export interface MarketRegimeInfo {
  status: 'Risk-On' | 'Neutral' | 'Risk-Off';
  score: number; // -100 to +100
  breadthPercent: number;
}

// Calculate Market Regime based on breadth, sector strength and volume
export function calculateMarketRegime(stocks: Stock[]): MarketRegimeInfo {
  if (stocks.length === 0) {
    return { status: 'Neutral', score: 0, breadthPercent: 50 };
  }

  // 1. Breadth: % of positive stocks
  const positiveStocks = stocks.filter(s => s.changePercent > 0);
  const breadthPercent = (positiveStocks.length / stocks.length) * 100;
  const breadthScore = (breadthPercent - 50) * 2; // -100 to +100

  // 2. Sector Strength: Growth vs Defensive
  let growthSum = 0;
  let growthCount = 0;
  let defensiveSum = 0;
  let defensiveCount = 0;

  stocks.forEach(s => {
    if (GROWTH_SECTORS.includes(s.sector)) {
      growthSum += s.changePercent;
      growthCount++;
    } else if (DEFENSIVE_SECTORS.includes(s.sector)) {
      defensiveSum += s.changePercent;
      defensiveCount++;
    }
  });

  const avgGrowthChange = growthCount > 0 ? growthSum / growthCount : 0;
  const avgDefensiveChange = defensiveCount > 0 ? defensiveSum / defensiveCount : 0;

  // Sector diff: growth performing better than defensive = risk-on signal
  const sectorDiff = avgGrowthChange - avgDefensiveChange;
  // Map sector difference to a score (e.g. +1.5% difference is full +100 score)
  const sectorScore = Math.max(-100, Math.min(100, sectorDiff * 66.6));

  // 3. Combined Score
  const score = Math.round(0.6 * breadthScore + 0.4 * sectorScore);

  let status: 'Risk-On' | 'Neutral' | 'Risk-Off' = 'Neutral';
  if (score > 15) status = 'Risk-On';
  else if (score < -15) status = 'Risk-Off';

  return { status, score, breadthPercent };
}
