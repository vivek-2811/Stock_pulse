import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useCopilotStore } from './CopilotStore';
import type { PersonaType } from './CopilotStore';
import { CopilotConversationList } from './CopilotConversationList';

interface Props {
  onPromptSelect: (text: string) => void;
}

export const CopilotSidebar: React.FC<Props> = ({ onPromptSelect }) => {
  const { activePersona, setPersona, newChat } = useCopilotStore();

  const personas: { id: PersonaType; label: string; icon: any; color: string; desc: string }[] = [
    { id: 'pm', label: 'Portfolio Manager', icon: ShieldCheck, color: 'text-emerald-400', desc: 'Focus on risk, asset weight, and rebalance logs' },
    { id: 'strategist', label: 'Market Strategist', icon: Bot, color: 'text-blue-400', desc: 'Focus on market regimes, indices, and macro signals' },
    { id: 'growth', label: 'Growth Investor', icon: Sparkles, color: 'text-amber-400', desc: 'Focus on sector leadership and momentum breakouts' },
    { id: 'risk_officer', label: 'Risk Officer', icon: AlertTriangle, color: 'text-rose-400', desc: 'Focus on beta exposure, drawdowns, and VaR safety' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35 }}
      className="w-56 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1"
      style={{ maxHeight: 'calc(100vh - 120px)' }}
    >
      {/* 1. Persona Selector Card */}
      <div className="glass-card rounded-2xl border border-border-glass p-3 space-y-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted block">Analyst Persona</span>
        
        <div className="space-y-1.5">
          {personas.map((p) => {
            const Icon = p.icon;
            const isSel = activePersona === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                title={p.desc}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-left transition-all ${
                  isSel
                    ? 'border-app-green/30 bg-app-green/5 text-white font-semibold'
                    : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${p.color}`} />
                <div className="min-w-0">
                  <span className="text-[11px] block leading-tight">{p.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. New Chat Action */}
      <button
        onClick={() => newChat()}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-app-green/30 bg-app-green/8 text-app-green hover:bg-app-green/15 text-xs font-bold transition-colors shrink-0"
      >
        Start New Conversation
      </button>

      {/* 3. Conversation History & Lists */}
      <CopilotConversationList onPromptSelect={onPromptSelect} />
    </motion.div>
  );
};
export default CopilotSidebar;
