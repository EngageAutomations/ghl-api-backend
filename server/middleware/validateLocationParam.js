/**
 * Middleware for validating GoHighLevel location parameters
 */

const validateLocationId = (locationId) => {
  const locationIdRegex = /^[A-Za-z0-9]{20,24}$/;
  return locationIdRegex.test(locationId);
};

const validateDirectoryName = (directoryName) => {
  const directoryNameRegex = /^[a-z0-9-]{3,30}$/;
  return directoryNameRegex.test(directoryName);
};

/**
 * Validates location ID parameter in request
 */
export const validateLocationParam = (req, res, next) => {
  const { locationId } = req.params;
  
  if (!locationId) {
    return res.status(400).json({
      error: 'Location ID is required',
      code: 'MISSING_LOCATION_ID'
    });
  }

  if (!validateLocationId(locationId)) {
    return res.status(400).json({
      error: 'Invalid location ID format. Must be 20-24 alphanumeric characters.',
      code: 'INVALID_LOCATION_ID'
    });
  }

  next();
};

/**
 * Validates directory name parameter in request
 */
export const validateDirectoryParam = (req, res, next) => {
  const { directoryName } = req.params;
  
  if (!directoryName) {
    return res.status(400).json({
      error: 'Directory name is required',
      code: 'MISSING_DIRECTORY_NAME'
    });
  }

  if (!validateDirectoryName(directoryName)) {
    return res.status(400).json({
      error: 'Directory name must be 3-30 lowercase letters, numbers, or hyphens only.',
      code: 'INVALID_DIRECTORY_NAME'
    });
  }

  next();
};

/**
 * Validates location enhancement request body
 */
export const validateLocationEnhancementBody = (req, res, next) => {
  const { ghlLocationId, directoryName, userId, enhancementConfig } = req.body;

  const errors = {};

  if (!ghlLocationId) {
    errors.ghlLocationId = 'Location ID is required';
  } else if (!validateLocationId(ghlLocationId)) {
    errors.ghlLocationId = 'Invalid location ID format';
  }

  if (!directoryName) {
    errors.directoryName = 'Directory name is required';
  } else if (!validateDirectoryName(directoryName)) {
    errors.directoryName = 'Invalid directory name format';
  }

  if (!userId || typeof userId !== 'number') {
    errors.userId = 'Valid user ID is required';
  }

  if (!enhancementConfig || typeof enhancementConfig !== 'object') {
    errors.enhancementConfig = 'Enhancement configuration is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors
    });
  }

  next();
};