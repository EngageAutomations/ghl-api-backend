/**
 * Railway Proxy API Client
 * Implements the exact API contract for dir.engageautomations.com
 */

import axios from 'axios';

// Railway API client with JWT authentication - use local development server for testing
export const railwayAPI = axios.create({
  baseURL: '/api/ghl' // Use local proxy for development
});

// Add JWT token to all requests
railwayAPI.interceptors.request.use(config => {
  const jwt = sessionStorage.getItem('railway_jwt') || localStorage.getItem('railway_jwt');
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

// Get JWT token from Railway auth endpoint
export async function getRailwayJWT(): Promise<string> {
  try {
    const response = await fetch('https://dir.engageautomations.com/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "agent": "replit-dev" })
    });
    
    const data = await response.json();
    if (data.jwt) {
      sessionStorage.setItem('railway_jwt', data.jwt);
      localStorage.setItem('railway_jwt', data.jwt);
      return data.jwt;
    }
    throw new Error('No JWT received from Railway');
  } catch (error) {
    console.error('JWT authentication failed:', error);
    throw error;
  }
}

// Upload images to GoHighLevel via Railway proxy
export async function uploadImages(locationId: string, files: File[]): Promise<string[]> {
  try {
    // Ensure we have a valid JWT
    let jwt = sessionStorage.getItem('railway_jwt');
    if (!jwt) {
      jwt = await getRailwayJWT();
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('file', file);
    });

    const response = await railwayAPI.post(`/locations/${locationId}/media`, formData);
    
    if (response.data.uploaded) {
      return response.data.uploaded.map((item: any) => item.publicUrl);
    }
    
    return [];
  } catch (error: any) {
    // Handle 401 - JWT expired, get new token
    if (error.response?.status === 401) {
      try {
        await getRailwayJWT();
        return uploadImages(locationId, files); // Retry with new token
      } catch (retryError) {
        console.error('Retry failed after JWT refresh:', retryError);
        throw retryError;
      }
    }
    
    console.error('Media upload error:', error);
    throw error;
  }
}

// Create product in GoHighLevel via Railway proxy
export async function createProduct(locationId: string, productData: {
  name: string;
  description: string;
  productType: 'PHYSICAL' | 'DIGITAL';
  price: number;
  imageUrl?: string;
}): Promise<any> {
  try {
    // Ensure we have a valid JWT
    let jwt = sessionStorage.getItem('railway_jwt');
    if (!jwt) {
      jwt = await getRailwayJWT();
    }

    const payload = {
      name: productData.name,
      description: productData.description,
      productType: productData.productType,
      availabilityType: "AVAILABLE_NOW",
      price: productData.price,
      imageUrl: productData.imageUrl
    };

    const response = await railwayAPI.post(`/locations/${locationId}/products`, payload);
    return response.data;
  } catch (error: any) {
    // Handle 401 - JWT expired, get new token
    if (error.response?.status === 401) {
      try {
        await getRailwayJWT();
        return createProduct(locationId, productData); // Retry with new token
      } catch (retryError) {
        console.error('Retry failed after JWT refresh:', retryError);
        throw retryError;
      }
    }
    
    console.error('Product creation error:', error);
    throw error;
  }
}

// Attach gallery images to existing product
export async function attachGallery(locationId: string, productId: string, mediaUrls: string[]): Promise<any> {
  try {
    let jwt = sessionStorage.getItem('railway_jwt');
    if (!jwt) {
      jwt = await getRailwayJWT();
    }

    const response = await railwayAPI.post(`/locations/${locationId}/products/${productId}/gallery`, {
      mediaUrls
    });
    
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      try {
        await getRailwayJWT();
        return attachGallery(locationId, productId, mediaUrls);
      } catch (retryError) {
        console.error('Retry failed after JWT refresh:', retryError);
        throw retryError;
      }
    }
    
    console.error('Gallery attachment error:', error);
    throw error;
  }
}

// Complete product creation workflow
export async function createProductWithImages(
  locationId: string,
  productData: {
    name: string;
    description: string;
    price: string;
    productType: 'PHYSICAL' | 'DIGITAL';
  },
  images: File[]
): Promise<{ product: any; imageUrls: string[] }> {
  // Step 1: Upload images
  const imageUrls = images.length > 0 ? await uploadImages(locationId, images) : [];
  
  // Step 2: Create product with first image as thumbnail
  const product = await createProduct(locationId, {
    name: productData.name,
    description: productData.description,
    productType: productData.productType,
    price: parseFloat(productData.price) || 0,
    imageUrl: imageUrls[0]
  });
  
  // Step 3: Attach remaining images to gallery
  if (imageUrls.length > 1) {
    const remainingImages = imageUrls.slice(1);
    await attachGallery(locationId, product.id, remainingImages);
  }
  
  return { product, imageUrls };
}