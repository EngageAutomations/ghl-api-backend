/**
 * GoHighLevel API Router - Dynamic endpoint routing system
 * Handles multiple API categories with automatic authentication and validation
 */

import { Request, Response } from 'express';
import GoHighLevelAPIManager, { GHLAPICategory } from './ghl-api-manager';
import { storage } from '../storage';

// API endpoint mapping structure
interface APIEndpointConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  category: GHLAPICategory;
  handler: string; // Method name in GoHighLevelAPIManager
  requiresAuth: boolean;
  requiresLocationId: boolean;
  validation?: any; // Zod schema for request validation
}

// Comprehensive API endpoint configurations
const API_ENDPOINTS: APIEndpointConfig[] = [
  // Products API
  { method: 'POST', path: '/products', category: GHLAPICategory.PRODUCTS, handler: 'createProduct', requiresAuth: true, requiresLocationId: true },
  { method: 'GET', path: '/products', category: GHLAPICategory.PRODUCTS, handler: 'getProducts', requiresAuth: true, requiresLocationId: true },
  { method: 'GET', path: '/products/:productId', category: GHLAPICategory.PRODUCTS, handler: 'getProduct', requiresAuth: true, requiresLocationId: true },
  { method: 'PUT', path: '/products/:productId', category: GHLAPICategory.PRODUCTS, handler: 'updateProduct', requiresAuth: true, requiresLocationId: true },
  { method: 'DELETE', path: '/products/:productId', category: GHLAPICategory.PRODUCTS, handler: 'deleteProduct', requiresAuth: true, requiresLocationId: true },
  
  // Product Prices
  { method: 'POST', path: '/products/:productId/prices', category: GHLAPICategory.PRODUCTS, handler: 'createProductPrice', requiresAuth: true, requiresLocationId: true },
  { method: 'GET', path: '/products/:productId/prices', category: GHLAPICategory.PRODUCTS, handler: 'getProductPrices', requiresAuth: true, requiresLocationId: true },
  
  // Contacts API
  { method: 'POST', path: '/contacts', category: GHLAPICategory.CONTACTS, handler: 'createContact', requiresAuth: true, requiresLocationId: true },
  { method: 'GET', path: '/contacts', category: GHLAPICategory.CONTACTS, handler: 'getContacts', requiresAuth: true, requiresLocationId: true },
  { method: 'GET', path: '/contacts/:contactId', category: GHLAPICategory.CONTACTS, handler: 'getContact', requiresAuth: true, requiresLocationId: true },
  { method: 'PUT', path: '/contacts/:contactId', category: GHLAPICategory.CONTACTS, handler: 'updateContact', requiresAuth: true, requiresLocationId: true },
  
  // Locations API
  { method: 'GET', path: '/locations', category: GHLAPICategory.LOCATIONS, handler: 'getLocations', requiresAuth: true, requiresLocationId: false },
  { method: 'GET', path: '/locations/:locationId', category: GHLAPICategory.LOCATIONS, handler: 'getLocation', requiresAuth: true, requiresLocationId: false },
  { method: 'PUT', path: '/locations/:locationId', category: GHLAPICategory.LOCATIONS, handler: 'updateLocation', requiresAuth: true, requiresLocationId: false },
  
  // Opportunities API
  { method: 'POST', path: '/opportunities', category: GHLAPICategory.OPPORTUNITIES, handler: 'createOpportunity', requiresAuth: true, requiresLocationId: true },
  { method: 'GET', path: '/opportunities', category: GHLAPICategory.OPPORTUNITIES, handler: 'getOpportunities', requiresAuth: true, requiresLocationId: true },
  
  // Workflows API
  { method: 'GET', path: '/workflows', category: GHLAPICategory.WORKFLOWS, handler: 'getWorkflows', requiresAuth: true, requiresLocationId: true },
  { method: 'POST', path: '/workflows/:workflowId/contacts/:contactId', category: GHLAPICategory.WORKFLOWS, handler: 'triggerWorkflow', requiresAuth: true, requiresLocationId: true },
  
  // Forms API
  { method: 'GET', path: '/forms', category: GHLAPICategory.FORMS, handler: 'getForms', requiresAuth: true, requiresLocationId: true },
  { method: 'GET', path: '/forms/:formId/submissions', category: GHLAPICategory.FORMS, handler: 'getFormSubmissions', requiresAuth: true, requiresLocationId: true },
  
  // Media API
  { method: 'POST', path: '/media/upload', category: GHLAPICategory.MEDIA, handler: 'uploadMedia', requiresAuth: true, requiresLocationId: true },
  { method: 'GET', path: '/media', category: GHLAPICategory.MEDIA, handler: 'getMediaFiles', requiresAuth: true, requiresLocationId: true },
  
  // User Info API
  { method: 'GET', path: '/user/info', category: GHLAPICategory.OAUTH, handler: 'getUserInfo', requiresAuth: true, requiresLocationId: false },
  { method: 'GET', path: '/user/me', category: GHLAPICategory.USERS, handler: 'getMe', requiresAuth: true, requiresLocationId: false }
];

export class GHLAPIRouter {
  
  /**
   * Get OAuth installation for authenticated requests
   */
  private static async getInstallation(installationId?: string) {
    const installations = storage.getAllInstallations();
    
    if (installations.length === 0) {
      throw new Error('No OAuth installations found');
    }
    
    // Use specific installation or first available
    const installation = installationId 
      ? installations.find(i => i.id.toString() === installationId)
      : installations[0];
    
    if (!installation) {
      throw new Error('Installation not found');
    }
    
    if (!installation.ghlAccessToken) {
      throw new Error('No access token available');
    }
    
    return installation;
  }

  /**
   * Create API manager instance with authentication
   */
  private static async createAPIManager(installationId?: string, locationId?: string): Promise<GoHighLevelAPIManager> {
    const installation = await this.getInstallation(installationId);
    
    const targetLocationId = locationId || installation.ghlLocationId;
    
    return new GoHighLevelAPIManager(installation.ghlAccessToken, targetLocationId);
  }

  /**
   * Dynamic API handler that routes requests to appropriate methods
   */
  static async handleAPIRequest(req: Request, res: Response) {
    try {
      const method = req.method as any;
      const path = req.route?.path || req.path;
      
      console.log(`[GHL API Router] ${method} ${path}`);
      
      // Find matching endpoint configuration
      const endpointConfig = API_ENDPOINTS.find(endpoint => 
        endpoint.method === method && this.pathMatches(endpoint.path, path)
      );
      
      if (!endpointConfig) {
        return res.status(404).json({
          success: false,
          error: 'API endpoint not found',
          method,
          path
        });
      }
      
      // Extract installation and location from query/headers
      const installationId = req.query.installationId as string || req.headers['x-installation-id'] as string;
      const locationId = req.query.locationId as string || req.headers['x-location-id'] as string;
      
      // Create authenticated API manager
      const apiManager = await this.createAPIManager(installationId, locationId);
      
      // Extract path parameters
      const pathParams = this.extractPathParams(endpointConfig.path, path);
      
      // Prepare method arguments
      const args = this.prepareMethodArgs(endpointConfig, req, pathParams);
      
      // Call the appropriate API method
      const handler = (apiManager as any)[endpointConfig.handler];
      if (!handler || typeof handler !== 'function') {
        throw new Error(`Handler method '${endpointConfig.handler}' not found`);
      }
      
      const result = await handler.apply(apiManager, args);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(result.status || 400).json(result);
      }
      
    } catch (error: any) {
      console.error('[GHL API Router Error]:', error);
      res.status(500).json({
        success: false,
        error: 'API request failed',
        details: error.message
      });
    }
  }

  /**
   * Check if request path matches endpoint pattern
   */
  private static pathMatches(pattern: string, actualPath: string): boolean {
    const patternRegex = pattern.replace(/:[^\/]+/g, '[^/]+');
    const regex = new RegExp(`^${patternRegex}$`);
    return regex.test(actualPath);
  }

  /**
   * Extract path parameters from URL
   */
  private static extractPathParams(pattern: string, actualPath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const actualParts = actualPath.split('/');
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        params[paramName] = actualParts[i];
      }
    }
    
    return params;
  }

  /**
   * Prepare method arguments based on endpoint configuration
   */
  private static prepareMethodArgs(config: APIEndpointConfig, req: Request, pathParams: Record<string, string>): any[] {
    const args: any[] = [];
    
    // Handle different argument patterns based on handler method
    switch (config.handler) {
      case 'createProduct':
      case 'createContact':
      case 'createOpportunity':
      case 'uploadMedia':
        args.push(req.body);
        break;
        
      case 'getProduct':
      case 'updateProduct':
      case 'deleteProduct':
        args.push(pathParams.productId, req.body || {});
        break;
        
      case 'getContact':
      case 'updateContact':
        args.push(pathParams.contactId, req.body || {});
        break;
        
      case 'getLocation':
      case 'updateLocation':
        args.push(pathParams.locationId, req.body || {});
        break;
        
      case 'createProductPrice':
      case 'getProductPrices':
        args.push(pathParams.productId, req.body || {});
        break;
        
      case 'triggerWorkflow':
        args.push(pathParams.workflowId, pathParams.contactId);
        break;
        
      case 'getFormSubmissions':
        args.push(pathParams.formId);
        break;
        
      case 'getProducts':
      case 'getContacts':
      case 'getOpportunities':
      case 'getMediaFiles':
        // Add pagination parameters
        const limit = parseInt(req.query.limit as string) || 100;
        const offset = parseInt(req.query.offset as string) || 0;
        args.push(undefined, limit, offset); // locationId auto-injected
        break;
        
      default:
        // No additional arguments for methods like getUserInfo, getMe, etc.
        break;
    }
    
    return args;
  }

  /**
   * Generate API endpoint documentation
   */
  static generateAPIDocumentation(): any {
    const documentation = {
      baseUrl: '/api/ghl',
      authentication: 'OAuth2 Bearer Token (stored from installation)',
      endpoints: API_ENDPOINTS.map(endpoint => ({
        method: endpoint.method,
        path: `/api/ghl${endpoint.path}`,
        category: endpoint.category,
        description: `${endpoint.method} ${endpoint.path}`,
        requiresAuth: endpoint.requiresAuth,
        requiresLocationId: endpoint.requiresLocationId,
        parameters: {
          headers: {
            'x-installation-id': 'Optional: Specific installation ID',
            'x-location-id': 'Optional: Override location ID'
          },
          query: {
            limit: 'Pagination limit (default: 100)',
            offset: 'Pagination offset (default: 0)',
            installationId: 'Alternative to header',
            locationId: 'Alternative to header'
          }
        }
      }))
    };
    
    return documentation;
  }

  /**
   * Test all API endpoints with stored authentication
   */
  static async testAllEndpoints(installationId?: string): Promise<any> {
    const results: any = {};
    
    try {
      const installation = await this.getInstallation(installationId);
      const apiManager = new GoHighLevelAPIManager(installation.ghlAccessToken, installation.ghlLocationId);
      
      // Test connection first
      const connectionTest = await apiManager.testConnection();
      results.connection = connectionTest;
      
      if (!connectionTest.success) {
        return results;
      }
      
      // Test each category
      const categories = Object.values(GHLAPICategory);
      
      for (const category of categories) {
        try {
          const categoryAPI = GoHighLevelAPIManager.createCategoryAPI(category, installation.ghlAccessToken, installation.ghlLocationId);
          
          switch (category) {
            case GHLAPICategory.PRODUCTS:
              results.products = await categoryAPI.getProducts();
              break;
            case GHLAPICategory.CONTACTS:
              results.contacts = await categoryAPI.getContacts();
              break;
            case GHLAPICategory.LOCATIONS:
              results.locations = await categoryAPI.getLocations();
              break;
            case GHLAPICategory.WORKFLOWS:
              results.workflows = await categoryAPI.getWorkflows();
              break;
            case GHLAPICategory.FORMS:
              results.forms = await categoryAPI.getForms();
              break;
            case GHLAPICategory.MEDIA:
              results.media = await categoryAPI.getMediaFiles();
              break;
            case GHLAPICategory.USERS:
              results.user = await categoryAPI.getMe();
              break;
          }
        } catch (error: any) {
          results[category] = { success: false, error: error.message };
        }
      }
      
    } catch (error: any) {
      results.error = error.message;
    }
    
    return results;
  }
}

export default GHLAPIRouter;