/**
 * GoHighLevel Product API Integration
 * Handles product creation and management using OAuth tokens
 */

import fetch from 'node-fetch';

export interface GHLProduct {
  name: string;
  description?: string;
  productType: 'DIGITAL' | 'PHYSICAL' | 'SERVICE';
  availabilityType: 'AVAILABLE_NOW' | 'LIMITED_QUANTITY' | 'PRE_ORDER';
  statementDescriptor?: string;
  medias?: Array<{
    url: string;
    type: 'image' | 'video';
  }>;
  prices?: Array<{
    name: string;
    currency: string;
    amount: number;
    type: 'ONE_TIME' | 'RECURRING';
    recurring?: {
      interval: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
      intervalCount: number;
    };
  }>;
}

export class GHLProductAPI {
  constructor(
    private accessToken: string,
    private locationId: string
  ) {}

  async createProduct(productData: GHLProduct): Promise<any> {
    try {
      console.log('Creating GoHighLevel product:', productData);
      
      const response = await fetch('https://services.leadconnectorhq.com/products/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'locationId': this.locationId
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GHL Product creation failed:', response.status, errorText);
        throw new Error(`GoHighLevel API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('GoHighLevel product created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating GoHighLevel product:', error);
      throw error;
    }
  }

  async getProducts(limit = 20, offset = 0): Promise<any> {
    try {
      const url = new URL('https://services.leadconnectorhq.com/products/');
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('offset', offset.toString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Version': '2021-07-28',
          'locationId': this.locationId
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching GoHighLevel products:', error);
      throw error;
    }
  }

  async updateProduct(productId: string, productData: Partial<GHLProduct>): Promise<any> {
    try {
      const response = await fetch(`https://services.leadconnectorhq.com/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'locationId': this.locationId
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel API Error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating GoHighLevel product:', error);
      throw error;
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://services.leadconnectorhq.com/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Version': '2021-07-28',
          'locationId': this.locationId
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GoHighLevel API Error: ${response.status} - ${errorText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting GoHighLevel product:', error);
      throw error;
    }
  }
}