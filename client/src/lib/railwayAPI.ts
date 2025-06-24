// Direct GoHighLevel API Integration
// Note: Railway v1.4.3 endpoints not yet available, using direct GHL API
import axios from 'axios';

const GHL_BASE = 'https://services.leadconnectorhq.com';

// Direct GoHighLevel API client
export const ghlApi = axios.create({
  baseURL: GHL_BASE,
  headers: {
    'Version': '2021-07-28'
  }
});

// Mock Railway integration for development
export const api = {
  post: async (endpoint: string, data: any) => {
    throw new Error('Railway API endpoints not yet deployed. Use direct GoHighLevel integration.');
  }
};

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

// Upload media directly to GoHighLevel
export async function uploadMedia(locationId: string, files: File[]): Promise<GhlUpload[]> {
  const accessToken = process.env.GHL_ACCESS_TOKEN || 
                     sessionStorage.getItem('ghl_access_token') ||
                     'ghl_pat_XQ6hy_y6Ke6sQj_0uHFdIbaPj_qEAEOME3emdj9x5Y4tJ5tAhqbL0G9e3AKsYmUP';
  
  if (!accessToken) {
    throw new Error('GoHighLevel access token required. Please provide credentials.');
  }
  
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('locationId', locationId);
    
    const response = await fetch('https://services.leadconnectorhq.com/medias/upload-file', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28'
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      fileUrl: result.url,
      fileId: result.id || file.name
    };
  });
  
  return await Promise.all(uploadPromises);
}

// Create product directly in GoHighLevel
export async function createProduct(locationId: string, body: CreateProductBody) {
  const accessToken = process.env.GHL_ACCESS_TOKEN || 
                     sessionStorage.getItem('ghl_access_token') ||
                     'ghl_pat_XQ6hy_y6Ke6sQj_0uHFdIbaPj_qEAEOME3emdj9x5Y4tJ5tAhqbL0G9e3AKsYmUP';
  
  if (!accessToken) {
    throw new Error('GoHighLevel access token required. Please provide credentials.');
  }
  
  const productData = {
    locationId,
    ...body
  };
  
  const response = await fetch('https://services.leadconnectorhq.com/products/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    },
    body: JSON.stringify(productData)
  });
  
  if (!response.ok) {
    throw new Error(`Product creation failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  return result;
}