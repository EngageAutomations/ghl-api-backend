/**
 * Automatic API Retry System
 * Handles token expiry and resubmits requests transparently
 */

const axios = require('axios');

// Enhanced API request wrapper with automatic retry
async function makeGHLAPICall(installation_id, requestConfig, maxRetries = 2) {
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      // Get fresh token before each attempt
      await ensureFreshTokenSmart(installation_id);
      const inst = installations.get(installation_id);
      
      if (!inst || !inst.accessToken) {
        throw new Error('No valid installation found');
      }
      
      // Clone and enhance request config
      const enhancedConfig = {
        ...requestConfig,
        headers: {
          'Authorization': `Bearer ${inst.accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
          ...requestConfig.headers
        }
      };
      
      // Add location ID if needed and not present
      if (inst.locationId && !enhancedConfig.params?.locationId) {
        enhancedConfig.params = {
          locationId: inst.locationId,
          ...enhancedConfig.params
        };
      }
      
      console.log(`[API] Attempt ${attempt + 1}/${maxRetries + 1} for ${requestConfig.method?.toUpperCase() || 'GET'} ${requestConfig.url}`);
      
      // Make the API call
      const response = await axios.request(enhancedConfig);
      
      console.log(`[API] ✅ Success on attempt ${attempt + 1}`);
      return response;
      
    } catch (error) {
      attempt++;
      
      const isTokenError = error.response?.status === 401 || 
                          error.response?.data?.message?.includes('Invalid JWT') ||
                          error.response?.data?.message?.includes('Unauthorized');
      
      if (isTokenError && attempt <= maxRetries) {
        console.log(`[API] ❌ Token error on attempt ${attempt}, retrying...`);
        console.log(`[API] Error: ${error.response?.data?.message || error.message}`);
        
        // Force token refresh
        const inst = installations.get(installation_id);
        if (inst) {
          inst.tokenStatus = 'needs_refresh';
          const refreshSuccess = await enhancedRefreshAccessToken(installation_id);
          
          if (!refreshSuccess) {
            throw new Error('Token refresh failed - OAuth reinstallation required');
          }
          
          // Wait a moment before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      
      // Non-token error or max retries reached
      console.log(`[API] ❌ Final failure after ${attempt} attempts`);
      throw error;
    }
  }
}

// Enhanced product creation with auto-retry
app.post('/api/products/create', async (req, res) => {
  try {
    const { installation_id, ...productData } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'installation_id required' 
      });
    }
    
    console.log('[PRODUCT] Creating product with auto-retry system');
    
    const response = await makeGHLAPICall(installation_id, {
      method: 'post',
      url: 'https://services.leadconnectorhq.com/products/',
      data: productData
    });
    
    res.json({
      success: true,
      product: response.data,
      message: 'Product created successfully'
    });
    
  } catch (error) {
    console.error('[PRODUCT] Creation failed:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Product creation failed',
      details: error.response?.data || error.message,
      retry_exhausted: true
    });
  }
});

// Enhanced media upload with auto-retry
app.post('/api/images/upload', async (req, res) => {
  try {
    const installation_id = req.body.installation_id || req.query.installation_id;
    
    if (!installation_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'installation_id required' 
      });
    }
    
    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }
    
    console.log('[MEDIA] Uploading with auto-retry system');
    
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('file', req.files.file.data, {
      filename: req.files.file.name,
      contentType: req.files.file.mimetype
    });
    
    const response = await makeGHLAPICall(installation_id, {
      method: 'post',
      url: 'https://services.leadconnectorhq.com/medias/upload-file',
      data: formData,
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });
    
    res.json({
      success: true,
      media: response.data,
      message: 'Media uploaded successfully'
    });
    
  } catch (error) {
    console.error('[MEDIA] Upload failed:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Media upload failed',
      details: error.response?.data || error.message,
      retry_exhausted: true
    });
  }
});

// Enhanced pricing creation with auto-retry
app.post('/api/products/:productId/prices', async (req, res) => {
  try {
    const { productId } = req.params;
    const { installation_id, ...priceData } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'installation_id required' 
      });
    }
    
    console.log('[PRICING] Creating price with auto-retry system');
    
    const response = await makeGHLAPICall(installation_id, {
      method: 'post',
      url: `https://services.leadconnectorhq.com/products/${productId}/prices`,
      data: priceData
    });
    
    res.json({
      success: true,
      price: response.data,
      message: 'Price created successfully'
    });
    
  } catch (error) {
    console.error('[PRICING] Creation failed:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Price creation failed',
      details: error.response?.data || error.message,
      retry_exhausted: true
    });
  }
});

// Generic API proxy with auto-retry for any GoHighLevel endpoint
app.all('/api/ghl/*', async (req, res) => {
  try {
    const installation_id = req.body.installation_id || req.query.installation_id;
    
    if (!installation_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'installation_id required' 
      });
    }
    
    // Extract target URL from path
    const targetPath = req.path.replace('/api/ghl', '');
    const targetUrl = `https://services.leadconnectorhq.com${targetPath}`;
    
    console.log(`[PROXY] ${req.method.toUpperCase()} ${targetUrl} with auto-retry`);
    
    const response = await makeGHLAPICall(installation_id, {
      method: req.method.toLowerCase(),
      url: targetUrl,
      data: req.body,
      params: req.query
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('[PROXY] Request failed:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: 'API request failed',
      details: error.response?.data || error.message,
      retry_exhausted: true
    });
  }
});

// Bulk operation with auto-retry (for complex workflows)
app.post('/api/workflow/complete-product', async (req, res) => {
  try {
    const { installation_id, productData, imageFiles, priceData } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'installation_id required' 
      });
    }
    
    const results = {
      images: [],
      product: null,
      prices: []
    };
    
    console.log('[WORKFLOW] Starting complete product creation workflow');
    
    // Step 1: Upload images
    if (imageFiles && imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        try {
          const FormData = require('form-data');
          const formData = new FormData();
          formData.append('file', imageFile.data, {
            filename: imageFile.name,
            contentType: imageFile.mimetype
          });
          
          const imageResponse = await makeGHLAPICall(installation_id, {
            method: 'post',
            url: 'https://services.leadconnectorhq.com/medias/upload-file',
            data: formData,
            headers: formData.getHeaders(),
            maxBodyLength: Infinity
          });
          
          results.images.push(imageResponse.data);
          console.log(`[WORKFLOW] ✅ Image uploaded: ${imageFile.name}`);
          
        } catch (imageError) {
          console.log(`[WORKFLOW] ❌ Image upload failed: ${imageFile.name}`);
          // Continue with other images
        }
      }
    }
    
    // Step 2: Create product
    const productPayload = {
      ...productData,
      image: results.images[0]?.url || productData.image
    };
    
    const productResponse = await makeGHLAPICall(installation_id, {
      method: 'post',
      url: 'https://services.leadconnectorhq.com/products/',
      data: productPayload
    });
    
    results.product = productResponse.data;
    console.log('[WORKFLOW] ✅ Product created');
    
    // Step 3: Add pricing (if pricing API exists)
    if (priceData && results.product.id) {
      try {
        const priceResponse = await makeGHLAPICall(installation_id, {
          method: 'post',
          url: `https://services.leadconnectorhq.com/products/${results.product.id}/prices`,
          data: priceData
        });
        
        results.prices.push(priceResponse.data);
        console.log('[WORKFLOW] ✅ Pricing added');
        
      } catch (priceError) {
        console.log('[WORKFLOW] ⚠️ Pricing creation failed (API may not exist)');
        // Continue without pricing
      }
    }
    
    res.json({
      success: true,
      workflow_complete: true,
      results: results,
      message: 'Complete product workflow executed successfully'
    });
    
  } catch (error) {
    console.error('[WORKFLOW] Failed:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Workflow execution failed',
      details: error.response?.data || error.message,
      partial_results: results
    });
  }
});

module.exports = {
  makeGHLAPICall
};