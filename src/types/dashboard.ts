export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  priceHistory: number[];
}

export interface PortfolioBreakdown {
  label: string; // e.g., "Stocks", "ETFs", "Crypto"
  value: number; // absolute value
  percentage: number; // percentage value (0 to 100)
  color: string; // Tailwind color class or hex string
}

export interface PortfolioValue {
  currentBalance: number;
  change: number;
  changePercent: number;
  history: number[];
  breakdown: PortfolioBreakdown[];
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  category: string;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface DashboardData {
  gainers: Stock[];
  losers: Stock[];
  portfolio: PortfolioValue;
  watchlist: WatchlistItem[];
  news: NewsItem[];
}
