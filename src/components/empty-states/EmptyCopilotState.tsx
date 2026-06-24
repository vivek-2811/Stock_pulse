import React from 'react';
import { Bot, HelpCircle, ShieldAlert, TrendingUp } from 'lucide-react';

interface EmptyCopilotStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export const EmptyCopilotState: React.FC<EmptyCopilotStateProps> = ({ onSelectPrompt }) => {
  const prompts = [
    {
      icon: ShieldAlert,
      text: 'Analyze my current portfolio risk profile and beta exposure.',
      label: 'Portfolio Risk Audit',
    },
    {
      icon: TrendingUp,
      text: 'Identify the top breakout candidates in the Screener right now.',
      label: 'Breakout Scan',
    },
    {
      icon: HelpCircle,
      text: 'Summarize today\'s sector catalysts and market regime.',
      label: 'Market Health Summary',
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-5 max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-app-green/10 border border-app-green/25 flex items-center justify-center text-app-green animate-pulse">
        <Bot className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Market Copilot</h3>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          Welcome to the institutional intelligence terminal. Ask me anything about your portfolio performance, watchlist alerts, or current market catalysts.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full mt-2">
        {prompts.map((p, idx) => {
          const Icon = p.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(p.text)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-border-glass hover:bg-white/5 hover:border-white/15 transition-all duration-150 text-left w-full group"
            >
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-text-muted group-hover:text-white transition-colors shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-app-green tracking-wider leading-none mb-1">
                  {p.label}
                </p>
                <p className="text-xs text-text-secondary truncate leading-tight group-hover:text-white transition-colors">
                  {p.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default EmptyCopilotState;
