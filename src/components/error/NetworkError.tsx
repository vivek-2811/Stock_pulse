import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface NetworkErrorProps {
  onReconnect?: () => void;
  isConnecting?: boolean;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ 
  onReconnect, 
  isConnecting = false 
}) => {
  return (
    <div className="glass-card border border-border-glass rounded-xl p-5 flex flex-col items-center justify-center text-center max-w-sm mx-auto gap-4">
      <div className="w-11 h-11 rounded-full bg-app-red/10 border border-app-red/25 flex items-center justify-center text-app-red">
        <WifiOff className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-white">Disrupted Feed Socket</h4>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Connection to the real-time simulation server was lost. Please verify your telemetry settings.
        </p>
      </div>
      {onReconnect && (
        <button
          onClick={onReconnect}
          disabled={isConnecting}
          className="w-full py-2 rounded-xl bg-app-red/15 border border-app-red/25 hover:bg-app-red/25 text-app-red text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
          {isConnecting ? 'Re-establishing socket...' : 'Force Reconnect'}
        </button>
      )}
    </div>
  );
};

export default NetworkError;
