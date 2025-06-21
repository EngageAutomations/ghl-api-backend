import validator from 'validator';

/**
 * Validation utilities for location enhancement system
 */

// GoHighLevel location ID format validation
export const validateLocationId = (locationId: string): boolean => {
  const locationIdRegex = /^[A-Za-z0-9]{20,24}$/;
  return locationIdRegex.test(locationId);
};

// Directory name validation - alphanumeric, hyphens, 3-30 chars
export const validateDirectoryName = (directoryName: string): boolean => {
  const directoryNameRegex = /^[a-z0-9-]{3,30}$/;
  return directoryNameRegex.test(directoryName);
};

// Sanitize user inputs
export const sanitizeInput = (input: string): string => {
  return validator.escape(input.trim());
};

// Validation error messages
export const ValidationErrors = {
  INVALID_LOCATION_ID: 'Invalid location ID format. Must be 20-24 alphanumeric characters.',
  INVALID_DIRECTORY_NAME: 'Directory name must be 3-30 lowercase letters, numbers, or hyphens only.',
  REQUIRED_FIELD: 'This field is required.',
  UNAUTHORIZED_LOCATION: 'You do not have access to this location.',
} as const;

// Form validation schema
export interface LocationEnhancementFormData {
  ghlLocationId: string;
  directoryName: string;
  userId: number;
  enhancementConfig: Record<string, any>;
}

export const validateLocationEnhancementForm = (data: Partial<LocationEnhancementFormData>): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!data.ghlLocationId) {
    errors.ghlLocationId = ValidationErrors.REQUIRED_FIELD;
  } else if (!validateLocationId(data.ghlLocationId)) {
    errors.ghlLocationId = ValidationErrors.INVALID_LOCATION_ID;
  }

  if (!data.directoryName) {
    errors.directoryName = ValidationErrors.REQUIRED_FIELD;
  } else if (!validateDirectoryName(data.directoryName)) {
    errors.directoryName = ValidationErrors.INVALID_DIRECTORY_NAME;
  }

  if (!data.userId) {
    errors.userId = ValidationErrors.REQUIRED_FIELD;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};