/**
 * GoHighLevel Products API helpers via Railway proxy
 */
import axios from 'axios';
import { authHeader } from './jwt';

export const createProduct = async (locationId: string, body: any) => {
  // Use Railway backend directly with installation ID
  const RAILWAY_BASE = 'https://dir.engageautomations.com';
  const INSTALLATION_ID = 'install_1750191250983';
  
  const { data } = await axios.post(
    `${RAILWAY_BASE}/api/products`, 
    { ...body, locationId, installationId: INSTALLATION_ID }, 
    { headers: { 'Content-Type': 'application/json', 'x-installation-id': INSTALLATION_ID } }
  );
  return data;
};

export const attachGallery = async (locationId: string, productId: string, urls: string[]) => {
  // Generate JWT token for authentication
  const { data: authData } = await axios.post('/api/auth/jwt');
  
  return axios.post(
    `/api/ghl/locations/${locationId}/products/${productId}/gallery`,
    { mediaUrls: urls }, 
    { headers: { 'Authorization': `Bearer ${authData.token}` } }
  );
};