/**
 * GoHighLevel Products API helpers via Railway proxy
 */
import axios from 'axios';
import { authHeader } from './jwt';

export const createProduct = (locationId: string, body: any) =>
  axios.post(`/api/ghl/locations/${locationId}/products`, body, { headers: { ...authHeader() } })
       .then(r => r.data);

export const attachGallery = (locationId: string, productId: string, urls: string[]) =>
  axios.post(`/api/ghl/locations/${locationId}/products/${productId}/gallery`,
             { mediaUrls: urls }, { headers: { ...authHeader() } });