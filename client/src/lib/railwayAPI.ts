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

// Get installation_id from OAuth redirect or storage
function getInstallationId(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const installationId = urlParams.get('installation_id');
  
  if (installationId) {
    sessionStorage.setItem('installation_id', installationId);
    return installationId;
  }
  
  const stored = sessionStorage.getItem('installation_id');
  if (stored) return stored;
  
  return 'latest';
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

// Get authenticated location ID
async function getAuthenticatedLocationId(): Promise<{ locationId: string; needsReconnect: boolean }> {
  const installationId = getInstallationId();
  const status = await checkOAuthStatus(installationId);
  
  if (!status.authenticated) {
    return { locationId: '', needsReconnect: true };
  }
  
  if (status.tokenStatus !== 'valid') {
    return { locationId: '', needsReconnect: true };
  }
  
  return { locationId: status.locationId, needsReconnect: false };
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