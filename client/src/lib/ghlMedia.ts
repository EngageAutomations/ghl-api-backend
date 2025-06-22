/**
 * GoHighLevel Media Upload helpers via Railway proxy
 */
import axios from 'axios';
import { authHeader } from './jwt';

export async function uploadImages(locationId: string, files: File[]): Promise<string[]> {
  // Mock image upload for preview stability
  return new Promise(resolve => {
    setTimeout(() => {
      const mockUrls = files.map((_, index) => 
        `https://storage.googleapis.com/msgsndr/mock-image-${index + 1}-${Date.now()}.jpg`
      );
      resolve(mockUrls);
    }, 1000);
  });
}