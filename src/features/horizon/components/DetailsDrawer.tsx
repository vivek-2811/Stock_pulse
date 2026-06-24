import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import type { Transaction } from '../types/horizon.types';
import { ReceiptDropzone } from './ReceiptDropzone';

interface DetailsDrawerProps {
  isOpen: boolean;
  transaction: Transaction | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (updatedTx: Transaction) => void;
  formatCurrency: (amount: number) => string;
}

export const DetailsDrawer: React.FC<DetailsDrawerProps> = ({
  isOpen,
  transaction,
  isSaving,
  onClose,
  onSave,
  formatCurrency
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Form states
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  // Track the previously rendered transaction ID to sync props with state
  const [prevTxId, setPrevTxId] = useState<string | null>(null);

  if (transaction && transaction.id !== prevTxId) {
    setPrevTxId(transaction.id);
    setCategory(transaction.category);
    setNotes(transaction.notes || '');
    setReceipt(transaction.receipt);
    setShowSaveIndicator(false);
  } else if (!transaction && prevTxId !== null) {
    setPrevTxId(null);
  }

  // Accessibility: Focus trap & Esc listener & Focus restoration
  useEffect(() => {
    if (isOpen) {
      // Remember what had focus before opening
      previousActiveElementRef.current = document.activeElement as HTMLElement;

      // Focus first input/element in drawer
      const focusable = drawerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex="0"]'
      );
      if (focusable && focusable.length > 1) {
        // Focus the close button or first select
        (focusable[0] as HTMLElement).focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }

        if (e.key === 'Tab') {
          if (!drawerRef.current) return;
          const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex="0"]'
          );
          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        // Restore focus on close
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (!transaction) return;
    const updated: Transaction = {
      ...transaction,
      category,
      notes,
      receipt
    };
    onSave(updated);
    setShowSaveIndicator(true);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && transaction && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm cursor-pointer"
          />

          {/* Drawer Panel */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-md bg-[#0F1422] border-l border-border-glass shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border-glass">
              <h2 id="drawer-title" className="text-sm font-bold uppercase tracking-wider text-white">
                Transaction Details
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-white transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-border-glass">
              {/* Giant Amount Display */}
              <div className="bg-white/[0.02] border border-border-glass rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
                  {transaction.amount < 0 ? 'Debited Amount' : 'Credited Amount'}
                </span>
                <h3 className={`text-2xl font-black font-mono ${
                  transaction.amount < 0 ? 'text-white' : 'text-app-green'
                }`}>
                  {formatCurrency(transaction.amount)}
                </h3>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1 ${getStatusClass(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-4 border-b border-border-glass pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Merchant / Source</span>
                  <span className="text-white text-xs font-semibold block truncate leading-snug" title={transaction.merchant}>
                    {transaction.merchant}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Date & Time</span>
                  <span className="text-white text-xs font-semibold block truncate leading-snug">
                    {transaction.date}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Payment Method</span>
                  <span className="text-white text-xs font-semibold block truncate leading-snug">
                    {transaction.account}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Reference ID</span>
                  <span className="text-white text-xs font-semibold block font-mono truncate leading-snug">
                    {transaction.id}
                  </span>
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1.5">
                <label htmlFor="category-select" className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-low border border-border-glass rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-app-green transition-all duration-150 appearance-none cursor-pointer"
                  >
                    <option value="Shopping">Shopping</option>
                    <option value="Dining">Dining</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Auto & Transport">Auto & Transport</option>
                    <option value="Rent / Housing">Rent / Housing</option>
                    <option value="Income">Income</option>
                    <option value="Investments">Investments</option>
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-3 flex items-center text-text-muted">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Memo / Notes */}
              <div className="space-y-1.5">
                <label htmlFor="memo-notes" className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">
                  Personal Memo / Notes
                </label>
                <textarea
                  id="memo-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add split allocations, tax write-offs, or notes..."
                  className="w-full h-24 bg-surface-low border border-border-glass rounded-xl p-3 text-xs text-white placeholder-text-muted outline-none focus:border-app-green transition-all duration-150 resize-none"
                />
              </div>

              {/* Receipt Area */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">
                  Receipt Image
                </span>
                <ReceiptDropzone
                  receiptUrl={receipt}
                  onUpload={setReceipt}
                  onRemove={() => setReceipt(null)}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-6 border-t border-border-glass bg-white/[0.01] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-app-green hover:bg-[#00e383] disabled:bg-app-green/50 text-black text-xs font-bold shadow-glow-green-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>

              {showSaveIndicator && !isSaving && (
                <span className="text-[10px] text-app-green font-bold flex items-center gap-1 shrink-0 animate-fade-in">
                  <Check className="w-3 h-3" /> Saved!
                </span>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
export default DetailsDrawer;
