import axios from 'axios';
import { authHeader } from './jwt';

export async function uploadImages(locationId: string, files: File[]): Promise<string[]> {
  const form = new FormData();
  
  // Add all files with the same key 'file' (GoHighLevel requirement)
  files.forEach(file => form.append('file', file));

  const { data } = await axios.post(
    `/api/ghl/locations/${locationId}/media`,
    form,
    { 
      headers: { 
        ...authHeader(),
        // Don't set Content-Type - FormData handles boundary automatically
      } 
    }
  );
  
  // Return array of uploaded image URLs
  return data.uploaded.map((upload: any) => upload.url || upload.publicUrl);
}