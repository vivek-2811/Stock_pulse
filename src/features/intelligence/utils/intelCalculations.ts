import type { Stock, MarketIndex } from '../../../services/mockDataEngine';

export interface SectorMetric {
  sector: string;
  label: string;
  dailyPerf: number;
  weeklyPerf: number;
  relativeStrength: number;
  moneyFlow: number; // In millions
  avgVolume: number;
  avgMarketCap: number;
  momentum: number; // -2 to +2
  topStocks: Stock[];
}

export interface MarketIntelligence {
  timestamp: number;
  
  // 1. Market Health
  healthScore: number;
  riskScore: number;
  healthConfidence: number;
  
  // 2. Market Regime
  regime: 'Risk-On' | 'Neutral' | 'Risk-Off';
  regimeScore: number; // -100 to 100
  regimeConfidence: number;
  regimeExplanations: string[];
  
  // 3. Fear & Greed
  fgScore: number;
  fgLabel: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  fgDetails: {
    momentum: number;
    volatility: number;
    breadth: number;
    volume: number;
    trend: number;
  };
  
  // 4. Market Breadth
  breadth: {
    advancers: number;
    decliners: number;
    unchanged: number;
    newHighs: number;
    newLows: number;
    adRatio: number;
    upVolume: number;
    downVolume: number;
    breadthPct: number;
  };
  
  // 5. Sector Rotation
  sectors: SectorMetric[];
  leadingSector: string;
  weakestSector: string;
  
  // 6. Institutional Flow
  flow: {
    totalInflow: number;
    totalOutflow: number;
    netInflow: number;
    growthFlow: number; // Tech + Comm
    defensiveFlow: number; // Utilities + Healthcare
    inflowSectors: { sector: string; amount: number }[];
    outflowSectors: { sector: string; amount: number }[];
  };
  
  // 7. Movers Heat Strip
  heatStripStocks: {
    symbol: string;
    changePercent: number;
    price: number;
    volume: number;
    relativeWidth: number; // percentage width
  }[];
}

const TARGET_SECTORS = [
  { key: 'Technology', label: 'Technology' },
  { key: 'Financial', label: 'Financials' },
  { key: 'Healthcare', label: 'Healthcare' },
  { key: 'Energy', label: 'Energy' },
  { key: 'Industrials', label: 'Industrials' },
  { key: 'Consumer', label: 'Consumer' },
  { key: 'Communication Services', label: 'Communication Services' },
  { key: 'Utilities', label: 'Utilities' }
];

export function calculateMarketIntelligence(
  stocks: Stock[],
  indices: MarketIndex[]
): MarketIntelligence {
  const sp500Index = indices.find(idx => idx.symbol === 'S&P 500') || indices[0];
  const nasdaqIndex = indices.find(idx => idx.symbol === 'NASDAQ') || indices[1] || indices[0];
  
  const sp500Perf = sp500Index ? sp500Index.changePercent : 0.2;
  const nasdaqPerf = nasdaqIndex ? nasdaqIndex.changePercent : 0.3;

  // ----------------------------------------------------
  // 1. Market Breadth
  // ----------------------------------------------------
  const advancers = stocks.filter(s => s.changePercent > 0).length;
  const decliners = stocks.filter(s => s.changePercent < 0).length;
  const unchanged = stocks.filter(s => s.changePercent === 0).length;
  
  // New highs and new lows (within 1.5% of 52W levels)
  const newHighs = stocks.filter(s => s.price >= s.high52W * 0.985).length;
  const newLows = stocks.filter(s => s.price <= s.low52W * 1.015).length;
  
  const adRatio = advancers / (decliners || 1);
  const breadthPct = stocks.length > 0 ? (advancers / stocks.length) * 100 : 50;
  
  const upVolume = stocks.reduce((sum, s) => s.changePercent > 0 ? sum + s.volume : sum, 0);
  const downVolume = stocks.reduce((sum, s) => s.changePercent < 0 ? sum + s.volume : sum, 0);

  // ----------------------------------------------------
  // 2. Sector Rotation
  // ----------------------------------------------------
  const sectorsData: SectorMetric[] = TARGET_SECTORS.map(sec => {
    const sectorStocks = stocks.filter(s => s.sector === sec.key);
    const count = sectorStocks.length || 1;
    
    // Performance
    const dailyPerf = sectorStocks.reduce((sum, s) => sum + s.changePercent, 0) / count;
    
    // Seeded stable weekly offset
    let hash = 0;
    for (let i = 0; i < sec.key.length; i++) hash += sec.key.charCodeAt(i);
    const seededOffset = ((hash % 10) - 5) * 0.3; // -1.5% to +1.5%
    const beta = sec.key === 'Technology' || sec.key === 'Communication Services' ? 1.4 : 0.9;
    const weeklyPerf = dailyPerf * 3 + seededOffset + (sec.key === 'Technology' ? nasdaqPerf * 1.2 : sp500Perf * beta);

    const relativeStrength = dailyPerf - sp500Perf;
    
    // Institutional Money Flow (in millions)
    const moneyFlow = sectorStocks.reduce(
      (sum, s) => sum + (s.price * (s.changePercent / 100) * (s.volume * 0.04)), 
      0
    ) / 1000000;
    
    const avgVolume = sectorStocks.reduce((sum, s) => sum + s.volume, 0) / count;
    const avgMarketCap = sectorStocks.reduce((sum, s) => sum + s.marketCap, 0) / count;
    
    // Momentum index
    let momentum = 0;
    if (dailyPerf > 0.4) momentum = 2;
    else if (dailyPerf > 0.1) momentum = 1;
    else if (dailyPerf < -0.4) momentum = -2;
    else if (dailyPerf < -0.1) momentum = -1;
    
    // Top 5 holdings
    const topStocks = [...sectorStocks]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    return {
      sector: sec.key,
      label: sec.label,
      dailyPerf,
      weeklyPerf,
      relativeStrength,
      moneyFlow,
      avgVolume,
      avgMarketCap,
      momentum,
      topStocks
    };
  });

  // Sort sectors by daily performance to get leaders/laggards
  const sortedSectors = [...sectorsData].sort((a, b) => b.dailyPerf - a.dailyPerf);
  const leadingSector = sortedSectors[0]?.label || 'Technology';
  const weakestSector = sortedSectors[sortedSectors.length - 1]?.label || 'Utilities';

  // ----------------------------------------------------
  // 3. Institutional Flows
  // ----------------------------------------------------
  let totalInflow = 0;
  let totalOutflow = 0;
  sectorsData.forEach(s => {
    if (s.moneyFlow >= 0) totalInflow += s.moneyFlow;
    else totalOutflow += Math.abs(s.moneyFlow);
  });
  
  const netInflow = totalInflow - totalOutflow;
  
  const techFlow = sectorsData.find(s => s.sector === 'Technology')?.moneyFlow || 0;
  const commFlow = sectorsData.find(s => s.sector === 'Communication Services')?.moneyFlow || 0;
  const growthFlow = techFlow + commFlow;
  
  const utilityFlow = sectorsData.find(s => s.sector === 'Utilities')?.moneyFlow || 0;
  const healthFlow = sectorsData.find(s => s.sector === 'Healthcare')?.moneyFlow || 0;
  const defensiveFlow = utilityFlow + healthFlow;

  const inflowSectors = sectorsData
    .filter(s => s.moneyFlow > 0)
    .map(s => ({ sector: s.label, amount: s.moneyFlow }))
    .sort((a, b) => b.amount - a.amount);
    
  const outflowSectors = sectorsData
    .filter(s => s.moneyFlow < 0)
    .map(s => ({ sector: s.label, amount: Math.abs(s.moneyFlow) }))
    .sort((a, b) => b.amount - a.amount);

  // ----------------------------------------------------
  // 4. Fear & Greed Index
  // ----------------------------------------------------
  const indexMomentum = Math.min(100, Math.max(0, 50 + sp500Perf * 20));
  const vix = 16 - (sp500Perf * 6) + (Math.random() - 0.5) * 0.5; // VIX rises on index drops
  const volatilityFG = Math.min(100, Math.max(0, 100 - (vix - 9) * 4.5));
  const breadthFG = breadthPct;
  const volumeFG = (upVolume / ((upVolume + downVolume) || 1)) * 100;
  const trendFG = Math.min(100, Math.max(0, 50 + (nasdaqPerf + sp500Perf) * 15));
  
  const fgScore = Math.round((indexMomentum + volatilityFG + breadthFG + volumeFG + trendFG) / 5);
  
  let fgLabel: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed' = 'Neutral';
  if (fgScore <= 25) fgLabel = 'Extreme Fear';
  else if (fgScore <= 45) fgLabel = 'Fear';
  else if (fgScore <= 55) fgLabel = 'Neutral';
  else if (fgScore <= 75) fgLabel = 'Greed';
  else fgLabel = 'Extreme Greed';

  // ----------------------------------------------------
  // 5. Market Regime
  // ----------------------------------------------------
  // Cyclicals vs Defensives rotation
  const cyclicalSectors = ['Technology', 'Financial', 'Industrials', 'Consumer'];
  const defensiveSectors = ['Healthcare', 'Utilities', 'Communication Services']; // Comm is grouped as defensive relative to standard high-beta here or neutral
  const cyclicalPerfs = sectorsData.filter(s => cyclicalSectors.includes(s.sector)).map(s => s.dailyPerf);
  const defensivePerfs = sectorsData.filter(s => defensiveSectors.includes(s.sector)).map(s => s.dailyPerf);
  
  const cyclicalAvg = cyclicalPerfs.reduce((sum, p) => sum + p, 0) / (cyclicalPerfs.length || 1);
  const defensiveAvg = defensivePerfs.reduce((sum, p) => sum + p, 0) / (defensivePerfs.length || 1);
  const rotationSpread = cyclicalAvg - defensiveAvg;

  // Volume Participation
  const totalVolume = stocks.reduce((sum, s) => sum + s.volume, 0);
  const totalAvgVolume = stocks.reduce((sum, s) => sum + s.avgVolume, 0);
  const volumeParticipation = totalVolume / (totalAvgVolume || 1);

  // Derive Regime Score [-100, 100]
  let regimeScore = 0;
  regimeScore += (breadthPct - 50) * 1.5; // breadths
  regimeScore += rotationSpread * 60; // rotation spread
  regimeScore += sp500Perf * 25 + nasdaqPerf * 15; // indices
  regimeScore += (volumeParticipation - 0.95) * 50; // volume flow

  regimeScore = Math.min(100, Math.max(-100, regimeScore));

  let regime: 'Risk-On' | 'Neutral' | 'Risk-Off' = 'Neutral';
  if (regimeScore > 20) regime = 'Risk-On';
  else if (regimeScore < -20) regime = 'Risk-Off';

  const regimeConfidence = Math.min(100, Math.max(30, Math.round(45 + Math.abs(regimeScore) * 0.65)));

  const regimeExplanations: string[] = [];
  if (breadthPct > 55) {
    regimeExplanations.push(`Advancers dominate with ${Math.round(breadthPct)}% bullish breadth.`);
  } else if (breadthPct < 45) {
    regimeExplanations.push(`Decliners lead, weighing on breadth (${Math.round(breadthPct)}% advancing).`);
  } else {
    regimeExplanations.push('Market breadth is evenly balanced.');
  }

  if (rotationSpread > 0.15) {
    regimeExplanations.push('Risk cyclicals lead defensive sectors, indicating growth accumulation.');
  } else if (rotationSpread < -0.15) {
    regimeExplanations.push('Defensive sectors lead cyclicals, signaling defensive capital preservation.');
  }

  if (volumeParticipation > 1.05) {
    regimeExplanations.push(`Institutional trading volume is active at ${(volumeParticipation).toFixed(2)}x normal.`);
  }

  if (sp500Perf > 0.3) {
    regimeExplanations.push('Index strength is robust, displaying supportive buying pressure.');
  } else if (sp500Perf < -0.3) {
    regimeExplanations.push('Indices show distribution selling with solid momentum to the downside.');
  }

  // ----------------------------------------------------
  // 6. Master Market Health Score (0-100)
  // ----------------------------------------------------
  // Combine factors:
  // - Breadth (20%): breadthPct
  // - Volume Participation (15%): volumeParticipation capped and normalized
  // - Index Momentum (25%): indexMomentum
  // - Fear & Greed (15%): fgScore
  // - Regime Score (15%): regimeScore mapped from [-100, 100] to [0, 100]
  // - Sector Breadth (10%): percentage of sectors with positive daily returns
  const volumeNormalized = Math.min(100, Math.max(0, volumeParticipation * 55));
  const regimeMapped = ((regimeScore + 100) / 2);
  const positiveSectorsPct = (sectorsData.filter(s => s.dailyPerf > 0).length / sectorsData.length) * 100;

  const healthScore = Math.round(
    (breadthPct * 0.20) +
    (volumeNormalized * 0.15) +
    (indexMomentum * 0.25) +
    (fgScore * 0.15) +
    (regimeMapped * 0.15) +
    (positiveSectorsPct * 0.10)
  );

  const riskScore = 100 - healthScore;

  // Master health confidence: high variance in sub-scores = low confidence, high alignment = high confidence
  const variance = 
    Math.abs(breadthPct - indexMomentum) + 
    Math.abs(fgScore - regimeMapped) + 
    Math.abs(positiveSectorsPct - breadthPct);
  
  const healthConfidence = Math.min(99, Math.max(25, Math.round(100 - (variance * 0.45))));

  // ----------------------------------------------------
  // 7. Movers Heat Strip
  // ----------------------------------------------------
  // Get top 10 stocks by volume
  const topVolumeStocks = [...stocks]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);
    
  const maxVol = Math.max(...topVolumeStocks.map(s => s.volume)) || 1;
  const minVol = Math.min(...topVolumeStocks.map(s => s.volume)) || 1;
  const volRange = maxVol - minVol || 1;

  const heatStripStocks = topVolumeStocks.map(s => {
    // Map volume to a relative width between 40% and 100% of max width allocation
    const normVol = (s.volume - minVol) / volRange;
    const relativeWidth = 40 + normVol * 60; // 40% to 100%

    return {
      symbol: s.symbol,
      changePercent: s.changePercent,
      price: s.price,
      volume: s.volume,
      relativeWidth
    };
  });

  return {
    timestamp: Date.now(),
    healthScore,
    riskScore,
    healthConfidence,
    regime,
    regimeScore,
    regimeConfidence,
    regimeExplanations,
    fgScore,
    fgLabel,
    fgDetails: {
      momentum: Math.round(indexMomentum),
      volatility: Math.round(volatilityFG),
      breadth: Math.round(breadthFG),
      volume: Math.round(volumeFG),
      trend: Math.round(trendFG)
    },
    breadth: {
      advancers,
      decliners,
      unchanged,
      newHighs,
      newLows,
      adRatio,
      upVolume,
      downVolume,
      breadthPct
    },
    sectors: sectorsData,
    leadingSector,
    weakestSector,
    flow: {
      totalInflow,
      totalOutflow,
      netInflow,
      growthFlow,
      defensiveFlow,
      inflowSectors,
      outflowSectors
    },
    heatStripStocks
  };
}
