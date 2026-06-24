import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DashboardWidget {
  id: string;
  title: string;
  visible: boolean;
}

export type DashboardPreset = 'default' | 'trader' | 'analytics' | 'minimal' | 'custom';

interface DashboardLayoutState {
  widgets: DashboardWidget[];
  activePreset: DashboardPreset;
  editMode: boolean;
  
  setEditMode: (val: boolean) => void;
  reorderWidget: (id: string, direction: 'up' | 'down') => void;
  toggleWidgetVisibility: (id: string, visible: boolean) => void;
  applyPreset: (preset: DashboardPreset) => void;
  resetLayout: () => void;
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'indices', title: 'Market Overview', visible: true },
  { id: 'portfolio', title: 'Portfolio Summary', visible: true },
  { id: 'allocations', title: 'Sector Allocations', visible: true },
  { id: 'tickers', title: 'Live Tickers', visible: true },
  { id: 'news', title: 'News Wire', visible: true },
  { id: 'heatmap', title: 'Sector Heatmap', visible: true },
  { id: 'actions', title: 'Operator Panel', visible: true }
];

export const useDashboardLayoutStore = create<DashboardLayoutState>()(
  persist(
    (set) => ({
      widgets: DEFAULT_WIDGETS,
      activePreset: 'default',
      editMode: false,

      setEditMode: (editMode) => set({ editMode }),

      reorderWidget: (id, direction) => set((state) => {
        const index = state.widgets.findIndex(w => w.id === id);
        if (index === -1) return {};
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= state.widgets.length) return {};

        const updated = [...state.widgets];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        return {
          widgets: updated,
          activePreset: 'custom'
        };
      }),

      toggleWidgetVisibility: (id, visible) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, visible } : w),
        activePreset: 'custom'
      })),

      applyPreset: (preset) => set(() => {
        if (preset === 'default') {
          return {
            widgets: DEFAULT_WIDGETS,
            activePreset: 'default'
          };
        }
        
        let visibleIds: string[] = [];
        if (preset === 'trader') {
          visibleIds = ['indices', 'tickers', 'heatmap', 'news', 'actions'];
        } else if (preset === 'analytics') {
          visibleIds = ['portfolio', 'allocations', 'heatmap', 'indices'];
        } else if (preset === 'minimal') {
          visibleIds = ['indices', 'portfolio', 'actions'];
        }

        // Apply visibilities to the default widget set
        const updated = DEFAULT_WIDGETS.map(w => ({
          ...w,
          visible: visibleIds.includes(w.id)
        }));

        return {
          widgets: updated,
          activePreset: preset
        };
      }),

      resetLayout: () => set({
        widgets: DEFAULT_WIDGETS,
        activePreset: 'default'
      })
    }),
    {
      name: 'stockpulse-dashboard-layout-storage',
      partialize: (state) => ({
        widgets: state.widgets,
        activePreset: state.activePreset
      })
    }
  )
);
