"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  sectionId: string;
  sectionKind: string;
  onReset?: () => void;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorKey: number;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[Forge Studio] Section "${this.props.sectionKind}" (${this.props.sectionId}) failed to render:`,
      error,
      info.componentStack
    );
  }

  handleRetry = () => {
    this.setState((prev) => ({ hasError: false, error: null, errorKey: prev.errorKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 border-2 border-dashed border-red-300 bg-red-50 p-8 text-center">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-900">This section couldn&rsquo;t render</p>
            <p className="mt-1 text-xs text-red-700 max-w-sm">
              The &ldquo;{this.props.sectionKind}&rdquo; section hit an error. Its config may be corrupted.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRetry} className="h-7 text-xs">
            <RotateCcw className="mr-1 h-3 w-3" /> Try again
          </Button>
        </div>
      );
    }
    return (
      <React.Fragment key={this.state.errorKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
