/**
 * Product Creation Workflow Service
 * Handles the complete 4-step product creation flow with automatic retry and token refresh
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

interface ProductDetails {
  name: string;
  description: string;
  type: 'one_time' | 'recurring';
  locationId?: string;
}

interface PriceData {
  amount: number; // in cents
  currency: string;
  type?: 'one_time' | 'recurring';
  interval?: 'month' | 'year' | 'week' | 'day';
}

interface WorkflowResult {
  success: boolean;
  productId?: string;
  imageUrl?: string;
  steps: {
    imageUpload: { success: boolean; url?: string; error?: string };
    productCreation: { success: boolean; id?: string; error?: string };
    imageAttachment: { success: boolean; error?: string };
    priceCreation: { success: boolean; error?: string };
  };
  error?: string;
  tokenRefreshed?: boolean;
}

export class ProductWorkflowService {
  private readonly baseUrl = 'https://services.leadconnectorhq.com';
  private readonly oauthBackendUrl = 'https://dir.engageautomations.com';
  private readonly maxRetries = 3;

  /**
   * Get fresh access token from OAuth backend
   */
  private async getAccessToken(installationId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.oauthBackendUrl}/api/token-access/${installationId}`
      );
      
      if (!response.data.success || !response.data.access_token) {
        throw new Error('Failed to get access token');
      }
      
      return response.data.access_token;
    } catch (error) {
      console.error('Token retrieval failed:', error);
      throw new Error('OAuth token unavailable - please reconnect your account');
    }
  }

  /**
   * Make API call with automatic retry on token expiry
   */
  private async makeAPICall(
    installationId: string,
    apiCall: (token: string) => Promise<any>,
    retryCount = 0
  ): Promise<any> {
    try {
      const token = await this.getAccessToken(installationId);
      return await apiCall(token);
    } catch (error: any) {
      // Check for token expiry (401 Unauthorized)
      if (error.response?.status === 401 && retryCount < this.maxRetries) {
        console.log(`Token expired, refreshing... (attempt ${retryCount + 1})`);
        
        // Try to refresh token via OAuth backend
        try {
          await axios.post(`${this.oauthBackendUrl}/api/refresh-token/${installationId}`);
          // Retry the API call with fresh token
          return await this.makeAPICall(installationId, apiCall, retryCount + 1);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Token refresh failed - please reconnect your account');
        }
      }
      
      throw error;
    }
  }

  /**
   * Step 1: Upload image to GoHighLevel media library
   */
  private async uploadImage(installationId: string, filePath: string): Promise<string> {
    const apiCall = async (token: string) => {
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));

      const response = await axios.post(
        `${this.baseUrl}/media/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000, // 30 second timeout for file uploads
        }
      );

      return response.data.url;
    };

    return await this.makeAPICall(installationId, apiCall);
  }

  /**
   * Step 2: Create product (without image initially)
   */
  private async createProduct(installationId: string, productDetails: ProductDetails): Promise<string> {
    const apiCall = async (token: string) => {
      const response = await axios.post(
        `${this.baseUrl}/products`,
        {
          name: productDetails.name,
          description: productDetails.description,
          type: productDetails.type,
          locationId: productDetails.locationId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.id;
    };

    return await this.makeAPICall(installationId, apiCall);
  }

  /**
   * Step 3: Update product with image URL
   */
  private async updateProductWithImage(installationId: string, productId: string, imageUrl: string): Promise<void> {
    const apiCall = async (token: string) => {
      await axios.put(
        `${this.baseUrl}/products/${productId}`,
        { image: imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    };

    await this.makeAPICall(installationId, apiCall);
  }

  /**
   * Step 4: Add price to product
   */
  private async addPriceToProduct(installationId: string, productId: string, priceData: PriceData): Promise<void> {
    const apiCall = async (token: string) => {
      const payload = {
        amount: priceData.amount,
        currency: priceData.currency,
        type: priceData.type || 'one_time',
        ...(priceData.type === 'recurring' && {
          interval: priceData.interval || 'month'
        })
      };

      await axios.post(
        `${this.baseUrl}/products/${productId}/prices`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
    };

    await this.makeAPICall(installationId, apiCall);
  }

  /**
   * Execute complete product creation workflow
   */
  public async createCompleteProduct(
    installationId: string,
    filePath: string,
    productDetails: ProductDetails,
    priceData: PriceData
  ): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: false,
      steps: {
        imageUpload: { success: false },
        productCreation: { success: false },
        imageAttachment: { success: false },
        priceCreation: { success: false }
      }
    };

    try {
      console.log('🚀 Starting product creation workflow...');

      // Step 1: Upload Image
      console.log('📸 Step 1: Uploading image...');
      try {
        const imageUrl = await this.uploadImage(installationId, filePath);
        result.imageUrl = imageUrl;
        result.steps.imageUpload = { success: true, url: imageUrl };
        console.log('✅ Image uploaded successfully:', imageUrl);
      } catch (error: any) {
        result.steps.imageUpload = { success: false, error: error.message };
        throw new Error(`Image upload failed: ${error.message}`);
      }

      // Step 2: Create Product
      console.log('🏗️ Step 2: Creating product...');
      try {
        const productId = await this.createProduct(installationId, productDetails);
        result.productId = productId;
        result.steps.productCreation = { success: true, id: productId };
        console.log('✅ Product created successfully:', productId);
      } catch (error: any) {
        result.steps.productCreation = { success: false, error: error.message };
        throw new Error(`Product creation failed: ${error.message}`);
      }

      // Step 3: Update Product with Image
      console.log('🖼️ Step 3: Attaching image to product...');
      try {
        await this.updateProductWithImage(installationId, result.productId!, result.imageUrl!);
        result.steps.imageAttachment = { success: true };
        console.log('✅ Image attached to product successfully');
      } catch (error: any) {
        result.steps.imageAttachment = { success: false, error: error.message };
        throw new Error(`Image attachment failed: ${error.message}`);
      }

      // Step 4: Add Price
      console.log('💰 Step 4: Adding price to product...');
      try {
        await this.addPriceToProduct(installationId, result.productId!, priceData);
        result.steps.priceCreation = { success: true };
        console.log('✅ Price added to product successfully');
      } catch (error: any) {
        result.steps.priceCreation = { success: false, error: error.message };
        throw new Error(`Price creation failed: ${error.message}`);
      }

      result.success = true;
      console.log('🎉 Product creation workflow completed successfully!');
      
      return result;

    } catch (error: any) {
      result.error = error.message;
      console.error('❌ Workflow failed:', error.message);
      return result;
    }
  }

  /**
   * Parse JSON input for workflow execution
   */
  public async processWorkflowFromJSON(jsonInput: any): Promise<WorkflowResult> {
    try {
      const {
        installationId,
        filePath,
        product,
        price
      } = jsonInput;

      // Validate required fields
      if (!installationId) throw new Error('installationId is required');
      if (!filePath) throw new Error('filePath is required');
      if (!product?.name) throw new Error('product.name is required');
      if (!product?.description) throw new Error('product.description is required');
      if (!price?.amount) throw new Error('price.amount is required');
      if (!price?.currency) throw new Error('price.currency is required');

      const productDetails: ProductDetails = {
        name: product.name,
        description: product.description,
        type: product.type || 'one_time',
        locationId: product.locationId
      };

      const priceData: PriceData = {
        amount: price.amount,
        currency: price.currency,
        type: price.type || 'one_time',
        interval: price.interval
      };

      return await this.createCompleteProduct(
        installationId,
        filePath,
        productDetails,
        priceData
      );

    } catch (error: any) {
      return {
        success: false,
        steps: {
          imageUpload: { success: false },
          productCreation: { success: false },
          imageAttachment: { success: false },
          priceCreation: { success: false }
        },
        error: `JSON parsing error: ${error.message}`
      };
    }
  }
}

export const productWorkflowService = new ProductWorkflowService();