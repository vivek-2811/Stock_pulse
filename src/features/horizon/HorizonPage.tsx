import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from './hooks/useTransactions';
import { useCsvExport } from './hooks/useCsvExport';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { TransactionsView } from './components/TransactionsView';
import { DetailsDrawer } from './components/DetailsDrawer';
import { ConfirmClearDataModal } from './components/ConfirmClearDataModal';
import { SkeletonRow } from './components/SkeletonRow';
import { LayoutDashboard, Activity, History, Settings, Eye, EyeOff, Info } from 'lucide-react';
import type { Transaction, HorizonViewMode } from './types/horizon.types';

export const HorizonPage: React.FC = () => {
  // 1. Hooks for State management & exports
  const {
    transactions,
    clearTransactions,
    restoreTransactions,
    updateTransactionOptimistic,
    simulateError,
    setSimulateError,
    isSaving,
  } = useTransactions();

  const { exportCsv } = useCsvExport(transactions);

  // 2. Local view state
  const [activeTab, setActiveTab] = useState<HorizonViewMode>('transactions');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Custom toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // Clear toast after timeout
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Simulate short loading state on initial mount to showcase Skeleton loaders
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Memoized active transaction selection for Details Drawer
  const activeTransaction = useMemo(() => {
    return transactions.find((tx) => tx.id === selectedTxId) || null;
  }, [transactions, selectedTxId]);

  // Format currency helper including balance masking logic
  const formatCurrency = useCallback(
    (amount: number) => {
      if (privacyMode) {
        return amount < 0 ? '-$ ••••' : '+$ ••••';
      }
      const absoluteValue = Math.abs(amount).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      });
      return amount < 0 ? `-$${absoluteValue.replace('$', '')}` : `+$${absoluteValue.replace('$', '')}`;
    },
    [privacyMode]
  );

  // Transaction Edit Save Handler (with Optimistic Updates)
  const handleSaveTransaction = useCallback(
    (updatedTx: Transaction) => {
      const originalTx = transactions.find((tx) => tx.id === updatedTx.id);
      if (!originalTx) return;

      updateTransactionOptimistic(
        updatedTx,
        originalTx,
        () => {
          // Success Callback
          triggerToast('Transaction changes saved successfully.', 'success');
          setSelectedTxId(null); // Close drawer
        },
        (errorMsg) => {
          // Error/Rollback Callback
          triggerToast(`Failed to save: ${errorMsg}. Reverting to original.`, 'error');
        }
      );
    },
    [transactions, updateTransactionOptimistic, triggerToast]
  );

  // Restore defaults / Connect bank simulated handler
  const handleConnectBank = useCallback(() => {
    setInitialLoading(true);
    setTimeout(() => {
      restoreTransactions();
      setInitialLoading(false);
      triggerToast('Simulated bank link established. Mock ledger restored.', 'success');
    }, 1200);
  }, [restoreTransactions, triggerToast]);

  // Outflow/Inflow values helper
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', name: 'Analytics', icon: Activity },
    { id: 'transactions', name: 'Transactions', icon: History },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      {/* Title Hero */}
      <div className="glass-card border border-border-glass rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-app-green/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-app-green">
            <History className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">
              Horizon Finance Integration
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Horizon Transaction Ledger</h1>
          <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
            A conversion of the Horizon Finance vanilla prototype into a production-grade React + TypeScript component. Demonstrates state orchestration, debounced search filters, focus traps, and optimistic rollbacks.
          </p>
        </div>

        {/* Global Privacy Toggle */}
        <button
          onClick={() => setPrivacyMode((p) => !p)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all duration-150 cursor-pointer ${
            privacyMode
              ? 'border-app-green/30 text-app-green bg-app-green/5'
              : 'border-border-glass text-white bg-surface-low hover:bg-white/5'
          }`}
          title="Toggle Privacy Masking"
        >
          {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {privacyMode ? 'Privacy Active' : 'Privacy Mode'}
        </button>
      </div>

      {/* Tab Nav Strip */}
      <div className="flex p-1 rounded-xl bg-surface-low border border-border-glass text-xs font-bold text-text-muted justify-around sm:justify-start sm:gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as HorizonViewMode)}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
                isActive ? 'bg-surface-high text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Active Sub-View rendering */}
      {initialLoading ? (
        <div className="bg-[#121824] border border-border-glass rounded-2xl p-5 space-y-6">
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          <table className="w-full text-left">
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        </div>
      ) : (
        <div className="focus:outline-none">
          {activeTab === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              privacyMode={privacyMode}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              transactions={transactions}
              privacyMode={privacyMode}
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              privacyMode={privacyMode}
              onTogglePrivacyMode={() => setPrivacyMode((p) => !p)}
              simulateError={simulateError}
              onToggleSimulateError={() => setSimulateError((e) => !e)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              privacyMode={privacyMode}
              activeTransactionId={selectedTxId}
              onSelectTransaction={setSelectedTxId}
              onClearClick={() => setIsClearModalOpen(true)}
              onExportClick={exportCsv}
              onConnectClick={handleConnectBank}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      )}

      {/* Details Drawer */}
      <DetailsDrawer
        isOpen={selectedTxId !== null}
        transaction={activeTransaction}
        isSaving={isSaving !== null}
        onClose={() => setSelectedTxId(null)}
        onSave={handleSaveTransaction}
        formatCurrency={formatCurrency}
      />

      {/* Clear Confirmation Modal */}
      <ConfirmClearDataModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={() => {
          clearTransactions();
          setIsClearModalOpen(false);
          triggerToast('All linked mock data cleared from ledger.', 'success');
        }}
      />

      {/* Custom Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <Info className="w-4.5 h-4.5 shrink-0" />
            <span className="text-xs font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default HorizonPage;
