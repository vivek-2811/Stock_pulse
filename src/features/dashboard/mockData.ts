import type { DashboardData } from '../../types/dashboard';

export const mockDashboardData: DashboardData = {
  gainers: [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 128.50,
      change: 5.95,
      changePercent: 4.85,
      priceHistory: [118.2, 120.5, 122.1, 121.8, 124.0, 125.6, 128.5]
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      price: 185.20,
      change: 6.10,
      changePercent: 3.40,
      priceHistory: [175.4, 178.2, 177.0, 180.1, 179.9, 182.3, 185.2]
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      price: 160.40,
      change: 4.60,
      changePercent: 2.95,
      priceHistory: [152.0, 154.5, 156.2, 155.0, 158.1, 159.2, 160.4]
    },
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 192.30,
      change: 4.05,
      changePercent: 2.15,
      priceHistory: [186.2, 187.5, 189.0, 188.4, 190.1, 191.0, 192.3]
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: 415.60,
      change: 7.35,
      changePercent: 1.80,
      priceHistory: [405.0, 408.2, 410.1, 409.5, 412.0, 413.5, 415.6]
    }
  ],
  losers: [
    {
      symbol: 'COIN',
      name: 'Coinbase Global, Inc.',
      price: 220.50,
      change: -13.10,
      changePercent: -5.60,
      priceHistory: [238.2, 235.0, 230.1, 232.4, 228.0, 226.5, 220.5]
    },
    {
      symbol: 'NFLX',
      name: 'Netflix, Inc.',
      price: 610.20,
      change: -20.15,
      changePercent: -3.20,
      priceHistory: [635.0, 630.2, 628.0, 632.1, 624.5, 620.0, 610.2]
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 170.10,
      change: -4.18,
      changePercent: -2.40,
      priceHistory: [175.2, 174.0, 173.5, 174.1, 172.5, 171.8, 170.1]
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      price: 178.40,
      change: -3.55,
      changePercent: -1.95,
      priceHistory: [182.5, 181.0, 180.2, 181.5, 179.8, 179.0, 178.4]
    },
    {
      symbol: 'META',
      name: 'Meta Platforms, Inc.',
      price: 475.30,
      change: -8.95,
      changePercent: -1.85,
      priceHistory: [488.2, 485.0, 482.1, 484.5, 480.0, 478.5, 475.3]
    }
  ],
  portfolio: {
    currentBalance: 142384.50,
    change: 2840.20,
    changePercent: 2.04,
    history: [137500, 138800, 138100, 140200, 141400, 140900, 142384.5],
    breakdown: [
      {
        label: 'Stocks',
        value: 92549.92,
        percentage: 65,
        color: 'bg-app-green'
      },
      {
        label: 'ETFs',
        value: 35596.12,
        percentage: 25,
        color: 'bg-on-surface-variant'
      },
      {
        label: 'Crypto',
        value: 14238.46,
        percentage: 10,
        color: 'bg-tertiary-fixed-dim'
      }
    ]
  },
  watchlist: [
    {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 192.30,
      change: 4.05,
      changePercent: 2.15
    },
    {
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      price: 185.20,
      change: 6.10,
      changePercent: 3.40
    },
    {
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      price: 178.40,
      change: -3.55,
      changePercent: -1.95
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corp.',
      price: 415.60,
      change: 7.35,
      changePercent: 1.80
    },
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 67230.00,
      change: -576.20,
      changePercent: -0.85
    }
  ],
  news: [
    {
      id: 'news-1',
      title: 'Nvidia Hits All-Time High as AI Chips Demand Surges',
      source: 'Reuters',
      timeAgo: '10m ago',
      category: 'TECH'
    },
    {
      id: 'news-2',
      title: 'Federal Reserve Signals Rates May Remain High For Longer',
      source: 'Bloomberg',
      timeAgo: '35m ago',
      category: 'MACRO'
    },
    {
      id: 'news-3',
      title: 'Bitcoin Consolidation Continues Ahead of Options Expiry',
      source: 'CoinDesk',
      timeAgo: '1h ago',
      category: 'CRYPTO'
    },
    {
      id: 'news-4',
      title: 'Apple Unveils New AI Features at WWDC, Stocks Rally',
      source: 'CNBC',
      timeAgo: '2h ago',
      category: 'TECH'
    },
    {
      id: 'news-5',
      title: 'Retail Sales Rise in May, Beating Wall Street Estimates',
      source: 'WSJ',
      timeAgo: '3h ago',
      category: 'MACRO'
    }
  ]
};
