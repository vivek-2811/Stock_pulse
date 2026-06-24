import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Copy, BookMarked, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { CopilotMessage as MessageType } from './CopilotStore';
import { CopilotInsightCard } from './CopilotInsightCard';
import { CopilotMetricGrid } from './CopilotMetricGrid';
import type { MetricItem } from './CopilotMetricGrid';
import { CopilotActionPanel } from './CopilotActionPanel';
import { useCopilotStore } from './CopilotStore';

interface Props {
  msg: MessageType;
  isLatest: boolean;
  onSave: () => void;
  onSelectPrompt?: (text: string) => void;
}

// Simple inline markdown formatter
function formatMarkdown(text: string): React.ReactNode {
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} className="text-sm text-text-secondary leading-relaxed mb-1">
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
          if (part.startsWith('`') && part.endsWith('`'))
            return <code key={j} className="text-app-green text-[11px] font-mono bg-app-green/8 px-1 rounded">{part.slice(1, -1)}</code>;
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

export const CopilotMessage: React.FC<Props> = ({ msg, isLatest, onSave, onSelectPrompt }) => {
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);

  const { activePersona } = useCopilotStore();

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Thinking State updates (Sequential status updates)
  const thinkingStatuses = [
    'Parsing market queries...',
    'Consulting shared calculations engine...',
    'Analyzing sector rotations & beta parameters...',
    'Synthesizing final portfolio HHI & risk weights...',
    'Formulating actionable strategist verdicts...'
  ];

  useEffect(() => {
    if (msg.isStreaming && isLatest) {
      const interval = setInterval(() => {
        setThinkingStep((s) => (s + 1) % thinkingStatuses.length);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [msg.isStreaming, isLatest]);

  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-end gap-2 pr-1"
      >
        <div className="max-w-lg">
          <div className="bg-app-green/10 border border-app-green/25 rounded-2xl rounded-br-md px-4 py-3 text-right">
            <p className="text-sm text-white">{msg.content}</p>
          </div>
          <p className="text-[9px] text-text-muted mt-1 text-right">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="w-7 h-7 rounded-full bg-app-green/15 border border-app-green/30 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-app-green" />
        </div>
      </motion.div>
    );
  }

  // Parse stock details metrics if it's stock research mode
  const isResearchMode = msg.mode === 'research';
  const matchTicker = isResearchMode ? msg.content.match(/\*\*([A-Z]+)\*\*/) : null;
  const activeTicker = matchTicker ? matchTicker[1] : undefined;

  // Extract tabular metrics from text
  const metricItems: MetricItem[] = [];
  const lines = msg.content.split('\n');
  lines.forEach(line => {
    const match = line.match(/•\s+(.+?):\s+(.+)/);
    if (match) {
      const label = match[1].replace('**', '').replace('**', '');
      const value = match[2].split('(')[0].trim();
      const sub = match[2].includes('(') ? match[2].substring(match[2].indexOf('(')).trim() : undefined;
      metricItems.push({ label, value, sub });
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-3 pl-1"
    >
      <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-blue-400" />
      </div>

      <div className="flex-1 min-w-0 space-y-3.5">
        {/* Thinking Status Center */}
        {msg.isStreaming && isLatest ? (
          <div className="bg-white/[0.02] border border-border-glass rounded-2xl p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-app-green animate-ping" />
              <span className="text-xs font-mono font-bold text-white tracking-tight">AI Analyst Thinking...</span>
            </div>
            <p className="text-[11px] text-text-muted font-mono">{thinkingStatuses[thinkingStep]}</p>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <motion.div 
                className="bg-app-green h-full rounded-full" 
                animate={{ width: ['0%', '100%'] }} 
                transition={{ duration: 3, repeat: Infinity }} 
              />
            </div>
          </div>
        ) : (
          <>
            {/* Main Response Summary */}
            <div className="bg-white/[0.02] border border-border-glass rounded-2xl rounded-tl-md px-4 py-3.5 shadow-sm space-y-2">
              <div className="space-y-1">
                {formatMarkdown(msg.content)}
              </div>
            </div>

            {/* Explainable Reasoning Panel (Evidence Panel) */}
            {msg.whyBreakdown && msg.whyBreakdown.length > 0 && (
              <div className="glass-card rounded-xl border border-border-glass/40 overflow-hidden">
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-white/5 transition-colors text-[10px] text-text-secondary font-bold font-mono"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    How this conclusion was reached (Evidence Panel)
                  </span>
                  {showEvidence ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {showEvidence && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border-glass/30 bg-surface-lowest/40 font-mono text-[10px] p-3 text-text-muted space-y-1"
                    >
                      {msg.whyBreakdown.map((item, idx) => (
                        <p key={idx} className="flex items-start gap-1.5 leading-normal">
                          <span className="text-blue-400 font-bold shrink-0">[{idx+1}]</span>
                          <span>{item}</span>
                        </p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Insights Row */}
            {msg.insights && msg.insights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {msg.insights.map((ins, i) => (
                  <CopilotInsightCard key={i} insight={ins} index={i} />
                ))}
              </div>
            )}

            {/* Structured Quantitative Metrics Grid */}
            {metricItems.length > 0 && (
              <CopilotMetricGrid metrics={metricItems} />
            )}

            {/* Actions Panel */}
            <CopilotActionPanel ticker={activeTicker} tickers={msg.mode === 'compare' ? ['AAPL', 'MSFT'] : undefined} mode={msg.mode} />
          </>
        )}

        {/* Footer toolbar */}
        {!msg.isStreaming && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider font-mono">
                {activePersona.toUpperCase()} Mode
              </span>
              <span className="text-[9px] text-text-muted">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-text-muted hover:text-white border border-transparent hover:border-border-glass font-medium transition-all"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
              <button
                onClick={onSave}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] text-text-muted hover:text-app-green border border-transparent hover:border-app-green/20 font-medium transition-all"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default CopilotMessage;
