import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────
export type NewsCategory =
  | 'All' | 'Market News' | 'Sector News' | 'Company News'
  | 'Earnings' | 'Economy' | 'Analyst Actions' | 'My News';

export type NewsSentiment = 'Bullish' | 'Neutral' | 'Bearish';
export type ImpactLevel = 'Low' | 'Medium' | 'High';
export type CatalystType =
  | 'Earnings' | 'Product Launch' | 'Dividend' | 'Buyback'
  | 'Upgrade' | 'Downgrade' | 'Market Event' | 'Economic Data' | 'Regulatory';

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  publishedAt: string;       // ISO string
  category: NewsCategory;
  sentiment: NewsSentiment;
  impactScore: number;       // 0–100
  impactLevel: ImpactLevel;
  relatedSymbols: string[];
  relatedSector: string;
  isBreaking: boolean;
  sourceUrl: string;
}

export interface CatalystEvent {
  id: string;
  symbol: string;
  type: CatalystType;
  title: string;
  description: string;
  timestamp: string;
  sentiment: NewsSentiment;
  impact: ImpactLevel;
  analystTarget?: number;
  analystFirm?: string;
}

export interface EarningsEntry {
  symbol: string;
  name: string;
  reportDate: string;        // ISO string
  epsEstimate: number;
  epsPrevious: number;
  revenueEstimate: string;   // e.g. "$12.4B"
  time: 'Before Open' | 'After Close' | 'During Market';
  sector: string;
}

export interface SectorSentimentEntry {
  sector: string;
  bullishPct: number;
  neutralPct: number;
  bearishPct: number;
  topHeadline: string;
  leader: string;
  laggard: string;
}

export interface TrendingStock {
  symbol: string;
  name: string;
  trendScore: number;
  momentumScore: number;
  sentimentScore: number;
  newsCount: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  sector: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  label: string;
  description: string;
  type: 'market' | 'catalyst' | 'macro' | 'sector' | 'alert';
  symbol?: string;
}

// ─── Seeded data generators ───────────────────────────────────────────────────
const SOURCES = [
  'Bloomberg', 'Reuters', 'CNBC', 'WSJ', 'MarketWatch',
  'Benzinga', 'Barron\'s', 'Financial Times', 'Seeking Alpha', 'The Motley Fool',
];

const SECTORS = [
  'Technology', 'Healthcare', 'Financials', 'Energy',
  'Consumer', 'Industrials', 'Utilities', 'Communication',
];

function seedId(prefix: string, n: number) {
  return `${prefix}-${n}`;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}
function minutesAgo(m: number): string {
  return new Date(Date.now() - m * 60000).toISOString();
}

// ─── Static news articles ─────────────────────────────────────────────────────
export const STATIC_ARTICLES: NewsArticle[] = [
  {
    id: 'n-1', headline: 'NVIDIA Surges on Record Data Center Revenue Beat',
    summary: 'NVIDIA reported quarterly data center revenue of $22.6B, crushing analyst estimates of $21.2B. CEO Jensen Huang cited accelerating AI infrastructure demand from hyperscalers.',
    source: 'Bloomberg', publishedAt: minutesAgo(8), category: 'Company News',
    sentiment: 'Bullish', impactScore: 94, impactLevel: 'High',
    relatedSymbols: ['NVDA', 'AMD', 'INTC'], relatedSector: 'Technology',
    isBreaking: true, sourceUrl: '#',
  },
  {
    id: 'n-2', headline: 'Fed Chair Signals Rate Cut Pause Through Q3',
    summary: 'Federal Reserve Chair indicated that persistent inflation data may delay the first rate cut beyond market expectations. Bond yields rose sharply following the remarks.',
    source: 'Reuters', publishedAt: minutesAgo(22), category: 'Economy',
    sentiment: 'Bearish', impactScore: 88, impactLevel: 'High',
    relatedSymbols: ['TLT', 'GLD'], relatedSector: 'Financials',
    isBreaking: true, sourceUrl: '#',
  },
  {
    id: 'n-3', headline: 'Apple Announces $110B Share Buyback Program',
    summary: 'Apple Inc. authorized a record $110 billion share repurchase program alongside quarterly earnings that topped Wall Street forecasts on both revenue and EPS.',
    source: 'CNBC', publishedAt: hoursAgo(1), category: 'Company News',
    sentiment: 'Bullish', impactScore: 82, impactLevel: 'High',
    relatedSymbols: ['AAPL'], relatedSector: 'Technology',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-4', headline: 'Goldman Sachs Upgrades Microsoft to Buy, $520 Target',
    summary: 'Goldman Sachs raised Microsoft to Buy from Neutral, setting a price target of $520, citing Azure AI growth acceleration and expanding Copilot monetization.',
    source: 'Barron\'s', publishedAt: hoursAgo(2), category: 'Analyst Actions',
    sentiment: 'Bullish', impactScore: 76, impactLevel: 'High',
    relatedSymbols: ['MSFT'], relatedSector: 'Technology',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-5', headline: 'Oil Slides 3% on OPEC+ Production Increase Rumors',
    summary: 'Crude oil prices fell sharply on reports that OPEC+ members are considering unwinding production cuts ahead of schedule. WTI crude dropped to $78/barrel.',
    source: 'Financial Times', publishedAt: hoursAgo(2), category: 'Sector News',
    sentiment: 'Bearish', impactScore: 70, impactLevel: 'Medium',
    relatedSymbols: ['XOM', 'CVX', 'COP'], relatedSector: 'Energy',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-6', headline: 'Technology Sector Breadth Reaches 68% — Risk-On Signal',
    summary: 'More than 68% of S&P 500 technology stocks are trading above their 50-day moving averages, a level historically associated with continued sector leadership.',
    source: 'MarketWatch', publishedAt: hoursAgo(3), category: 'Market News',
    sentiment: 'Bullish', impactScore: 62, impactLevel: 'Medium',
    relatedSymbols: ['QQQ', 'XLK'], relatedSector: 'Technology',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-7', headline: 'JPMorgan Downgrades Tesla, Cuts Target to $130',
    summary: 'JPMorgan analysts lowered Tesla to Underweight citing pricing pressure, margin compression in China, and intensifying EV competition from BYD and legacy OEMs.',
    source: 'Seeking Alpha', publishedAt: hoursAgo(4), category: 'Analyst Actions',
    sentiment: 'Bearish', impactScore: 78, impactLevel: 'High',
    relatedSymbols: ['TSLA'], relatedSector: 'Consumer',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-8', headline: 'Healthcare Stocks Rally as FDA Approves Novo Nordisk Obesity Drug',
    summary: 'The FDA granted approval to Novo Nordisk\'s semaglutide variant, sending healthcare stocks broadly higher. Eli Lilly shares also gained on competitive positioning.',
    source: 'Bloomberg', publishedAt: hoursAgo(5), category: 'Sector News',
    sentiment: 'Bullish', impactScore: 72, impactLevel: 'High',
    relatedSymbols: ['LLY', 'NVO', 'BMY'], relatedSector: 'Healthcare',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-9', headline: 'Meta Platforms Raises Q3 Guidance on AI Ad Revenue Surge',
    summary: 'Meta raised its revenue outlook for Q3 2026 by 8% above consensus, driven by AI-optimized advertising and Reels monetization. Shares rose 6% after-hours.',
    source: 'WSJ', publishedAt: hoursAgo(6), category: 'Company News',
    sentiment: 'Bullish', impactScore: 80, impactLevel: 'High',
    relatedSymbols: ['META', 'GOOGL', 'SNAP'], relatedSector: 'Communication',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-10', headline: 'US CPI Data Beats Estimates — Inflation Remains Sticky',
    summary: 'The Consumer Price Index rose 3.4% YoY in May, above the 3.2% consensus forecast. Core CPI ex food and energy came in at 3.6%, fueling hawkish Fed expectations.',
    source: 'Reuters', publishedAt: hoursAgo(7), category: 'Economy',
    sentiment: 'Bearish', impactScore: 85, impactLevel: 'High',
    relatedSymbols: [], relatedSector: 'Financials',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-11', headline: 'Amazon Web Services Signs $4B AI Compute Deal with Anthropic',
    summary: 'Amazon expanded its strategic partnership with Anthropic, committing $4B in cloud compute capacity. AWS CEO cited AI workloads as the fastest-growing cloud segment.',
    source: 'CNBC', publishedAt: hoursAgo(8), category: 'Company News',
    sentiment: 'Bullish', impactScore: 74, impactLevel: 'High',
    relatedSymbols: ['AMZN', 'GOOGL', 'MSFT'], relatedSector: 'Technology',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-12', headline: 'Financials Sector Outperforms on Strong Bank Earnings Beat',
    summary: 'Major U.S. banks reported Q2 earnings well ahead of consensus, with net interest income remaining resilient. The XLF ETF rose 2.1% on broad sector strength.',
    source: 'Benzinga', publishedAt: hoursAgo(9), category: 'Sector News',
    sentiment: 'Bullish', impactScore: 68, impactLevel: 'Medium',
    relatedSymbols: ['JPM', 'BAC', 'GS', 'MS'], relatedSector: 'Financials',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-13', headline: 'Morgan Stanley Initiates Palantir at Overweight, $40 Target',
    summary: 'Morgan Stanley began coverage of Palantir Technologies with an Overweight rating, citing AI platform differentiation and growing U.S. government contract pipeline.',
    source: 'Barron\'s', publishedAt: hoursAgo(10), category: 'Analyst Actions',
    sentiment: 'Bullish', impactScore: 65, impactLevel: 'Medium',
    relatedSymbols: ['PLTR'], relatedSector: 'Technology',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-14', headline: 'Utilities Sector Lags as Rate Cut Expectations Fade',
    summary: 'Rate-sensitive utility stocks underperformed broad indices as bond yields climbed. The XLU ETF fell 1.4%, marking its third consecutive week of outflows.',
    source: 'MarketWatch', publishedAt: hoursAgo(11), category: 'Sector News',
    sentiment: 'Bearish', impactScore: 55, impactLevel: 'Medium',
    relatedSymbols: ['XLU', 'NEE', 'DUK'], relatedSector: 'Utilities',
    isBreaking: false, sourceUrl: '#',
  },
  {
    id: 'n-15', headline: 'Berkshire Hathaway Discloses New Position in Chubb Insurance',
    summary: 'Berkshire Hathaway disclosed a $6.7B stake in Chubb Ltd in its 13-F filing, revealing Warren Buffett had been quietly accumulating the position over two quarters.',
    source: 'WSJ', publishedAt: hoursAgo(12), category: 'Company News',
    sentiment: 'Bullish', impactScore: 70, impactLevel: 'Medium',
    relatedSymbols: ['BRK.B', 'CB'], relatedSector: 'Financials',
    isBreaking: false, sourceUrl: '#',
  },
];

// ─── Catalyst events ──────────────────────────────────────────────────────────
export const STATIC_CATALYSTS: CatalystEvent[] = [
  { id: 'c-1', symbol: 'NVDA', type: 'Earnings', title: 'NVDA Q2 Earnings Beat', description: 'Revenue $30.0B vs $28.6B est. EPS $6.12 vs $5.59 est.', timestamp: minutesAgo(15), sentiment: 'Bullish', impact: 'High' },
  { id: 'c-2', symbol: 'MSFT', type: 'Upgrade', title: 'Goldman Sachs Upgrade', description: 'Raised to Buy. Target $520. Azure AI acceleration cited.', timestamp: hoursAgo(2), sentiment: 'Bullish', impact: 'High', analystFirm: 'Goldman Sachs', analystTarget: 520 },
  { id: 'c-3', symbol: 'AAPL', type: 'Buyback', title: '$110B Share Buyback', description: 'Record repurchase authorization. Yield-enhancing for shareholders.', timestamp: hoursAgo(1), sentiment: 'Bullish', impact: 'High' },
  { id: 'c-4', symbol: 'TSLA', type: 'Downgrade', title: 'JPMorgan Downgrade', description: 'Cut to Underweight. Target $130. Margin compression concern.', timestamp: hoursAgo(4), sentiment: 'Bearish', impact: 'High', analystFirm: 'JPMorgan', analystTarget: 130 },
  { id: 'c-5', symbol: 'META', type: 'Earnings', title: 'META Raises Q3 Guidance', description: 'Q3 revenue guide $8% above consensus on AI ad revenue.', timestamp: hoursAgo(6), sentiment: 'Bullish', impact: 'High' },
  { id: 'c-6', symbol: 'LLY', type: 'Regulatory', title: 'FDA Drug Approval', description: 'Semaglutide obesity variant receives full FDA approval.', timestamp: hoursAgo(5), sentiment: 'Bullish', impact: 'High' },
  { id: 'c-7', symbol: 'AMZN', type: 'Product Launch', title: 'AWS-Anthropic $4B Deal', description: 'Expanded AI compute partnership. Largest cloud AI commitment.', timestamp: hoursAgo(8), sentiment: 'Bullish', impact: 'Medium' },
  { id: 'c-8', symbol: 'PLTR', type: 'Upgrade', title: 'Morgan Stanley Initiation', description: 'Overweight initiation. $40 target. AI platform differentiation.', timestamp: hoursAgo(10), sentiment: 'Bullish', impact: 'Medium', analystFirm: 'Morgan Stanley', analystTarget: 40 },
  { id: 'c-9', symbol: 'XOM', type: 'Market Event', title: 'Oil Sector Pressure', description: 'WTI crude -3% on OPEC+ production increase speculation.', timestamp: hoursAgo(2), sentiment: 'Bearish', impact: 'Medium' },
  { id: 'c-10', symbol: 'JPM', type: 'Earnings', title: 'JPM Q2 Net Interest Beat', description: 'Net interest income $23.2B vs $22.8B est. Resilient NIM.', timestamp: hoursAgo(9), sentiment: 'Bullish', impact: 'High' },
];

// ─── Earnings calendar ────────────────────────────────────────────────────────
function daysFromNow(d: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
}

export const EARNINGS_CALENDAR: EarningsEntry[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', reportDate: daysFromNow(0), epsEstimate: 6.12, epsPrevious: 5.16, revenueEstimate: '$30.0B', time: 'After Close', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp', reportDate: daysFromNow(1), epsEstimate: 2.94, epsPrevious: 2.93, revenueEstimate: '$64.5B', time: 'After Close', sector: 'Technology' },
  { symbol: 'AAPL', name: 'Apple Inc', reportDate: daysFromNow(2), epsEstimate: 1.35, epsPrevious: 1.26, revenueEstimate: '$90.3B', time: 'After Close', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', reportDate: daysFromNow(3), epsEstimate: 1.84, epsPrevious: 1.89, revenueEstimate: '$89.6B', time: 'After Close', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms', reportDate: daysFromNow(4), epsEstimate: 4.72, epsPrevious: 4.71, revenueEstimate: '$38.3B', time: 'After Close', sector: 'Communication' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', reportDate: daysFromNow(5), epsEstimate: 0.84, epsPrevious: 0.53, revenueEstimate: '$148.6B', time: 'After Close', sector: 'Consumer' },
  { symbol: 'JPM', name: 'JPMorgan Chase', reportDate: daysFromNow(7), epsEstimate: 4.11, epsPrevious: 4.63, revenueEstimate: '$42.4B', time: 'Before Open', sector: 'Financials' },
  { symbol: 'LLY', name: 'Eli Lilly & Co', reportDate: daysFromNow(8), epsEstimate: 2.58, epsPrevious: 2.58, revenueEstimate: '$8.8B', time: 'Before Open', sector: 'Healthcare' },
  { symbol: 'TSLA', name: 'Tesla Inc', reportDate: daysFromNow(10), epsEstimate: 0.52, epsPrevious: 0.45, revenueEstimate: '$25.6B', time: 'After Close', sector: 'Consumer' },
  { symbol: 'PLTR', name: 'Palantir Technologies', reportDate: daysFromNow(12), epsEstimate: 0.09, epsPrevious: 0.08, revenueEstimate: '$899M', time: 'After Close', sector: 'Technology' },
  { symbol: 'XOM', name: 'ExxonMobil Corp', reportDate: daysFromNow(14), epsEstimate: 2.02, epsPrevious: 2.14, revenueEstimate: '$90.1B', time: 'Before Open', sector: 'Energy' },
  { symbol: 'BAC', name: 'Bank of America', reportDate: daysFromNow(14), epsEstimate: 0.80, epsPrevious: 0.83, revenueEstimate: '$25.5B', time: 'Before Open', sector: 'Financials' },
];

// ─── Timeline events ──────────────────────────────────────────────────────────
export const STATIC_TIMELINE: TimelineEvent[] = [
  { id: 't-1', time: '09:30', label: 'Market Open', description: 'US equity markets open. Futures indicated +0.4%.', type: 'market' },
  { id: 't-2', time: '09:45', label: 'NVDA Surge', description: 'NVDA +4.2% on earnings beat. Data center revenue record.', type: 'catalyst', symbol: 'NVDA' },
  { id: 't-3', time: '10:15', label: 'MSFT Upgrade', description: 'Goldman Sachs upgrades MSFT to Buy, $520 target.', type: 'catalyst', symbol: 'MSFT' },
  { id: 't-4', time: '10:30', label: 'Tech Sector Leadership', description: 'Technology sector moves to #1 position in S&P 500 breadth.', type: 'sector' },
  { id: 't-5', time: '11:00', label: 'CPI Data Released', description: 'US CPI 3.4% YoY, above 3.2% est. Bond yields rise sharply.', type: 'macro' },
  { id: 't-6', time: '11:30', label: 'TSLA Downgrade', description: 'JPMorgan downgrades TSLA to Underweight. Target $130.', type: 'catalyst', symbol: 'TSLA' },
  { id: 't-7', time: '12:00', label: 'Fear & Greed at 74', description: 'Sentiment indicator crosses 70 — Greed territory.', type: 'alert' },
  { id: 't-8', time: '13:00', label: 'Oil -3%', description: 'WTI crude drops on OPEC+ production increase speculation.', type: 'macro' },
  { id: 't-9', time: '13:30', label: 'FDA Approval', description: 'FDA approves Novo Nordisk obesity drug. LLY +2.8%.', type: 'catalyst', symbol: 'LLY' },
  { id: 't-10', time: '14:00', label: 'AAPL Buyback', description: 'Apple announces record $110B share repurchase program.', type: 'catalyst', symbol: 'AAPL' },
  { id: 't-11', time: '14:45', label: 'Fed Commentary', description: 'FOMC minutes confirm rate cut pause through Q3 2026.', type: 'macro' },
  { id: 't-12', time: '15:45', label: 'Power Hour Begins', description: 'Volume spike as institutional positioning ahead of close.', type: 'market' },
  { id: 't-13', time: '16:00', label: 'Market Close', description: 'S&P 500 closes +0.7%. NASDAQ leads at +1.1%.', type: 'market' },
];

// ─── Sector sentiment ─────────────────────────────────────────────────────────
export const SECTOR_SENTIMENT: SectorSentimentEntry[] = [
  { sector: 'Technology', bullishPct: 72, neutralPct: 18, bearishPct: 10, topHeadline: 'AI demand drives record data center orders', leader: 'NVDA', laggard: 'INTC' },
  { sector: 'Healthcare', bullishPct: 60, neutralPct: 25, bearishPct: 15, topHeadline: 'FDA approves Novo Nordisk obesity drug', leader: 'LLY', laggard: 'PFE' },
  { sector: 'Financials', bullishPct: 55, neutralPct: 30, bearishPct: 15, topHeadline: 'Banks beat on net interest income', leader: 'JPM', laggard: 'SCHW' },
  { sector: 'Energy', bullishPct: 28, neutralPct: 32, bearishPct: 40, topHeadline: 'Oil slides on OPEC+ production rumors', leader: 'CVX', laggard: 'OXY' },
  { sector: 'Consumer', bullishPct: 48, neutralPct: 28, bearishPct: 24, topHeadline: 'Amazon AWS-Anthropic deal boosts confidence', leader: 'AMZN', laggard: 'TSLA' },
  { sector: 'Industrials', bullishPct: 50, neutralPct: 32, bearishPct: 18, topHeadline: 'Infrastructure spending supports industrial demand', leader: 'CAT', laggard: 'BA' },
  { sector: 'Utilities', bullishPct: 30, neutralPct: 35, bearishPct: 35, topHeadline: 'Rate cut delay pressures rate-sensitive utilities', leader: 'SO', laggard: 'NEE' },
  { sector: 'Communication', bullishPct: 65, neutralPct: 22, bearishPct: 13, topHeadline: 'Meta raises Q3 guidance on AI ad revenue', leader: 'META', laggard: 'PARA' },
];

// ─── Store ────────────────────────────────────────────────────────────────────
interface NewsState {
  activeCategory: NewsCategory;
  searchQuery: string;
  bookmarks: string[];
  earningsView: 'today' | 'week' | 'month';

  setCategory: (cat: NewsCategory) => void;
  setSearch: (q: string) => void;
  toggleBookmark: (id: string) => void;
  setEarningsView: (v: 'today' | 'week' | 'month') => void;
}

export const useNewsStore = create<NewsState>()(
  persist(
    (set) => ({
      activeCategory: 'All',
      searchQuery: '',
      bookmarks: [],
      earningsView: 'week',

      setCategory: (cat) => set({ activeCategory: cat }),
      setSearch: (q) => set({ searchQuery: q }),
      toggleBookmark: (id) =>
        set((s) => ({
          bookmarks: s.bookmarks.includes(id)
            ? s.bookmarks.filter((b) => b !== id)
            : [...s.bookmarks, id],
        })),
      setEarningsView: (v) => set({ earningsView: v }),
    }),
    { name: 'stockpulse-news' }
  )
);
