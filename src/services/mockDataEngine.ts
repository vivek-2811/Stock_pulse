export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  industry: string;
  peRatio: number;
  eps: number;
  dividendYield: number;
  high52W: number;
  low52W: number;
  avgVolume: number;
  beta: number;
  sparkline: number[];
}

export interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

export interface CandlestickData {
  time: number; // UNIX timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  summary: string;
  thumbnail: string;
  category: 'Markets' | 'Tech' | 'Crypto' | 'Economy';
  url: string;
}

import { generateAllStocks } from './mock/stockGenerator';

const INITIAL_INDICES: Omit<MarketIndex, 'sparkline'>[] = [
  { symbol: 'S&P 500', name: 'S&P 500 Index', price: 5431.60, change: 25.40, changePercent: 0.47 },
  { symbol: 'NASDAQ', name: 'NASDAQ Composite', price: 17852.12, change: 145.22, changePercent: 0.82 },
  { symbol: 'DOW JONES', name: 'Dow Jones Industrial Average', price: 39150.85, change: -85.10, changePercent: -0.22 },
  { symbol: 'Russell 2000', name: 'Russell 2000 Index', price: 2022.04, change: 12.34, changePercent: 0.61 }
];

// In-memory state
let stocks: Stock[] = [];
let indices: MarketIndex[] = [];
let isMarketOpen = true;

// Subscribers list
type TickCallback = (data: { stocks: Stock[]; indices: MarketIndex[]; isMarketOpen: boolean }) => void;
const subscribers = new Set<TickCallback>();

// Helper to generate a mini sparkline array
function generateSparkline(basePrice: number, points = 12): number[] {
  const data: number[] = [];
  let curr = basePrice * 0.98;
  for (let i = 0; i < points; i++) {
    curr += (Math.random() - 0.48) * (basePrice * 0.01);
    data.push(curr);
  }
  return data;
}

// Initialize state
function init() {
  stocks = generateAllStocks().map(s => ({
    ...s,
    sparkline: generateSparkline(s.price, 15)
  }));
  
  indices = INITIAL_INDICES.map(idx => ({
    ...idx,
    sparkline: generateSparkline(idx.price, 15)
  }));
}

init();

// Simulated WebSocket pricing ticker loop
let tickIntervalId: any = null;
let updateFrequencyMs = 3000; // default 3s

function startPriceTicker() {
  if (tickIntervalId) clearInterval(tickIntervalId);
  
  tickIntervalId = setInterval(() => {
    if (!isMarketOpen) return;
    
    // Update indices
    indices = indices.map(idx => {
      const direction = idx.symbol === 'DOW JONES' ? -0.45 : 0.52; // Maintain typical daily bias
      const variance = (Math.random() - direction) * 0.002;
      const changeVal = idx.price * variance;
      const newPrice = Number((idx.price + changeVal).toFixed(2));
      const totalChange = Number((idx.change + changeVal).toFixed(2));
      const originalBase = idx.price - idx.change;
      const percent = Number(((totalChange / originalBase) * 100).toFixed(2));
      
      const newSparkline = [...idx.sparkline.slice(1), newPrice];
      
      return {
        ...idx,
        price: newPrice,
        change: totalChange,
        changePercent: percent,
        sparkline: newSparkline
      };
    });
    
    // Update stocks
    stocks = stocks.map(stock => {
      const volatility = stock.beta * 0.0015;
      // TSLA, NVDA are more volatile, Coca Cola less
      const direction = Math.random() - 0.49; // slight upward drift
      const changeVal = stock.price * direction * volatility;
      const newPrice = Number((stock.price + changeVal).toFixed(2));
      const totalChange = Number((stock.change + changeVal).toFixed(2));
      const originalBase = stock.price - stock.change;
      const percent = Number(((totalChange / originalBase) * 100).toFixed(2));
      const volChange = Math.floor(Math.random() * 5000);
      
      const newSparkline = [...stock.sparkline.slice(1), newPrice];

      return {
        ...stock,
        price: newPrice,
        change: totalChange,
        changePercent: percent,
        volume: stock.volume + volChange,
        sparkline: newSparkline
      };
    });
    
    // Notify all subscribers
    notifySubscribers();
  }, updateFrequencyMs);
}

function notifySubscribers() {
  const data = { stocks, indices, isMarketOpen };
  subscribers.forEach(cb => cb(data));
}

// Start immediately
startPriceTicker();

// Exported actions
export const mockDataEngine = {
  getStocks(): Stock[] {
    return stocks;
  },
  
  getIndices(): MarketIndex[] {
    return indices;
  },
  
  isMarketOpen(): boolean {
    return isMarketOpen;
  },
  
  toggleMarketStatus() {
    isMarketOpen = !isMarketOpen;
    notifySubscribers();
    return isMarketOpen;
  },
  
  setRefreshInterval(seconds: number) {
    updateFrequencyMs = seconds * 1000;
    startPriceTicker();
  },
  
  subscribe(callback: TickCallback) {
    subscribers.add(callback);
    // Initial call
    callback({ stocks, indices, isMarketOpen });
    return () => {
      subscribers.delete(callback);
    };
  },
  
  getNews(category?: string): NewsItem[] {
    const allNews: NewsItem[] = [
      {
        id: 'news-1',
        title: 'NVIDIA Market Cap Vaults Over Tech Rivals in Explosive AI Growth',
        source: 'Financial Pulse',
        date: '10 minutes ago',
        summary: 'NVIDIA gains momentum as cloud hyperscalers buy next-gen Blackwell chips. Analysts boost targets, signaling more growth in enterprise computing sectors.',
        thumbnail: 'https://picsum.photos/seed/nvda/200/120',
        category: 'Tech',
        url: '#'
      },
      {
        id: 'news-2',
        title: 'Federal Reserve Signals Interest Rates to Hold Steady at Current Targets',
        source: 'Macro Market Review',
        date: '45 minutes ago',
        summary: 'Central bank policymakers noted progress on inflation but requested additional core price datasets before initiating rate cuts later in the year.',
        thumbnail: 'https://picsum.photos/seed/fed/200/120',
        category: 'Economy',
        url: '#'
      },
      {
        id: 'news-3',
        title: 'Apple Announces Integration of Open-Source Neural Models into iOS Ecosystem',
        source: 'TechSentry',
        date: '2 hours ago',
        summary: 'In a surprise developers announcement, Apple revealed a deep integration of hardware-accelerated local models aiming to bolster user productivity metrics.',
        thumbnail: 'https://picsum.photos/seed/apple/200/120',
        category: 'Tech',
        url: '#'
      },
      {
        id: 'news-4',
        title: 'S&P 500 Reaches Fresh Intra-Day Highs Amid Tech and Banking Momentum',
        source: 'Wall Street Bulletin',
        date: '3 hours ago',
        summary: 'Equities trade higher as financial giants match earning estimates. Traders maintain bullish forecasts leading into next weeks economic projections.',
        thumbnail: 'https://picsum.photos/seed/bull/200/120',
        category: 'Markets',
        url: '#'
      },
      {
        id: 'news-5',
        title: 'Bitcoin Consolidates Above Key Support Level as Institutional Inflow Continues',
        source: 'CryptoAnalytica',
        date: '4 hours ago',
        summary: 'Cryptocurrency volumes stabilize. Heavy net accumulation of Bitcoin by spot ETFs supports market optimism despite recent liquidations.',
        thumbnail: 'https://picsum.photos/seed/bitcoin/200/120',
        category: 'Crypto',
        url: '#'
      },
      {
        id: 'news-6',
        title: 'Retail Spending Gains Mildly, Pointing to Resilient Consumer Defensive Sector',
        source: 'Macro Market Review',
        date: '5 hours ago',
        summary: 'Walmart and Pepsi reports suggest consumers are adapting well to persistent price thresholds, keeping retail margins robust and dividend payouts stable.',
        thumbnail: 'https://picsum.photos/seed/retail/200/120',
        category: 'Economy',
        url: '#'
      },
      {
        id: 'news-7',
        title: 'Tesla Re-examines Next-Gen Gigafactory Timelines to Optimize Model Pricing',
        source: 'AutoDrive Weekly',
        date: '6 hours ago',
        summary: 'Tesla focuses on capital expenditures management, optimizing battery cell yield counts at existing Gigafactories rather than immediate physical expansion.',
        thumbnail: 'https://picsum.photos/seed/tesla/200/120',
        category: 'Tech',
        url: '#'
      },
      {
        id: 'news-8',
        title: 'Global Chip Supply Chain Redundancy Boosted by Strategic Fabrication Sites',
        source: 'Semiconductor Today',
        date: '1 day ago',
        summary: 'TSMC, Intel, and AMD push forward with regional manufacturing hubs in Europe and North America to shield against localized geo-economic incidents.',
        thumbnail: 'https://picsum.photos/seed/chips/200/120',
        category: 'Markets',
        url: '#'
      }
    ];
    
    if (category) {
      return allNews.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }
    return allNews;
  },
  
  getHistoricalData(symbol: string, timeframe: string): CandlestickData[] {
    const asset = (stocks.find(s => s.symbol === symbol) || indices.find(i => i.symbol === symbol) || stocks[0]) as any;
    const basePrice = asset.price;
    const assetVolume = asset.volume || 500000000;
    
    let points = 60;
    let timeStepSeconds = 300; // 5 minutes
    
    switch (timeframe) {
      case '1D':
        points = 78; // 6.5 hours * 12 points/hour (5-min intervals)
        timeStepSeconds = 300; 
        break;
      case '1W':
        points = 168; // 24 hours * 7 days (hourly intervals)
        timeStepSeconds = 3600;
        break;
      case '1M':
        points = 30; // 30 days
        timeStepSeconds = 86400;
        break;
      case '3M':
        points = 90; // 90 days
        timeStepSeconds = 86400;
        break;
      case '6M':
        points = 180; // 180 days
        timeStepSeconds = 86400;
        break;
      case '1Y':
        points = 365; // 365 days
        timeStepSeconds = 86400;
        break;
      case '5Y':
        points = 260; // 52 weeks * 5 years (weekly)
        timeStepSeconds = 86400 * 7;
        break;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const data: CandlestickData[] = [];
    
    // Seeded random number generator so the chart for a stock is stable
    let seed = 0;
    for (let c = 0; c < symbol.length; c++) seed += symbol.charCodeAt(c);
    
    function seededRandom() {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }
    
    let currentPrice = basePrice * (0.85 + seededRandom() * 0.15); // start lower than current price
    
    for (let i = points; i > 0; i--) {
      const time = now - i * timeStepSeconds;
      
      const changePercent = (seededRandom() - 0.485) * 0.02; // slight positive bias
      const open = Number(currentPrice.toFixed(2));
      const close = Number((currentPrice * (1 + changePercent)).toFixed(2));
      
      const volatility = 0.015;
      const high = Number((Math.max(open, close) * (1 + seededRandom() * volatility)).toFixed(2));
      const low = Number((Math.min(open, close) * (1 - seededRandom() * volatility)).toFixed(2));
      
      const volume = Math.floor(seededRandom() * (assetVolume / points) * 2 + 5000);
      
      data.push({
        time,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }
    
    // Make the last point match the live price
    if (data.length > 0) {
      data[data.length - 1].close = asset.price;
      if (data[data.length - 1].open > asset.price) {
        data[data.length - 1].high = Math.max(data[data.length - 1].high, data[data.length - 1].open);
        data[data.length - 1].low = Math.min(data[data.length - 1].low, asset.price);
      } else {
        data[data.length - 1].high = Math.max(data[data.length - 1].high, asset.price);
        data[data.length - 1].low = Math.min(data[data.length - 1].low, data[data.length - 1].open);
      }
    }
    
    return data;
  }
};
