import React from 'react';
import { User, Eye, EyeOff, ShieldAlert, Settings } from 'lucide-react';

interface SettingsViewProps {
  privacyMode: boolean;
  onTogglePrivacyMode: () => void;
  simulateError: boolean;
  onToggleSimulateError: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  privacyMode,
  onTogglePrivacyMode,
  simulateError,
  onToggleSimulateError
}) => {
  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="bg-surface-low border border-border-glass rounded-2xl p-5">
        <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">Preferences / Settings</span>
        <h2 className="text-base font-bold text-white tracking-tight mt-0.5">Settings</h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xl leading-relaxed">
          Manage your account preferences, mock privacy masking, and simulated database network error paths.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Profile Card */}
        <div className="bg-surface-low border border-border-glass rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border-glass">
            <User className="w-4.5 h-4.5 text-app-green" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Member Profile</h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-border-glass flex items-center justify-center font-bold text-base text-white">
              SJ
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-none">Sarah Jenkins</h4>
              <span className="text-[10px] text-app-green font-bold block mt-1.5 uppercase tracking-wider">
                Platinum Tier Member
              </span>
            </div>
          </div>
          <p className="text-[11px] text-text-muted leading-relaxed pt-1">
            Accounts: Amex Gold Card (...2003), Chase Checking (...4392), Vanguard Brokerage (...8829).
          </p>
        </div>

        {/* Configurations Card */}
        <div className="bg-surface-low border border-border-glass rounded-2xl p-5 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border-glass">
            <Settings className="w-4.5 h-4.5 text-app-green" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">System Controls</h3>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Sensitive Balance Masking</span>
              <span className="text-[10px] text-text-muted block">
                Hides transaction values and account totals with $ •••• placeholders.
              </span>
            </div>
            <button
              onClick={onTogglePrivacyMode}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                privacyMode
                  ? 'border-app-green/30 text-app-green bg-app-green/5'
                  : 'border-border-glass text-text-muted hover:text-white hover:bg-white/5'
              }`}
              title={privacyMode ? "Disable Privacy Masking" : "Enable Privacy Masking"}
              aria-label={privacyMode ? "Disable Privacy Masking" : "Enable Privacy Masking"}
            >
              {privacyMode ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>

          {/* Network Error Simulation Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-white block">Simulate Network Error</span>
              <span className="text-[10px] text-text-muted block">
                Forces transactions edit saves in the details drawer to fail, testing optimistic rollback logic.
              </span>
            </div>
            <button
              onClick={onToggleSimulateError}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
                simulateError
                  ? 'border-red-500/30 text-red-500 bg-red-500/5'
                  : 'border-border-glass text-text-muted hover:text-white hover:bg-white/5'
              }`}
              title={simulateError ? "Disable Error Simulation" : "Enable Error Simulation"}
              aria-label={simulateError ? "Disable Error Simulation" : "Enable Error Simulation"}
            >
              <ShieldAlert className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsView;
