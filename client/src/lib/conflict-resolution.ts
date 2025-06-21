/**
 * Professional Conflict Resolution System
 * Handles data conflicts with sophisticated merge strategies
 */

export interface ConflictData<T = any> {
  field: string;
  yours: T;
  theirs: T;
  base?: T; // Original value before both changes
}

export interface ConflictResolution<T = any> {
  conflicts: ConflictData<T>[];
  yours: Record<string, any>;
  theirs: Record<string, any>;
  lastModified: {
    yours: string;
    theirs: string;
  };
  updatedBy?: {
    yours: string;
    theirs: string;
  };
}

export enum MergeStrategy {
  TAKE_YOURS = 'take_yours',
  TAKE_THEIRS = 'take_theirs',
  MERGE_AUTO = 'merge_auto',
  MERGE_MANUAL = 'merge_manual'
}

export class ConflictResolver {
  /**
   * Detects conflicts between two data objects
   */
  static detectConflicts<T extends Record<string, any>>(
    yours: T,
    theirs: T,
    base?: T
  ): ConflictData[] {
    const conflicts: ConflictData[] = [];
    const allKeys = new Set([
      ...Object.keys(yours),
      ...Object.keys(theirs),
      ...(base ? Object.keys(base) : [])
    ]);

    for (const key of allKeys) {
      const yourValue = yours[key];
      const theirValue = theirs[key];
      const baseValue = base?.[key];

      // Deep comparison for objects
      if (!this.deepEqual(yourValue, theirValue)) {
        conflicts.push({
          field: key,
          yours: yourValue,
          theirs: theirValue,
          base: baseValue
        });
      }
    }

    return conflicts;
  }

  /**
   * Automatically resolves conflicts using various strategies
   */
  static autoResolve<T extends Record<string, any>>(
    conflicts: ConflictData[],
    yours: T,
    theirs: T,
    strategy: MergeStrategy = MergeStrategy.MERGE_AUTO
  ): T {
    const resolved: Record<string, any> = { ...yours };

    for (const conflict of conflicts) {
      switch (strategy) {
        case MergeStrategy.TAKE_YOURS:
          resolved[conflict.field] = conflict.yours;
          break;

        case MergeStrategy.TAKE_THEIRS:
          resolved[conflict.field] = conflict.theirs;
          break;

        case MergeStrategy.MERGE_AUTO:
          resolved[conflict.field] = this.autoMergeField(conflict);
          break;

        default:
          // Manual resolution required
          resolved[conflict.field] = conflict.yours;
      }
    }

    return resolved as T;
  }

  /**
   * Attempts to automatically merge conflicting fields
   */
  private static autoMergeField(conflict: ConflictData): any {
    const { yours, theirs, base } = conflict;

    // If one side is null/undefined, take the other
    if (yours == null) return theirs;
    if (theirs == null) return yours;

    // For arrays, merge unique values
    if (Array.isArray(yours) && Array.isArray(theirs)) {
      return [...new Set([...yours, ...theirs])];
    }

    // For objects, merge properties
    if (typeof yours === 'object' && typeof theirs === 'object') {
      return { ...theirs, ...yours }; // Yours takes precedence
    }

    // For strings, if one contains the other, take the longer one
    if (typeof yours === 'string' && typeof theirs === 'string') {
      if (yours.includes(theirs)) return yours;
      if (theirs.includes(yours)) return theirs;
      
      // If they're completely different, prefer yours
      return yours;
    }

    // For numbers, take the more recent (higher) value if it makes sense
    if (typeof yours === 'number' && typeof theirs === 'number') {
      // If we have a base value, prefer the one that changed more
      if (base != null && typeof base === 'number') {
        const yourDiff = Math.abs(yours - base);
        const theirDiff = Math.abs(theirs - base);
        return yourDiff >= theirDiff ? yours : theirs;
      }
      return Math.max(yours, theirs);
    }

    // Default: prefer yours
    return yours;
  }

  /**
   * Deep equality check for complex objects
   */
  private static deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    if (typeof a !== typeof b) return false;
    
    if (typeof a !== 'object') return a === b;
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && this.deepEqual(a[key], b[key])
    );
  }

  /**
   * Creates a human-readable description of conflicts
   */
  static describeConflicts(conflicts: ConflictData[]): string[] {
    return conflicts.map(conflict => {
      const field = conflict.field.replace(/([A-Z])/g, ' $1').toLowerCase();
      return `${field}: your change vs. their change`;
    });
  }

  /**
   * Validates that a resolved object is consistent
   */
  static validateResolution<T>(
    resolved: T,
    original: T,
    conflicts: ConflictData[]
  ): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check that all conflicts were addressed
    for (const conflict of conflicts) {
      const resolvedValue = (resolved as any)[conflict.field];
      if (resolvedValue === undefined) {
        issues.push(`Field '${conflict.field}' was not resolved`);
      }
    }

    // Check for required fields (if applicable)
    const requiredFields = ['id', 'ghlLocationId', 'directoryName'];
    for (const field of requiredFields) {
      if ((resolved as any)[field] == null) {
        issues.push(`Required field '${field}' is missing`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}