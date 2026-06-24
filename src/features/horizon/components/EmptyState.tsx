import React from 'react';
import { AlertCircle, HelpCircle, Link as LinkIcon } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-history' | 'no-results';
  onConnect?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onConnect }) => {
  if (type === 'no-history') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-5 animate-pulse">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white tracking-tight">No Transactions Linked Yet</h3>
        <p className="text-xs text-text-muted mt-1.5 max-w-sm leading-relaxed">
          Link your checking, savings, or brokerage accounts to view details in real-time.
        </p>
        <button
          onClick={onConnect}
          className="mt-6 flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-app-green hover:bg-[#00e383] text-black text-xs font-bold shadow-glow-green-sm transition-all duration-200"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          Connect Bank Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-white/5 border border-border-glass flex items-center justify-center text-text-muted mb-4">
        <HelpCircle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-white">No Matching Transactions</h3>
      <p className="text-xs text-text-muted mt-1">
        Try adjusting your filters or search keywords to find what you are looking for.
      </p>
    </div>
  );
};
export default EmptyState;
