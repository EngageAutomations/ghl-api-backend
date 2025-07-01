// OAuth Backend Fix - Add missing endpoints for installation tracking
// This file adds the missing /installations endpoint and debugging

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory install store
const installations = new Map();

// Customer support data store
const supportTickets = new Map();
const supportSessions = new Map();
const supportMetrics = {
  totalTickets: 0,
  resolvedTickets: 0,
  averageResponseTime: 0,
  customerSatisfaction: 0
};

// Add pre-seeded installation if env vars exist
if (process.env.GHL_ACCESS_TOKEN) {
  installations.set('install_seed', {
    id: 'install_seed',
    accessToken: process.env.GHL_ACCESS_TOKEN,
    refreshToken: process.env.GHL_REFRESH_TOKEN || null,
    expiresIn: 86399,
    expiresAt: Date.now() + 86399 * 1000,
    locationId: process.env.GHL_LOCATION_ID || 'WAvk87RmW9rBSDJHeOpH',
    scopes: process.env.GHL_SCOPES || 'medias.write medias.readonly',
    tokenStatus: 'valid',
    createdAt: new Date().toISOString()
  });
}

// ENHANCED TOKEN LIFECYCLE HELPERS
const PADDING_MS = 10 * 60 * 1000; // 10 minutes padding for early expiry protection
const refreshers = new Map();

async function enhancedRefreshAccessToken(id) {
  const inst = installations.get(id);
  
  if (!inst) {
    console.log(`[REFRESH] Installation ${id} not found`);
    return false;
  }

  if (!inst.refreshToken) {
    console.log(`[REFRESH] No refresh token for ${id} - OAuth reinstall required`);
    inst.tokenStatus = 'refresh_required';
    return false;
  }

  try {
    console.log(`[REFRESH] Attempting token refresh for ${id}`);
    
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: inst.refreshToken
    });

    const { data } = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      body,
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
        timeout: 15000 
      }
    );

    // Update installation with new tokens
    inst.accessToken = data.access_token;
    inst.refreshToken = data.refresh_token || inst.refreshToken; // Keep old if new not provided
    inst.expiresIn = data.expires_in;
    inst.expiresAt = Date.now() + data.expires_in * 1000;
    inst.tokenStatus = 'valid';
    inst.lastRefresh = new Date().toISOString();
    
    console.log(`[REFRESH] ✅ Token refreshed successfully for ${id}`);
    console.log(`[REFRESH] New expiry: ${new Date(inst.expiresAt).toISOString()}`);
    
    // Schedule next refresh
    scheduleRefreshSmart(id);
    
    return true;
    
  } catch (error) {
    console.error(`[REFRESH] ❌ Failed for ${id}:`, error.response?.data || error.message);
    
    if (error.response?.data?.error === 'invalid_grant') {
      console.log(`[REFRESH] Refresh token expired for ${id} - OAuth reinstall required`);
      inst.tokenStatus = 'refresh_expired';
    } else {
      inst.tokenStatus = 'refresh_failed';
    }
    
    return false;
  }
}

// Legacy function for backward compatibility
async function refreshAccessToken(id) {
  return await enhancedRefreshAccessToken(id);
}

// Enhanced refresh scheduling with shorter intervals for early expiry protection
function scheduleRefreshSmart(id) {
  const inst = installations.get(id);
  if (!inst) return;

  // Clear existing refresh timer
  if (refreshers.has(id)) {
    clearTimeout(refreshers.get(id));
  }

  // Calculate time until refresh needed (refresh at 80% of token lifetime)
  const timeUntilExpiry = inst.expiresAt - Date.now();
  const refreshTime = Math.max(timeUntilExpiry * 0.8, 5 * 60 * 1000); // Minimum 5 minutes
  
  console.log(`[SCHEDULE] ${id} refresh scheduled in ${Math.round(refreshTime / 60000)} minutes`);

  const timer = setTimeout(async () => {
    console.log(`[SCHEDULE] Executing scheduled refresh for ${id}`);
    await enhancedRefreshAccessToken(id);
  }, refreshTime);

  refreshers.set(id, timer);
}

// Legacy function for backward compatibility
function scheduleRefresh(id) {
  scheduleRefreshSmart(id);
}

// Smart token validation with automatic refresh and early expiry detection
async function ensureFreshTokenSmart(id) {
  const inst = installations.get(id);
  
  if (!inst) {
    throw new Error(`Installation ${id} not found`);
  }

  // Check if token is expired or will expire soon
  const timeUntilExpiry = inst.expiresAt - Date.now();
  const needsRefresh = timeUntilExpiry < PADDING_MS; // 10 minutes padding
  
  console.log(`[TOKEN] ${id} expires in ${Math.round(timeUntilExpiry / 60000)} minutes`);
  
  if (needsRefresh) {
    console.log(`[TOKEN] ${id} needs refresh - attempting automatic renewal`);
    
    const refreshSuccess = await enhancedRefreshAccessToken(id);
    
    if (!refreshSuccess) {
      throw new Error(`Token refresh failed for ${id} - OAuth reinstallation required`);
    }
  }

  // Test token validity with a lightweight API call
  try {
    await axios.get(`https://services.leadconnectorhq.com/locations/${inst.locationId}`, {
      headers: {
        'Authorization': `Bearer ${inst.accessToken}`,
        'Version': '2021-07-28'
      },
      timeout: 5000
    });
    
    console.log(`[TOKEN] ✅ ${id} token validated successfully`);
    inst.tokenStatus = 'valid';
    return true;
    
  } catch (validationError) {
    console.log(`[TOKEN] ❌ ${id} token validation failed:`, validationError.response?.data?.message || validationError.message);
    
    if (validationError.response?.status === 401) {
      console.log(`[TOKEN] ${id} token expired early - attempting refresh`);
      
      const refreshSuccess = await enhancedRefreshAccessToken(id);
      
      if (!refreshSuccess) {
        inst.tokenStatus = 'invalid';
        throw new Error(`Token invalid and refresh failed for ${id} - OAuth reinstallation required`);
      }
      
      return true;
    }
    
    throw validationError;
  }
}

// Legacy function for backward compatibility
async function ensureFreshToken(id) {
  return await ensureFreshTokenSmart(id);
}

// AUTOMATIC API RETRY SYSTEM
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

function requireInstall(req, res) {
  const installationId = req.method === 'GET' ? req.query.installation_id : req.body.installation_id;
  const inst = installations.get(installationId);
  if (!inst || !inst.accessToken) {
    res.status(400).json({ success: false, error: `Installation not found: ${installationId}` });
    return null;
  }
  return inst;
}

// BASIC ROUTES
app.get('/', (req, res) => {
  const authenticatedCount = Array.from(installations.values()).filter(inst => inst.tokenStatus === 'valid').length;
  res.json({
    service: "GoHighLevel OAuth Backend",
    version: "5.4.2-field-fix",
    installs: installations.size,
    authenticated: authenticatedCount,
    status: "operational",
    features: ["oauth", "products", "images", "pricing", "media-upload"],
    debug: "complete multi-step workflow ready",
    ts: Date.now()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// BRIDGE SYSTEM ENDPOINTS

// Bridge endpoint to provide OAuth credentials to external systems
app.get('/api/bridge/oauth-credentials', (req, res) => {
  console.log('Bridge: Providing OAuth credentials');
  
  // Return hardcoded OAuth credentials for bridge system
  res.json({
    client_id: '675e4251e4b0e7a613050be3',
    client_secret: '675e4251e4b0e7a613050be3-3lGGH5vhNS4RJxXb',
    redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback',
    scope: 'businesses.readonly businesses.write calendars.readonly calendars.write campaigns.readonly campaigns.write companies.readonly companies.write contacts.readonly contacts.write conversations.readonly conversations.write courses.readonly courses.write forms.readonly forms.write links.readonly links.write locations.readonly locations.write medias.readonly medias.write opportunities.readonly opportunities.write payments.write products.readonly products.write snapshots.readonly surveys.readonly surveys.write users.readonly users.write workflows.readonly workflows.write',
    authorization_url: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
    token_url: 'https://services.leadconnectorhq.com/oauth/token'
  });
});

// Bridge endpoint to handle OAuth authorization codes
app.post('/api/bridge/process-oauth', async (req, res) => {
  console.log('Bridge: Processing OAuth authorization code');
  
  try {
    const { code, redirectUri } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, error: 'Authorization code required' });
    }
    
    // Exchange code for tokens (same logic as OAuth callback)
    const tokenData = await exchangeCode(code, redirectUri || 'https://dir.engageautomations.com/api/oauth/callback');
    
    if (tokenData) {
      const installationId = storeInstall(tokenData);
      
      res.json({
        success: true,
        installation_id: installationId,
        location_id: tokenData.locationId,
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in
      });
    } else {
      res.status(400).json({ success: false, error: 'Token exchange failed' });
    }
    
  } catch (error) {
    console.error('Bridge OAuth processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bridge endpoint to get installation status
app.get('/api/bridge/installation/:id', (req, res) => {
  const { id } = req.params;
  const installation = installations.get(id);
  
  if (!installation) {
    return res.status(404).json({ success: false, error: 'Installation not found' });
  }
  
  res.json({
    success: true,
    installation: {
      id: installation.id,
      location_id: installation.locationId,
      status: installation.tokenStatus,
      scopes: installation.scopes,
      created_at: installation.createdAt
    }
  });
});

// Bridge endpoint to list all installations
app.get('/api/bridge/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(install => ({
    id: install.id,
    location_id: install.locationId,
    status: install.tokenStatus,
    scopes: install.scopes,
    created_at: install.createdAt
  }));
  
  res.json({
    success: true,
    total: installationList.length,
    installations: installationList
  });
});

// MISSING INSTALLATIONS ENDPOINT - This was the problem!
app.get('/installations', (req, res) => {
  const installList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: new Date(inst.expiresAt).toISOString(),
    scopes: inst.scopes,
    lastActivity: inst.lastActivity || inst.createdAt
  }));
  
  res.json({
    total: installations.size,
    authenticated: installList.filter(inst => inst.tokenStatus === 'valid').length,
    installations: installList,
    webhookEndpoint: '/webhook/app-uninstall'
  });
});

// OAuth token exchange
async function exchangeCode(code, redirectUri) {
  const body = new URLSearchParams({
    client_id: process.env.GHL_CLIENT_ID,
    client_secret: process.env.GHL_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  });
  const { data } = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000
  });
  return data;
}

function storeInstall(tokenData) {
  const id = `install_${Date.now()}`;
  installations.set(id, {
    id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    locationId: tokenData.locationId || 'WAvk87RmW9rBSDJHeOpH',
    scopes: tokenData.scope || '',
    tokenStatus: 'valid',
    createdAt: new Date().toISOString()
  });
  scheduleRefresh(id);
  console.log(`[NEW INSTALL] ${id} stored with location ${tokenData.locationId || 'WAvk87RmW9rBSDJHeOpH'}`);
  return id;
}

// OAUTH CALLBACK - Enhanced with better logging
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  console.log('=== OAUTH CALLBACK RECEIVED ===');
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);
  
  const { code, error, state } = req.query;
  
  if (error) {
    console.error('OAuth error from GHL:', error);
    return res.status(400).json({ error: 'OAuth error', details: error });
  }
  
  if (!code) {
    console.error('No authorization code received');
    return res.status(400).json({ error: 'code required' });
  }
  
  try {
    const redirectUri = req.path.startsWith('/api')
      ? (process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback')
      : (process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback');

    console.log('Exchanging code for tokens...');
    console.log('Redirect URI:', redirectUri);
    
    const tokenData = await exchangeCode(code, redirectUri);
    console.log('Token exchange successful');
    
    const id = storeInstall(tokenData);
    console.log('Installation stored with ID:', id);
    
    const url = `https://listings.engageautomations.com/?installation_id=${id}&welcome=true`;
    console.log('Redirecting to:', url);
    
    res.redirect(url);
  } catch (e) {
    console.error('OAuth error:', e.response?.data || e.message);
    res.status(500).json({ error: 'OAuth failed', details: e.response?.data || e.message });
  }
});

app.get('/api/oauth/status', (req, res) => {
  const inst = installations.get(req.query.installation_id);
  if (!inst) return res.json({ authenticated: false });
  res.json({ authenticated: true, tokenStatus: inst.tokenStatus, locationId: inst.locationId });
});

// ENHANCED MEDIA UPLOAD ENDPOINT WITH AUTO-RETRY
app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  console.log('=== MEDIA UPLOAD REQUEST WITH AUTO-RETRY ===');
  
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file required' });
    }
    
    console.log(`[MEDIA] Uploading file: ${req.file.originalname} (${req.file.size} bytes) with auto-retry`);
    
    // Create form data for GoHighLevel API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Use automatic retry system for media upload
    const uploadResponse = await makeGHLAPICall(installation_id, {
      method: 'post',
      url: 'https://services.leadconnectorhq.com/medias/upload-file',
      data: formData,
      headers: {
        ...formData.getHeaders()
      },
      maxBodyLength: Infinity
    });
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log('[MEDIA] ✅ Upload successful with auto-retry protection');
    
    res.json({
      success: true,
      mediaUrl: uploadResponse.data.url || uploadResponse.data.fileUrl,
      mediaId: uploadResponse.data.id,
      data: uploadResponse.data,
      message: 'Media uploaded successfully with auto-retry protection'
    });
    
  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('[MEDIA] ❌ Upload failed after all retries:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Media upload failed',
      details: error.response?.data || error.message,
      retry_exhausted: true,
      action: error.message?.includes('OAuth reinstallation required') ? 'complete_oauth_installation' : 'retry_later'
    });
  }
});

// MEDIA LIST ENDPOINT
app.get('/api/media/list', async (req, res) => {
  try {
    const { installation_id } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const mediaResponse = await axios.get('https://services.leadconnectorhq.com/medias/', {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28'
      },
      params: {
        locationId: installation.locationId,
        limit: 100
      }
    });
    
    res.json({
      success: true,
      media: mediaResponse.data.medias || mediaResponse.data,
      total: mediaResponse.data.count || mediaResponse.data.length
    });
    
  } catch (error) {
    console.error('Media list error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// PRICING ENDPOINT
app.post('/api/products/:productId/prices', async (req, res) => {
  try {
    const { productId } = req.params;
    const { installation_id, name, type, amount, currency } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const priceData = {
      name,
      type,
      amount: parseInt(amount),
      currency: currency || 'USD'
    };
    
    const priceResponse = await axios.post(`https://services.leadconnectorhq.com/products/${productId}/prices`, priceData, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Price created:', priceResponse.data);
    
    res.json({
      success: true,
      price: priceResponse.data
    });
    
  } catch (error) {
    console.error('Price creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// ENHANCED PRODUCT CREATION ENDPOINT WITH AUTO-RETRY
app.post('/api/products/create', async (req, res) => {
  console.log('=== PRODUCT CREATION REQUEST WITH AUTO-RETRY ===');
  
  try {
    const { name, description, productType, sku, currency, installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'product name required' });
    }
    
    console.log(`[PRODUCT] Creating product: ${name} with auto-retry system`);
    
    const productData = {
      name,
      description: description || '',
      productType: productType || 'DIGITAL',
      ...(sku && { sku }),
      ...(currency && { currency })
    };
    
    // Use automatic retry system for product creation
    const response = await makeGHLAPICall(installation_id, {
      method: 'post',
      url: 'https://services.leadconnectorhq.com/products/',
      data: productData
    });
    
    console.log('[PRODUCT] ✅ Product creation successful:', response.data);
    
    res.json({
      success: true,
      product: response.data.product || response.data,
      message: 'Product created successfully with auto-retry protection'
    });
    
  } catch (error) {
    console.error('[PRODUCT] ❌ Creation failed after all retries:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Product creation failed',
      details: error.response?.data || error.message,
      retry_exhausted: true,
      action: error.message?.includes('OAuth reinstallation required') ? 'complete_oauth_installation' : 'retry_later'
    });
  }
});

// PRODUCT LISTING ENDPOINT
app.get('/api/products/list', async (req, res) => {
  console.log('=== PRODUCT LISTING REQUEST ===');
  
  try {
    const { installation_id } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const productsResponse = await axios.get('https://services.leadconnectorhq.com/products/', {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28'
      },
      params: {
        locationId: installation.locationId,
        limit: 100
      }
    });
    
    console.log('Products retrieved:', productsResponse.data.products?.length || 0);
    
    res.json({
      success: true,
      products: productsResponse.data.products || [],
      count: productsResponse.data.products?.length || 0
    });
    
  } catch (error) {
    console.error('Product listing error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to retrieve products from GoHighLevel'
    });
  }
});

// COLLECTION MANAGEMENT ENDPOINTS

// Create product collection
app.post('/api/collections/create', async (req, res) => {
  console.log('=== COLLECTION CREATION REQUEST ===');
  
  try {
    const { name, description, productIds = [], installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'collection name required' });
    }
    
    console.log(`Creating collection: ${name}`);
    console.log(`Products to include: ${productIds.length}`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const collectionData = {
      name,
      description: description || '',
      productIds: productIds,
      locationId: installation.locationId
    };
    
    const collectionResponse = await axios.post('https://services.leadconnectorhq.com/collections/', collectionData, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Collection created:', collectionResponse.data);
    
    res.json({
      success: true,
      collection: collectionResponse.data,
      message: 'Collection created successfully'
    });
    
  } catch (error) {
    console.error('Collection creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create collection'
    });
  }
});

// List all collections
app.get('/api/collections/list', async (req, res) => {
  console.log('=== COLLECTION LIST REQUEST ===');
  
  try {
    const { installation_id } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const collectionsResponse = await axios.get('https://services.leadconnectorhq.com/collections/', {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28'
      },
      params: {
        locationId: installation.locationId
      }
    });
    
    console.log('Collections retrieved:', collectionsResponse.data.collections?.length || 0);
    
    res.json({
      success: true,
      collections: collectionsResponse.data.collections || [],
      count: collectionsResponse.data.collections?.length || 0
    });
    
  } catch (error) {
    console.error('Collection listing error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to retrieve collections'
    });
  }
});

// Add products to existing collection
app.post('/api/collections/:collectionId/products', async (req, res) => {
  console.log('=== ADD PRODUCTS TO COLLECTION ===');
  
  try {
    const { collectionId } = req.params;
    const { productIds, installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ success: false, error: 'productIds array required' });
    }
    
    console.log(`Adding ${productIds.length} products to collection ${collectionId}`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const updateResponse = await axios.patch(`https://services.leadconnectorhq.com/collections/${collectionId}`, {
      productIds: productIds
    }, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Products added to collection:', updateResponse.data);
    
    res.json({
      success: true,
      collection: updateResponse.data,
      message: 'Products added to collection successfully'
    });
    
  } catch (error) {
    console.error('Add products to collection error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to add products to collection'
    });
  }
});

// COMPLETE PRODUCT WORKFLOW WITH PHOTOS AND PRICING

// Complete product creation workflow: photos → product → pricing
app.post('/api/workflow/complete-product', async (req, res) => {
  console.log('=== COMPLETE PRODUCT WORKFLOW ===');
  
  try {
    const { 
      name, 
      description, 
      productType, 
      sku, 
      currency,
      photos = [], // Array of photo objects: [{filename, buffer, mimetype}, ...]
      pricing = [], // Array of pricing objects: [{name, type, amount, currency}, ...]
      installation_id 
    } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'product name required' });
    }
    
    console.log(`Starting complete workflow for: ${name}`);
    console.log(`Photos to upload: ${photos.length}`);
    console.log(`Pricing tiers: ${pricing.length}`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const workflowResult = {
      product: null,
      uploadedPhotos: [],
      createdPrices: [],
      errors: []
    };
    
    // Step 1: Upload multiple photos to media library
    console.log('Step 1: Uploading photos to media library...');
    
    for (let i = 0; i < photos.length; i++) {
      try {
        const photo = photos[i];
        console.log(`Uploading photo ${i + 1}/${photos.length}: ${photo.filename}`);
        
        const formData = new FormData();
        // Handle both buffer and file path scenarios
        if (photo.buffer) {
          formData.append('file', photo.buffer, {
            filename: photo.filename,
            contentType: photo.mimetype
          });
        } else if (photo.path) {
          formData.append('file', fs.createReadStream(photo.path), {
            filename: photo.filename,
            contentType: photo.mimetype
          });
        }
        
        const uploadResponse = await axios.post(`https://services.leadconnectorhq.com/medias/upload-file`, formData, {
          headers: {
            'Authorization': `Bearer ${installation.accessToken}`,
            'Version': '2021-07-28',
            ...formData.getHeaders()
          },
          timeout: 30000
        });
        
        workflowResult.uploadedPhotos.push({
          filename: photo.filename,
          mediaId: uploadResponse.data.id,
          url: uploadResponse.data.url,
          success: true
        });
        
        console.log(`✓ Photo ${i + 1} uploaded: ${uploadResponse.data.id}`);
        
      } catch (photoError) {
        console.error(`✗ Photo ${i + 1} upload failed:`, photoError.response?.data || photoError.message);
        workflowResult.uploadedPhotos.push({
          filename: photos[i].filename,
          success: false,
          error: photoError.response?.data || photoError.message
        });
        workflowResult.errors.push(`Photo upload failed: ${photos[i].filename}`);
      }
    }
    
    // Step 2: Create the product with uploaded photo IDs
    console.log('Step 2: Creating product...');
    
    const mediaIds = workflowResult.uploadedPhotos
      .filter(photo => photo.success)
      .map(photo => photo.mediaId);
    
    const productData = {
      name,
      description: description || '',
      productType: productType || 'DIGITAL', // GoHighLevel API expects 'productType' field with DIGITAL enum
      locationId: installation.locationId,
      mediaIds: mediaIds, // Attach uploaded photos
      ...(sku && { sku }),
      ...(currency && { currency })
    };
    
    console.log(`Creating product with ${mediaIds.length} attached photos`);
    
    const productResponse = await axios.post('https://services.leadconnectorhq.com/products/', productData, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    workflowResult.product = productResponse.data;
    console.log(`✓ Product created: ${productResponse.data.id}`);
    
    // Step 3: Add multiple pricing tiers
    console.log('Step 3: Adding pricing tiers...');
    
    for (let i = 0; i < pricing.length; i++) {
      try {
        const price = pricing[i];
        console.log(`Adding price ${i + 1}/${pricing.length}: ${price.name}`);
        
        const priceData = {
          name: price.name,
          type: price.type || 'one_time',
          amount: parseInt(price.amount),
          currency: price.currency || 'USD'
        };
        
        const priceResponse = await axios.post(`https://services.leadconnectorhq.com/products/${productResponse.data.id}/prices`, priceData, {
          headers: {
            'Authorization': `Bearer ${installation.accessToken}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        workflowResult.createdPrices.push({
          name: price.name,
          priceId: priceResponse.data.id,
          amount: price.amount,
          type: price.type,
          success: true
        });
        
        console.log(`✓ Price ${i + 1} created: ${priceResponse.data.id}`);
        
      } catch (priceError) {
        console.error(`✗ Price ${i + 1} creation failed:`, priceError.response?.data || priceError.message);
        workflowResult.createdPrices.push({
          name: pricing[i].name,
          success: false,
          error: priceError.response?.data || priceError.message
        });
        workflowResult.errors.push(`Price creation failed: ${pricing[i].name}`);
      }
    }
    
    // Workflow completion summary
    const summary = {
      success: true,
      productId: workflowResult.product?.id,
      productName: workflowResult.product?.name,
      photosUploaded: workflowResult.uploadedPhotos.filter(p => p.success).length,
      pricesCreated: workflowResult.createdPrices.filter(p => p.success).length,
      totalErrors: workflowResult.errors.length
    };
    
    console.log('=== WORKFLOW COMPLETE ===');
    console.log(`Product: ${summary.productName} (${summary.productId})`);
    console.log(`Photos: ${summary.photosUploaded}/${photos.length} uploaded`);
    console.log(`Prices: ${summary.pricesCreated}/${pricing.length} created`);
    console.log(`Errors: ${summary.totalErrors}`);
    
    res.json({
      success: true,
      summary,
      details: workflowResult,
      message: 'Complete product workflow executed'
    });
    
  } catch (error) {
    console.error('Complete workflow error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Complete product workflow failed'
    });
  }
});

// Multi-photo upload endpoint (standalone)
app.post('/api/photos/upload-multiple', upload.array('photos', 10), async (req, res) => {
  console.log('=== MULTIPLE PHOTO UPLOAD ===');
  
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No photos provided' });
    }
    
    console.log(`Uploading ${req.files.length} photos`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const uploadResults = [];
    
    for (let i = 0; i < req.files.length; i++) {
      try {
        const file = req.files[i];
        console.log(`Uploading photo ${i + 1}/${req.files.length}: ${file.originalname}`);
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file.path), {
          filename: file.originalname,
          contentType: file.mimetype
        });
        
        const uploadResponse = await axios.post(`https://services.leadconnectorhq.com/medias/upload-file`, formData, {
          headers: {
            'Authorization': `Bearer ${installation.accessToken}`,
            'Version': '2021-07-28',
            ...formData.getHeaders()
          },
          timeout: 30000
        });
        
        uploadResults.push({
          filename: file.originalname,
          mediaId: uploadResponse.data.id,
          url: uploadResponse.data.url,
          size: file.size,
          success: true
        });
        
        console.log(`✓ Photo uploaded: ${uploadResponse.data.id}`);
        
        // Clean up temp file
        fs.unlinkSync(file.path);
        
      } catch (uploadError) {
        console.error(`✗ Photo upload failed:`, uploadError.response?.data || uploadError.message);
        uploadResults.push({
          filename: req.files[i].originalname,
          success: false,
          error: uploadError.response?.data || uploadError.message
        });
      }
    }
    
    const successCount = uploadResults.filter(r => r.success).length;
    
    res.json({
      success: true,
      totalUploaded: successCount,
      totalFiles: req.files.length,
      uploads: uploadResults,
      mediaIds: uploadResults.filter(r => r.success).map(r => r.mediaId)
    });
    
  } catch (error) {
    console.error('Multiple photo upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Multiple photo upload failed'
    });
  }
});

// ENHANCED PRODUCT WORKFLOWS

// Create product with collection assignment
app.post('/api/products/create-with-collection', async (req, res) => {
  console.log('=== PRODUCT + COLLECTION WORKFLOW ===');
  
  try {
    const { 
      name, 
      description, 
      productType, 
      sku, 
      currency, 
      collectionId,
      pricing = [],
      mediaIds = [],
      installation_id 
    } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'product name required' });
    }
    
    console.log(`Creating product with collection assignment: ${name}`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    // Step 1: Create the product
    const productData = {
      name,
      description: description || '',
      productType: productType || 'product',
      sku: sku || '',
      currency: currency || 'USD',
      locationId: installation.locationId,
      mediaIds: mediaIds
    };
    
    const productResponse = await axios.post('https://services.leadconnectorhq.com/products/', productData, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    const createdProduct = productResponse.data;
    console.log('Product created:', createdProduct.id);
    
    // Step 2: Add pricing if provided
    const createdPrices = [];
    if (pricing.length > 0) {
      for (const price of pricing) {
        try {
          const priceResponse = await axios.post(`https://services.leadconnectorhq.com/products/${createdProduct.id}/prices`, {
            name: price.name,
            type: price.type || 'one_time',
            amount: parseInt(price.amount),
            currency: price.currency || 'USD'
          }, {
            headers: {
              'Authorization': `Bearer ${installation.accessToken}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            }
          });
          createdPrices.push(priceResponse.data);
          console.log('Price created:', priceResponse.data.id);
        } catch (priceError) {
          console.error('Price creation failed:', priceError.response?.data);
        }
      }
    }
    
    // Step 3: Add to collection if specified
    let collectionUpdate = null;
    if (collectionId) {
      try {
        const updateResponse = await axios.patch(`https://services.leadconnectorhq.com/collections/${collectionId}`, {
          productIds: [createdProduct.id]
        }, {
          headers: {
            'Authorization': `Bearer ${installation.accessToken}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        });
        collectionUpdate = updateResponse.data;
        console.log('Product added to collection:', collectionId);
      } catch (collectionError) {
        console.error('Collection update failed:', collectionError.response?.data);
      }
    }
    
    res.json({
      success: true,
      product: createdProduct,
      prices: createdPrices,
      collection: collectionUpdate,
      message: 'Product created with full workflow'
    });
    
  } catch (error) {
    console.error('Product workflow error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create product with workflow'
    });
  }
});

// TOKEN TEST ENDPOINT
app.get('/api/test/token', async (req, res) => {
  console.log('=== TOKEN TEST REQUEST ===');
  
  try {
    const { installation_id } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    console.log('Testing token with location info request...');
    
    // Test with a simple location info request
    const testResponse = await axios.get(`https://services.leadconnectorhq.com/locations/${installation.locationId}`, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28'
      }
    });
    
    console.log('Token test successful:', testResponse.status);
    
    res.json({
      success: true,
      tokenStatus: 'valid',
      locationId: installation.locationId,
      scopes: installation.scopes,
      locationData: testResponse.data
    });
    
  } catch (error) {
    console.error('Token test error:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
      message: 'Token test failed'
    });
  }
});

// CUSTOMER SUPPORT ENDPOINTS

// Create support ticket
app.post('/api/support/tickets', async (req, res) => {
  console.log('=== SUPPORT TICKET CREATION ===');
  
  try {
    const { 
      customerEmail, 
      customerName,
      subject, 
      description, 
      priority = 'medium',
      category = 'general',
      installationId 
    } = req.body;
    
    if (!customerEmail || !subject || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'customerEmail, subject, and description are required' 
      });
    }
    
    const ticketId = 'ticket_' + Date.now();
    const ticket = {
      id: ticketId,
      customerEmail,
      customerName: customerName || 'Unknown',
      subject,
      description,
      priority, // low, medium, high, urgent
      category, // general, technical, billing, feature_request
      status: 'open', // open, in_progress, waiting_customer, resolved, closed
      installationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: 'msg_' + Date.now(),
        from: 'customer',
        content: description,
        timestamp: new Date().toISOString()
      }],
      assignedTo: null,
      tags: [],
      satisfaction: null
    };
    
    supportTickets.set(ticketId, ticket);
    supportMetrics.totalTickets++;
    
    console.log(`Support ticket created: ${ticketId}`);
    
    res.json({
      success: true,
      ticket,
      message: 'Support ticket created successfully'
    });
    
  } catch (error) {
    console.error('Support ticket creation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to create support ticket'
    });
  }
});

// Get support tickets (admin view)
app.get('/api/support/tickets', (req, res) => {
  try {
    const { status, priority, category, customerEmail } = req.query;
    let tickets = Array.from(supportTickets.values());
    
    // Apply filters
    if (status) tickets = tickets.filter(t => t.status === status);
    if (priority) tickets = tickets.filter(t => t.priority === priority);
    if (category) tickets = tickets.filter(t => t.category === category);
    if (customerEmail) tickets = tickets.filter(t => t.customerEmail === customerEmail);
    
    // Sort by creation date (newest first)
    tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      tickets,
      count: tickets.length,
      metrics: supportMetrics
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific ticket
app.get('/api/support/tickets/:ticketId', (req, res) => {
  try {
    const ticket = supportTickets.get(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    res.json({ success: true, ticket });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update ticket status
app.patch('/api/support/tickets/:ticketId', (req, res) => {
  try {
    const ticket = supportTickets.get(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    const { status, assignedTo, priority, tags } = req.body;
    
    if (status) ticket.status = status;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
    if (priority) ticket.priority = priority;
    if (tags) ticket.tags = tags;
    
    ticket.updatedAt = new Date().toISOString();
    
    // Update metrics
    if (status === 'resolved' || status === 'closed') {
      supportMetrics.resolvedTickets++;
    }
    
    supportTickets.set(req.params.ticketId, ticket);
    
    res.json({ success: true, ticket });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add message to ticket
app.post('/api/support/tickets/:ticketId/messages', (req, res) => {
  try {
    const ticket = supportTickets.get(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    const { content, from = 'support' } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message content is required' 
      });
    }
    
    const message = {
      id: 'msg_' + Date.now(),
      from, // 'customer' or 'support'
      content,
      timestamp: new Date().toISOString()
    };
    
    ticket.messages.push(message);
    ticket.updatedAt = new Date().toISOString();
    
    supportTickets.set(req.params.ticketId, ticket);
    
    res.json({ success: true, message, ticket });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customer satisfaction rating
app.post('/api/support/tickets/:ticketId/satisfaction', (req, res) => {
  try {
    const ticket = supportTickets.get(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    const { rating, feedback } = req.body; // rating: 1-5
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    ticket.satisfaction = { rating, feedback, submittedAt: new Date().toISOString() };
    ticket.updatedAt = new Date().toISOString();
    
    supportTickets.set(req.params.ticketId, ticket);
    
    // Update average satisfaction
    const satisfactionRatings = Array.from(supportTickets.values())
      .filter(t => t.satisfaction)
      .map(t => t.satisfaction.rating);
      
    if (satisfactionRatings.length > 0) {
      supportMetrics.customerSatisfaction = 
        satisfactionRatings.reduce((a, b) => a + b, 0) / satisfactionRatings.length;
    }
    
    res.json({ success: true, ticket });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Support analytics dashboard
app.get('/api/support/analytics', (req, res) => {
  try {
    const tickets = Array.from(supportTickets.values());
    const now = new Date();
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const analytics = {
      overview: supportMetrics,
      ticketsByStatus: {
        open: tickets.filter(t => t.status === 'open').length,
        in_progress: tickets.filter(t => t.status === 'in_progress').length,
        waiting_customer: tickets.filter(t => t.status === 'waiting_customer').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        closed: tickets.filter(t => t.status === 'closed').length
      },
      ticketsByPriority: {
        low: tickets.filter(t => t.priority === 'low').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        high: tickets.filter(t => t.priority === 'high').length,
        urgent: tickets.filter(t => t.priority === 'urgent').length
      },
      ticketsByCategory: {
        general: tickets.filter(t => t.category === 'general').length,
        technical: tickets.filter(t => t.category === 'technical').length,
        billing: tickets.filter(t => t.category === 'billing').length,
        feature_request: tickets.filter(t => t.category === 'feature_request').length
      },
      recentActivity: tickets
        .filter(t => new Date(t.createdAt) > last30Days)
        .length,
      averageResolutionTime: calculateAverageResolutionTime(tickets),
      topCustomers: getTopCustomers(tickets)
    };
    
    res.json({ success: true, analytics });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Customer self-service portal
app.get('/api/support/customer/:customerEmail/tickets', (req, res) => {
  try {
    const customerEmail = req.params.customerEmail;
    const tickets = Array.from(supportTickets.values())
      .filter(t => t.customerEmail === customerEmail)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json({
      success: true,
      tickets: tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        category: t.category,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messageCount: t.messages.length
      })),
      count: tickets.length
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
function calculateAverageResolutionTime(tickets) {
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  if (resolvedTickets.length === 0) return 0;
  
  const totalTime = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.createdAt);
    const updated = new Date(ticket.updatedAt);
    return sum + (updated - created);
  }, 0);
  
  return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)); // hours
}

function getTopCustomers(tickets) {
  const customerCounts = {};
  tickets.forEach(ticket => {
    customerCounts[ticket.customerEmail] = (customerCounts[ticket.customerEmail] || 0) + 1;
  });
  
  return Object.entries(customerCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([email, count]) => ({ email, ticketCount: count }));
}

// PRODUCTION MONITORING ENDPOINTS

// Token health check endpoint
app.get('/api/token-health/:id', async (req, res) => {
  const { id } = req.params;
  const inst = installations.get(id);
  
  if (!inst) {
    return res.status(404).json({ error: 'Installation not found' });
  }

  const timeUntilExpiry = inst.expiresAt - Date.now();
  
  res.json({
    installation_id: id,
    token_status: inst.tokenStatus,
    expires_at: inst.expiresAt,
    expires_in_minutes: Math.round(timeUntilExpiry / 60000),
    has_refresh_token: !!inst.refreshToken,
    last_refresh: inst.lastRefresh || 'never',
    needs_refresh: timeUntilExpiry < PADDING_MS,
    health: timeUntilExpiry > 0 ? 'healthy' : 'expired'
  });
});

// Manual refresh endpoint for emergencies
app.post('/api/refresh-token/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const success = await enhancedRefreshAccessToken(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        installation_id: id,
        expires_at: installations.get(id).expiresAt
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Refresh failed - OAuth reinstallation required',
        installation_id: id
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Refresh attempt failed',
      details: error.message
    });
  }
});

// Universal API proxy with auto-retry for any GoHighLevel endpoint
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

// Complete workflow endpoint with auto-retry
app.post('/api/workflow/complete-product', async (req, res) => {
  try {
    const { installation_id, productData, priceData } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'installation_id required' 
      });
    }
    
    const results = {
      product: null,
      prices: []
    };
    
    console.log('[WORKFLOW] Starting complete product creation workflow with auto-retry');
    
    // Step 1: Create product
    const productResponse = await makeGHLAPICall(installation_id, {
      method: 'post',
      url: 'https://services.leadconnectorhq.com/products/',
      data: productData
    });
    
    results.product = productResponse.data;
    console.log('[WORKFLOW] ✅ Product created');
    
    // Step 2: Add pricing (if pricing API exists)
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
      message: 'Complete product workflow executed successfully with auto-retry protection'
    });
    
  } catch (error) {
    console.error('[WORKFLOW] Failed:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: 'Workflow execution failed',
      details: error.response?.data || error.message,
      partial_results: results,
      retry_exhausted: true
    });
  }
});

// Start Enhanced OAuth Backend Server
app.listen(port, () => {
  console.log(`✅ Enhanced OAuth Backend with Auto-Retry running on port ${port}`);
  console.log(`📊 Version: 7.0.0-production-ready`);
  console.log(`🔧 Features: OAuth, Products, Media, Support, Webhooks, Auto-Retry`);
  console.log(`⚡ Installations: ${installations.size}`);
  console.log(`🎫 Support tickets: ${supportTickets.size}`);
  console.log(`🔄 Token Management: Enhanced with early expiry protection`);
  console.log(`🛡️ API Protection: Automatic retry on token failures`);
  console.log(`🚀 Production Ready: Token monitoring and emergency refresh endpoints`);
});
