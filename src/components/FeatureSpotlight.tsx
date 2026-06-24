import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronRight, Filter, Briefcase, Scale, Radio } from 'lucide-react';
import { useNavigate } from 'react-router';

export const FeatureSpotlight: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isDismissed = localStorage.getItem('stockpulse-spotlight-dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('stockpulse-spotlight-dismissed', 'true');
  };

  const features = [
    {
      icon: Filter,
      title: 'Screener Pro',
      desc: 'Quantitative stock scan',
      color: 'text-app-green bg-app-green/10 border-app-green/20',
      route: '/screener-pro',
    },
    {
      icon: Radio,
      title: 'Market Intelligence',
      desc: 'Regimes & sentiment tracking',
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      route: '/intelligence',
    },
    {
      icon: Briefcase,
      title: 'Portfolio Hub',
      desc: 'Real-time performance metrics',
      color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      route: '/portfolio',
    },
    {
      icon: Scale,
      title: 'Compare Workspace',
      desc: 'Direct correlation comparisons',
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      route: '/compare',
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative w-full rounded-2xl border border-app-green/20 bg-app-green/5 overflow-hidden p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          {/* Spotlight aura */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-app-green/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Left info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-app-green/10 border border-app-green/25 flex items-center justify-center text-app-green shrink-0 mt-0.5 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                Developer Feature Spotlight
              </h4>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed max-w-xl">
                StockPulse has been built with an institutional-grade layout. Explore our top engineering modules or launch the Guided Demo mode.
              </p>
            </div>
          </div>

          {/* Action Grid */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 z-10">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(f.route)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#0a0e14]/60 border border-border-glass hover:border-white/20 hover:bg-[#0a0e14]/90 transition-all duration-150 text-left shrink-0"
                >
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${f.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white leading-tight flex items-center">
                      {f.title}
                      <ChevronRight className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                    </p>
                    <p className="text-[9px] text-text-muted leading-tight truncate max-w-[100px]">
                      {f.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 md:relative md:top-auto md:right-auto p-1 rounded-lg hover:bg-white/5 transition-colors text-text-muted hover:text-white shrink-0"
            title="Dismiss spotlight banner"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeatureSpotlight;
