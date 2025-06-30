const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Get fresh token from OAuth backend
async function getFreshToken(installationId, oauthBackend) {
  const tokenResponse = await axios.get(`${oauthBackend}/api/oauth/token/${installationId}`);
  return tokenResponse.data.accessToken;
}

// Product APIs
async function createProduct(productData, req) {
  // Get fresh token for this request
  const accessToken = await getFreshToken(req.installationId, req.oauthBackend);
  
  const response = await axios.post(`${GHL_API_BASE}/products/`, {
    name: productData.name,
    description: productData.description,
    productType: productData.type || 'PHYSICAL',
    locationId: productData.locationId
  }, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });
  return response.data;
}

async function getProducts(locationId, req) {
  const accessToken = await getFreshToken(req.installationId, req.oauthBackend);
  
  const response = await axios.get(`${GHL_API_BASE}/products/`, {
    params: { locationId },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28'
    }
  });
  return response.data;
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