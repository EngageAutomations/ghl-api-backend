/**
 * GoHighLevel Products API - Railway Backend Integration
 * Handles product creation and gallery management through authenticated Railway proxy
 */

import axios from 'axios';
import { authHeader } from './jwt';

export interface ProductData {
  name: string;
  description?: string;
  price?: string;
  productType?: string;
  imageUrl?: string;
}

export async function createProduct(locationId: string, productData: ProductData) {
  // Use the actual installation ID from Railway backend
  const installationId = 'install_1750191250983'; // Real installation ID
  const payload = {
    installation_id: installationId,
    name: productData.name,
    description: productData.description,
    productType: productData.productType || 'DIGITAL',
    price: productData.price
  };
  
  const { data } = await axios.post(
    `https://dir.engageautomations.com/api/ghl/products/create`,
    payload,
    { 
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      } 
    }
  );
  return data;
}

export async function attachGallery(locationId: string, productId: string, mediaUrls: string[]) {
  const { data } = await axios.post(
    `/api/ghl/locations/${locationId}/products/${productId}/gallery`,
    { mediaUrls },
    { headers: authHeader() }
  );
  return data;
}

export async function createProductWithImages(
  locationId: string, 
  productData: ProductData, 
  imageUrls: string[]
) {
  // Use first image as thumbnail
  const [thumbnail, ...galleryUrls] = imageUrls;
  
  // Create product with thumbnail
  const product = await createProduct(locationId, {
    ...productData,
    imageUrl: thumbnail
  });
  
  // Attach remaining images to gallery if any
  if (galleryUrls.length > 0) {
    await attachGallery(locationId, product.id, galleryUrls);
  }
  
  return product;
}