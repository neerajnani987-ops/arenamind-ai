import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0b10] text-white">
          <Card className="max-w-md w-full border border-rose-500/20 bg-[#0d0e16]/80 backdrop-blur-xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/30">
                <svg className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
              <p className="text-sm text-white/60 leading-relaxed">
                An unexpected error occurred in the application layout. Our operation panel was interrupted.
              </p>
              
              {this.state.error && (
                <div className="w-full text-left bg-black/40 border border-white/5 rounded-lg p-3 overflow-x-auto max-h-36">
                  <p className="text-[10px] font-mono text-rose-400 select-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex w-full space-x-2 pt-2">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(this.state.error?.stack || this.state.error?.message || '');
                  }}
                >
                  Copy Stack Trace
                </Button>
                <Button 
                  variant="danger" 
                  className="flex-1"
                  onClick={this.handleReset}
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
