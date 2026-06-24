import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router';
import { Bot, Sparkles } from 'lucide-react';
import { useCopilotStore } from './CopilotStore';
import { CopilotSidebar } from './CopilotSidebar';
import { CopilotChat } from './CopilotChat';
import { CopilotContextPanel } from './CopilotContextPanel';

export const CopilotPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { activeChatId, newChat } = useCopilotStore();

  // Ensure there's always an active chat
  useEffect(() => {
    if (!activeChatId) {
      newChat();
    }
  }, [activeChatId, newChat]);

  const urlPrompt = searchParams.get('prompt') ?? undefined;
  const chatRef = useRef<{ sendPrompt: (text: string) => void }>(null);

  return (
    <div className="flex flex-col h-full gap-0 select-none">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-4 shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              AI Market Copilot Workspace
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black uppercase tracking-wider font-mono">Beta</span>
            </h1>
            <p className="text-[10px] text-text-muted">Bloomberg × Koyfin × Perplexity Quantitative Terminal Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-glass bg-surface-lowest/60">
          <Sparkles className="w-3 h-3 text-yellow-400" />
          <span className="text-[10px] text-text-muted font-mono">StockPulse ScoreEngine v2.0</span>
        </div>
      </motion.div>

      {/* Three-column layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Sidebar: Personas & Chats */}
        <CopilotSidebar onPromptSelect={(text) => chatRef.current?.sendPrompt(text)} />

        {/* Center Chat Console */}
        <CopilotChat ref={chatRef} initialPrompt={urlPrompt} />

        {/* Right Panel: Telemetry & Markets Context */}
        <CopilotContextPanel />
      </div>
    </div>
  );
};
export default CopilotPage;
