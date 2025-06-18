/**
 * Universal API Router for GoHighLevel Integration
 * Configuration-driven endpoint management with automatic authentication injection
 */

import { Request, Response, NextFunction } from 'express';
import { EnhancedOAuthManager } from './oauth-enhanced.js';

interface EndpointConfig {
  method: string;
  pattern: string;
  ghlEndpoint: string;
  scopes: string[];
  requiresLocation?: boolean;
  supportsQuery?: boolean;
  supportsBody?: boolean;
  rateLimit?: number;
}

/**
 * Configuration for all GoHighLevel API endpoints
 * Based on API v2021-07-28 specification
 */
const API_ENDPOINTS: EndpointConfig[] = [
  // Products API
  {
    method: 'GET',
    pattern: '/products',
    ghlEndpoint: '/products',
    scopes: ['products.readonly', 'products.write'],
    requiresLocation: true,
    supportsQuery: true
  },
  {
    method: 'POST',
    pattern: '/products',
    ghlEndpoint: '/products',
    scopes: ['products.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'GET',
    pattern: '/products/:productId',
    ghlEndpoint: '/products/{productId}',
    scopes: ['products.readonly', 'products.write'],
    requiresLocation: true
  },
  {
    method: 'PUT',
    pattern: '/products/:productId',
    ghlEndpoint: '/products/{productId}',
    scopes: ['products.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'DELETE',
    pattern: '/products/:productId',
    ghlEndpoint: '/products/{productId}',
    scopes: ['products.write'],
    requiresLocation: true
  },

  // Product Prices API
  {
    method: 'GET',
    pattern: '/products/:productId/prices',
    ghlEndpoint: '/products/{productId}/prices',
    scopes: ['products.readonly', 'products.write'],
    requiresLocation: true,
    supportsQuery: true
  },
  {
    method: 'POST',
    pattern: '/products/:productId/prices',
    ghlEndpoint: '/products/{productId}/prices',
    scopes: ['products.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'GET',
    pattern: '/products/:productId/prices/:priceId',
    ghlEndpoint: '/products/{productId}/prices/{priceId}',
    scopes: ['products.readonly', 'products.write'],
    requiresLocation: true
  },
  {
    method: 'PUT',
    pattern: '/products/:productId/prices/:priceId',
    ghlEndpoint: '/products/{productId}/prices/{priceId}',
    scopes: ['products.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'DELETE',
    pattern: '/products/:productId/prices/:priceId',
    ghlEndpoint: '/products/{productId}/prices/{priceId}',
    scopes: ['products.write'],
    requiresLocation: true
  },

  // Contacts API
  {
    method: 'GET',
    pattern: '/contacts',
    ghlEndpoint: '/contacts',
    scopes: ['contacts.readonly', 'contacts.write'],
    requiresLocation: true,
    supportsQuery: true
  },
  {
    method: 'POST',
    pattern: '/contacts',
    ghlEndpoint: '/contacts',
    scopes: ['contacts.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'GET',
    pattern: '/contacts/:contactId',
    ghlEndpoint: '/contacts/{contactId}',
    scopes: ['contacts.readonly', 'contacts.write'],
    requiresLocation: true
  },
  {
    method: 'PUT',
    pattern: '/contacts/:contactId',
    ghlEndpoint: '/contacts/{contactId}',
    scopes: ['contacts.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'DELETE',
    pattern: '/contacts/:contactId',
    ghlEndpoint: '/contacts/{contactId}',
    scopes: ['contacts.write'],
    requiresLocation: true
  },

  // Locations API
  {
    method: 'GET',
    pattern: '/locations',
    ghlEndpoint: '/locations',
    scopes: ['locations.readonly'],
    supportsQuery: true
  },
  {
    method: 'GET',
    pattern: '/locations/:locationId',
    ghlEndpoint: '/locations/{locationId}',
    scopes: ['locations.readonly']
  },

  // Opportunities API
  {
    method: 'GET',
    pattern: '/opportunities',
    ghlEndpoint: '/opportunities',
    scopes: ['opportunities.readonly', 'opportunities.write'],
    requiresLocation: true,
    supportsQuery: true
  },
  {
    method: 'POST',
    pattern: '/opportunities',
    ghlEndpoint: '/opportunities',
    scopes: ['opportunities.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'GET',
    pattern: '/opportunities/:opportunityId',
    ghlEndpoint: '/opportunities/{opportunityId}',
    scopes: ['opportunities.readonly', 'opportunities.write'],
    requiresLocation: true
  },
  {
    method: 'PUT',
    pattern: '/opportunities/:opportunityId',
    ghlEndpoint: '/opportunities/{opportunityId}',
    scopes: ['opportunities.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'DELETE',
    pattern: '/opportunities/:opportunityId',
    ghlEndpoint: '/opportunities/{opportunityId}',
    scopes: ['opportunities.write'],
    requiresLocation: true
  },

  // Workflows API
  {
    method: 'GET',
    pattern: '/workflows',
    ghlEndpoint: '/workflows',
    scopes: ['workflows.readonly'],
    requiresLocation: true,
    supportsQuery: true
  },
  {
    method: 'POST',
    pattern: '/workflows/:workflowId/trigger',
    ghlEndpoint: '/workflows/{workflowId}/trigger',
    scopes: ['workflows.write'],
    requiresLocation: true,
    supportsBody: true
  },

  // Forms API
  {
    method: 'GET',
    pattern: '/forms',
    ghlEndpoint: '/forms',
    scopes: ['forms.readonly'],
    requiresLocation: true,
    supportsQuery: true
  },
  {
    method: 'GET',
    pattern: '/forms/:formId/submissions',
    ghlEndpoint: '/forms/{formId}/submissions',
    scopes: ['forms.readonly'],
    requiresLocation: true,
    supportsQuery: true
  },

  // Media Files API
  {
    method: 'GET',
    pattern: '/medias/files',
    ghlEndpoint: '/medias/files',
    scopes: ['media.readonly', 'media.write'],
    requiresLocation: true,
    supportsQuery: true
  },
  {
    method: 'POST',
    pattern: '/medias/upload-file',
    ghlEndpoint: '/medias/upload-file',
    scopes: ['media.write'],
    requiresLocation: true,
    supportsBody: true
  },
  {
    method: 'DELETE',
    pattern: '/medias/:mediaId',
    ghlEndpoint: '/medias/{mediaId}',
    scopes: ['media.write'],
    requiresLocation: true
  }
];

export class UniversalAPIRouter {
  private oauthManager: EnhancedOAuthManager;
  private readonly ghlBaseUrl = 'https://services.leadconnectorhq.com';

  constructor() {
    this.oauthManager = new EnhancedOAuthManager();
  }

  /**
   * Find endpoint configuration for the given method and path
   */
  findEndpointConfig(method: string, path: string): EndpointConfig | null {
    return API_ENDPOINTS.find(config => {
      if (config.method !== method.toUpperCase()) return false;
      return this.matchPattern(config.pattern, path);
    }) || null;
  }

  /**
   * Extract path parameters from URL pattern
   */
  extractPathParams(pattern: string, actualPath: string): Record<string, string> {
    const patternParts = pattern.split('/');
    const pathParts = actualPath.split('/');
    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathParts[i];
      }
    }

    return params;
  }

  /**
   * Build GoHighLevel endpoint URL with parameters
   */
  buildGHLEndpoint(config: EndpointConfig, pathParams: Record<string, string>, locationId?: string): string {
    let endpoint = config.ghlEndpoint;

    // Replace path parameters
    for (const [key, value] of Object.entries(pathParams)) {
      endpoint = endpoint.replace(`{${key}}`, value);
    }

    // Add location ID if required
    if (config.requiresLocation && locationId) {
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint += `${separator}locationId=${locationId}`;
    }

    return `${this.ghlBaseUrl}${endpoint}`;
  }

  /**
   * Check if user has required scopes
   */
  checkScopes(userScopes: string[], requiredScopes: string[]): boolean {
    const userScopeList = userScopes.split(' ');
    return requiredScopes.some(scope => userScopeList.includes(scope));
  }

  /**
   * Get installation from session token
   */
  async getInstallationFromSession(req: Request): Promise<any> {
    const sessionToken = req.cookies?.session_token;
    if (!sessionToken) return null;

    const tokenData = this.oauthManager.verifySessionToken(sessionToken);
    if (!tokenData) return null;

    // Get installation from database
    const { db } = await import('./db.js');
    const query = 'SELECT * FROM oauth_installations WHERE id = $1';
    const result = await db.query(query, [tokenData.installationId]);
    
    return result.rows[0] || null;
  }

  /**
   * Main request handler for universal API routing
   */
  async handleRequest(req: Request, res: Response): Promise<void> {
    try {
      const path = req.path.replace('/api/ghl', '');
      const config = this.findEndpointConfig(req.method, path);

      if (!config) {
        res.status(404).json({ 
          error: 'Endpoint not found',
          method: req.method,
          path: path
        });
        return;
      }

      // Get installation and validate authentication
      const installation = await this.getInstallationFromSession(req);
      if (!installation) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check scopes
      if (!this.checkScopes(installation.ghl_scopes, config.scopes)) {
        res.status(403).json({ 
          error: 'Insufficient permissions',
          required: config.scopes,
          available: installation.ghl_scopes
        });
        return;
      }

      // Ensure valid token
      const validInstallation = await this.oauthManager.ensureValidToken({
        id: installation.id,
        ghlUserId: installation.ghl_user_id,
        locationId: installation.ghl_location_id,
        accessToken: installation.ghl_access_token,
        refreshToken: installation.ghl_refresh_token,
        expiresAt: new Date(installation.ghl_expires_at),
        scopes: installation.ghl_scopes
      });

      // Extract path parameters
      const pathParams = this.extractPathParams(config.pattern, path);

      // Build GoHighLevel URL
      const ghlUrl = this.buildGHLEndpoint(config, pathParams, validInstallation.locationId);

      // Prepare headers
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${validInstallation.accessToken}`,
        'Version': '2021-07-28'
      };

      // Handle different content types
      let body: string | undefined;
      if (config.supportsBody && (req.method === 'POST' || req.method === 'PUT')) {
        if (req.is('multipart/form-data')) {
          // Handle file uploads
          headers['Content-Type'] = req.get('Content-Type') || 'multipart/form-data';
          body = req.body;
        } else {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(req.body);
        }
      }

      // Add query parameters
      let finalUrl = ghlUrl;
      if (config.supportsQuery && Object.keys(req.query).length > 0) {
        const queryParams = new URLSearchParams();
        for (const [key, value] of Object.entries(req.query)) {
          if (typeof value === 'string') {
            queryParams.append(key, value);
          }
        }
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl += `${separator}${queryParams}`;
      }

      // Make request to GoHighLevel
      const response = await fetch(finalUrl, {
        method: req.method,
        headers,
        body
      });

      // Handle response
      const responseData = await response.json();
      res.status(response.status).json(responseData);

    } catch (error) {
      console.error('Universal API Router error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private matchPattern(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // Parameter - matches anything
        continue;
      } else if (patternPart !== pathPart) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Middleware for OAuth authentication with installation ID bypass
 */
export async function requireOAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Debug: Log request details
  console.log('requireOAuth middleware called for:', req.method, req.path);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  // Check if this is an installation ID request (bypass OAuth requirement)
  const installationIdFromBody = req.body?.installationId;
  const installationIdFromQuery = req.query?.installationId;
  const installationIdFromHeader = req.headers['x-installation-id'];
  
  if (installationIdFromBody || installationIdFromQuery || installationIdFromHeader) {
    console.log('Installation ID detected, bypassing OAuth check:', {
      body: installationIdFromBody,
      query: installationIdFromQuery,
      header: installationIdFromHeader
    });
    (req as any).hasInstallationId = true;
    return next();
  }

  const router = new UniversalAPIRouter();
  const installation = await router.getInstallationFromSession(req);
  
  if (!installation) {
    console.log('No OAuth installation found and no installation ID provided');
    res.status(401).json({ error: 'Authorization header with Bearer token required' });
    return;
  }

  // Add installation to request for use in route handlers
  (req as any).installation = installation;
  next();
}

/**
 * Session recovery endpoint for embedded CRM tab access
 */
export async function handleSessionRecovery(req: Request, res: Response): Promise<void> {
  try {
    const { ghlUserId, locationId, installationId } = req.body;

    // Find installation by multiple methods
    const { db } = await import('./db.js');
    let query: string;
    let params: any[];

    if (installationId) {
      query = 'SELECT * FROM oauth_installations WHERE id = $1';
      params = [installationId];
    } else if (ghlUserId && locationId) {
      query = 'SELECT * FROM oauth_installations WHERE ghl_user_id = $1 AND ghl_location_id = $2';
      params = [ghlUserId, locationId];
    } else if (ghlUserId) {
      query = 'SELECT * FROM oauth_installations WHERE ghl_user_id = $1';
      params = [ghlUserId];
    } else {
      res.status(400).json({ error: 'Missing identification parameters' });
      return;
    }

    const result = await db.query(query, params);
    const installation = result.rows[0];

    if (!installation) {
      res.status(401).json({ error: 'No OAuth installation found' });
      return;
    }

    // Generate new session token
    const oauthManager = new EnhancedOAuthManager();
    const sessionToken = oauthManager.generateSessionToken(installation.id);

    // Set secure session cookie
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Required for iframe embedding
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({ 
      success: true,
      userId: installation.ghl_user_id,
      locationId: installation.ghl_location_id
    });

  } catch (error) {
    console.error('Session recovery error:', error);
    res.status(500).json({ error: 'Session recovery failed' });
  }
}