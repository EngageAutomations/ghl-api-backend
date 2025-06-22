/**
 * GoHighLevel Products API helpers via Railway proxy
 */
import axios from 'axios';
import { authHeader } from './jwt';

export const createProduct = async (locationId: string, body: any) => {
  // Generate JWT token for authentication
  const { data: authData } = await axios.post('/api/auth/jwt');
  
  const { data } = await axios.post(
    `/api/ghl/locations/${locationId}/products`, 
    body, 
    { headers: { 'Authorization': `Bearer ${authData.token}` } }
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