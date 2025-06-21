/**
 * Professional Bulk Operations System
 * Handles batch processing with progress tracking and error recovery
 */

export interface BulkOperation<T, R> {
  id: string;
  items: T[];
  operation: (item: T) => Promise<R>;
  onProgress?: (completed: number, total: number, current?: T) => void;
  onItemComplete?: (item: T, result: R, index: number) => void;
  onItemError?: (item: T, error: any, index: number) => void;
  concurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface BulkResult<T, R> {
  succeeded: Array<{ item: T; result: R; index: number }>;
  failed: Array<{ item: T; error: any; index: number }>;
  total: number;
  duration: number;
  successRate: number;
}

export class BulkOperationProcessor {
  private static activeOperations = new Map<string, boolean>();

  /**
   * Processes a bulk operation with sophisticated error handling and progress tracking
   */
  static async process<T, R>(
    operation: BulkOperation<T, R>
  ): Promise<BulkResult<T, R>> {
    const startTime = Date.now();
    const { id, items, operation: fn, onProgress, onItemComplete, onItemError } = operation;
    const concurrency = operation.concurrency || 3;
    const retryAttempts = operation.retryAttempts || 2;
    const retryDelay = operation.retryDelay || 1000;

    if (this.activeOperations.has(id)) {
      throw new Error(`Bulk operation '${id}' is already in progress`);
    }

    this.activeOperations.set(id, true);

    const succeeded: Array<{ item: T; result: R; index: number }> = [];
    const failed: Array<{ item: T; error: any; index: number }> = [];
    let completed = 0;

    try {
      // Process items in batches with controlled concurrency
      for (let i = 0; i < items.length; i += concurrency) {
        const batch = items.slice(i, Math.min(i + concurrency, items.length));
        const batchPromises = batch.map(async (item, batchIndex) => {
          const itemIndex = i + batchIndex;
          let lastError: any;

          // Retry logic
          for (let attempt = 0; attempt <= retryAttempts; attempt++) {
            try {
              const result = await fn(item);
              succeeded.push({ item, result, index: itemIndex });
              onItemComplete?.(item, result, itemIndex);
              return;
            } catch (error) {
              lastError = error;
              if (attempt < retryAttempts) {
                await this.delay(retryDelay * (attempt + 1)); // Exponential backoff
              }
            }
          }

          // All retry attempts failed
          failed.push({ item, error: lastError, index: itemIndex });
          onItemError?.(item, lastError, itemIndex);
        });

        await Promise.all(batchPromises);
        completed += batch.length;
        onProgress?.(completed, items.length);
      }

      const duration = Date.now() - startTime;
      const successRate = (succeeded.length / items.length) * 100;

      return {
        succeeded,
        failed,
        total: items.length,
        duration,
        successRate
      };

    } finally {
      this.activeOperations.delete(id);
    }
  }

  /**
   * Creates a bulk enhancement operation for location enhancements
   */
  static createLocationEnhancementBulkOperation(
    locationIds: string[],
    directoryName: string,
    userId: number,
    enhancementConfig: Record<string, any>,
    onProgress?: (completed: number, total: number) => void
  ): BulkOperation<string, any> {
    return {
      id: `location_enhancement_bulk_${Date.now()}`,
      items: locationIds,
      operation: async (locationId: string) => {
        const response = await fetch('/api/location-enhancements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ghlLocationId: locationId,
            directoryName,
            userId,
            enhancementConfig,
            isActive: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        return response.json();
      },
      onProgress,
      concurrency: 5,
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  /**
   * Processes bulk validation operations
   */
  static async validateBulkItems<T>(
    items: T[],
    validator: (item: T) => Promise<{ isValid: boolean; errors: string[] }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{
    valid: T[];
    invalid: Array<{ item: T; errors: string[] }>;
  }> {
    const valid: T[] = [];
    const invalid: Array<{ item: T; errors: string[] }> = [];

    const operation: BulkOperation<T, { isValid: boolean; errors: string[] }> = {
      id: `validation_bulk_${Date.now()}`,
      items,
      operation: validator,
      onProgress,
      onItemComplete: (item, result) => {
        if (result.isValid) {
          valid.push(item);
        } else {
          invalid.push({ item, errors: result.errors });
        }
      },
      concurrency: 10, // Higher concurrency for validation
      retryAttempts: 1
    };

    await this.process(operation);

    return { valid, invalid };
  }

  /**
   * Creates a progress tracker for bulk operations
   */
  static createProgressTracker(
    onUpdate: (progress: {
      completed: number;
      total: number;
      percentage: number;
      estimatedTimeRemaining?: number;
    }) => void
  ): (completed: number, total: number) => void {
    const startTime = Date.now();
    let lastUpdate = startTime;

    return (completed: number, total: number) => {
      const now = Date.now();
      const elapsed = now - startTime;
      const percentage = (completed / total) * 100;
      
      let estimatedTimeRemaining: number | undefined;
      if (completed > 0 && completed < total) {
        const averageTimePerItem = elapsed / completed;
        const remainingItems = total - completed;
        estimatedTimeRemaining = averageTimePerItem * remainingItems;
      }

      // Throttle updates to avoid overwhelming the UI
      if (now - lastUpdate > 100 || completed === total) {
        onUpdate({
          completed,
          total,
          percentage,
          estimatedTimeRemaining
        });
        lastUpdate = now;
      }
    };
  }

  /**
   * Utility method for delays in retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Checks if a bulk operation is currently running
   */
  static isOperationActive(operationId: string): boolean {
    return this.activeOperations.has(operationId);
  }

  /**
   * Gets all active operation IDs
   */
  static getActiveOperations(): string[] {
    return Array.from(this.activeOperations.keys());
  }

  /**
   * Cancels an active operation (if supported by the operation)
   */
  static cancelOperation(operationId: string): boolean {
    if (this.activeOperations.has(operationId)) {
      this.activeOperations.delete(operationId);
      return true;
    }
    return false;
  }
}