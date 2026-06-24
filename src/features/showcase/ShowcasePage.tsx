import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { 
  Play, 
  RotateCw, 
  Layers, 
  Cpu, 
  Code, 
  ExternalLink, 
  Terminal, 
  Zap, 
  Scale, 
  BriefcaseBusiness, 
  Bot, 
  LayoutDashboard, 
  Activity,
  ChevronRight,
  ShieldCheck,
  Search,
  BookOpen
} from 'lucide-react';
import { useShowcaseStore } from '../../store/useShowcaseStore';
import { useDemoReset } from '../../components/DemoResetProvider';

export const ShowcasePage: React.FC = () => {
  const navigate = useNavigate();
  const { startDemo } = useShowcaseStore();
  const { resetDemoWorkspace } = useDemoReset();

  const handleStartDemo = () => {
    startDemo();
    navigate('/dashboard'); // Go to start of demo
  };

  const workspaceShortcuts = [
    {
      name: 'Interactive Dashboard',
      route: '/dashboard',
      description: 'NYSE price streams, index tickers, and layout density sliders.',
      icon: LayoutDashboard,
      color: 'text-app-green bg-app-green/10 border-app-green/20'
    },
    {
      name: 'Screener Pro Workspace',
      route: '/screener-pro',
      description: 'Rank candidates by custom Opportunity Scores and factors.',
      icon: Zap,
      color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    },
    {
      name: 'Market Intelligence Desk',
      route: '/intelligence',
      description: 'Fear & Greed index telemetry, sector rotation, and breadth.',
      icon: Activity,
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    },
    {
      name: 'AI Copilot Workspace',
      route: '/copilot',
      description: 'Persona-driven analyst (Risk Officer, PM) with evidence logs.',
      icon: Bot,
      color: 'text-blue-400 bg-blue-400/10 border-blue-500/20'
    },
    {
      name: 'Compare Terminal',
      route: '/compare',
      description: 'Pearson correlation heatmap matrices and delta verdict summaries.',
      icon: Scale,
      color: 'text-orange-400 bg-orange-400/10 border-orange-400/20'
    },
    {
      name: 'Backtesting Sandbox',
      route: '/backtest',
      description: 'Simulate custom allocations against SPY with Sharpe ratios.',
      icon: BriefcaseBusiness,
      color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
    },
    {
      name: 'System Status Center',
      route: '/system-status',
      description: 'Lighthouse audit metrics, bundle sizes, and route diagnostics.',
      icon: ShieldCheck,
      color: 'text-[#00FF94] bg-[#00FF94]/10 border-[#00FF94]/20'
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      {/* Title Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card border border-border-glass rounded-2xl p-6 relative overflow-hidden flex flex-col gap-2"
      >
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-app-green/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex items-center gap-2 text-app-green">
          <Terminal className="w-5 h-5" />
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Recruiter Showcase Workspace</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">StockPulse Presentation Dashboard</h1>
        <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
          Welcome to the analyst workspace directory. Here you can launch guided walkthrough loops, reset simulated portfolios to factory baselines, or examine individual application views.
        </p>
      </motion.div>

      {/* Main Core Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card border border-border-glass rounded-2xl p-5 flex flex-col justify-between h-full gap-4 hover:border-white/10 transition-colors"
        >
          <div className="flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-app-green/10 border border-app-green/25 flex items-center justify-center text-app-green shrink-0">
              <Play className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Play Guided Walkthrough</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Let the system guide you! Auto-navigates through views with structural developer context panels.
            </p>
          </div>
          <button
            onClick={handleStartDemo}
            className="w-full py-2.5 rounded-xl border border-app-green/20 bg-app-green/10 hover:bg-app-green/20 text-app-green text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Guided Tour
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card border border-border-glass rounded-2xl p-5 flex flex-col justify-between h-full gap-4 hover:border-white/10 transition-colors"
        >
          <div className="flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center text-yellow-400 shrink-0">
              <RotateCw className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Reset Baseline Data</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Restores simulated portfolios, watchlists, alert rules, and AI copilot threads back to baseline limits.
            </p>
          </div>
          <button
            onClick={resetDemoWorkspace}
            className="w-full py-2.5 rounded-xl border border-yellow-500/25 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Reset Data Baseline
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card border border-border-glass rounded-2xl p-5 flex flex-col justify-between h-full gap-4 hover:border-white/10 transition-colors"
        >
          <div className="flex flex-col gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Engineering Blueprint</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Examine our design choices, canvas chart rendering systems, Zustand telemetry, and Core Web Vitals.
            </p>
          </div>
          <button
            onClick={() => navigate('/about')}
            className="w-full py-2.5 rounded-xl border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Open Technical Blueprint
          </button>
        </motion.div>
      </div>

      {/* Recruiter Workspace Quick Links */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card border border-border-glass rounded-2xl p-5 flex flex-col gap-4"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
          <Cpu className="w-4.5 h-4.5 text-app-green" />
          Interactive Workspaces Jump Strip
        </h3>
        <p className="text-xs text-text-secondary leading-normal">
          Click any workspace target below to jump directly into that view. Notice the persistent <b>Keyboard Navigation Console</b> (press <kbd className="font-mono bg-surface-lowest border border-border-glass px-1 py-0.5 rounded text-[10px]">g</kbd> followed by any destination key).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {workspaceShortcuts.map((ws, i) => {
            const Icon = ws.icon;
            return (
              <div
                key={i}
                onClick={() => navigate(ws.route)}
                className="surface-low border border-border-glass hover:border-white/10 rounded-xl p-3.5 flex items-start gap-3 hover:bg-white/5 cursor-pointer transition-all duration-150 group text-left"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${ws.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white group-hover:text-app-green transition-colors truncate">
                      {ws.name}
                    </h4>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-[10px] text-text-muted mt-1 leading-normal">
                    {ws.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Code Repository Spec */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card border border-border-glass rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-border-glass flex items-center justify-center text-white shrink-0">
            <Code className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Source Code Repository</h4>
            <p className="text-xs text-text-muted mt-0.5">
              Examine clean folder structures, modular components, and code splitting on GitHub.
            </p>
          </div>
        </div>
        <button
          onClick={() => window.open('https://github.com', '_blank')}
          className="py-2.5 px-4 rounded-xl bg-white/5 border border-border-glass hover:bg-white/10 hover:border-white/20 text-white text-xs font-bold transition-all duration-150 flex items-center gap-1.5"
        >
          Open GitHub Repository
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </div>
  );
};

export default ShowcasePage;
