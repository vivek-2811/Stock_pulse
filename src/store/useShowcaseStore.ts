import { create } from 'zustand';

export interface DemoStep {
  route: string;
  title: string;
  desc: string;
  techHighlight: string;
  userValue: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    route: '/dashboard',
    title: '1. Terminal Dashboard',
    desc: 'The central hub for index telemetry, real-time simulated price ticks, and layout density.',
    techHighlight: 'Tech: In-memory PubSub data engine, SVG mini-sparkline drawings, CSS Grid.',
    userValue: 'Value: Immediate high-level market perspective and quick search command triggers.',
  },
  {
    route: '/portfolio',
    title: '2. Portfolio Hub',
    desc: 'Interactive ledger detailing owned shares, average buy-ins, and realized returns.',
    techHighlight: 'Tech: Zustand persist middleware, custom transaction ledger arithmetic.',
    userValue: 'Value: Visual tracking of capital deployment, tax liabilities, and relative returns.',
  },
  {
    route: '/screener-pro',
    title: '3. Screener Pro',
    desc: 'Quantitative stock filter sorting candidates by momentum, volume, and sector.',
    techHighlight: 'Tech: Debounced search queries, custom Opportunity Score algorithm, rank badges.',
    userValue: 'Value: Rapid stock discovery based on technical thresholds and momentum breakouts.',
  },
  {
    route: '/intelligence',
    title: '4. Market Intelligence',
    desc: 'Algorithmic calculations of market regime, Fear & Greed scoring, and sector leadership.',
    techHighlight: 'Tech: Custom statistical calculations from simulated NYSE ticker history.',
    userValue: 'Value: Strategic oversight helping traders determine asset class weights.',
  },
  {
    route: '/news',
    title: '5. News & Catalysts',
    desc: 'Bloomberg-style 3-column real-time workspace separating feeds, timelines, and earnings.',
    techHighlight: 'Tech: Complex 3-column scrollable containment, breaking news banners.',
    userValue: 'Value: Central catalyst context ensuring traders understand why prices are moving.',
  },
  {
    route: '/copilot',
    title: '6. AI Market Copilot',
    desc: 'Contextual AI analyst reading your portfolio and recommending risk adjustments.',
    techHighlight: 'Tech: Message thread storage, mock contextual response generators.',
    userValue: 'Value: Actionable portfolio audits without needing to leave the trade screen.',
  },
  {
    route: '/compare',
    title: '7. Compare Workspace',
    desc: 'Direct comparative overlay mapping technical indicators and historical correlations.',
    techHighlight: 'Tech: Chart.js integrations, correlation coefficient matrices.',
    userValue: 'Value: Evaluating asset pairs directly to identify lagging opportunities.',
  },
];

interface ShowcaseState {
  isDemoPlaying: boolean;
  currentStepIndex: number;
  startDemo: () => void;
  stopDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

export const useShowcaseStore = create<ShowcaseState>((set, get) => ({
  isDemoPlaying: false,
  currentStepIndex: 0,

  startDemo: () => set({ isDemoPlaying: true, currentStepIndex: 0 }),
  stopDemo: () => set({ isDemoPlaying: false, currentStepIndex: 0 }),

  nextStep: () => set((state) => {
    const nextIdx = state.currentStepIndex + 1;
    if (nextIdx >= DEMO_STEPS.length) {
      return { isDemoPlaying: false, currentStepIndex: 0 };
    }
    return { currentStepIndex: nextIdx };
  }),

  prevStep: () => set((state) => {
    const prevIdx = state.currentStepIndex - 1;
    if (prevIdx < 0) return {};
    return { currentStepIndex: prevIdx };
  }),
}));
