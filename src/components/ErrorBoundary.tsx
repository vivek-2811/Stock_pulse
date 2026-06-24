import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
          <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-red-500/20 dark:border-red-500/10 shadow-2xl text-center">
            
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
              <AlertCircle className="w-8 h-8" />
            </div>

            {/* Error Message */}
            <h1 className="text-xl font-bold mb-2 tracking-tight">Something went wrong</h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
              An unexpected rendering error occurred inside the dashboard modules. Our monitoring services have logged this issue.
            </p>

            {/* Technical Detail Expandable */}
            {this.state.error && (
              <div className="text-left mb-6 bg-red-500/5 dark:bg-red-500/5 border border-red-500/10 dark:border-red-500/5 p-3.5 rounded-xl max-h-32 overflow-y-auto font-mono text-[11px] text-red-500 leading-normal scrollbar-thin">
                <span className="font-bold">Error:</span> {this.state.error.message}
                {this.state.error.stack && (
                  <pre className="mt-1 opacity-80 overflow-x-auto whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-sky-600/15"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Application
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/40 hover:bg-gray-100 dark:hover:bg-zinc-800 font-semibold text-sm transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>
            
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
