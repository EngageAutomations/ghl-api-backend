/**
 * GoHighLevel Products API - Railway Backend Integration
 * Implements Railway proxy API contract
 */

export { createProduct, attachGallery, createProductWithImages } from './railwayAPI';

export interface ProductData {
  name: string;
  description?: string;
  price?: string;
  productType?: 'PHYSICAL' | 'DIGITAL';
  imageUrl?: string;
}