import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[DIUMED][ERROR BOUNDARY]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-mineral-black text-stone flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-emergency-red/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="text-emergency-red" size={32} />
          </div>
          <h1 className="text-warm-pearl text-2xl font-light mb-3 tracking-tight">Something interrupted DiuMed.</h1>
          <p className="text-muted-slate text-sm mb-10 max-w-[280px]">
            The application encountered an unexpected state and could not continue.
          </p>
          <div className="space-y-4 w-full max-w-[280px]">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-raised-graphite border border-white/10 text-warm-pearl py-4 rounded-full text-sm font-medium hover:bg-white/5 transition-colors"
            >
              TRY AGAIN
            </button>
            <button 
              onClick={() => window.location.href = '/'} 
              className="w-full bg-transparent text-stone py-4 rounded-full text-sm font-medium hover:text-warm-pearl transition-colors"
            >
              GO HOME
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
