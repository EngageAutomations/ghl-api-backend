/**
 * GoHighLevel API Manager - Scalable Multi-Endpoint System
 * Handles all GHL API endpoints with centralized authentication and error handling
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { z } from 'zod';

// Base API configuration
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

// Common response schemas
export const GHLErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  statusCode: z.number().optional()
});

export const GHLSuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional()
});

// API endpoint categories
export enum GHLAPICategory {
  PRODUCTS = 'products',
  CONTACTS = 'contacts',
  LOCATIONS = 'locations',
  OPPORTUNITIES = 'opportunities',
  CALENDARS = 'calendars',
  WORKFLOWS = 'workflows',
  FORMS = 'forms',
  SURVEYS = 'surveys',
  MEDIA = 'media',
  USERS = 'users',
  OAUTH = 'oauth'
}

// Request/Response types
interface APIRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  requiresLocationId?: boolean;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  details?: any;
}

export class GoHighLevelAPIManager {
  private accessToken: string;
  private locationId?: string;

  constructor(accessToken: string, locationId?: string) {
    this.accessToken = accessToken;
    this.locationId = locationId;
  }

  /**
   * Core API request handler with automatic authentication
   */
  private async makeRequest<T = any>(request: APIRequest): Promise<APIResponse<T>> {
    try {
      const config: AxiosRequestConfig = {
        method: request.method,
        url: `${GHL_API_BASE}${request.endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Version': GHL_API_VERSION,
          ...request.headers
        },
        timeout: 15000
      };

      if (request.data) {
        config.data = request.data;
      }

      if (request.params) {
        config.params = request.params;
      }

      // Auto-inject location ID if required
      if (request.requiresLocationId && this.locationId) {
        if (request.data) {
          request.data.locationId = this.locationId;
        } else if (request.params) {
          request.params.locationId = this.locationId;
        }
      }

      console.log(`[GHL API] ${request.method} ${request.endpoint}`);
      
      const response: AxiosResponse<T> = await axios(config);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };

    } catch (error: any) {
      console.error(`[GHL API Error] ${request.method} ${request.endpoint}:`, error.message);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        status: error.response?.status || 500,
        details: error.response?.data
      };
    }
  }

  // ============================================================================
  // PRODUCTS API
  // ============================================================================

  async createProduct(productData: any): Promise<APIResponse> {
    return this.makeRequest({
      endpoint: '/products/',
      method: 'POST',
      data: {
        ...productData,
        locationId: productData.locationId || this.locationId
      }
    });
  }

  async getProducts(locationId?: string, limit = 100, offset = 0): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products`,
      method: 'GET',
      params: { limit, offset }
    });
  }

  async getProduct(productId: string, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}`,
      method: 'GET'
    });
  }

  async updateProduct(productId: string, updates: any, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}`,
      method: 'PUT',
      data: updates
    });
  }

  async deleteProduct(productId: string, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}`,
      method: 'DELETE'
    });
  }

  // Product Prices
  async createProductPrice(productId: string, priceData: any, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}/prices`,
      method: 'POST',
      data: priceData
    });
  }

  async getProductPrices(productId: string, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/products/${productId}/prices`,
      method: 'GET'
    });
  }

  // ============================================================================
  // CONTACTS API
  // ============================================================================

  async createContact(contactData: any, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/contacts`,
      method: 'POST',
      data: contactData
    });
  }

  async getContacts(locationId?: string, limit = 100, offset = 0): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/contacts`,
      method: 'GET',
      params: { limit, offset }
    });
  }

  async getContact(contactId: string, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/contacts/${contactId}`,
      method: 'GET'
    });
  }

  async updateContact(contactId: string, updates: any, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/contacts/${contactId}`,
      method: 'PUT',
      data: updates
    });
  }

  // ============================================================================
  // LOCATIONS API
  // ============================================================================

  async getLocations(): Promise<APIResponse> {
    return this.makeRequest({
      endpoint: '/locations/',
      method: 'GET'
    });
  }

  async getLocation(locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}`,
      method: 'GET'
    });
  }

  async updateLocation(updates: any, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}`,
      method: 'PUT',
      data: updates
    });
  }

  // ============================================================================
  // OPPORTUNITIES API
  // ============================================================================

  async createOpportunity(opportunityData: any, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/opportunities`,
      method: 'POST',
      data: opportunityData
    });
  }

  async getOpportunities(locationId?: string, limit = 100, offset = 0): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/opportunities`,
      method: 'GET',
      params: { limit, offset }
    });
  }

  // ============================================================================
  // WORKFLOWS API
  // ============================================================================

  async getWorkflows(locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/workflows`,
      method: 'GET'
    });
  }

  async triggerWorkflow(workflowId: string, contactId: string, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/workflows/${workflowId}/contacts/${contactId}`,
      method: 'POST'
    });
  }

  // ============================================================================
  // FORMS API
  // ============================================================================

  async getForms(locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/forms`,
      method: 'GET'
    });
  }

  async getFormSubmissions(formId: string, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/forms/${formId}/submissions`,
      method: 'GET'
    });
  }

  // ============================================================================
  // MEDIA API
  // ============================================================================

  async uploadMedia(file: FormData, locationId?: string): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/medias/upload-file`,
      method: 'POST',
      data: file,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async getMediaFiles(locationId?: string, limit = 100, offset = 0): Promise<APIResponse> {
    const targetLocationId = locationId || this.locationId;
    return this.makeRequest({
      endpoint: `/locations/${targetLocationId}/medias`,
      method: 'GET',
      params: { limit, offset }
    });
  }

  // ============================================================================
  // OAUTH & USER INFO
  // ============================================================================

  async getUserInfo(): Promise<APIResponse> {
    return this.makeRequest({
      endpoint: '/oauth/userinfo',
      method: 'GET'
    });
  }

  async getMe(): Promise<APIResponse> {
    return this.makeRequest({
      endpoint: '/users/me',
      method: 'GET'
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Test API connection and token validity
   */
  async testConnection(): Promise<APIResponse> {
    try {
      const userInfo = await this.getUserInfo();
      if (userInfo.success) {
        return {
          success: true,
          data: {
            tokenValid: true,
            userInfo: userInfo.data,
            locationId: this.locationId
          }
        };
      } else {
        return userInfo;
      }
    } catch (error: any) {
      return {
        success: false,
        error: 'Connection test failed',
        details: error.message
      };
    }
  }

  /**
   * Update location ID for this API instance
   */
  setLocationId(locationId: string): void {
    this.locationId = locationId;
  }

  /**
   * Get current location ID
   */
  getLocationId(): string | undefined {
    return this.locationId;
  }

  /**
   * Create specialized API instance for specific category
   */
  static createCategoryAPI(category: GHLAPICategory, accessToken: string, locationId?: string): GoHighLevelAPIManager {
    const api = new GoHighLevelAPIManager(accessToken, locationId);
    
    // Add category-specific logging
    const originalMakeRequest = (api as any).makeRequest.bind(api);
    (api as any).makeRequest = function(request: APIRequest) {
      console.log(`[GHL ${category.toUpperCase()}] ${request.method} ${request.endpoint}`);
      return originalMakeRequest(request);
    };
    
    return api;
  }
}

export default GoHighLevelAPIManager;