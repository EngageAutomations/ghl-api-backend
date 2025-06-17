/**
 * GoHighLevel API Service
 * Handles product and collection creation via GoHighLevel APIs
 */

import { storage } from '../storage';

interface GHLProduct {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  productType?: 'PHYSICAL' | 'DIGITAL' | 'SERVICE';
  availability?: 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT';
  locationId: string;
}

interface GHLProductResponse {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  image?: string;
  productType?: string;
  availability?: string;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

interface OAuthInstallation {
  id: string;
  accessToken: string;
  refreshToken?: string;
  locationId: string;
  scopes: string;
  tokenExpiry: Date;
}

export class GoHighLevelAPIService {
  private baseURL = 'https://services.leadconnectorhq.com';
  private storage: any;
  
  constructor() {
    this.storage = storage;
  }

  /**
   * Get OAuth installation by various identifiers
   */
  private async getInstallation(installationId?: string, locationId?: string, userId?: string): Promise<OAuthInstallation | null> {
    try {
      // Try to get installation from Railway backend first
      if (installationId) {
        const railwayResponse = await fetch(`https://dir.engageautomations.com/api/installations`);
        if (railwayResponse.ok) {
          const railwayData = await railwayResponse.json();
          const installation = railwayData.installations?.find((inst: any) => inst.id === installationId);
          if (installation) {
            return {
              id: installation.id,
              accessToken: installation.accessToken,
              refreshToken: installation.refreshToken,
              locationId: installation.locationId,
              scopes: installation.scopes,
              tokenExpiry: new Date(installation.tokenExpiry)
            };
          }
        }
      }

      // Fallback to local database lookup
      const installations = await this.storage.getAllOAuthInstallations();
      let installation = installations.find(inst => inst.id === installationId);
      
      if (!installation && locationId) {
        installation = installations.find(inst => inst.ghlLocationId === locationId);
      }
      
      if (!installation && userId) {
        installation = installations.find(inst => inst.ghlUserId === userId);
      }

      if (!installation) {
        return null;
      }

      return {
        id: installation.id,
        accessToken: installation.ghlAccessToken,
        refreshToken: installation.ghlRefreshToken,
        locationId: installation.ghlLocationId,
        scopes: installation.ghlScopes,
        tokenExpiry: installation.ghlTokenExpiry
      };
    } catch (error) {
      console.error('Error getting installation:', error);
      return null;
    }
  }

  /**
   * Make authenticated request to GoHighLevel API
   */
  private async makeGHLRequest(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      accessToken: string;
      locationId?: string;
    }
  ): Promise<any> {
    const { method = 'GET', body, accessToken, locationId } = options;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28'
    };

    if (method !== 'GET' && body) {
      headers['Content-Type'] = 'application/json';
    }

    const url = `${this.baseURL}${endpoint}`;
    console.log(`Making GHL API request: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseText = await response.text();
    console.log(`GHL API response (${response.status}):`, responseText);

    if (!response.ok) {
      throw new Error(`GoHighLevel API error: ${response.status} - ${responseText}`);
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      return responseText;
    }
  }

  /**
   * Create a product in GoHighLevel
   */
  async createProduct(productData: {
    name: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    installationId?: string;
    locationId?: string;
    userId?: string;
  }): Promise<GHLProductResponse> {
    const installation = await this.getInstallation(
      productData.installationId, 
      productData.locationId, 
      productData.userId
    );

    if (!installation) {
      throw new Error('No valid OAuth installation found for product creation');
    }

    // Check if token is expired
    if (installation.tokenExpiry < new Date()) {
      throw new Error('OAuth token expired. Please re-authenticate.');
    }

    const ghlProductData: GHLProduct = {
      name: productData.name,
      description: productData.description || '',
      price: productData.price ? Math.round(productData.price * 100) : undefined, // Convert to cents
      currency: 'USD',
      image: productData.imageUrl,
      productType: 'DIGITAL',
      availability: 'AVAILABLE',
      locationId: installation.locationId
    };

    console.log('Creating GHL product:', ghlProductData);

    try {
      const result = await this.makeGHLRequest('/products', {
        method: 'POST',
        body: ghlProductData,
        accessToken: installation.accessToken,
        locationId: installation.locationId
      });

      console.log('GHL product created successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to create GHL product:', error);
      throw error;
    }
  }

  /**
   * Get products from GoHighLevel
   */
  async getProducts(options: {
    installationId?: string;
    locationId?: string;
    userId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<GHLProductResponse[]> {
    const installation = await this.getInstallation(
      options.installationId, 
      options.locationId, 
      options.userId
    );

    if (!installation) {
      throw new Error('No valid OAuth installation found for getting products');
    }

    const queryParams = new URLSearchParams();
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.offset) queryParams.append('offset', options.offset.toString());
    
    const endpoint = `/products?${queryParams.toString()}`;

    try {
      const result = await this.makeGHLRequest(endpoint, {
        method: 'GET',
        accessToken: installation.accessToken,
        locationId: installation.locationId
      });

      return result.products || [];
    } catch (error) {
      console.error('Failed to get GHL products:', error);
      throw error;
    }
  }

  /**
   * Update a product in GoHighLevel
   */
  async updateProduct(
    productId: string,
    updateData: {
      name?: string;
      description?: string;
      price?: number;
      imageUrl?: string;
      installationId?: string;
      locationId?: string;
      userId?: string;
    }
  ): Promise<GHLProductResponse> {
    const installation = await this.getInstallation(
      updateData.installationId, 
      updateData.locationId, 
      updateData.userId
    );

    if (!installation) {
      throw new Error('No valid OAuth installation found for product update');
    }

    const ghlUpdateData: Partial<GHLProduct> = {};
    if (updateData.name) ghlUpdateData.name = updateData.name;
    if (updateData.description) ghlUpdateData.description = updateData.description;
    if (updateData.price !== undefined) ghlUpdateData.price = Math.round(updateData.price * 100);
    if (updateData.imageUrl) ghlUpdateData.image = updateData.imageUrl;

    try {
      const result = await this.makeGHLRequest(`/products/${productId}`, {
        method: 'PUT',
        body: ghlUpdateData,
        accessToken: installation.accessToken,
        locationId: installation.locationId
      });

      console.log('GHL product updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to update GHL product:', error);
      throw error;
    }
  }

  /**
   * Delete a product from GoHighLevel
   */
  async deleteProduct(productId: string, options: {
    installationId?: string;
    locationId?: string;
    userId?: string;
  }): Promise<boolean> {
    const installation = await this.getInstallation(
      options.installationId, 
      options.locationId, 
      options.userId
    );

    if (!installation) {
      throw new Error('No valid OAuth installation found for product deletion');
    }

    try {
      await this.makeGHLRequest(`/products/${productId}`, {
        method: 'DELETE',
        accessToken: installation.accessToken,
        locationId: installation.locationId
      });

      console.log('GHL product deleted successfully:', productId);
      return true;
    } catch (error) {
      console.error('Failed to delete GHL product:', error);
      throw error;
    }
  }

  /**
   * Upload media file to GoHighLevel
   */
  async uploadMedia(file: Buffer | File, options: {
    fileName: string;
    contentType: string;
    installationId?: string;
    locationId?: string;
    userId?: string;
  }): Promise<{ url: string; fileId: string }> {
    const installation = await this.getInstallation(
      options.installationId, 
      options.locationId, 
      options.userId
    );

    if (!installation) {
      throw new Error('No valid OAuth installation found for media upload');
    }

    // Create FormData for file upload
    const formData = new FormData();
    
    if (file instanceof File) {
      formData.append('file', file);
    } else {
      // Handle Buffer (from Node.js)
      const blob = new Blob([file], { type: options.contentType });
      formData.append('file', blob, options.fileName);
    }
    
    formData.append('locationId', installation.locationId);

    try {
      const response = await fetch(`${this.baseURL}/medias/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${installation.accessToken}`,
          'Version': '2021-07-28'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Media upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Media uploaded successfully:', result);

      return {
        url: result.url || result.fileUrl || result.downloadUrl,
        fileId: result.id || result.fileId
      };
    } catch (error) {
      console.error('Failed to upload media to GHL:', error);
      throw error;
    }
  }

  /**
   * Test connection with GoHighLevel API
   */
  async testConnection(options: {
    installationId?: string;
    locationId?: string;
    userId?: string;
  }): Promise<{ success: boolean; locationInfo?: any; error?: string }> {
    try {
      const installation = await this.getInstallation(
        options.installationId, 
        options.locationId, 
        options.userId
      );

      if (!installation) {
        return { success: false, error: 'No valid OAuth installation found' };
      }

      // Test with a simple location info request
      const locationInfo = await this.makeGHLRequest(`/locations/${installation.locationId}`, {
        method: 'GET',
        accessToken: installation.accessToken,
        locationId: installation.locationId
      });

      return { success: true, locationInfo };
    } catch (error) {
      console.error('GHL connection test failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const ghlAPIService = new GoHighLevelAPIService();