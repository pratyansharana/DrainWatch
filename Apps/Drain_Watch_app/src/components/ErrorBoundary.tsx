import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StateScreen } from './StateScreen';

interface Props {
  children: ReactNode;
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
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <StateScreen 
          variant="error"
          title="Application Encountered an Error"
          description={this.state.error?.message || "An unexpected rendering fault occurred."}
          buttonText="Restart & Recover"
          onAction={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
