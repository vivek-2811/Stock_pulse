import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockDataEngine } from '../services/mockDataEngine';

export type Theme = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';
export type RefreshInterval = 2 | 5 | 10 | 0; // in seconds, 0 = manual

interface SettingsState {
  theme: Theme;
  density: Density;
  refreshInterval: RefreshInterval;
  primaryCurrency: string;
  notificationsEnabled: boolean;
  securityMode: boolean;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  setRefreshInterval: (interval: RefreshInterval) => void;
  setPrimaryCurrency: (currency: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSecurityMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark', // Defaulting to premium dark mode
      density: 'comfortable',
      refreshInterval: 5,
      primaryCurrency: 'USD',
      notificationsEnabled: true,
      securityMode: false,
      setTheme: (theme) => {
        set({ theme });
        // Apply class to body for Tailwind styling
        applyThemeClass(theme);
      },
      setDensity: (density) => set({ density }),
      setRefreshInterval: (refreshInterval) => {
        set({ refreshInterval });
        if (refreshInterval > 0) {
          mockDataEngine.setRefreshInterval(refreshInterval);
          mockDataEngine.toggleMarketStatus(); // toggle to make sure ticker running
          // If was paused, restart
          if (!mockDataEngine.isMarketOpen()) {
            mockDataEngine.toggleMarketStatus();
          }
        } else {
          // Pause updates
          if (mockDataEngine.isMarketOpen()) {
            mockDataEngine.toggleMarketStatus();
          }
        }
      },
      setPrimaryCurrency: (primaryCurrency) => set({ primaryCurrency }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setSecurityMode: (securityMode) => set({ securityMode }),
    }),
    {
      name: 'stockpulse-settings-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme after rehydration
        if (state) {
          applyThemeClass(state.theme);
        }
      }
    }
  )
);

// Theme helper to handle class toggling
export function applyThemeClass(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}
