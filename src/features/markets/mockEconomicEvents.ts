export interface EconomicEvent {
  id: string;
  title: string;
  impact: 'High' | 'Medium' | 'Low';
  country: 'US' | 'EU' | 'UK' | 'JP' | 'CN';
  date: string; // e.g. "Today, 18:00" or "Tomorrow, 14:30"
  forecast: string;
  previous: string;
  actual?: string;
  category: 'Today' | 'Tomorrow' | 'This Week';
}

export const mockEconomicEvents: EconomicEvent[] = [
  {
    id: 'ev-1',
    title: 'Core CPI Inflation Rate (YoY)',
    impact: 'High',
    country: 'US',
    date: 'Today, 18:00',
    forecast: '3.2%',
    previous: '3.4%',
    actual: '3.1%',
    category: 'Today'
  },
  {
    id: 'ev-2',
    title: 'FOMC Interest Rate Decision',
    impact: 'High',
    country: 'US',
    date: 'Today, 23:30',
    forecast: '5.25%',
    previous: '5.50%',
    actual: undefined,
    category: 'Today'
  },
  {
    id: 'ev-3',
    title: 'German GDP Growth Rate (QoQ)',
    impact: 'Medium',
    country: 'EU',
    date: 'Today, 11:30',
    forecast: '0.1%',
    previous: '-0.2%',
    actual: '0.2%',
    category: 'Today'
  },
  {
    id: 'ev-4',
    title: 'BoJ Interest Rate Statement',
    impact: 'High',
    country: 'JP',
    date: 'Tomorrow, 08:30',
    forecast: '0.15%',
    previous: '0.10%',
    actual: undefined,
    category: 'Tomorrow'
  },
  {
    id: 'ev-5',
    title: 'Initial Jobless Claims',
    impact: 'Low',
    country: 'US',
    date: 'Tomorrow, 18:00',
    forecast: '215K',
    previous: '210K',
    actual: undefined,
    category: 'Tomorrow'
  },
  {
    id: 'ev-6',
    title: 'UK CPI (MoM)',
    impact: 'Medium',
    country: 'UK',
    date: 'Tomorrow, 12:30',
    forecast: '0.2%',
    previous: '0.3%',
    actual: undefined,
    category: 'Tomorrow'
  },
  {
    id: 'ev-7',
    title: 'US Retail Sales (MoM)',
    impact: 'High',
    country: 'US',
    date: 'June 25, 18:00',
    forecast: '0.4%',
    previous: '0.1%',
    actual: undefined,
    category: 'This Week'
  },
  {
    id: 'ev-8',
    title: 'ECB President Lagarde Speech',
    impact: 'Medium',
    country: 'EU',
    date: 'June 26, 19:30',
    forecast: '--',
    previous: '--',
    actual: undefined,
    category: 'This Week'
  },
  {
    id: 'ev-9',
    title: 'China Caixin Manufacturing PMI',
    impact: 'High',
    country: 'CN',
    date: 'June 27, 07:15',
    forecast: '50.6',
    previous: '50.2',
    actual: undefined,
    category: 'This Week'
  }
];
