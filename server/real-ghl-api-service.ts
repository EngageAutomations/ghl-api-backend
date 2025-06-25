/**
 * Real GoHighLevel API Service
 * Makes actual API calls to create products with pricing and images
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
}

export class RealGHLAPIService {
  private baseUrl = 'https://services.leadconnectorhq.com';
  private version = '2021-07-28';
  private accessToken: string;
  private locationId: string;

  constructor() {
    this.accessToken = process.env.GHL_ACCESS_TOKEN || '';
    this.locationId = process.env.GHL_LOCATION_ID || '';
    
    if (!this.accessToken || !this.locationId) {
      console.log('Missing GHL credentials - need real OAuth tokens');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Version': this.version
    };
  }

  async createProduct(productData: ProductData) {
    try {
      if (!this.accessToken || !this.locationId) {
        throw new Error('Missing GoHighLevel OAuth credentials');
      }

      console.log('Creating real product in GoHighLevel account...');
      console.log('Product:', productData.name);

      const requestBody = {
        name: productData.name,
        description: productData.description,
        type: productData.type,
        currency: productData.currency,
        sku: productData.sku,
        locationId: this.locationId
      };

      const response = await fetch(`${this.baseUrl}/products`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Product created successfully in GoHighLevel');
      
      return {
        success: true,
        product: result.product || result,
        message: 'Product created in your GoHighLevel account'
      };
    } catch (error) {
      console.error('Product creation failed:', error);
      throw error;
    }
  }

  async createProductPrice(productId: string, priceData: PriceData) {
    try {
      console.log('Creating price for product in GoHighLevel...');
      console.log('Product ID:', productId);
      console.log('Price:', `$${(priceData.amount / 100).toFixed(2)}`);

      const requestBody = {
        locationId: this.locationId,
        name: priceData.name,
        type: priceData.type,
        amount: priceData.amount,
        currency: priceData.currency
      };

      const response = await fetch(`${this.baseUrl}/products/${productId}/price`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel Price API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Price created successfully in GoHighLevel');
      
      return {
        success: true,
        price: result.price || result,
        message: 'Price created in your GoHighLevel account'
      };
    } catch (error) {
      console.error('Price creation failed:', error);
      throw error;
    }
  }

  async uploadImageToMediaLibrary(fileBuffer: Buffer, fileName: string, mimeType: string) {
    try {
      console.log('Uploading image to GoHighLevel media library...');
      console.log('File:', fileName);

      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: fileName, contentType: mimeType });
      formData.append('locationId', this.locationId);

      const response = await fetch(`${this.baseUrl}/medias/upload-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Version': this.version,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel Media API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Image uploaded successfully to GoHighLevel');
      
      return {
        success: true,
        file: result.file || result,
        message: 'Image uploaded to your GoHighLevel media library'
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  }

  async getMediaFiles(limit: number = 20, offset: number = 0) {
    try {
      console.log('Getting media files from GoHighLevel...');

      const params = new URLSearchParams({
        locationId: this.locationId,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.baseUrl}/medias/files?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel Media Files API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Media files retrieved from GoHighLevel');
      
      return {
        success: true,
        files: result.files || [],
        total: result.total || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('Media files retrieval failed:', error);
      throw error;
    }
  }

  async listProducts() {
    try {
      console.log('Listing products from GoHighLevel account...');

      const params = new URLSearchParams({
        locationId: this.locationId,
        limit: '100'
      });

      const response = await fetch(`${this.baseUrl}/products?${params}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel Products API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Products retrieved from GoHighLevel account');
      
      return {
        success: true,
        products: result.products || [],
        total: result.total || 0
      };
    } catch (error) {
      console.error('Products retrieval failed:', error);
      throw error;
    }
  }
}