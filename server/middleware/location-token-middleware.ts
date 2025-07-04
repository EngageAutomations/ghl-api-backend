/**
 * Location Token Middleware
 * Automatically converts Company tokens to Location tokens for media operations
 * 
 * USAGE:
 * - Apply to media upload endpoints that require Location-level access
 * - Automatically handles token conversion and caching
 * - Transparent to existing API calls
 */

import { Request, Response, NextFunction } from 'express';
import { locationTokenConverter } from '../location-token-converter';

interface ExtendedRequest extends Request {
  locationToken?: string;
  installationId?: string;
  locationId?: string;
}

/**
 * Middleware to ensure Location token is available for media operations
 */
export async function ensureLocationToken(
  req: ExtendedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    console.log('[LOCATION MIDDLEWARE] Processing request for media operation');
    
    // Get installation ID from various sources
    const installationId = req.body?.installation_id || 
                          req.query?.installation_id || 
                          req.headers?.['x-installation-id'] ||
                          req.installationId;

    if (!installationId) {
      console.error('[LOCATION MIDDLEWARE] No installation_id found');
      res.status(400).json({ 
        success: false, 
        error: 'installation_id required for media operations' 
      });
      return;
    }

    console.log(`[LOCATION MIDDLEWARE] Getting Location token for installation: ${installationId}`);
    
    // Get or convert to Location token
    const locationToken = await locationTokenConverter.getLocationToken(installationId);
    
    if (!locationToken) {
      console.error('[LOCATION MIDDLEWARE] Failed to get Location token');
      res.status(401).json({ 
        success: false, 
        error: 'Failed to obtain Location-level access token for media operations',
        details: 'Company token could not be converted to Location token'
      });
      return;
    }

    // Attach Location token to request for downstream handlers
    req.locationToken = locationToken;
    req.installationId = installationId;
    
    console.log('[LOCATION MIDDLEWARE] ✅ Location token obtained and attached to request');
    next();

  } catch (error) {
    console.error('[LOCATION MIDDLEWARE] Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Location token middleware error',
      details: error.message 
    });
  }
}

/**
 * Middleware to check if Location token is available (non-blocking)
 */
export async function checkLocationTokenAvailability(
  req: ExtendedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const installationId = req.body?.installation_id || 
                          req.query?.installation_id || 
                          req.headers?.['x-installation-id'];

    if (installationId) {
      const hasLocationToken = await locationTokenConverter.hasLocationToken(installationId);
      req.headers['x-location-token-available'] = hasLocationToken.toString();
      console.log(`[LOCATION MIDDLEWARE] Location token availability: ${hasLocationToken}`);
    }

    next();

  } catch (error) {
    // Non-blocking - continue even if check fails
    console.warn('[LOCATION MIDDLEWARE] Availability check failed:', error.message);
    next();
  }
}

/**
 * Clear cached Location tokens for an installation
 */
export function clearLocationTokenCache(installationId: string): void {
  locationTokenConverter.clearCache(installationId);
  console.log(`[LOCATION MIDDLEWARE] Cleared cache for installation: ${installationId}`);
}