import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AppError, ErrorCategory } from '@/lib/error-handling';

interface ErrorDisplayProps {
  error: AppError;
  onDismiss?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  onRetry,
  showDetails = false
}) => {
  const getVariantByCategory = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return 'default';
      case ErrorCategory.AUTHORIZATION:
        return 'destructive';
      case ErrorCategory.CONFLICT:
        return 'default';
      case ErrorCategory.SYSTEM:
        return 'destructive';
      case ErrorCategory.NETWORK:
        return 'default';
      default:
        return 'default';
    }
  };

  const getIconByCategory = (category: ErrorCategory) => {
    switch (category) {
      case ErrorCategory.VALIDATION:
        return <AlertTriangle className="h-4 w-4" />;
      case ErrorCategory.AUTHORIZATION:
        return <AlertTriangle className="h-4 w-4" />;
      case ErrorCategory.CONFLICT:
        return <RefreshCw className="h-4 w-4" />;
      case ErrorCategory.SYSTEM:
        return <AlertTriangle className="h-4 w-4" />;
      case ErrorCategory.NETWORK:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Alert variant={getVariantByCategory(error.category)} className="mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {getIconByCategory(error.category)}
          <div className="flex-1">
            <AlertTitle className="text-sm font-medium">
              {error.category.charAt(0).toUpperCase() + error.category.slice(1)} Error
            </AlertTitle>
            <AlertDescription className="text-sm">
              {error.userMessage}
            </AlertDescription>
            
            {showDetails && error.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  Technical Details
                </summary>
                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  resetErrorBoundary
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md mx-auto text-center p-6">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Error</h1>
      <p className="text-gray-600 mb-6">
        An unexpected error occurred. Our team has been notified.
      </p>
      <div className="space-y-3">
        <Button onClick={resetErrorBoundary} className="w-full">
          Try Again
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="w-full"
        >
          Refresh Page
        </Button>
      </div>
      <details className="mt-6 text-left">
        <summary className="cursor-pointer text-sm text-gray-500 mb-2">
          Error Details
        </summary>
        <div className="bg-red-50 p-3 rounded border text-xs">
          <div className="font-mono text-red-800 mb-2">{error.name}</div>
          <div className="text-red-700 mb-2">{error.message}</div>
          {error.stack && (
            <pre className="text-red-600 text-xs overflow-auto">
              {error.stack}
            </pre>
          )}
        </div>
      </details>
    </div>
  </div>
);