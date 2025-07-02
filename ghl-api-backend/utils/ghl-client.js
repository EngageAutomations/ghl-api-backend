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

// Product creation using the EXACT GoHighLevel format you provided
async function createProduct(productData, req) {
  try {
    console.log('Creating product in GoHighLevel with CORRECT API format');
    
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
    
    // Create product payload using EXACT GoHighLevel format from your example
    const productPayload = {
      name: productData.name,
      locationId: locationId,
      description: productData.description || '',
      productType: productData.type || 'DIGITAL',
      availableInStore: productData.availableInStore !== false
    };
    
    // Add optional fields with correct structure - EXACTLY as your example
    if (productData.image) {
      productPayload.image = productData.image;
    }
    
    if (productData.statementDescriptor) {
      productPayload.statementDescriptor = productData.statementDescriptor;
    }
    
    if (productData.medias && Array.isArray(productData.medias)) {
      productPayload.medias = productData.medias;
    }
    
    if (productData.variants && Array.isArray(productData.variants)) {
      productPayload.variants = productData.variants;
    }
    
    if (productData.collectionIds && Array.isArray(productData.collectionIds)) {
      productPayload.collectionIds = productData.collectionIds;
    }
    
    if (productData.isTaxesEnabled !== undefined) {
      productPayload.isTaxesEnabled = productData.isTaxesEnabled;
    }
    
    if (productData.taxes && Array.isArray(productData.taxes)) {
      productPayload.taxes = productData.taxes;
    }
    
    if (productData.automaticTaxCategoryId) {
      productPayload.automaticTaxCategoryId = productData.automaticTaxCategoryId;
    }
    
    if (productData.isLabelEnabled !== undefined) {
      productPayload.isLabelEnabled = productData.isLabelEnabled;
    }
    
    if (productData.label) {
      productPayload.label = productData.label;
    }
    
    if (productData.slug) {
      productPayload.slug = productData.slug;
    }
    
    if (productData.seo) {
      productPayload.seo = productData.seo;
    }
    
    console.log('Making direct call to GoHighLevel Products API with CORRECT format');
    console.log('Location ID:', locationId);
    console.log('Product payload:', JSON.stringify(productPayload, null, 2));
    
    // Make direct call using EXACT configuration from your example
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://services.leadconnectorhq.com/products/',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'Version': '2021-07-28', 
        'Authorization': `Bearer ${accessToken}`
      },
      data: productPayload
    };
    
    const response = await axios.request(config);
    
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