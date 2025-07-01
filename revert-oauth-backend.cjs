/**
 * Revert OAuth Backend to Stable Version
 * Remove image upload changes and restore to frontend-redirect only
 */

async function revertOAuthBackend() {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    console.log('=== Reverting OAuth Backend ===');
    
    // Restore original package.json without image upload dependencies
    const packageJson = {
      "name": "ghl-oauth-backend",
      "version": "5.8.0",
      "description": "GoHighLevel OAuth Backend with Frontend Redirect",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5", 
        "axios": "^1.6.0"
      },
      "engines": {
        "node": ">=16"
      }
    };

    // Update package.json back to original
    const { data: currentPackage } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'package.json'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'package.json',
      message: 'Revert: Remove image upload dependencies, restore OAuth-only backend',
      content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
      sha: currentPackage.sha
    });

    // Restore OAuth backend to frontend-redirect version without image upload
    const backendCode = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const installations = new Map();

// OAUTH CALLBACK - Process and redirect to frontend
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  console.log('=== OAUTH CALLBACK ===');
  const { code, error, state } = req.query;
  
  if (error) {
    console.error('OAuth error received:', error);
    const errorUrl = \`https://listings.engageautomations.com/oauth-error?error=\${encodeURIComponent(error)}\`;
    return res.redirect(302, errorUrl);
  }
  
  if (!code) {
    console.error('No authorization code provided');
    return res.redirect(302, 'https://listings.engageautomations.com/oauth-error?error=missing_code');
  }

  try {
    console.log('Processing OAuth code:', code.substring(0, 8) + '...');
    
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
    });

    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    const installationId = \`install_\${Date.now()}\`;
    const installationData = {
      id: installationId,
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in,
      expiresAt: Date.now() + (tokenResponse.data.expires_in * 1000),
      locationId: tokenResponse.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenResponse.data.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    };
    
    installations.set(installationId, installationData);
    console.log(\`[INSTALL] ✅ \${installationId} created successfully\`);
    
    const frontendUrl = \`https://listings.engageautomations.com/?installation_id=\${installationId}&welcome=true\`;
    res.redirect(302, frontendUrl);

  } catch (error) {
    console.error('OAuth processing error:', error.response?.data || error.message);
    const errorParams = new URLSearchParams({
      error: 'oauth_processing_failed',
      details: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
    res.redirect(302, \`https://listings.engageautomations.com/oauth-error?\${errorParams}\`);
  }
});

// TOKEN MANAGEMENT FUNCTIONS
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
    inst.expiresAt = Date.now() + (data.expires_in * 1000);
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
  if (timeUntilExpiry < 5 * 60 * 1000) {
    await refreshAccessToken(id);
  }
  
  if (inst.tokenStatus !== 'valid') throw new Error('Token invalid');
  return inst;
}

// BASIC PRODUCT CREATION (for OAuth backend compatibility)
app.post('/api/products/create', async (req, res) => {
  try {
    const { name, description, productType, sku, currency, installation_id } = req.body;
    
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
    
    const response = await axios.post('https://services.leadconnectorhq.com/products/', productData, {
      headers: {
        'Authorization': \`Bearer \${installation.accessToken}\`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    res.json({
      success: true,
      product: response.data.product || response.data,
      message: 'Product created via OAuth backend (use API backend for advanced features)'
    });
    
  } catch (error) {
    console.error('[PRODUCT] Creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create product'
    });
  }
});

// HEALTH CHECK
app.get('/', (req, res) => {
  const html = \`
<!DOCTYPE html>
<html>
<head>
    <title>GoHighLevel OAuth Backend</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .status { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .feature { display: inline-block; background: #e7f3ff; padding: 8px 16px; margin: 5px; border-radius: 20px; }
        .endpoint { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; }
        .note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 GoHighLevel OAuth Backend</h1>
        <p>Version 5.8.0-frontend-redirect | Status: Operational</p>
    </div>
    
    <div class="note">
        <h3>📋 OAuth Backend Purpose</h3>
        <p>This backend handles OAuth authentication only. For API features like image upload, media management, and advanced product creation, use the separate API backend.</p>
    </div>
    
    <div class="status">
        <h3>System Status</h3>
        <p><strong>Installations:</strong> \${installations.size}</p>
        <p><strong>Authenticated:</strong> \${Array.from(installations.values()).filter(inst => inst.tokenStatus === 'valid').length}</p>
        <p><strong>Frontend:</strong> <a href="https://listings.engageautomations.com">listings.engageautomations.com</a></p>
        <p><strong>Last Updated:</strong> \${new Date().toISOString()}</p>
    </div>
    
    <h3>🚀 Features</h3>
    <div class="feature">OAuth Processing</div>
    <div class="feature">Frontend Redirect</div>
    <div class="feature">Token Management</div>
    
    <h3>📡 OAuth Endpoints</h3>
    <div class="endpoint"><strong>GET/POST</strong> /oauth/callback - OAuth processing with frontend redirect</div>
    <div class="endpoint"><strong>POST</strong> /api/products/create - Basic product creation (for compatibility)</div>
    <div class="endpoint"><strong>GET</strong> /installations - View OAuth installations</div>
    
    <p><strong>Note:</strong> For advanced API features, use the dedicated API backend server.</p>
</body>
</html>
\`;
  
  res.send(html);
});

// INSTALLATIONS ENDPOINT
app.get('/installations', (req, res) => {
  const installationsArray = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: inst.expiresAt,
    timeUntilExpiry: Math.max(0, Math.round((inst.expiresAt - Date.now()) / 1000))
  }));
  
  res.json({
    installations: installationsArray,
    count: installationsArray.length,
    frontend: 'https://listings.engageautomations.com',
    note: 'OAuth backend - use separate API backend for advanced features'
  });
});

app.listen(port, () => {
  console.log(\`✅ OAuth Backend v5.8.0-frontend-redirect running on port \${port}\`);
  console.log(\`🔗 OAuth processing with frontend redirect to listings.engageautomations.com\`);
  console.log(\`📋 OAuth-only backend - API features handled by separate API server\`);
});`;

    // Deploy the reverted OAuth backend
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'Revert: Restore OAuth-only backend, remove image upload features',
      content: Buffer.from(backendCode).toString('base64'),
      sha: currentFile.sha
    });

    console.log('✅ OAuth backend reverted to frontend-redirect version');
    console.log('🔄 Removed image upload features - restored OAuth-only functionality');
    console.log('📋 OAuth backend separation maintained');
    
    return { success: true, reverted: true };
    
  } catch (error) {
    console.error('❌ Revert failed:', error.message);
    return { success: false, error: error.message };
  }
}

revertOAuthBackend();