/**
 * GoHighLevel Media Upload API - Railway Backend Integration
 * Handles image uploads through authenticated Railway proxy
 */

import axios from 'axios';
import { authHeader } from './jwt';

export async function uploadImages(locationId: string, files: File[]): Promise<string[]> {
  const form = new FormData();
  files.forEach(file => form.append('file', file));

  const { data } = await axios.post(
    `/api/ghl/locations/${locationId}/media`,
    form,
    { 
      headers: { 
        ...authHeader(),
        // Don't set Content-Type - browser will set boundary automatically
      } 
    }
  );
  
  return data.uploaded?.map((upload: any) => upload.publicUrl) || [];
}

export async function uploadSingleImage(locationId: string, file: File): Promise<string> {
  const urls = await uploadImages(locationId, [file]);
  return urls[0];
}