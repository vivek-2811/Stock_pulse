import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMarketStore } from './useMarketStore';
import { calculateMarketIntelligence } from '../features/intelligence/utils/intelCalculations';

export type AlertType = 
  | 'PRICE_ABOVE' 
  | 'PRICE_BELOW' 
  | 'PCT_CHANGE_ABOVE' 
  | 'PCT_CHANGE_BELOW'
  | 'FEAR_GREED_ABOVE'
  | 'FEAR_GREED_BELOW'
  | 'MARKET_HEALTH_ABOVE'
  | 'MARKET_HEALTH_BELOW'
  | 'RISK_ON_BEGINS'
  | 'RISK_OFF_BEGINS'
  | 'SECTOR_LEADERSHIP_CHANGE'
  | 'BREADTH_BELOW';

export interface MarketAlert {
  id: string;
  symbol: string;
  type: AlertType;
  value: number;
  isTriggered: boolean;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  isRead: boolean;
}

interface AlertState {
  alerts: MarketAlert[];
  notifications: AppNotification[];
  
  createAlert: (symbol: string, type: AlertType, value: number) => void;
  deleteAlert: (id: string) => void;
  clearNotifications: () => void;
  markAllAsRead: () => void;
}

export const useAlertStore = create<AlertState>()(
  persist(
    (set) => ({
      alerts: [],
      notifications: [],

      createAlert: (symbol, type, value) => {
        const newAlert: MarketAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          symbol,
          type,
          value,
          isTriggered: false,
          createdAt: new Date().toISOString()
        };
        set(state => ({ alerts: [newAlert, ...state.alerts] }));
      },

      deleteAlert: (id) => set(state => ({
        alerts: state.alerts.filter(a => a.id !== id)
      })),

      clearNotifications: () => set({ notifications: [] }),

      markAllAsRead: () => set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true }))
      }))
    }),
    {
      name: 'stockpulse-alerts-storage',
      partialize: (state) => ({
        alerts: state.alerts,
        notifications: state.notifications
      })
    }
  )
);

// Track regime and top sector changes in memory for state transition triggers
let lastRegime: 'Risk-On' | 'Neutral' | 'Risk-Off' | null = null;
let lastTopSector: string | null = null;

// Subscribe to useMarketStore in the background to evaluate alerts reactively
useMarketStore.subscribe((marketState) => {
  const { alerts, notifications } = useAlertStore.getState();
  const activeAlerts = alerts.filter(a => !a.isTriggered);
  if (activeAlerts.length === 0) return;

  if (marketState.stocks.length === 0 || marketState.indices.length === 0) return;

  // Derive intelligence metrics once for this tick
  const intel = calculateMarketIntelligence(marketState.stocks, marketState.indices);

  const triggeredAlertIds: string[] = [];
  const newNotifications: AppNotification[] = [];

  activeAlerts.forEach(alert => {
    // 1. Handle macro intelligence alerts
    if (alert.symbol === '$MARKET') {
      let hit = false;
      let description = '';
      let title = 'Market Intel Alert';

      switch (alert.type) {
        case 'FEAR_GREED_ABOVE':
          if (intel.fgScore >= alert.value) {
            hit = true;
            description = `Fear & Greed Index crossed above ${alert.value} (Current: ${intel.fgScore})`;
            title = 'Greed Threshold Met';
          }
          break;
        case 'FEAR_GREED_BELOW':
          if (intel.fgScore <= alert.value) {
            hit = true;
            description = `Fear & Greed Index crossed below ${alert.value} (Current: ${intel.fgScore})`;
            title = 'Fear Threshold Met';
          }
          break;
        case 'MARKET_HEALTH_ABOVE':
          if (intel.healthScore >= alert.value) {
            hit = true;
            description = `Market Health Index surged above ${alert.value}/100 (Current: ${intel.healthScore})`;
            title = 'Health Target Cleared';
          }
          break;
        case 'MARKET_HEALTH_BELOW':
          if (intel.healthScore <= alert.value) {
            hit = true;
            description = `Market Health Index degraded below ${alert.value}/100 (Current: ${intel.healthScore})`;
            title = 'Health Warning Triggered';
          }
          break;
        case 'BREADTH_BELOW':
          if (intel.breadth.breadthPct <= alert.value) {
            hit = true;
            description = `Advancing breadth ratio declined below ${alert.value}% (Current: ${intel.breadth.breadthPct.toFixed(1)}%)`;
            title = 'Market Breadth Warning';
          }
          break;
        case 'RISK_ON_BEGINS':
          if (intel.regime === 'Risk-On' && lastRegime !== 'Risk-On' && lastRegime !== null) {
            hit = true;
            description = `Market Regime transitioned to Risk-On (Score: ${intel.regimeScore.toFixed(0)})`;
            title = 'Risk-On Regime Confirmed';
          }
          break;
        case 'RISK_OFF_BEGINS':
          if (intel.regime === 'Risk-Off' && lastRegime !== 'Risk-Off' && lastRegime !== null) {
            hit = true;
            description = `Market Regime transitioned to Risk-Off (Score: ${intel.regimeScore.toFixed(0)})`;
            title = 'Risk-Off Regime Confirmed';
          }
          break;
        case 'SECTOR_LEADERSHIP_CHANGE':
          if (lastTopSector !== null && lastTopSector !== intel.leadingSector) {
            hit = true;
            description = `Sector leadership rotated. ${intel.leadingSector} overtook ${lastTopSector} as the #1 ranked sector.`;
            title = 'Sector Leadership Rotation';
          }
          break;
      }

      if (hit) {
        triggeredAlertIds.push(alert.id);
        newNotifications.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toLocaleTimeString(),
          title,
          message: description,
          isRead: false
        });
      }
    } else {
      // 2. Handle stock-specific price alerts (existing logic)
      const stock = marketState.stocks.find(s => s.symbol === alert.symbol);
      if (!stock) return;

      let hit = false;
      let description = '';

      switch (alert.type) {
        case 'PRICE_ABOVE':
          if (stock.price >= alert.value) {
            hit = true;
            description = `${alert.symbol} surged above your target price of $${alert.value.toFixed(2)} (Current: $${stock.price.toFixed(2)})`;
          }
          break;
        case 'PRICE_BELOW':
          if (stock.price <= alert.value) {
            hit = true;
            description = `${alert.symbol} fell below your target price of $${alert.value.toFixed(2)} (Current: $${stock.price.toFixed(2)})`;
          }
          break;
        case 'PCT_CHANGE_ABOVE':
          if (stock.changePercent >= alert.value) {
            hit = true;
            description = `${alert.symbol} is up +${stock.changePercent.toFixed(2)}% exceeding your threshold of +${alert.value}%`;
          }
          break;
        case 'PCT_CHANGE_BELOW':
          if (stock.changePercent <= alert.value) {
            hit = true;
            description = `${alert.symbol} is down ${stock.changePercent.toFixed(2)}% breaching your threshold of ${alert.value}%`;
          }
          break;
      }

      if (hit) {
        triggeredAlertIds.push(alert.id);
        newNotifications.push({
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: new Date().toLocaleTimeString(),
          title: `Alert Triggered: ${alert.symbol}`,
          message: description,
          isRead: false
        });
      }
    }
  });

  // Update in-memory references to state
  lastRegime = intel.regime;
  lastTopSector = intel.leadingSector;

  if (triggeredAlertIds.length > 0) {
    useAlertStore.setState({
      alerts: alerts.map(a => triggeredAlertIds.includes(a.id) ? { ...a, isTriggered: true } : a),
      notifications: [...newNotifications, ...notifications].slice(0, 100) // cap notifications
    });
  }
});
