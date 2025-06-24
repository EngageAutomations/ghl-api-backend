// Railway Proxy API Integration - Complete JWT + OAuth Flow
import axios from 'axios';

const RAILWAY_BASE = 'https://dir.engageautomations.com';

// JWT token management
let jwtToken: string | null = null;

// Step 1: Get JWT token for Railway authentication
async function getJWTToken(): Promise<string> {
  if (jwtToken) return jwtToken;
  
  // Try different JWT endpoint patterns
  const jwtEndpoints = ['/api/auth/token', '/auth/token', '/api/token', '/token'];
  
  for (const endpoint of jwtEndpoints) {
    try {
      const response = await fetch(`${RAILWAY_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        jwtToken = data.token || data.jwt || data.access_token;
        if (jwtToken) return jwtToken;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Fallback: Return empty string to proceed without JWT (Railway may not require it)
  console.log('JWT not available, proceeding without token');
  return '';
}

// Get installation_id from storage (used only for status checks)
function getInstallationId(): string {
  const stored = sessionStorage.getItem('installation_id');
  if (stored) {
    return stored;
  }
  return 'latest';
}

// Get location_id from storage (used for uploads/products)
function getLocationId(): string {
  const stored = sessionStorage.getItem('location_id');
  if (stored) {
    return stored;
  }
  throw new Error('No location_id stored. Complete OAuth flow first.');
}

// Step 2: Check OAuth status and get locationId
export async function checkOAuthStatus(installationId: string) {
  const jwt = await getJWTToken();
  
  const headers: Record<string, string> = {};
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }
  
  const response = await fetch(`${RAILWAY_BASE}/api/oauth/status?installation_id=${installationId}`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error(`OAuth status check failed: ${response.status}`);
  }
  
  return await response.json(); // { authenticated, tokenStatus, locationId }
}

// Get authenticated location ID using stored values
async function getAuthenticatedLocationId(): Promise<{ locationId: string; needsReconnect: boolean }> {
  try {
    // First try to use stored location_id
    const storedLocationId = sessionStorage.getItem('location_id');
    if (storedLocationId) {
      console.log('Using stored location_id:', storedLocationId);
      return { locationId: storedLocationId, needsReconnect: false };
    }
    
    // If no stored location_id, check OAuth status
    const installationId = getInstallationId();
    console.log('Checking OAuth status for installation:', installationId);
    
    const status = await checkOAuthStatus(installationId);
    console.log('OAuth status response:', status);
    
    if (!status.authenticated) {
      console.log('Not authenticated, needs reconnect');
      return { locationId: '', needsReconnect: true };
    }
    
    if (status.tokenStatus !== 'valid') {
      console.log('Invalid token status, needs reconnect');
      return { locationId: '', needsReconnect: true };
    }
    
    if (status.locationId) {
      console.log('Got location ID from status check:', status.locationId);
      sessionStorage.setItem('location_id', status.locationId);
      return { locationId: status.locationId, needsReconnect: false };
    }
    
    return { locationId: '', needsReconnect: true };
    
  } catch (error) {
    console.log('OAuth authentication check failed:', error.message);
    return { locationId: '', needsReconnect: true };
  }
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

// Step 3a: Upload media (≤10 files) with JWT + locationId
export async function uploadMedia(locationId: string, files: File[]): Promise<{ uploads: GhlUpload[]; needsReconnect: boolean }> {
  const { locationId: authLocationId, needsReconnect } = await getAuthenticatedLocationId();
  
  if (needsReconnect) {
    return { uploads: [], needsReconnect: true };
  }
  
  const jwt = await getJWTToken();
  
  // Limit to 10 files as per Railway specification
  const limitedFiles = files.slice(0, 10);
  
  const uploadPromises = limitedFiles.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: Record<string, string> = {};
    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }
    
    const response = await fetch(`${RAILWAY_BASE}/api/ghl/locations/${authLocationId}/media`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return {
      fileUrl: result.uploaded?.[0]?.fileUrl || result.url,
      fileId: result.uploaded?.[0]?.fileId || result.id || file.name
    };
  });
  
  const uploads = await Promise.all(uploadPromises);
  return { uploads, needsReconnect: false };
}

// Step 3b: Create product with image URLs and JWT + locationId
export async function createProduct(locationId: string, body: CreateProductBody): Promise<{ product: any; needsReconnect: boolean }> {
  const { locationId: authLocationId, needsReconnect } = await getAuthenticatedLocationId();
  
  if (needsReconnect) {
    return { product: null, needsReconnect: true };
  }
  
  const jwt = await getJWTToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (jwt) {
    headers['Authorization'] = `Bearer ${jwt}`;
  }
  
  const response = await fetch(`${RAILWAY_BASE}/api/ghl/locations/${authLocationId}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`Product creation failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  return { product: result.product || result, needsReconnect: false };
}

// Complete workflow: JWT → OAuth check → media upload → product creation
export async function createProductWithImages(
  formData: CreateProductBody, 
  imageFiles: File[]
): Promise<{ success: boolean; product?: any; needsReconnect: boolean; error?: string }> {
  try {
    // Step 1: Ensure JWT token
    await getJWTToken();
    
    // Step 2: Check OAuth status
    const { needsReconnect } = await getAuthenticatedLocationId();
    if (needsReconnect) {
      return { success: false, needsReconnect: true };
    }
    
    // Step 3a: Upload images (≤10 files)
    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      const { uploads, needsReconnect: uploadReconnect } = await uploadMedia('', imageFiles);
      if (uploadReconnect) {
        return { success: false, needsReconnect: true };
      }
      imageUrls = uploads.map(upload => upload.fileUrl).filter(Boolean);
    }
    
    // Step 3b: Create product with uploaded image URLs
    const productData = {
      ...formData,
      ...(imageUrls.length > 0 && { imageUrl: imageUrls[0], images: imageUrls })
    };
    
    const { product, needsReconnect: productReconnect } = await createProduct('', productData);
    if (productReconnect) {
      return { success: false, needsReconnect: true };
    }
    
    return { success: true, product, needsReconnect: false };
    
  } catch (error) {
    return { 
      success: false, 
      needsReconnect: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}