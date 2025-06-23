/**
 * GoHighLevel Media Upload API - Railway Backend Integration
 * Implements Railway proxy API contract
 */

export { uploadImages, uploadSingleImage } from './railwayAPI';

// Legacy compatibility wrapper
export async function uploadSingleImage(locationId: string, file: File): Promise<string> {
  const { uploadImages } = await import('./railwayAPI');
  const urls = await uploadImages(locationId, [file]);
  return urls[0];
}