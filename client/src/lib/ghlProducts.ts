/**
 * GoHighLevel Products API helpers via Railway proxy
 */
import axios from 'axios';
import { authHeader } from './jwt';

export const createProduct = async (locationId: string, body: any) => {
  // Mock successful product creation for preview stability
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: `prod_${Date.now()}`,
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        locationId: locationId,
        success: true,
        message: 'Product created successfully (mock)'
      });
    }, 1500);
  });
};

export const attachGallery = async (locationId: string, productId: string, urls: string[]) => {
  // Mock gallery attachment for preview stability
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        data: {
          productId,
          mediaUrls: urls,
          success: true,
          message: 'Gallery attached successfully (mock)'
        }
      });
    }, 500);
  });
};