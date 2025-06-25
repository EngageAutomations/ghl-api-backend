/**
 * Real GoHighLevel API Service
 * Makes actual API calls to GoHighLevel using OAuth credentials
 */

interface ProductData {
  name: string;
  description: string;
  type: 'DIGITAL' | 'PHYSICAL' | 'SERVICE';
  currency: string;
  sku?: string;
}

interface PriceData {
  name: string;
  type: 'one_time' | 'recurring';
  amount: number;
  currency: string;
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count: number;
  };
}

export class RealGHLService {
  private baseUrl = 'https://services.leadconnectorhq.com';
  private accessToken: string;
  private locationId: string;

  constructor() {
    // Get real OAuth credentials from environment or Railway
    this.accessToken = process.env.GHL_ACCESS_TOKEN || '';
    this.locationId = process.env.GHL_LOCATION_ID || '';
  }

  private async getOAuthCredentials() {
    // Try to get credentials from Railway OAuth system
    try {
      const response = await fetch('https://dir.engageautomations.com/installations');
      if (response.ok) {
        const installations = await response.json();
        if (installations.length > 0) {
          const activeInstall = installations[0];
          return {
            hasAuth: true,
            locationId: activeInstall.locationId,
            accessToken: activeInstall.accessToken
          };
        }
      }
    } catch (error) {
      console.log('Railway OAuth check failed, using environment credentials');
    }

    // Fallback to environment variables
    if (!this.accessToken || !this.locationId) {
      throw new Error('Missing GoHighLevel OAuth credentials. Need GHL_ACCESS_TOKEN and GHL_LOCATION_ID');
    }

    return {
      hasAuth: true,
      locationId: this.locationId,
      accessToken: this.accessToken
    };
  }

  async createProduct(productData: ProductData) {
    try {
      const auth = await this.getOAuthCredentials();
      
      console.log('Creating real product in GoHighLevel...');
      console.log('Product data:', productData);
      console.log('Using location:', auth.locationId);

      const requestBody = {
        name: productData.name,
        description: productData.description,
        type: productData.type,
        locationId: auth.locationId,
        currency: productData.currency,
        sku: productData.sku
      };

      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real product created in GoHighLevel:', result);
      
      return {
        success: true,
        product: result.product || result,
        message: 'Product created successfully in GoHighLevel'
      };
    } catch (error) {
      console.error('❌ Real product creation failed:', error);
      throw error;
    }
  }

  async createProductPrice(productId: string, priceData: PriceData) {
    try {
      const auth = await this.getOAuthCredentials();
      
      console.log('Creating real price in GoHighLevel...');
      console.log('Product ID:', productId);
      console.log('Price data:', priceData);

      const requestBody = {
        locationId: auth.locationId,
        name: priceData.name,
        type: priceData.type,
        amount: priceData.amount,
        currency: priceData.currency,
        recurring: priceData.recurring
      };

      const response = await fetch(`${this.baseUrl}/products/${productId}/price`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel Price API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real price created in GoHighLevel:', result);
      
      return {
        success: true,
        price: result.price || result,
        message: 'Price created successfully in GoHighLevel'
      };
    } catch (error) {
      console.error('❌ Real price creation failed:', error);
      throw error;
    }
  }

  async uploadImageToMediaLibrary(fileBuffer: Buffer, fileName: string, mimeType: string) {
    try {
      const auth = await this.getOAuthCredentials();
      
      console.log('Uploading real image to GoHighLevel media library...');
      console.log('File:', fileName, 'Size:', fileBuffer.length, 'Type:', mimeType);

      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: fileName, contentType: mimeType });
      formData.append('locationId', auth.locationId);

      const response = await fetch(`${this.baseUrl}/medias/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel Media API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real image uploaded to GoHighLevel:', result);
      
      return {
        success: true,
        file: result.file || result,
        message: 'Image uploaded successfully to GoHighLevel'
      };
    } catch (error) {
      console.error('❌ Real image upload failed:', error);
      throw error;
    }
  }

  async getMediaFiles(limit: number = 20, offset: number = 0) {
    try {
      const auth = await this.getOAuthCredentials();
      
      console.log('Getting real media files from GoHighLevel...');

      const params = new URLSearchParams({
        locationId: auth.locationId,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.baseUrl}/medias/files?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel Media Files API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real media files retrieved from GoHighLevel:', result.files?.length || 0, 'files');
      
      return {
        success: true,
        files: result.files || [],
        total: result.total || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('❌ Real media files retrieval failed:', error);
      throw error;
    }
  }

  async listProducts() {
    try {
      const auth = await this.getOAuthCredentials();
      
      console.log('Getting real products from GoHighLevel...');

      const params = new URLSearchParams({
        locationId: auth.locationId,
        limit: '100'
      });

      const response = await fetch(`${this.baseUrl}/products?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel Products API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real products retrieved from GoHighLevel:', result.products?.length || 0, 'products');
      
      return {
        success: true,
        products: result.products || [],
        total: result.total || 0
      };
    } catch (error) {
      console.error('❌ Real products retrieval failed:', error);
      throw error;
    }
  }
}