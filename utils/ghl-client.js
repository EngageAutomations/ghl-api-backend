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

// Product APIs - using OAuth backend's existing endpoints
async function createProduct(productData, req) {
  try {
    // Use OAuth backend's existing product creation endpoint
    const response = await axios.post(`${req.oauthBackend}/api/products/create`, {
      name: productData.name,
      description: productData.description,
      productType: productData.type || 'PHYSICAL',
      locationId: productData.locationId,
      sku: productData.sku,
      currency: productData.currency,
      installation_id: req.installationId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('OAuth backend product creation failed:', error.message);
    throw error;
  }
}

async function getProducts(locationId, req) {
  try {
    // Use OAuth backend's existing product listing endpoint
    const response = await axios.get(`${req.oauthBackend}/api/products/list`, {
      params: {
        installation_id: req.installationId
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('OAuth backend product listing failed:', error.message);
    throw error;
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