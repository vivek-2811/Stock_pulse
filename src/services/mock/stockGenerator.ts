import type { Stock } from '../mockDataEngine';

// Seeded random number generator for 100% deterministic mock data
function createSeededRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// 20 real stocks from mockDataEngine, updated to standard sectors
export const REAL_STOCKS_BASE = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.84, change: 1.24, changePercent: 0.66, volume: 52400000, marketCap: 2980000000000, sector: 'Technology', industry: 'Consumer Electronics', peRatio: 30.5, eps: 6.22, dividendYield: 0.51, high52W: 199.62, low52W: 164.08, avgVolume: 58000000, beta: 1.28 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 421.90, change: 3.45, changePercent: 0.82, volume: 22800000, marketCap: 3130000000000, sector: 'Technology', industry: 'Software—Infrastructure', peRatio: 36.2, eps: 11.65, dividendYield: 0.71, high52W: 430.82, low52W: 315.18, avgVolume: 24500000, beta: 0.89 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 176.42, change: -0.58, changePercent: -0.33, volume: 29100000, marketCap: 2210000000000, sector: 'Communication Services', industry: 'Internet Content & Information', peRatio: 26.8, eps: 6.58, dividendYield: 0.45, high52W: 179.95, low52W: 115.50, avgVolume: 32000000, beta: 1.05 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 903.56, change: 24.12, changePercent: 2.74, volume: 48500000, marketCap: 2250000000000, sector: 'Technology', industry: 'Semiconductors', peRatio: 74.3, eps: 12.16, dividendYield: 0.02, high52W: 974.00, low52W: 373.56, avgVolume: 42000000, beta: 1.68 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 177.46, change: -4.20, changePercent: -2.31, volume: 81200000, marketCap: 565000000000, sector: 'Consumer', industry: 'Auto Manufacturers', peRatio: 58.4, eps: 3.04, dividendYield: 0.00, high52W: 299.29, low52W: 138.80, avgVolume: 94000000, beta: 2.10 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 182.15, change: 1.05, changePercent: 0.58, volume: 38400000, marketCap: 1890000000000, sector: 'Consumer', industry: 'Internet Retail', peRatio: 62.1, eps: 2.93, dividendYield: 0.00, high52W: 189.77, low52W: 101.15, avgVolume: 45000000, beta: 1.14 },
  { symbol: 'META', name: 'Meta Platforms Inc.', price: 479.80, change: -8.50, changePercent: -1.74, volume: 18900000, marketCap: 1220000000000, sector: 'Communication Services', industry: 'Internet Content & Information', peRatio: 28.9, eps: 16.60, dividendYield: 0.42, high52W: 531.49, low52W: 229.85, avgVolume: 21000000, beta: 1.22 },
  { symbol: 'NFLX', name: 'Netflix Inc.', price: 613.50, change: 5.80, changePercent: 0.95, volume: 4100000, marketCap: 265000000000, sector: 'Communication Services', industry: 'Entertainment', peRatio: 42.4, eps: 14.47, dividendYield: 0.00, high52W: 639.00, low52W: 315.62, avgVolume: 5000000, beta: 1.25 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 194.55, change: 0.22, changePercent: 0.11, volume: 9200000, marketCap: 560000000000, sector: 'Financial', industry: 'Banks—Diversified', peRatio: 12.1, eps: 16.08, dividendYield: 2.36, high52W: 200.94, low52W: 123.11, avgVolume: 11000000, beta: 1.08 },
  { symbol: 'V', name: 'Visa Inc.', price: 274.92, change: -1.18, changePercent: -0.43, volume: 6800000, marketCap: 575000000000, sector: 'Financial', industry: 'Credit Services', peRatio: 31.8, eps: 8.65, dividendYield: 0.76, high52W: 290.96, low52W: 215.14, avgVolume: 8000000, beta: 0.95 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 60.25, change: 0.40, changePercent: 0.67, volume: 16200000, marketCap: 485000000000, sector: 'Consumer', industry: 'Discount Stores', peRatio: 25.1, eps: 2.40, dividendYield: 1.39, high52W: 61.66, low52W: 48.12, avgVolume: 18000000, beta: 0.49 },
  { symbol: 'DIS', name: 'The Walt Disney Co.', price: 116.10, change: 1.85, changePercent: 1.62, volume: 11500000, marketCap: 212000000000, sector: 'Communication Services', industry: 'Entertainment', peRatio: 72.5, eps: 1.60, dividendYield: 0.39, high52W: 123.74, low52W: 78.73, avgVolume: 9500000, beta: 1.39 },
  { symbol: 'KO', name: 'The Coca-Cola Co.', price: 62.48, change: -0.12, changePercent: -0.19, volume: 14800000, marketCap: 270000000000, sector: 'Consumer', industry: 'Beverages—Non-Alcoholic', peRatio: 24.2, eps: 2.58, dividendYield: 3.07, high52W: 64.99, low52W: 51.55, avgVolume: 13500000, beta: 0.59 },
  { symbol: 'PEP', name: 'PepsiCo Inc.', price: 172.15, change: -1.05, changePercent: -0.61, volume: 5100000, marketCap: 236000000000, sector: 'Consumer', industry: 'Beverages—Non-Alcoholic', peRatio: 25.8, eps: 6.67, dividendYield: 2.92, high52W: 196.88, low52W: 155.83, avgVolume: 6000000, beta: 0.55 },
  { symbol: 'NKE', name: 'NIKE Inc.', price: 95.80, change: -0.65, changePercent: -0.67, volume: 7400000, marketCap: 145000000000, sector: 'Consumer', industry: 'Footwear & Accessories', peRatio: 26.3, eps: 3.64, dividendYield: 1.54, high52W: 122.63, low52W: 88.66, avgVolume: 8200000, beta: 1.11 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', price: 161.22, change: 3.52, changePercent: 2.23, volume: 64500000, marketCap: 260000000000, sector: 'Technology', industry: 'Semiconductors', peRatio: 335.8, eps: 0.48, dividendYield: 0.00, high52W: 227.30, low52W: 93.11, avgVolume: 72000000, beta: 1.74 },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', price: 65.45, change: 0.85, changePercent: 1.32, volume: 10200000, marketCap: 70000000000, sector: 'Financial', industry: 'Credit Services', peRatio: 16.2, eps: 4.04, dividendYield: 0.00, high52W: 76.54, low52W: 50.25, avgVolume: 12000000, beta: 1.35 },
  { symbol: 'SQ', name: 'Block Inc.', price: 68.32, change: -1.48, changePercent: -2.12, volume: 8900000, marketCap: 42000000000, sector: 'Technology', industry: 'Software—Infrastructure', peRatio: 48.8, eps: 1.40, dividendYield: 0.00, high52W: 87.52, low52W: 39.26, avgVolume: 10500000, beta: 2.34 },
  { symbol: 'ADBE', name: 'Adobe Inc.', price: 486.20, change: -2.35, changePercent: -0.48, volume: 3200000, marketCap: 218000000000, sector: 'Technology', industry: 'Software—Infrastructure', peRatio: 44.5, eps: 10.93, dividendYield: 0.00, high52W: 638.25, low52W: 433.97, avgVolume: 4000000, beta: 1.30 },
  { symbol: 'INTC', name: 'Intel Corp.', price: 30.12, change: -0.38, changePercent: -1.25, volume: 44200000, marketCap: 128000000000, sector: 'Technology', industry: 'Semiconductors', peRatio: 31.7, eps: 0.95, dividendYield: 1.66, high52W: 51.28, low52W: 29.73, avgVolume: 49000000, beta: 1.25 }
];

const SECTORS = [
  'Technology',
  'Financial',
  'Healthcare',
  'Energy',
  'Consumer',
  'Industrials',
  'Communication Services',
  'Utilities'
];

const INDUSTRIES_MAP: Record<string, string[]> = {
  Technology: ['Software—Infrastructure', 'Semiconductors', 'Consumer Electronics', 'IT Services', 'Hardware—Storage'],
  Financial: ['Banks—Diversified', 'Credit Services', 'Asset Management', 'Insurance—Diversified', 'Capital Markets'],
  Healthcare: ['Biotechnology', 'Pharmaceuticals', 'Medical Devices', 'Diagnostics & Research', 'Healthcare Plans'],
  Energy: ['Oil & Gas Integrated', 'Oil & Gas E&P', 'Solar', 'Oil & Gas Equipment', 'Clean Energy'],
  Consumer: ['Auto Manufacturers', 'Internet Retail', 'Beverages—Non-Alcoholic', 'Discount Stores', 'Restaurants', 'Footwear & Accessories'],
  Industrials: ['Aerospace & Defense', 'Specialty Industrial Machinery', 'Integrated Freight & Logistics', 'Railroads', 'Building Products'],
  'Communication Services': ['Internet Content & Information', 'Entertainment', 'Telecom Services', 'Advertising Agencies'],
  Utilities: ['Utilities—Regulated Electric', 'Utilities—Regulated Gas', 'Utilities—Renewable', 'Utilities—Regulated Water']
};

const SECTOR_LEXICON: Record<string, { prefixes: string[]; suffixes: string[] }> = {
  Technology: {
    prefixes: ['Quantum', 'Apex', 'Nova', 'Stellar', 'Core', 'Byte', 'Sys', 'Intellect', 'Data', 'Cloud', 'Nexus', 'Matrix', 'Silicon', 'Alpha', 'Omni', 'Logic', 'Vector', 'Optima', 'Zenith', 'Sync', 'Cyber', 'Kernel', 'Logic', 'Synapse', 'Cortex', 'Proto', 'Aero'],
    suffixes: ['Systems', 'Technologies', 'Software', 'Networks', 'Solutions', 'Dynamics', 'Labs', 'Digital', 'Computers', 'AI', 'Micro', 'Services', 'Tech', 'Labs', 'Analytics', 'OS']
  },
  Financial: {
    prefixes: ['Global', 'Federal', 'Trust', 'Capital', 'Alliance', 'Summit', 'Equity', 'Assets', 'Wealth', 'Banc', 'Credit', 'Secure', 'Heritage', 'Fidelity', 'Prime', 'Vanguard', 'Meridian', 'Legacy', 'Liberty', 'Pinnacle', 'Summit', 'Charter', 'Standard', 'First'],
    suffixes: ['Group', 'Bancorp', 'Holdings', 'Capital', 'Partners', 'Advisors', 'Finance', 'Trust', 'Mutual', 'Securities', 'Banc', 'Funds', 'Credit', 'Ventures']
  },
  Healthcare: {
    prefixes: ['Astra', 'Biogen', 'Cure', 'Derma', 'Eli', 'Gen', 'Heart', 'Immuno', 'Joint', 'Life', 'Med', 'Neuro', 'Optic', 'Pulse', 'Thera', 'Vax', 'Bio', 'Pharma', 'Health', 'Nano', 'Soma', 'Zymo', 'Cell', 'Gene', 'Onco', 'Viri', 'Synco', 'Helix'],
    suffixes: ['Pharmaceuticals', 'Therapeutics', 'Biosciences', 'Healthcare', 'Diagnostics', 'Medical', 'Biotech', 'Genetics', 'Labs', 'Remedies', 'Solutions', 'Health']
  },
  Energy: {
    prefixes: ['Petro', 'Sun', 'Solar', 'Wind', 'Hydro', 'Carbon', 'Gas', 'Oil', 'Power', 'Volt', 'Terra', 'Nova', 'Drill', 'Refine', 'Pipeline', 'Summit', 'Eco', 'Green', 'Nucleo', 'Fission', 'Clean', 'Geothermal', 'Apex', 'Energo'],
    suffixes: ['Energy', 'Petroleum', 'Resources', 'Power', 'Solar', 'Utilities', 'Gas', 'Exploration', 'Fuels', 'Refining', 'Power & Light', 'Generators']
  },
  Consumer: {
    prefixes: ['Target', 'Brand', 'Retail', 'Wear', 'Food', 'Mart', 'Home', 'Auto', 'Goods', 'Styles', 'Trend', 'Active', 'Direct', 'Prime', 'Elite', 'Lux', 'Star', 'Urban', 'Coast', 'Pinnacle', 'Mkt', 'Kitchen', 'Urban', 'Vogue', 'Fit'],
    suffixes: ['Stores', 'Brands', 'Retail', 'Apparel', 'Motors', 'Foods', 'Products', 'Direct', 'Goods', 'Co', 'Outlet', 'Markets', 'Supermarkets', 'Trading']
  },
  Industrials: {
    prefixes: ['General', 'Standard', 'United', 'Allied', 'Heavy', 'Build', 'Steel', 'Air', 'Rail', 'Freight', 'Engine', 'Machinery', 'Titan', 'Atlas', 'Forge', 'Vulcan', 'Iron', 'Construct', 'Logistics', 'Transit', 'Industrial', 'Cargo', 'Ship', 'Precision'],
    suffixes: ['Industrials', 'Aerospace', 'Logistics', 'Manufacturing', 'Railways', 'Engines', 'Equipment', 'Materials', 'Corp', 'Systems', 'Heavy Machinery', 'Instruments']
  },
  'Communication Services': {
    prefixes: ['Tele', 'Com', 'Net', 'Signal', 'Wave', 'Broadband', 'Media', 'Entertain', 'Stream', 'Voice', 'Connect', 'Talk', 'Social', 'Buzz', 'Cast', 'Wire', 'Portal', 'Vibe', 'Ping', 'Link', 'Interact', 'Beam', 'Spectrum', 'Sat'],
    suffixes: ['Communications', 'Telecom', 'Media', 'Entertainment', 'Networks', 'Mobile', 'Broadcasting', 'Interactive', 'Mobiles', 'Wire', 'Web', 'Net']
  },
  Utilities: {
    prefixes: ['Pacific', 'Atlantic', 'Northern', 'Southern', 'Eastern', 'Western', 'Power', 'Grid', 'Electric', 'Water', 'Gas', 'Hydro', 'Thermal', 'Atomic', 'Wind', 'Solar', 'Energy', 'Centrale', 'Metropolitan', 'National', 'Local'],
    suffixes: ['Utilities', 'Power & Light', 'Electric', 'Water', 'Energy Services', 'Infrastructure', 'Grid', 'Power', 'Gas Utility', 'District']
  }
};

export function generateAllStocks(): Stock[] {
  const stocks: Stock[] = [];
  const usedSymbols = new Set<string>();

  // Add the 20 real stocks first
  REAL_STOCKS_BASE.forEach(s => {
    stocks.push({
      ...s,
      sparkline: [] // Will be populated in mockDataEngine
    });
    usedSymbols.add(s.symbol);
  });

  const rand = createSeededRandom(42); // Seeded random for determinism

  // Generate 480 synthetic stocks to make 500 stocks total
  const stocksNeeded = 500;
  const targetPerSector = Math.ceil(stocksNeeded / SECTORS.length);

  SECTORS.forEach(sector => {
    const currentSectorRealStocksCount = REAL_STOCKS_BASE.filter(s => s.sector === sector).length;
    const synthNeeded = targetPerSector - currentSectorRealStocksCount;

    const lexicon = SECTOR_LEXICON[sector];
    const industries = INDUSTRIES_MAP[sector];

    for (let i = 0; i < synthNeeded; i++) {
      let companyName = '';
      let symbol = '';

      // Generate a unique symbol and company name
      let retries = 0;
      while (retries < 100) {
        const prefIdx = Math.floor(rand() * lexicon.prefixes.length);
        const suffIdx = Math.floor(rand() * lexicon.suffixes.length);
        const pref = lexicon.prefixes[prefIdx];
        const suff = lexicon.suffixes[suffIdx];
        companyName = `${pref} ${suff}`;

        // Create a 3-4 letter symbol from name
        const cleanName = companyName.replace(/[^A-Z]/gi, '').toUpperCase();
        if (cleanName.length >= 3) {
          symbol = cleanName.slice(0, 3);
          // Add a letter from suffix if it needs 4 letters or has duplicate
          if (cleanName.length >= 4 && rand() > 0.4) {
            symbol = cleanName.slice(0, 4);
          }
        } else {
          symbol = 'STK' + Math.floor(rand() * 10);
        }

        // Handle symbol duplicates by changing last char
        let baseSymbol = symbol;
        let suffixCount = 65; // 'A'
        while (usedSymbols.has(symbol) && suffixCount <= 90) { // Up to 'Z'
          symbol = baseSymbol.slice(0, 3) + String.fromCharCode(suffixCount);
          suffixCount++;
        }

        if (!usedSymbols.has(symbol)) {
          break;
        }
        retries++;
      }

      usedSymbols.add(symbol);

      // Sizing tier probabilities: Mega (1%), Large (15%), Mid (50%), Small (34%)
      const sizeRoll = rand();
      let marketCap = 0;
      let price = 0;
      
      if (sizeRoll < 0.01) {
        // Mega Cap (200B - 800B)
        marketCap = Math.floor((200 + rand() * 600) * 1000000000);
        price = 100 + rand() * 900;
      } else if (sizeRoll < 0.16) {
        // Large Cap (10B - 200B)
        marketCap = Math.floor((10 + rand() * 190) * 1000000000);
        price = 50 + rand() * 250;
      } else if (sizeRoll < 0.66) {
        // Mid Cap (2B - 10B)
        marketCap = Math.floor((2 + rand() * 8) * 1000000000);
        price = 15 + rand() * 100;
      } else {
        // Small Cap (100M - 2B)
        marketCap = Math.floor((0.1 + rand() * 1.9) * 1000000000);
        price = 2 + rand() * 30;
      }

      const peRatio = Number((10 + rand() * 70).toFixed(1));
      const eps = Number((price / peRatio).toFixed(2));
      const dividendYield = rand() > 0.65 ? Number((rand() * 5).toFixed(2)) : 0;
      const beta = Number((0.5 + rand() * 1.5).toFixed(2));
      const changePercent = Number(((rand() - 0.49) * 4).toFixed(2)); // daily performance between -1.96% and +2.04%
      const change = Number(((price * changePercent) / 100).toFixed(2));
      
      const industry = industries[Math.floor(rand() * industries.length)];
      const avgVolume = Math.floor((100000 + rand() * 15000000));
      const volume = Math.floor(avgVolume * (0.5 + rand() * 0.8));

      const high52W = Number((price * (1.05 + rand() * 0.4)).toFixed(2));
      const low52W = Number((price * (0.6 + rand() * 0.38)).toFixed(2));

      stocks.push({
        symbol,
        name: companyName,
        price: Number(price.toFixed(2)),
        change,
        changePercent,
        volume,
        marketCap,
        sector,
        industry,
        peRatio,
        eps,
        dividendYield,
        high52W,
        low52W,
        avgVolume,
        beta,
        sparkline: []
      });
    }
  });

  return stocks;
}
