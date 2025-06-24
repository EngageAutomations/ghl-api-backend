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

// Upload media directly to GoHighLevel (requires user credentials)
export async function uploadMedia(locationId: string, files: File[]): Promise<GhlUpload[]> {
  // This would require user's GHL access token
  // For now, return mock data for UI development
  console.warn('Direct GHL upload requires user access token. Railway proxy not yet available.');
  
  return files.map((file, index) => ({
    fileUrl: `https://example.com/uploaded/${file.name}`,
    fileId: `mock_${index}_${file.name}`
  }));
}

// Create product directly in GoHighLevel (requires user credentials)
export async function createProduct(locationId: string, body: CreateProductBody) {
  // This would require user's GHL access token
  // For now, return mock success for UI development
  console.warn('Direct GHL product creation requires user access token. Railway proxy not yet available.');
  
  return {
    id: `mock_${Date.now()}`,
    name: body.name,
    description: body.description,
    price: body.price,
    imageUrl: body.imageUrl,
    created: new Date().toISOString()
  };
}