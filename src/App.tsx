import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/toasts/ToastProvider';
import { DemoResetProvider } from './components/DemoResetProvider';
import { Activity } from 'lucide-react';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Reusable Page Loader fallback for Route splitting chunks loading
const PageLoader = () => (
  <div className="min-h-screen bg-[#0A0E14] flex flex-col items-center justify-center gap-4 text-[#8A8F98]">
    <div className="w-10 h-10 rounded-xl bg-[#00FF94]/10 flex items-center justify-center border border-[#00FF94]/30 animate-spin">
      <Activity className="w-5 h-5 text-[#00FF94] animate-pulse" />
    </div>
    <span className="text-xs font-bold tracking-wider uppercase animate-pulse font-mono">Loading Terminal Module...</span>
  </div>
);

// Lazy Loaded Pages
const LandingPage = lazy(() => import('./features/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const MarketsPage = lazy(() => import('./features/markets/MarketsPage').then(m => ({ default: m.MarketsPage })));
const StockDetails = lazy(() => import('./features/stock-details/StockDetails').then(m => ({ default: m.StockDetails })));
const WatchlistPage = lazy(() => import('./features/watchlist/WatchlistPage').then(m => ({ default: m.WatchlistPage })));
const PortfolioPage = lazy(() => import('./features/portfolio/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const TransactionsPage = lazy(() => import('./features/portfolio/TransactionsPage').then(m => ({ default: m.TransactionsPage })));
const NewsPage = lazy(() => import('./features/news/NewsPage').then(m => ({ default: m.NewsPage })));
const ComparePage = lazy(() => import('./features/compare/ComparePage').then(m => ({ default: m.ComparePage })));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage').then(m => ({ default: m.SettingsPage })));
const MarketScreener = lazy(() => import('./features/screener/MarketScreener').then(m => ({ default: m.MarketScreener })));
const ScreenerProPage = lazy(() => import('./features/screener/ScreenerProPage').then(m => ({ default: m.ScreenerProPage })));
const HeatmapPage = lazy(() => import('./features/heatmap/HeatmapPage').then(m => ({ default: m.HeatmapPage })));
const GlobePage = lazy(() => import('./features/globe/GlobePage').then(m => ({ default: m.GlobePage })));
const AiAssistantPage = lazy(() => import('./features/ai-assistant/AiAssistantPage').then(m => ({ default: m.AiAssistantPage })));
const MarketIntelligencePage = lazy(() => import('./features/intelligence/MarketIntelligencePage').then(m => ({ default: m.MarketIntelligencePage })));
const CopilotPage = lazy(() => import('./features/copilot/CopilotPage').then(m => ({ default: m.CopilotPage })));
const ShowcasePage = lazy(() => import('./features/showcase/ShowcasePage').then(m => ({ default: m.ShowcasePage })));
const AboutStockPulse = lazy(() => import('./features/showcase/AboutStockPulse').then(m => ({ default: m.AboutStockPulse })));
const SystemStatusPage = lazy(() => import('./features/status/SystemStatusPage').then(m => ({ default: m.SystemStatusPage })));
const BacktestPage = lazy(() => import('./features/portfolio/BacktestPage').then(m => ({ default: m.BacktestPage })));
const HorizonPage = lazy(() => import('./features/horizon/HorizonPage').then(m => ({ default: m.HorizonPage })));


function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <DemoResetProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Landing page as root */}
                  <Route path="/" element={<LandingPage />} />
                  
                  {/* Dashboard routes wrapped in common Sidebar Layout */}
                  <Route element={<Layout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/intelligence" element={<MarketIntelligencePage />} />
                    <Route path="/markets" element={<MarketsPage />} />
                    <Route path="/stock/:symbol" element={<StockDetails />} />
                    <Route path="/watchlist" element={<WatchlistPage />} />
                    <Route path="/portfolio" element={<PortfolioPage />} />
                    <Route path="/transactions" element={<TransactionsPage />} />
                    <Route path="/screener" element={<MarketScreener />} />
                    <Route path="/screener-pro" element={<ScreenerProPage />} />
                    <Route path="/heatmap" element={<HeatmapPage />} />
                    <Route path="/globe" element={<GlobePage />} />
                    <Route path="/assistant" element={<AiAssistantPage />} />
                    <Route path="/copilot" element={<CopilotPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/compare" element={<ComparePage />} />
                    <Route path="/showcase" element={<ShowcasePage />} />
                    <Route path="/about" element={<AboutStockPulse />} />
                    <Route path="/project-health" element={<SystemStatusPage />} />
                    <Route path="/system-status" element={<SystemStatusPage />} />
                    <Route path="/backtest" element={<BacktestPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/horizon" element={<HorizonPage />} />

                    
                    {/* Catch-all redirects back to dashboard */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </DemoResetProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
