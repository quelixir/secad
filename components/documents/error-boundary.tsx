"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  RefreshCw, 
  FileX, 
  Home,
  Bug
} from "lucide-react";
import { toast } from "sonner";

interface DocumentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
}

interface DocumentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    errorId: string;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class DocumentErrorBoundary extends React.Component<
  DocumentErrorBoundaryProps,
  DocumentErrorBoundaryState
> {
  constructor(props: DocumentErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DocumentErrorBoundaryState> {
    // Generate a unique error ID for tracking
    const errorId = `doc-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    console.error("Document Error Boundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show error toast
    toast.error("Something went wrong with the document interface");
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={error!}
            resetError={this.handleReset}
            errorId={errorId}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  An error occurred while loading the document interface. This might be due to a 
                  network issue or a temporary problem with the application.
                </AlertDescription>
              </Alert>
              
              {error && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Error Details:</p>
                  <p className="text-xs bg-muted p-2 rounded font-mono break-all">
                    {error.message}
                  </p>
                  <p className="text-xs mt-2 opacity-75">
                    Error ID: {errorId}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleReload} 
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
              </div>
              
              <div className="text-xs text-center text-muted-foreground">
                If this problem persists, please contact support and provide the error ID above.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for handling async errors in functional components
export function useDocumentErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Document Error ${context ? `(${context})` : ""}:`, error);
    
    // Determine error type and show appropriate message
    let message = "An unexpected error occurred";
    
    if (error.message.includes("fetch")) {
      message = "Network error - please check your connection";
    } else if (error.message.includes("permission") || error.message.includes("unauthorized")) {
      message = "You don't have permission to perform this action";
    } else if (error.message.includes("not found")) {
      message = "The requested document could not be found";
    } else if (error.message.includes("validation")) {
      message = "Invalid data provided";
    } else if (error.message.includes("storage") || error.message.includes("quota")) {
      message = "Storage limit exceeded";
    }
    
    toast.error(message);
  }, []);

  return { handleError };
}

// Custom error component for specific scenarios
export function DocumentNotFound({ 
  onBack, 
  message = "The document you're looking for could not be found." 
}: { 
  onBack?: () => void;
  message?: string;
}) {
  return (
    <div className="min-h-[300px] flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <FileX className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Document Not Found</h3>
          <p className="text-muted-foreground max-w-md">
            {message}
          </p>
        </div>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
}

// Network error component
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Connection Error</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Unable to connect to the server. Please check your internet connection and try again.
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

export default DocumentErrorBoundary;