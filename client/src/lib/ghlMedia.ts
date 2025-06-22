/**
 * GoHighLevel Media Upload helpers via Railway proxy
 */
import axios from 'axios';
import { authHeader } from './jwt';

export async function uploadImages(locationId: string, files: File[]): Promise<string[]> {
  // Generate JWT token for authentication
  const { data: authData } = await axios.post('/api/auth/jwt');
  
  const form = new FormData();
  files.forEach(f => form.append('file', f));          // key MUST be 'file'

  const { data } = await axios.post(
    `/api/ghl/locations/${locationId}/media`,
    form,
    { 
      headers: { 
        'Authorization': `Bearer ${authData.token}`,
        // Don't set Content-Type, let browser set it with boundary
      } 
    }
  );
  
  return data.uploaded.map((u: any) => u.publicUrl);   // [url,…]
}