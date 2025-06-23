import axios from 'axios';
import { authHeader } from './jwt';

export const createProduct = async (locationId: string, productData: any) => {
  const { data } = await axios.post(
    `/api/ghl/locations/${locationId}/products`,
    productData,
    { headers: { ...authHeader() } }
  );
  return data.product || data;
};

export const attachGallery = async (locationId: string, productId: string, urls: string[]) => {
  const { data } = await axios.post(
    `/api/ghl/locations/${locationId}/products/${productId}/gallery`,
    { mediaUrls: urls },
    { headers: { ...authHeader() } }
  );
  return data;
};