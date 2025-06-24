// Railway v1.4.3 API Integration
import axios from 'axios';

const BASE = 'https://dir.engageautomations.com';
export const api = axios.create({ baseURL: `${BASE}/api/ghl` });

// Inject JWT on every request
api.interceptors.request.use(cfg => {
  const jwt = sessionStorage.getItem('jwt');
  if (jwt) cfg.headers.Authorization = `Bearer ${jwt}`;
  return cfg;
});

// Get and store JWT token
export async function ensureJwt() {
  if (sessionStorage.getItem('jwt')) return;
  const { data } = await axios.post(`${BASE}/api/auth/token`, {});
  sessionStorage.setItem('jwt', data.jwt);
}

// Types for Railway API responses
export interface GhlUpload {
  fileUrl: string;
  fileId: string;
}

export interface CreateProductBody {
  name: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  productType?: 'DIGITAL' | 'PHYSICAL';
  availabilityType?: 'AVAILABLE_NOW' | 'COMING_SOON';
}

// Upload multiple images (0-10 files, ≤25MB each)
export async function uploadMedia(locationId: string, files: File[]): Promise<GhlUpload[]> {
  await ensureJwt();
  const fd = new FormData();
  files.forEach(f => fd.append('file', f));
  
  const { data } = await api.post<{ uploaded: GhlUpload[] }>(
    `/locations/${locationId}/media`,
    fd,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data.uploaded;
}

// Create product with uploaded images
export async function createProduct(locationId: string, body: CreateProductBody) {
  await ensureJwt();
  const { data } = await api.post(`/locations/${locationId}/products`, body);
  return data.product;
}