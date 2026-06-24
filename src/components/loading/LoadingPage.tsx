import React from 'react';
import { Activity } from 'lucide-react';

export const LoadingPage: React.FC = () => {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-text-muted">
      <div className="w-10 h-10 rounded-xl bg-app-green/10 flex items-center justify-center border border-app-green/30 animate-spin">
        <Activity className="w-5 h-5 text-app-green animate-pulse" />
      </div>
      <span className="text-[10px] font-black tracking-wider uppercase animate-pulse font-mono">
        Decrypting market telemetry...
      </span>
    </div>
  );
};

export default LoadingPage;
