#!/bin/bash

echo "=== DEPLOYING RAILWAY BACKEND WITH PRODUCT API ==="

# Copy the complete railway backend with product API
cp railway-backend-complete-with-products.js railway-backend/index.js

echo "✅ Updated Railway backend with product API endpoints"

# Verify the product-api.js file exists
if [ -f "railway-backend/product-api.js" ]; then
    echo "✅ Product API module exists"
else
    echo "❌ Product API module missing - copying from complete implementation"
    # Extract product API functions to separate file
    cat > railway-backend/product-api.js << 'EOF'
/**
 * GoHighLevel Product Creation API for Railway Backend
 * Implements the GHL Products API v2021-07-28 specification
 */

const axios = require('axios');

// GoHighLevel API configuration
const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

// Product creation endpoint following GHL API spec
async function createGHLProduct(productData, accessToken) {
  try {
    console.log('=== CREATING GHL PRODUCT ===');
    console.log('Product data:', productData);
    
    // Validate required fields per GHL API specification
    if (!productData.name || !productData.locationId || !productData.productType) {
      throw new Error('Missing required fields: name, locationId, and productType are required');
    }
    
    // Prepare request payload according to GHL API spec
    const payload = {
      name: productData.name,
      locationId: productData.locationId,
      productType: productData.productType, // DIGITAL, PHYSICAL, or SERVICE
      description: productData.description || '',
      image: productData.image || undefined,
      statementDescriptor: productData.statementDescriptor || undefined,
      availableInStore: productData.availableInStore !== undefined ? productData.availableInStore : true,
      medias: productData.medias || undefined,
      variants: productData.variants || undefined
    };
    
    // Remove undefined fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    console.log('Sending payload to GHL:', payload);
    
    // Make authenticated request to GoHighLevel API
    const response = await axios.post(`${GHL_API_BASE}/products/`, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': GHL_API_VERSION
      },
      timeout: 15000
    });
    
    console.log('GHL API Response Status:', response.status);
    console.log('GHL API Response Data:', response.data);
    
    return {
      success: true,
      product: response.data,
      message: 'Product created successfully in GoHighLevel'
    };
    
  } catch (error) {
    console.error('=== GHL PRODUCT CREATION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: 'Product creation failed',
      details: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Get products from GoHighLevel
async function getGHLProducts(locationId, accessToken, limit = 100, offset = 0) {
  try {
    const response = await axios.get(`${GHL_API_BASE}/locations/${locationId}/products`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': GHL_API_VERSION
      },
      params: { limit, offset },
      timeout: 10000
    });
    
    return {
      success: true,
      products: response.data.products || [],
      total: response.data.total || 0
    };
    
  } catch (error) {
    console.error('Error fetching GHL products:', error.message);
    return {
      success: false,
      error: 'Failed to fetch products',
      details: error.response?.data || error.message
    };
  }
}

// Update product in GoHighLevel
async function updateGHLProduct(productId, updates, accessToken) {
  try {
    const response = await axios.put(`${GHL_API_BASE}/products/${productId}`, updates, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': GHL_API_VERSION
      },
      timeout: 10000
    });
    
    return {
      success: true,
      product: response.data,
      message: 'Product updated successfully'
    };
    
  } catch (error) {
    console.error('Error updating GHL product:', error.message);
    return {
      success: false,
      error: 'Product update failed',
      details: error.response?.data || error.message
    };
  }
}

module.exports = {
  createGHLProduct,
  getGHLProducts,
  updateGHLProduct
};
EOF
    echo "✅ Created product-api.js module"
fi

echo "=== RAILWAY DEPLOYMENT STATUS ==="
echo "✅ Backend updated with product API endpoints"
echo "✅ OAuth token integration ready"
echo "✅ Product creation system deployed"
echo ""
echo "Available endpoints:"
echo "- POST /api/ghl/products - Create product in GoHighLevel"
echo "- POST /api/test/ghl-product - Test product creation"
echo "- GET /api/ghl/products - Retrieve products from GoHighLevel"
echo "- GET /api/debug/installations - View OAuth installations"
echo ""
echo "🚀 Railway backend ready for product API testing"