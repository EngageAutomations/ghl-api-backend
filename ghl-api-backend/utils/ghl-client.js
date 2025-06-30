const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Direct GoHighLevel API call using OAuth backend's existing endpoints
async function makeDirectGHLCall(endpoint, method, data, installationId, oauthBackend) {
  // Use the OAuth backend's existing product creation endpoint
  const response = await axios({
    method: 'POST',
    url: `${oauthBackend}/api/products/create`,
    data: {
      ...data,
      installation_id: installationId
    },
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.data;
}

// Product creation with real GoHighLevel API calls
async function createProduct(productData, req) {
  try {
    console.log('Creating real product in GoHighLevel via OAuth backend proxy');
    
    // Get valid installation with access token from OAuth backend
    const installsResponse = await axios.get(`${req.oauthBackend}/installations`);
    const installations = installsResponse.data.installations || [];
    const validInstall = installations.find(i => i.id === req.installationId && i.tokenStatus === 'valid');
    
    if (!validInstall) {
      throw new Error('No valid OAuth installation found');
    }
    
    // Make direct GoHighLevel API call using tokens from OAuth backend
    const ghlProductData = {
      name: productData.name,
      description: productData.description,
      productType: productData.type || 'PHYSICAL',
      ...(productData.sku && { sku: productData.sku }),
      ...(productData.currency && { currency: productData.currency })
    };
    
    const ghlResponse = await axios.post('https://services.leadconnectorhq.com/products/', ghlProductData, {
      headers: {
        'Authorization': `Bearer ${validInstall.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Real GoHighLevel product created: ${ghlResponse.data.product?.id}`);
    
    return { 
      product: ghlResponse.data.product,
      success: true,
      message: 'Product created in GoHighLevel',
      locationId: validInstall.locationId
    };
    
  } catch (error) {
    console.error('GoHighLevel product creation error:', error.response?.data || error.message);
    throw new Error(`Failed to create product in GoHighLevel: ${error.response?.data?.message || error.message}`);
  }
}

async function getProducts(locationId, req) {
  try {
    console.log(`Retrieving real products from GoHighLevel for location ${locationId}`);
    
    // Get valid installation with access token
    const installsResponse = await axios.get(`${req.oauthBackend}/installations`);
    const installations = installsResponse.data.installations || [];
    const validInstall = installations.find(i => i.tokenStatus === 'valid');
    
    if (!validInstall) {
      throw new Error('No valid OAuth installation found');
    }
    
    // Make real GoHighLevel API call to get products
    const ghlResponse = await axios.get('https://services.leadconnectorhq.com/products/', {
      headers: {
        'Authorization': `Bearer ${validInstall.accessToken}`,
        'Version': '2021-07-28'
      },
      params: {
        locationId: locationId || validInstall.locationId,
        limit: 100
      }
    });
    
    const products = ghlResponse.data.products || [];
    console.log(`Retrieved ${products.length} real products from GoHighLevel`);
    
    return { 
      products,
      count: products.length,
      success: true,
      locationId: locationId || validInstall.locationId
    };
    
  } catch (error) {
    console.error('GoHighLevel product listing error:', error.response?.data || error.message);
    throw new Error(`Failed to retrieve products from GoHighLevel: ${error.response?.data?.message || error.message}`);
  }
}

async function updateProduct(productId, updates, accessToken) {
  const response = await axios.put(`${GHL_API_BASE}/products/${productId}`, updates, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });
  return response.data;
}

async function deleteProduct(productId, accessToken) {
  const response = await axios.delete(`${GHL_API_BASE}/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28'
    }
  });
  return response.data;
}

// Media APIs
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

// Pricing APIs
async function createPrice(productId, priceData, accessToken) {
  const response = await axios.post(`${GHL_API_BASE}/products/${productId}/price`, priceData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });
  return response.data;
}

async function getPrices(productId, accessToken) {
  const response = await axios.get(`${GHL_API_BASE}/products/${productId}/price`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28'
    }
  });
  return response.data;
}

// Contact APIs
async function createContact(contactData, accessToken) {
  const response = await axios.post(`${GHL_API_BASE}/contacts/`, contactData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });
  return response.data;
}

async function getContacts(locationId, accessToken, params = {}) {
  const response = await axios.get(`${GHL_API_BASE}/contacts/`, {
    params: { locationId, ...params },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28'
    }
  });
  return response.data;
}

// Workflow APIs
async function getWorkflows(locationId, accessToken) {
  const response = await axios.get(`${GHL_API_BASE}/workflows/`, {
    params: { locationId },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28'
    }
  });
  return response.data;
}

module.exports = {
  createProduct, getProducts, updateProduct, deleteProduct,
  uploadMedia, getMedia,
  createPrice, getPrices,
  createContact, getContacts,
  getWorkflows
};