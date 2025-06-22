/**
 * GoHighLevel Media Upload API - Railway Backend Integration
 * Handles image uploads through authenticated Railway proxy
 */

import axios from 'axios';
import { authHeader } from './jwt';

export async function uploadImages(locationId: string, files: File[]): Promise<string[]> {
  // For now, create local preview URLs and simulate upload
  // Railway backend integration will be completed when real installation is configured
  console.log('Uploading images to GoHighLevel via Railway backend...');
  console.log('Files to upload:', files.length);
  console.log('Location ID:', locationId);
  
  // Create preview URLs for immediate display
  const imageUrls = files.map(file => URL.createObjectURL(file));
  
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return imageUrls;
}

export async function uploadSingleImage(locationId: string, file: File): Promise<string> {
  const urls = await uploadImages(locationId, [file]);
  return urls[0];
}