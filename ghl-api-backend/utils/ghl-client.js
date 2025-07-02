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

// Product creation making direct GoHighLevel API calls
async function createProduct(productData, req) {
  try {
    console.log('Creating product in GoHighLevel with direct API call');
    
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
    
    // Create product payload for GoHighLevel API
    const productPayload = {
      name: productData.name,
      description: productData.description || '',
      productType: productData.type || 'DIGITAL',
      locationId: locationId,
      availableInStore: productData.availableInStore !== false
    };
    
    if (productData.image) productPayload.image = productData.image;
    if (productData.medias) productPayload.medias = productData.medias;
    if (productData.sku) productPayload.sku = productData.sku;
    
    console.log('Making direct call to GoHighLevel Products API');
    console.log('Location ID:', locationId);
    console.log('Product payload:', productPayload);
    
    // Make direct call to GoHighLevel Products API
    const response = await axios.post(`${GHL_API_BASE}/products/`, productPayload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
    
    console.log('GoHighLevel response:', response.status, response.data);
    return response.data;
  } catch (error) {
    console.error('Product creation error:', error.message);
    if (error.response) {
      console.error('GoHighLevel error response:', error.response.status, error.response.data);
    }
    throw error;
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
        'Version': '2021-07-28'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Get products error:', error.message);
    throw error;
  }
}

// Update product
async function updateProduct(productId, productData, accessToken) {
  const response = await axios.put(`${GHL_API_BASE}/products/${productId}`, productData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });
  
  return response.data;
}

// Delete product
async function deleteProduct(productId, accessToken) {
  const response = await axios.delete(`${GHL_API_BASE}/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28'
    }
  });
  
  return response.data;
}

// Media upload
async function uploadMedia(file, locationId, accessToken) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(file.path));
  formData.append('locationId', locationId);
  
  const response = await axios.post(`${GHL_API_BASE}/medias/upload-file`, formData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28',
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
      'Version': '2021-07-28'
    }
  });
  
  return response.data;
}

module.exports = {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  uploadMedia,
  getMedia
};