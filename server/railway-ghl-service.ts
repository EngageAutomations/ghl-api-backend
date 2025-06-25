/**
 * Railway GoHighLevel Service
 * Uses Railway backend OAuth system for real GHL API calls
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

export class RailwayGHLService {
  private railwayBaseUrl = 'https://dir.engageautomations.com';
  private installationId = 'install_1750191250983'; // Active installation from Railway

  async createProduct(productData: ProductData) {
    try {
      console.log('Creating real product via Railway backend...');
      console.log('Product data:', productData);

      const response = await fetch(`${this.railwayBaseUrl}/api/ghl/products/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Installation-ID': this.installationId
        },
        body: JSON.stringify({
          ...productData,
          installationId: this.installationId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Railway GHL API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real product created via Railway:', result);
      
      return {
        success: true,
        product: result.product || result,
        message: 'Product created successfully in GoHighLevel via Railway'
      };
    } catch (error) {
      console.error('❌ Railway product creation failed:', error);
      throw error;
    }
  }

  async createProductPrice(productId: string, priceData: PriceData) {
    try {
      console.log('Creating real price via Railway backend...');
      console.log('Product ID:', productId);
      console.log('Price data:', priceData);

      const response = await fetch(`${this.railwayBaseUrl}/api/ghl/products/${productId}/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Installation-ID': this.installationId
        },
        body: JSON.stringify({
          ...priceData,
          installationId: this.installationId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Railway GHL Price API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real price created via Railway:', result);
      
      return {
        success: true,
        price: result.price || result,
        message: 'Price created successfully in GoHighLevel via Railway'
      };
    } catch (error) {
      console.error('❌ Railway price creation failed:', error);
      throw error;
    }
  }

  async uploadImageToMediaLibrary(fileBuffer: Buffer, fileName: string, mimeType: string) {
    try {
      console.log('Uploading real image via Railway backend...');
      console.log('File:', fileName, 'Size:', fileBuffer.length, 'Type:', mimeType);

      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: fileName, contentType: mimeType });
      formData.append('installationId', this.installationId);

      const response = await fetch(`${this.railwayBaseUrl}/api/ghl/media/upload`, {
        method: 'POST',
        headers: {
          'Installation-ID': this.installationId,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Railway GHL Media API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real image uploaded via Railway:', result);
      
      return {
        success: true,
        file: result.file || result,
        message: 'Image uploaded successfully to GoHighLevel via Railway'
      };
    } catch (error) {
      console.error('❌ Railway image upload failed:', error);
      throw error;
    }
  }

  async getMediaFiles(limit: number = 20, offset: number = 0) {
    try {
      console.log('Getting real media files via Railway backend...');

      const params = new URLSearchParams({
        installationId: this.installationId,
        limit: limit.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`${this.railwayBaseUrl}/api/ghl/media/list?${params}`, {
        method: 'GET',
        headers: {
          'Installation-ID': this.installationId
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Railway GHL Media Files API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real media files retrieved via Railway:', result.files?.length || 0, 'files');
      
      return {
        success: true,
        files: result.files || [],
        total: result.total || 0,
        limit,
        offset
      };
    } catch (error) {
      console.error('❌ Railway media files retrieval failed:', error);
      throw error;
    }
  }

  async listProducts() {
    try {
      console.log('Getting real products via Railway backend...');

      const params = new URLSearchParams({
        installationId: this.installationId,
        limit: '100'
      });

      const response = await fetch(`${this.railwayBaseUrl}/api/ghl/products/list?${params}`, {
        method: 'GET',
        headers: {
          'Installation-ID': this.installationId
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Railway GHL Products API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Real products retrieved via Railway:', result.products?.length || 0, 'products');
      
      return {
        success: true,
        products: result.products || [],
        total: result.total || 0
      };
    } catch (error) {
      console.error('❌ Railway products retrieval failed:', error);
      throw error;
    }
  }
}