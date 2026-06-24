import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Play, X, ChevronRight, ChevronLeft, Terminal, Cpu, Info } from 'lucide-react';
import { useShowcaseStore, DEMO_STEPS } from '../store/useShowcaseStore';

export const RecruiterDemoOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { isDemoPlaying, currentStepIndex, nextStep, prevStep, stopDemo } = useShowcaseStore();
  const [secondsLeft, setSecondsLeft] = useState(12);

  const currentStep = DEMO_STEPS[currentStepIndex];

  // Sync navigation when step index changes
  useEffect(() => {
    if (!isDemoPlaying || !currentStep) return;
    
    // Automatically route to the current step page
    navigate(currentStep.route);
    setSecondsLeft(12); // Reset countdown timer
  }, [currentStepIndex, isDemoPlaying, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (!isDemoPlaying) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          nextStep(); // Trigger next step when timer expires
          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDemoPlaying, nextStep]);

  if (!isDemoPlaying || !currentStep) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-[9999] w-full max-w-sm pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="glass-card border border-app-green/30 bg-[#0e1218]/95 backdrop-blur-2xl shadow-2xl rounded-2xl p-5 flex flex-col gap-4 pointer-events-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-glass pb-3">
            <div className="flex items-center gap-2 text-app-green">
              <Terminal className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Auto Demo Mode</span>
            </div>
            <button
              onClick={stopDemo}
              className="p-1 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors"
              title="Stop guided demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Info */}
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              {currentStep.title}
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              {currentStep.desc}
            </p>
          </div>

          {/* Technical Specs Callout */}
          <div className="surface-low border border-border-glass rounded-xl p-3 flex flex-col gap-1 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-app-green font-bold">
              <Cpu size={12} />
              <span>Architectural Insight</span>
            </div>
            <p className="text-white font-medium">{currentStep.techHighlight}</p>
            <div className="flex items-center gap-1.5 text-blue-400 font-bold mt-1.5">
              <Info size={12} />
              <span>User Impact</span>
            </div>
            <p className="text-text-muted">{currentStep.userValue}</p>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.03]">
            {/* Step indicators */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono text-text-muted">
                Step {currentStepIndex + 1} of {DEMO_STEPS.length}
              </span>
              <span className="text-text-muted text-[10px]">·</span>
              {/* Countdown circle */}
              <div className="relative flex items-center justify-center w-5 h-5">
                <svg className="w-5 h-5 transform -rotate-90">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    fill="none"
                    stroke="var(--app-green, #00FF94)"
                    strokeWidth="2"
                    strokeDasharray="50 50"
                    strokeDashoffset={50 - (50 * secondsLeft) / 12}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="absolute text-[8px] font-black font-mono text-white">{secondsLeft}</span>
              </div>
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentStepIndex === 0}
                onClick={prevStep}
                className="p-1.5 rounded-lg border border-border-glass bg-white/3 hover:bg-white/5 disabled:opacity-40 text-white transition-colors"
                title="Previous step"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextStep}
                className="py-1.5 px-3 rounded-lg bg-app-green/10 border border-app-green/20 hover:bg-app-green/20 text-app-green text-xs font-bold transition-all duration-150 flex items-center gap-1"
                title={currentStepIndex === DEMO_STEPS.length - 1 ? 'Finish tour' : 'Next step'}
              >
                {currentStepIndex === DEMO_STEPS.length - 1 ? 'Finish' : 'Next'}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RecruiterDemoOverlay;
