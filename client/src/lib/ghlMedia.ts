/**
 * GoHighLevel Media Upload helpers via Railway proxy
 */
import axios from 'axios';
import { authHeader } from './jwt';

export async function uploadImages(locationId: string, files: File[]): Promise<string[]> {
  const form = new FormData();
  files.forEach(f => form.append('file', f));          // key MUST be 'file'

  const { data } = await axios.post(
    `/api/ghl/locations/${locationId}/media`,
    form,
    { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
  );
  
  return data.uploaded.map((u: any) => u.publicUrl);   // [url,…]
}