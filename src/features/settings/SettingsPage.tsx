import React from 'react';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { Theme, Density, RefreshInterval } from '../../store/useSettingsStore';
import { 
  Settings, 
  Paintbrush, 
  Database, 
  BellRing, 
  ShieldAlert,
  Moon,
  Sun,
  Monitor,
  Check
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    theme,
    density,
    refreshInterval,
    primaryCurrency,
    notificationsEnabled,
    securityMode,
    setTheme,
    setDensity,
    setRefreshInterval,
    setPrimaryCurrency,
    setNotificationsEnabled,
    setSecurityMode
  } = useSettingsStore();

  const themesList: { value: Theme; label: string; icon: any }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark Mode', icon: Moon },
    { value: 'system', label: 'System Sync', icon: Monitor }
  ];

  const densityList: { value: Density; label: string; desc: string }[] = [
    { value: 'comfortable', label: 'Comfortable', desc: 'Spacious widgets and comfortable row paddings.' },
    { value: 'compact', label: 'Compact', desc: 'Dense data grids, optimized for multi-screen monitoring.' }
  ];

  const intervalsList: { value: RefreshInterval; label: string }[] = [
    { value: 2, label: 'High Frequency (2s)' },
    { value: 5, label: 'Balanced (5s)' },
    { value: 10, label: 'Low Bandwidth (10s)' },
    { value: 0, label: 'Paused / Manual Refresh' }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-500" /> System Control Station
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-medium">Manage styling themes, local database update intervals, and privacy modes.</p>
      </div>

      <div className="space-y-6">
        
        {/* 1. Appearance Settings Panel */}
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-150 dark:border-zinc-850">
            <Paintbrush className="w-4 h-4 text-sky-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 !m-0">Appearance & Theme</h2>
          </div>

          {/* Theme buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block">Color Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {themesList.map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.value;

                return (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition-all duration-205 ${
                      isSelected
                        ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'border-gray-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 text-gray-500 dark:text-zinc-450 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Density selectors */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block">Dashboard Layout Density</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {densityList.map((d) => {
                const isSelected = density === d.value;

                return (
                  <button
                    key={d.value}
                    onClick={() => setDensity(d.value)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-sky-500/30 bg-sky-500/[0.04] dark:bg-sky-500/[0.02]'
                        : 'border-gray-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">{d.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 leading-normal">{d.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. Data & Feeds Settings Panel */}
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-150 dark:border-zinc-850">
            <Database className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-505 !m-0">Data Intervals & Feeds</h2>
          </div>

          {/* Pricing feeds update interval */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block">Live Price Updates Frequency</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {intervalsList.map((item) => {
                const isSelected = refreshInterval === item.value;

                return (
                  <button
                    key={item.value}
                    onClick={() => setRefreshInterval(item.value)}
                    className={`px-3 py-3 rounded-xl border text-[10px] sm:text-xs font-bold text-center transition-all duration-200 leading-normal ${
                      isSelected
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-gray-250 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/30 text-gray-550 dark:text-zinc-450 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">
              High frequency updates provide high volume simulation but trigger heavy CPU usage. Pausing disables background pricing calculations.
            </p>
          </div>

          {/* Primary Base currency selection */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 block">Primary Base Currency</label>
            <div className="flex gap-2">
              {['USD ($)', 'EUR (€)', 'GBP (£)', 'JPY (¥)'].map((curr) => {
                const val = curr.split(' ')[0];
                const isSelected = primaryCurrency === val;

                return (
                  <button
                    key={val}
                    onClick={() => setPrimaryCurrency(val)}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all duration-150 ${
                      isSelected
                        ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'border-gray-200 dark:border-zinc-805 bg-white/45 dark:bg-zinc-900/35 text-gray-500 dark:text-zinc-450 hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {curr}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. Alerts & Privacy Protocols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Notifications Panel */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-150 dark:border-zinc-850">
              <BellRing className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 !m-0">Banners & Audio</h2>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">Enable Desktop Banners</span>
                <span className="text-[10px] text-gray-400 leading-normal block mt-0.5">Toggle alert popups on price crosses.</span>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  notificationsEnabled ? 'bg-sky-600' : 'bg-gray-250 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Privacy/Security masking Panel */}
          <div className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-150 dark:border-zinc-850">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 !m-0">Security & Privacy</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 block">Privacy Masking Mode</span>
                <span className="text-[10px] text-gray-400 leading-normal block mt-0.5">Mask values on portfolio with asterisks.</span>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => setSecurityMode(!securityMode)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  securityMode ? 'bg-red-500' : 'bg-gray-250 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                    securityMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default SettingsPage;
