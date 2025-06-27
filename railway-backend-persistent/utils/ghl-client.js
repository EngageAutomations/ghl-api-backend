const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

// Product management
async function createProduct(productData, accessToken) {
  const payload = {
    name: productData.name,
    locationId: productData.locationId,
    productType: productData.productType || 'DIGITAL',
    description: productData.description || '',
    availableInStore: productData.availableInStore !== false
  };
  
  if (productData.image) payload.image = productData.image;
  if (productData.medias) payload.medias = productData.medias;
  
  const response = await axios.post(`${GHL_API_BASE}/products/`, payload, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  });
  
  return response.data;
}

async function getProducts(locationId, accessToken) {
  const response = await axios.get(`${GHL_API_BASE}/products/`, {
    params: { locationId },
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Version': '2021-07-28'
    }
  });
  
  return response.data;
}

// Media management  
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

// Pricing management
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

module.exports = {
  createProduct,
  getProducts,
  uploadMedia,
  getMedia,
  createPrice,
  getPrices
};