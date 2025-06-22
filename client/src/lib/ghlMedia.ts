/**
 * GoHighLevel Media Upload helpers via Railway proxy
 */
import axios from 'axios';
import { authHeader } from './jwt';

export async function uploadImages(locationId: string, files: File[]): Promise<string[]> {
  // Use Railway backend directly with installation ID
  const RAILWAY_BASE = 'https://dir.engageautomations.com';
  const INSTALLATION_ID = 'install_1750191250983';
  
  const form = new FormData();
  files.forEach(f => form.append('file', f));          // key MUST be 'file'
  form.append('locationId', locationId);

  const { data } = await axios.post(
    `${RAILWAY_BASE}/api/ghl/${INSTALLATION_ID}/media`,
    form
    // Don't set headers for multipart, let browser handle
  );
  
  return data.uploaded?.map((u: any) => u.publicUrl) || [];   // [url,…]
}