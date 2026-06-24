import React, { createContext, useContext, useState } from 'react';

interface AnalyticsInteractionType {
  sharedHoverIdx: number | null;
  setSharedHoverIdx: (idx: number | null) => void;
  benchmarkSymbol: string;
  setBenchmarkSymbol: (sym: string) => void;
}

const AnalyticsInteractionContext = createContext<AnalyticsInteractionType | undefined>(undefined);

export const AnalyticsInteractionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sharedHoverIdx, setSharedHoverIdx] = useState<number | null>(null);
  const [benchmarkSymbol, setBenchmarkSymbol] = useState<string>('S&P 500');

  return (
    <AnalyticsInteractionContext.Provider value={{
      sharedHoverIdx,
      setSharedHoverIdx,
      benchmarkSymbol,
      setBenchmarkSymbol
    }}>
      {children}
    </AnalyticsInteractionContext.Provider>
  );
};

export const useAnalyticsInteraction = () => {
  const context = useContext(AnalyticsInteractionContext);
  if (!context) {
    throw new Error('useAnalyticsInteraction must be used within an AnalyticsInteractionProvider');
  }
  return context;
};
