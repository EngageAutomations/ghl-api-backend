// Railway Proxy API Integration - Fixed Endpoints
import axios from 'axios';

const RAILWAY_BASE = 'https://dir.engageautomations.com';

// Get installation_id from URL params or storage
function getInstallationId(): string {
  // Check URL params first (from OAuth redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const installationId = urlParams.get('installation_id');
  
  if (installationId) {
    sessionStorage.setItem('installation_id', installationId);
    return installationId;
  }
  
  // Check stored installation_id
  const stored = sessionStorage.getItem('installation_id');
  if (stored) return stored;
  
  // Fallback to latest if no specific ID
  return 'latest';
}

// Check OAuth status for installation
export async function checkOAuthStatus(installationId: string) {
  const response = await fetch(`${RAILWAY_BASE}/api/oauth/status?installation_id=${installationId}`);
  if (response.ok) {
    return await response.json(); // { authenticated, tokenStatus, locationId }
  }
  throw new Error('OAuth status check failed');
}

// Get location ID from OAuth status
async function getLocationId(): Promise<string> {
  const installationId = getInstallationId();
  const status = await checkOAuthStatus(installationId);
  
  if (!status.authenticated) {
    throw new Error('App not authenticated. Please reconnect the app in GoHighLevel.');
  }
  
  if (status.tokenStatus !== 'valid') {
    throw new Error('Token expired. Please reconnect the app in GoHighLevel.');
  }
  
  return status.locationId;
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

// Upload media using correct location-centric endpoint
export async function uploadMedia(locationId: string, files: File[]): Promise<GhlUpload[]> {
  const realLocationId = await getLocationId();
  
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${RAILWAY_BASE}/api/ghl/locations/${realLocationId}/media`, {
      method: 'POST',
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
  
  return await Promise.all(uploadPromises);
}

// Create product using correct location-centric endpoint
export async function createProduct(locationId: string, body: CreateProductBody) {
  const realLocationId = await getLocationId();
  
  const response = await fetch(`${RAILWAY_BASE}/api/ghl/locations/${realLocationId}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`Product creation failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  return result.product || result;
}