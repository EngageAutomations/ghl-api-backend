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
    `${RAILWAY_BASE}/api/media/upload`,
    form,
    { 
      headers: { 
        'x-installation-id': INSTALLATION_ID
        // Don't set Content-Type, let browser set it with boundary for multipart
      } 
    }
  );
  
  return data.uploaded?.map((u: any) => u.publicUrl) || [];   // [url,…]
}