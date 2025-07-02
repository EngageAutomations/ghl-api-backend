const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Helper function to extract location ID from JWT token
function extractLocationIdFromToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.authClassId || null;
  } catch (error) {
    console.log('Error extracting location ID from token:', error.message);
    return null;
  }
}

// Product creation using EXACT single backend format that was working
async function createProduct(productData, req) {
  try {
    console.log('Creating product using single backend format that was working');
    
    // Get access token from OAuth backend
    const tokenResponse = await axios.post(`${req.oauthBackend}/api/token-access`, {
      installation_id: req.installationId
    });
    
    if (!tokenResponse.data.success || !tokenResponse.data.accessToken) {
      throw new Error('Failed to get valid access token from OAuth backend');
    }
    
    const accessToken = tokenResponse.data.accessToken;
    const installation = tokenResponse.data.installation;
    
    // Extract location ID from installation or token
    const locationId = installation?.locationId || extractLocationIdFromToken(accessToken);
    
    if (!locationId) {
      throw new Error('No location ID available for product creation');
    }
    
    // Use EXACT product format that single backend was using (simpler structure)
    const productPayload = {
      name: productData.name,
      locationId: locationId,
      description: productData.description || '',
      productType: productData.type || 'DIGITAL',
      availableInStore: productData.availableInStore !== false
    };
    
    // Add image if provided (single backend style)
    if (productData.image) {
      productPayload.image = productData.image;
    }
    
    // Add medias array if provided (single backend style)
    if (productData.medias && Array.isArray(productData.medias)) {
      productPayload.medias = productData.medias;
    }
    
    console.log('Using single backend request format with automatic retry system');
    console.log('Location ID:', locationId);
    console.log('Product payload:', JSON.stringify(productPayload, null, 2));
    
    // Use EXACT makeGHLAPICall format from single backend
    const requestConfig = {
      method: 'POST',
      url: 'https://services.leadconnectorhq.com/products/',
      data: productPayload,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Replicate single backend's automatic API retry system
    const response = await makeGHLAPICallLikeSingleBackend(req.installationId, requestConfig, accessToken, locationId);
    
    console.log('GoHighLevel response (single backend format):', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('Product creation error (single backend format):', error.message);
    if (error.response) {
      console.error('GoHighLevel error response:', error.response.status, error.response.data);
    }
    throw error;
  }
}

// Replicate single backend's makeGHLAPICall function
async function makeGHLAPICallLikeSingleBackend(installation_id, requestConfig, accessToken, locationId, maxRetries = 2) {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      // Clone and enhance request config EXACTLY like single backend
      const enhancedConfig = {
        ...requestConfig,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
          ...requestConfig.headers
        }
      };
      
      // Add location ID params like single backend
      if (locationId && !enhancedConfig.params?.locationId) {
        enhancedConfig.params = {
          locationId: locationId,
          ...enhancedConfig.params
        };
      }
      
      console.log(`[API] Attempt ${attempt + 1}/${maxRetries + 1} for ${requestConfig.method?.toUpperCase() || 'GET'} ${requestConfig.url}`);
      console.log(`[API] Headers: Authorization: Bearer ${accessToken.substring(0, 20)}..., Version: 2021-07-28`);
      
      // Make the API call EXACTLY like single backend
      const response = await axios.request(enhancedConfig);
      
      console.log(`[API] ✅ Success on attempt ${attempt + 1} (single backend format)`);
      return response;
      
    } catch (error) {
      attempt++;
      
      const isTokenError = error.response?.status === 401 || 
                          error.response?.data?.message?.includes('Invalid JWT') ||
                          error.response?.data?.message?.includes('Unauthorized');
      
      if (isTokenError && attempt <= maxRetries) {
        console.log(`[API] ❌ Token error on attempt ${attempt}, retrying... (single backend style)`);
        console.log(`[API] Error: ${error.response?.data?.message || error.message}`);
        
        // Wait a moment before retry (single backend behavior)
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      // Non-token error or max retries reached
      console.log(`[API] ❌ Final failure after ${attempt} attempts (single backend format)`);
      throw error;
    }
  }
}

// Get products from GoHighLevel
async function getProducts(locationId, req) {
  try {
    // Get access token from OAuth backend
    const tokenResponse = await axios.post(`${req.oauthBackend}/api/token-access`, {
      installation_id: req.installationId
    });
    
    if (!tokenResponse.data.success || !tokenResponse.data.accessToken) {
      throw new Error('Failed to get valid access token');
    }
    
    const accessToken = tokenResponse.data.accessToken;
    
    const response = await axios.get(`${GHL_API_BASE}/products/`, {
      params: { locationId },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Get products error:', error.message);
    throw error;
  }
}

// Media upload
async function uploadMedia(file, locationId, accessToken) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(file.path));
  formData.append('locationId', locationId);
  
  const response = await axios.post(`${GHL_API_BASE}/medias/upload-file`, formData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...formData.getHeaders()
    }
  });
  
  return response.data;
}

// Get media
async function getMedia(locationId, accessToken) {
  const response = await axios.get(`${GHL_API_BASE}/medias/`, {
    params: { locationId },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });
  
  return response.data;
}

module.exports = {
  createProduct,
  getProducts,
  uploadMedia,
  getMedia
};