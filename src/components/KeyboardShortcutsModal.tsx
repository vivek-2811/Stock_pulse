import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ 
  isOpen: propIsOpen, 
  onClose: propOnClose 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // If controlled, use parent state
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [propIsOpen]);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setIsOpen(false);
    }
  };

  const shortcuts = [
    { keys: ['Ctrl', 'K'], label: 'Open Command Palette' },
    { keys: ['?'], label: 'Open Shortcuts Cheat Sheet' },
    { keys: ['Esc'], label: 'Close Active Modals / Popups' },
    { keys: ['g', 'd'], label: 'Go to Dashboard' },
    { keys: ['g', 'p'], label: 'Go to Portfolio Hub' },
    { keys: ['g', 'w'], label: 'Go to Watchlist Manager' },
    { keys: ['g', 's'], label: 'Go to Screener Pro' },
    { keys: ['g', 'i'], label: 'Go to Market Intelligence' },
    { keys: ['g', 'n'], label: 'Go to News & Catalysts' },
    { keys: ['g', 'c'], label: 'Go to AI Market Copilot' },
    { keys: ['g', 'm'], label: 'Go to Compare Tickers' },
    { keys: ['g', 'h'], label: 'Go to Project Health' },
    { keys: ['g', 'a'], label: 'Go to Showcase & Tour' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={handleClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl glass-card border border-border-glass bg-[#0e1218]/95 backdrop-blur-2xl shadow-2xl p-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-glass mb-4">
              <div className="flex items-center gap-2 text-app-green">
                <Keyboard className="w-5 h-5" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-white/5 transition-colors text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
              {shortcuts.map((shortcut, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between py-1 border-b border-white/[0.02]"
                >
                  <span className="text-xs font-semibold text-[#dfe2eb]">
                    {shortcut.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIdx) => (
                      <React.Fragment key={keyIdx}>
                        {keyIdx > 0 && <span className="text-[10px] text-text-muted">+</span>}
                        <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-white/5 border border-border-glass text-[10px] font-bold font-mono text-white min-w-[20px] shadow-sm">
                          {key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="text-[10px] text-text-muted mt-5 text-center">
              Press <kbd className="bg-white/5 px-1 py-0.5 rounded border border-border-glass font-bold font-mono text-white">?</kbd> at any time to toggle this helper overlay.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsModal;
