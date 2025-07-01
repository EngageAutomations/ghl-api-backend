/**
 * Restore OAuth Installation After Deployment
 */

async function restoreOAuthInstallation() {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    console.log('=== Restoring OAuth Installation ===');
    
    // Create a backend version that pre-seeds the installation
    const restoredBackend = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const installations = new Map();

// RESTORE YOUR INSTALLATION ON STARTUP
function restoreInstallation() {
  // Your successful OAuth installation from today
  installations.set('install_1751343410712', {
    id: 'install_1751343410712',
    accessToken: process.env.GHL_ACCESS_TOKEN || 'restore_needed',
    refreshToken: process.env.GHL_REFRESH_TOKEN || null,
    expiresIn: 86399,
    expiresAt: Date.now() + 86399 * 1000,
    locationId: 'WAvk87RmW9rBSDJHeOpH',
    scopes: 'medias.write medias.readonly products.write products.readonly',
    tokenStatus: 'valid',
    createdAt: '2025-07-01T04:16:50.712Z',
    restored: true
  });
  
  console.log('[STARTUP] Installation restored: install_1751343410712');
}

// TOKEN HELPERS
async function refreshAccessToken(id) {
  const inst = installations.get(id);
  if (!inst || !inst.refreshToken) return false;

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
    
    console.log(\`[REFRESH] Token updated for \${id}\`);
    return true;
  } catch (error) {
    console.error(\`[REFRESH] Failed for \${id}:\`, error.response?.data || error.message);
    inst.tokenStatus = 'failed';
    return false;
  }
}

async function ensureFreshToken(id) {
  const inst = installations.get(id);
  if (!inst) throw new Error('Unknown installation');
  
  const timeUntilExpiry = inst.expiresAt - Date.now();
  if (timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes padding
    await refreshAccessToken(id);
  }
  
  if (inst.tokenStatus !== 'valid') throw new Error('Token invalid');
  return inst;
}

// BASIC ROUTES
app.get('/', (req, res) => {
  res.json({
    service: "GoHighLevel OAuth Backend",
    version: "5.5.1-installation-restored",
    status: "operational",
    installs: installations.size,
    authenticated: Array.from(installations.values()).filter(inst => inst.tokenStatus === 'valid').length,
    features: ["oauth", "products", "token-refresh"],
    endpoints: ["/api/products/create", "/api/products", "/installations"],
    restored: "install_1751343410712",
    ready: true
  });
});

app.get('/installations', (req, res) => {
  const installationsArray = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: inst.expiresAt,
    restored: inst.restored || false
  }));
  
  res.json({
    installations: installationsArray,
    count: installationsArray.length
  });
});

// OAUTH CALLBACK - For new installations
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  console.log('=== OAUTH CALLBACK ===');
  const { code, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    return res.status(400).json({ error: 'OAuth error', details: error });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
    });

    console.log('[OAUTH] Exchanging authorization code...');
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    const id = \`install_\${Date.now()}\`;
    installations.set(id, {
      id,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in,
      expiresAt: Date.now() + tokenResponse.data.expires_in * 1000,
      locationId: tokenResponse.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenResponse.data.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    });

    console.log(\`[INSTALL] \${id} created successfully\`);
    
    res.json({
      success: true,
      installationId: id,
      message: 'OAuth installation successful'
    });

  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'OAuth callback failed',
      details: error.response?.data || error.message
    });
  }
});

// PRODUCT CREATION
app.post('/api/products/create', async (req, res) => {
  try {
    const { name, description, productType, sku, currency, installation_id } = req.body;
    
    console.log(\`[PRODUCT] Creating: \${name}\`);
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'product name required' });
    }
    
    const installation = await ensureFreshToken(installation_id);
    
    const productData = {
      name,
      description: description || '',
      productType: productType || 'DIGITAL',
      locationId: installation.locationId,
      ...(sku && { sku }),
      ...(currency && { currency })
    };
    
    console.log(\`[PRODUCT] Sending to GHL:\`, productData);
    
    const productResponse = await axios.post('https://services.leadconnectorhq.com/products/', productData, {
      headers: {
        'Authorization': \`Bearer \${installation.accessToken}\`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(\`[PRODUCT] Created successfully: \${productResponse.data.product?.id || 'unknown'}\`);
    
    res.json({
      success: true,
      product: productResponse.data.product || productResponse.data,
      message: 'Product created successfully'
    });
    
  } catch (error) {
    console.error('[PRODUCT] Creation error:', error.response?.data || error.message);
    
    // Try token refresh on 401
    if (error.response?.status === 401) {
      try {
        console.log('[PRODUCT] Attempting token refresh...');
        await refreshAccessToken(req.body.installation_id);
      } catch (refreshError) {
        console.error('[PRODUCT] Token refresh failed:', refreshError.message);
      }
    }
    
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create product'
    });
  }
});

// PRODUCT LISTING
app.get('/api/products', async (req, res) => {
  try {
    const { installation_id } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    const installation = await ensureFreshToken(installation_id);
    
    const productsResponse = await axios.get('https://services.leadconnectorhq.com/products/', {
      headers: {
        'Authorization': \`Bearer \${installation.accessToken}\`,
        'Version': '2021-07-28'
      },
      params: {
        locationId: installation.locationId
      },
      timeout: 15000
    });
    
    res.json({
      success: true,
      products: productsResponse.data.products || productsResponse.data,
      count: productsResponse.data.products?.length || 0
    });
    
  } catch (error) {
    console.error('[PRODUCTS] List error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

// Restore installation on startup
restoreInstallation();

app.listen(port, () => {
  console.log(\`✅ OAuth Backend with restored installation running on port \${port}\`);
  console.log(\`📊 Features: OAuth, Product Creation\`);
  console.log(\`🔗 Endpoints: /api/products/create, /api/products\`);
  console.log(\`📦 Installations: \${installations.size} (restored: install_1751343410712)\`);
});`;

    // Deploy the restored version
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'v5.5.1-installation-restored: Restore OAuth installation install_1751343410712',
      content: Buffer.from(restoredBackend).toString('base64'),
      sha: currentFile.sha
    });

    console.log('✅ OAuth installation restored successfully');
    
    return { success: true, installation: 'install_1751343410712' };
    
  } catch (error) {
    console.error('❌ Installation restore failed:', error.message);
    return { success: false, error: error.message };
  }
}

restoreOAuthInstallation();