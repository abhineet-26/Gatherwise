import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gw-paper text-gw-ink-900">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-gw-line shadow-lg text-center">
            <div className="w-12 h-12 rounded-full bg-gw-vermilion-50 text-gw-vermilion-700 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-display font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-gw-ink-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred while rendering the workspace.'}
            </p>
            <Button
              variant="primary"
              onClick={this.handleReset}
              icon={<RefreshCw className="w-4 h-4" />}
              className="w-full"
            >
              Reload Workspace
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
