// Railway Proxy API Integration
// Using correct location-centric endpoints
import axios from 'axios';

const RAILWAY_BASE = 'https://dir.engageautomations.com';

// Discover working location ID for Railway proxy
async function discoverLocationId(): Promise<string> {
  // Try common location ID patterns
  const patterns = ['WAVk87RmW9rBSDJHeOpH', 'install_1', 'location_1'];
  
  for (const locationId of patterns) {
    try {
      const response = await fetch(`${RAILWAY_BASE}/api/ghl/locations/${locationId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test', price: 1, productType: 'DIGITAL' })
      });
      
      if (response.status === 200) {
        return locationId;
      }
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('No working location ID found');
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

// Upload media via Railway proxy
export async function uploadMedia(locationId: string, files: File[]): Promise<GhlUpload[]> {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('installation_id', getInstallationId());
    formData.append('file', file);
    
    const response = await fetch(`${RAILWAY_BASE}/api/ghl/media/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      fileUrl: result.url || result.fileUrl,
      fileId: result.id || result.fileId || file.name
    };
  });
  
  return await Promise.all(uploadPromises);
}

// Create product via Railway proxy using legacy endpoint
export async function createProduct(locationId: string, body: CreateProductBody) {
  const productData = {
    installation_id: getInstallationId(),
    ...body
  };
  
  const response = await fetch(`${RAILWAY_BASE}/api/ghl/products/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  
  if (!response.ok) {
    throw new Error(`Product creation failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.product || result;
}