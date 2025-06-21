/**
 * Professional Error Handling System
 * Centralized error management with categorization and user-friendly messaging
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHORIZATION = 'authorization',
  CONFLICT = 'conflict',
  SYSTEM = 'system'
}

export interface AppError {
  id: string;
  category: ErrorCategory;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private static errors: AppError[] = [];
  private static listeners: ((error: AppError) => void)[] = [];

  static createError(
    category: ErrorCategory,
    message: string,
    userMessage: string,
    details?: any,
    context?: Record<string, any>
  ): AppError {
    const error: AppError = {
      id: `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category,
      message,
      userMessage,
      details,
      timestamp: new Date(),
      context
    };

    this.errors.push(error);
    this.notifyListeners(error);
    
    // Log to console for debugging
    console.error('Application Error:', {
      category,
      message,
      details,
      context
    });

    return error;
  }

  static handleAPIError(error: any, context?: Record<string, any>): AppError {
    if (error.status === 400) {
      return this.createError(
        ErrorCategory.VALIDATION,
        error.message || 'Validation failed',
        'Please check your input and try again',
        error.details,
        context
      );
    }

    if (error.status === 401 || error.status === 403) {
      return this.createError(
        ErrorCategory.AUTHORIZATION,
        'Access denied',
        'You do not have permission to perform this action',
        error,
        context
      );
    }

    if (error.status === 409) {
      return this.createError(
        ErrorCategory.CONFLICT,
        'Data conflict detected',
        'Another user has modified this data. Please refresh and try again.',
        error.data,
        context
      );
    }

    if (error.status >= 500) {
      return this.createError(
        ErrorCategory.SYSTEM,
        'Server error occurred',
        'We encountered a technical issue. Please try again in a moment.',
        error,
        context
      );
    }

    return this.createError(
      ErrorCategory.NETWORK,
      'Network error',
      'Unable to connect to the server. Please check your connection.',
      error,
      context
    );
  }

  static addListener(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private static notifyListeners(error: AppError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  static getRecentErrors(count = 10): AppError[] {
    return this.errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count);
  }

  static clearErrors(): void {
    this.errors = [];
  }
}