import { useState, useEffect, useCallback } from 'react';
import { ErrorHandler, AppError, ErrorCategory } from '@/lib/error-handling';
import { useToast } from '@/hooks/use-toast';

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<AppError[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = ErrorHandler.addListener((error: AppError) => {
      setErrors(prev => [error, ...prev.slice(0, 9)]); // Keep last 10 errors
      
      // Show toast for critical errors
      if (error.category === ErrorCategory.SYSTEM || error.category === ErrorCategory.AUTHORIZATION) {
        toast({
          title: 'Error',
          description: error.userMessage,
          variant: 'destructive'
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  const handleError = useCallback((
    error: any,
    context?: Record<string, any>
  ): AppError => {
    return ErrorHandler.handleAPIError(error, context);
  }, []);

  const createError = useCallback((
    category: ErrorCategory,
    message: string,
    userMessage: string,
    details?: any,
    context?: Record<string, any>
  ): AppError => {
    return ErrorHandler.createError(category, message, userMessage, details, context);
  }, []);

  const dismissError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
    ErrorHandler.clearErrors();
  }, []);

  return {
    errors,
    handleError,
    createError,
    dismissError,
    clearAllErrors
  };
};