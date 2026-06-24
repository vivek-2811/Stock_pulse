import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Scale, Activity, BarChart2, Filter } from 'lucide-react';

interface Props {
  onSelect: (text: string) => void;
  compact?: boolean;
}

export const CopilotPromptSuggestions: React.FC<Props> = ({ onSelect, compact = false }) => {
  const suggestions = [
    { text: 'Analyze my portfolio risk', icon: BarChart2, color: 'text-rose-400' },
    { text: 'Compare AAPL vs MSFT', icon: Scale, color: 'text-indigo-400' },
    { text: 'Summarize today\'s market', icon: Activity, color: 'text-emerald-400' },
    { text: 'Explain current market regime', icon: Sparkles, color: 'text-amber-400' },
    { text: 'What sectors are strongest?', icon: Activity, color: 'text-sky-400' },
    { text: 'Analyze my watchlist', icon: Sparkles, color: 'text-teal-400' },
    { text: 'Screener opportunity score matches', icon: Filter, color: 'text-pink-400' }
  ];

  const list = compact ? suggestions.slice(0, 4) : suggestions;

  return (
    <div className={`grid gap-2 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
      {list.map((s, idx) => {
        const Icon = s.icon;
        return (
          <button
            key={idx}
            onClick={() => onSelect(s.text)}
            className="flex items-start text-left gap-2.5 p-3 rounded-xl border border-border-glass bg-white/[0.01] hover:bg-white/[0.04] hover:border-app-green/35 text-xs text-text-secondary hover:text-white transition-all duration-200 group"
          >
            <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 transition-transform group-hover:scale-110 ${s.color}`} />
            <span className="leading-snug">{s.text}</span>
          </button>
        );
      })}
    </div>
  );
};
export default CopilotPromptSuggestions;
