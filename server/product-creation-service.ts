/**
 * Product Creation Service
 * Direct GoHighLevel API integration for product management
 */

interface ProductData {
  name: string;
  description?: string;
  type: 'DIGITAL' | 'PHYSICAL' | 'SERVICE';
  price: number;
  currency?: string;
  sku?: string;
}

interface GHLInstallation {
  ghlAccessToken: string;
  ghlLocationId: string;
  ghlRefreshToken?: string;
}

export class ProductCreationService {
  private static async makeGHLRequest(
    endpoint: string, 
    installation: GHLInstallation, 
    options: RequestInit = {}
  ) {
    const response = await fetch(`https://services.leadconnectorhq.com${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${installation.ghlAccessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GoHighLevel API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  static async createProduct(productData: ProductData, installation: GHLInstallation) {
    const endpoint = `/products?locationId=${installation.ghlLocationId}`;
    
    const ghlProductData = {
      name: productData.name,
      description: productData.description || '',
      type: productData.type,
      price: Math.round(productData.price * 100), // Convert to cents
      currency: productData.currency || 'USD',
      ...(productData.sku && { sku: productData.sku })
    };

    console.log('Creating product in GoHighLevel:', ghlProductData);
    
    return this.makeGHLRequest(endpoint, installation, {
      method: 'POST',
      body: JSON.stringify(ghlProductData)
    });
  }

  static async getProducts(installation: GHLInstallation, limit = 20, offset = 0) {
    const endpoint = `/products?locationId=${installation.ghlLocationId}&limit=${limit}&offset=${offset}`;
    return this.makeGHLRequest(endpoint, installation);
  }

  static async getProduct(productId: string, installation: GHLInstallation) {
    const endpoint = `/products/${productId}?locationId=${installation.ghlLocationId}`;
    return this.makeGHLRequest(endpoint, installation);
  }

  static async updateProduct(productId: string, productData: Partial<ProductData>, installation: GHLInstallation) {
    const endpoint = `/products/${productId}?locationId=${installation.ghlLocationId}`;
    
    const ghlProductData = {
      ...(productData.name && { name: productData.name }),
      ...(productData.description && { description: productData.description }),
      ...(productData.type && { type: productData.type }),
      ...(productData.price && { price: Math.round(productData.price * 100) }),
      ...(productData.currency && { currency: productData.currency }),
      ...(productData.sku && { sku: productData.sku })
    };

    return this.makeGHLRequest(endpoint, installation, {
      method: 'PUT',
      body: JSON.stringify(ghlProductData)
    });
  }

  static async deleteProduct(productId: string, installation: GHLInstallation) {
    const endpoint = `/products/${productId}?locationId=${installation.ghlLocationId}`;
    return this.makeGHLRequest(endpoint, installation, {
      method: 'DELETE'
    });
  }

  // Test method to verify OAuth credentials work
  static async testConnection(installation: GHLInstallation) {
    try {
      const endpoint = `/locations/${installation.ghlLocationId}`;
      const result = await this.makeGHLRequest(endpoint, installation);
      return { success: true, location: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}