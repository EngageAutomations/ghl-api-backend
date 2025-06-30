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

// TOKEN LIFECYCLE HELPERS
const PADDING_MS = 5 * 60 * 1000;
const refreshers = new Map();

async function refreshAccessToken(id) {
  const inst = installations.get(id);
  if (!inst || !inst.refreshToken) return;

  try {
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: inst.refreshToken
    });

    const { data } = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
    );

    inst.accessToken = data.access_token;
    inst.refreshToken = data.refresh_token || inst.refreshToken;
    inst.expiresIn = data.expires_in;
    inst.expiresAt = Date.now() + data.expires_in * 1000;
    inst.tokenStatus = 'valid';

    scheduleRefresh(id);
    console.log(`[REFRESH] ${id} → ${(data.expires_in / 3600).toFixed(1)} h`);
  } catch (err) {
    console.error(`[REFRESH-FAIL] ${id}`, err.response?.data || err.message);
    inst.tokenStatus = 'invalid';
  }
}

function scheduleRefresh(id) {
  clearTimeout(refreshers.get(id));
  const inst = installations.get(id);
  if (!inst || !inst.expiresAt) return;
  const delay = Math.max(inst.expiresAt - Date.now() - PADDING_MS, 0);
  const t = setTimeout(() => refreshAccessToken(id), delay);
  refreshers.set(id, t);
}

async function ensureFreshToken(id) {
  const inst = installations.get(id);
  if (!inst) throw new Error('Unknown installation');
  if (!inst.expiresAt || inst.expiresAt - Date.now() < PADDING_MS) {
    await refreshAccessToken(id);
  }
  if (inst.tokenStatus !== 'valid') throw new Error('Token invalid');
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
    version: "5.3.0-complete-workflow",
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

// MISSING INSTALLATIONS ENDPOINT - This was the problem!
app.get('/installations', (req, res) => {
  const installList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: new Date(inst.expiresAt).toISOString(),
    scopes: inst.scopes
  }));
  
  res.json({
    total: installations.size,
    authenticated: installList.filter(inst => inst.tokenStatus === 'valid').length,
    installations: installList
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

// MEDIA UPLOAD ENDPOINT
app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  console.log('=== MEDIA UPLOAD REQUEST ===');
  
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file required' });
    }
    
    console.log(`Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    // Create form data for GoHighLevel API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Upload to GoHighLevel media library
    const uploadResponse = await axios.post(`https://services.leadconnectorhq.com/medias/upload-file`, formData, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        ...formData.getHeaders()
      },
      params: {
        locationId: installation.locationId
      }
    });
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log('Media upload successful:', uploadResponse.data);
    
    res.json({
      success: true,
      mediaUrl: uploadResponse.data.url || uploadResponse.data.fileUrl,
      mediaId: uploadResponse.data.id,
      data: uploadResponse.data
    });
    
  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Media upload error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
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

// PRODUCT CREATION ENDPOINT
app.post('/api/products/create', async (req, res) => {
  console.log('=== PRODUCT CREATION REQUEST ===');
  
  try {
    const { name, description, productType, sku, currency, installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'product name required' });
    }
    
    console.log(`Creating product: ${name}`);
    
    await ensureFreshToken(installation_id);
    const installation = installations.get(installation_id);
    
    const productData = {
      name,
      description: description || '',
      productType: productType || 'PHYSICAL',
      ...(sku && { sku }),
      ...(currency && { currency })
    };
    
    // Create product in GoHighLevel
    const productResponse = await axios.post('https://services.leadconnectorhq.com/products/', productData, {
      headers: {
        'Authorization': `Bearer ${installation.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Product creation successful:', productResponse.data);
    
    res.json({
      success: true,
      product: productResponse.data.product || productResponse.data,
      message: 'Product created successfully in GoHighLevel'
    });
    
  } catch (error) {
    console.error('Product creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create product in GoHighLevel'
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

// Start server
app.listen(port, () => {
  console.log(`Enhanced OAuth backend running on port ${port}`);
  console.log(`Version: 5.3.0-complete-workflow`);
  console.log(`Features: OAuth, Products, Media Upload, Pricing`);
  console.log(`Installations: ${installations.size}`);
  console.log('Ready for multi-step product creation workflow');
});
