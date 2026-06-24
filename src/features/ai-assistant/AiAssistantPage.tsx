import React, { useState, useRef, useEffect } from 'react';
import { useAssistantStore } from '../../store/useAssistantStore';
import { Cpu, Send, Trash2, HelpCircle, Activity, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AiAssistantPage: React.FC = () => {
  const { 
    messages, 
    clearHistory, 
    generateResponse,
    lastAnalyzedSymbol,
    lastComparedSymbols
  } = useAssistantStore();

  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const query = inputVal;
    setInputVal('');

    // 1. Add user message
    useAssistantStore.getState().addMessage('user', query);
    
    // 2. Set typing state
    setIsTyping(true);

    // 3. Process reply
    await generateResponse(query);
    setIsTyping(false);
  };

  const handleCommandClick = (command: string) => {
    setInputVal(command);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[500px]">
      
      {/* Main Chat Interface */}
      <div className="lg:col-span-3 glass-card rounded-3xl border border-border-glass flex flex-col justify-between overflow-hidden bg-surface-lowest/15">
        
        {/* Terminal Header */}
        <div className="px-6 py-4.5 border-b border-border-glass bg-surface-lowest/50 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-app-green animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-white leading-none">Copilot Financial Analyst</h2>
              <span className="text-[10px] text-text-muted mt-1 block">Powered by local heuristic quantitative data maps.</span>
            </div>
          </div>
          <button
            onClick={clearHistory}
            className="p-2 rounded-xl border border-border-glass bg-surface-glass text-text-muted hover:text-white hover:bg-white/5 transition-colors"
            title="Clear Chat Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Message Logs Pane */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed border ${
                    isAi 
                      ? 'bg-surface-low border-border-glass text-on-surface' 
                      : 'bg-app-green/10 border-app-green/20 text-white font-medium'
                  }`}>
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-6 mb-1 text-[9px] font-bold text-text-muted">
                      <span>{isAi ? 'AI CO-PILOT' : 'USER ORDER'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    {/* Message body with basic markdown formatting */}
                    <div className="space-y-1.5 whitespace-pre-line">
                      {msg.content.split('\n').map((line, lIdx) => {
                        if (line.startsWith('### ')) {
                          return <h4 key={lIdx} className="font-bold text-white text-sm mt-2">{line.replace('### ', '')}</h4>;
                        }
                        if (line.startsWith('- ')) {
                          return <div key={lIdx} className="pl-2.5 relative before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-app-green">{line.replace('- ', '')}</div>;
                        }
                        // Handle bold markdown tags
                        if (line.includes('**')) {
                          const boldPart = line.match(/\*\*(.*?)\*\*/)?.[1];
                          if (boldPart) {
                            const replaced = line.replace(`**${boldPart}**`, '');
                            return <p key={lIdx}>{replaced}<strong className="text-app-green font-bold">{boldPart}</strong></p>;
                          }
                        }
                        return <p key={lIdx}>{line}</p>;
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-surface-low border border-border-glass rounded-2xl px-4 py-3 flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-[10px]">Evaluating data tables...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar form */}
        <form onSubmit={handleSend} className="p-4 border-t border-border-glass bg-surface-lowest/30 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-surface-lowest text-xs border border-border-glass rounded-xl px-4 py-3.5 text-white placeholder-text-muted focus:outline-none focus:border-app-green font-medium"
            placeholder="Type standard command (e.g. /compare TSLA NVDA) or prompt details..."
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
          />
          <button
            type="submit"
            className="p-3.5 bg-app-green text-black rounded-xl hover:shadow-glow-green hover:scale-[1.02] transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Structured Context Monitor Panel */}
      <div className="glass-card rounded-3xl p-6 border border-border-glass flex flex-col justify-between lg:col-span-1 space-y-6">
        <div className="space-y-6">
          <div className="pb-3 border-b border-border-glass">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Developer Insights</span>
            <h2 className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-app-green" /> Structured Context Monitor
            </h2>
          </div>

          {/* Variables Tracker */}
          <div className="space-y-4 text-xs font-mono">
            <div className="space-y-1 bg-surface-lowest/50 p-3 rounded-xl border border-border-glass/40">
              <span className="text-[9px] font-bold text-text-muted uppercase block">lastAnalyzedSymbol</span>
              <span className={`text-xs font-bold ${lastAnalyzedSymbol ? 'text-app-green' : 'text-[#8A8F98]'}`}>
                {lastAnalyzedSymbol ? `"${lastAnalyzedSymbol}"` : 'null'}
              </span>
            </div>
            
            <div className="space-y-1 bg-surface-lowest/50 p-3 rounded-xl border border-border-glass/40">
              <span className="text-[9px] font-bold text-text-muted uppercase block">lastComparedSymbols</span>
              <span className={`text-xs font-bold ${lastComparedSymbols.length > 0 ? 'text-app-green' : 'text-[#8A8F98]'}`}>
                {lastComparedSymbols.length > 0 ? `[${lastComparedSymbols.map(s => `"${s}"`).join(', ')}]` : '[]'}
              </span>
            </div>

            <div className="space-y-1 bg-surface-lowest/50 p-3 rounded-xl border border-border-glass/40">
              <span className="text-[9px] font-bold text-text-muted uppercase block">stateSessionMemory</span>
              <span className="text-[10px] text-text-muted leading-relaxed block">
                Tracks relative follow-up keys. Allows context-aware queries like: "Which is cheaper?".
              </span>
            </div>
          </div>

          {/* Quick command buttons */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">Quick Presets</span>
            <div className="flex flex-col gap-1.5">
              {[
                { label: 'Check Portfolio Risk Profile', cmd: '/risk' },
                { label: 'View Cost & Holdings', cmd: '/portfolio' },
                { label: 'Compare Apple & Microsoft', cmd: '/compare AAPL MSFT' },
                { label: 'Analyze NVIDIA Ticker', cmd: '/analyze NVDA' }
              ].map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCommandClick(btn.cmd)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-border-glass/60 hover:border-app-green/30 bg-surface-glass text-[10px] text-text-muted hover:text-white transition-all flex items-center gap-1.5 font-sans"
                >
                  <Sparkles className="w-3 h-3 text-app-green" /> {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Helpful Tip */}
        <div className="p-3 bg-app-green/5 rounded-xl border border-app-green/10 text-[10px] text-text-muted flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-app-green flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">Use chatbot terminal command macros directly inside the input bar: `/buy TICKER QTY` and `/sell TICKER QTY` update your positions instantly.</p>
        </div>
      </div>

    </div>
  );
};
export default AiAssistantPage;
