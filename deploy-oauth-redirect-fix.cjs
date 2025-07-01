/**
 * Deploy OAuth Redirect Fix - Force Fresh Deployment
 * Ensures Railway backend redirects users to frontend after OAuth
 */

async function deployOAuthRedirectFix() {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    console.log('=== Deploying OAuth Redirect Fix ===');
    
    // Create package.json to ensure proper deployment
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

    // Deploy package.json first
    try {
      const { data: currentPackage } = await octokit.rest.repos.getContent({
        owner: 'EngageAutomations',
        repo: 'oauth-backend',
        path: 'package.json'
      });

      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'EngageAutomations',
        repo: 'oauth-backend',
        path: 'package.json',
        message: 'Update package.json for v5.8.0-frontend-redirect',
        content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
        sha: currentPackage.sha
      });
    } catch (error) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: 'EngageAutomations',
        repo: 'oauth-backend',
        path: 'package.json',
        message: 'Create package.json for v5.8.0-frontend-redirect',
        content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64')
      });
    }

    console.log('✅ Package.json updated');

    // Deploy the OAuth backend with frontend redirect
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
  console.log('Query params:', req.query);
  console.log('Headers:', req.headers);
  
  const { code, error, state } = req.query;
  
  if (error) {
    console.error('OAuth error received:', error);
    const errorUrl = \`https://listings.engageautomations.com/oauth-error?error=\${encodeURIComponent(error)}\`;
    console.log('Redirecting to error page:', errorUrl);
    return res.redirect(302, errorUrl);
  }
  
  if (!code) {
    console.error('No authorization code provided');
    const errorUrl = 'https://listings.engageautomations.com/oauth-error?error=missing_code';
    console.log('Redirecting to error page:', errorUrl);
    return res.redirect(302, errorUrl);
  }

  try {
    console.log('Processing OAuth code:', code.substring(0, 8) + '...');
    
    // Check for required environment variables
    if (!process.env.GHL_CLIENT_ID || !process.env.GHL_CLIENT_SECRET) {
      throw new Error('Missing GHL_CLIENT_ID or GHL_CLIENT_SECRET environment variables');
    }
    
    // Exchange authorization code for tokens
    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
    });

    console.log('[OAUTH] Exchanging authorization code for tokens...');
    console.log('[OAUTH] Client ID:', process.env.GHL_CLIENT_ID);
    console.log('[OAUTH] Redirect URI:', process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback');
    
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    console.log('[OAUTH] Token exchange successful');
    console.log('[OAUTH] Response keys:', Object.keys(tokenResponse.data));

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
    console.log(\`[INSTALL] Location ID: \${installationData.locationId}\`);
    console.log(\`[INSTALL] Token expires in: \${installationData.expiresIn} seconds\`);
    
    // Redirect to frontend with installation details
    const frontendUrl = \`https://listings.engageautomations.com/?installation_id=\${installationId}&welcome=true\`;
    console.log(\`[REDIRECT] Sending user to frontend: \${frontendUrl}\`);
    
    res.redirect(302, frontendUrl);

  } catch (error) {
    console.error('OAuth processing error:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    // Redirect to frontend error page with details
    const errorParams = new URLSearchParams({
      error: 'oauth_processing_failed',
      details: error.response?.data?.message || error.message,
      timestamp: new Date().toISOString()
    });
    
    const errorUrl = \`https://listings.engageautomations.com/oauth-error?\${errorParams}\`;
    console.log('Redirecting to error page:', errorUrl);
    res.redirect(302, errorUrl);
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

// AUTO-RETRY API WRAPPER
async function makeGHLAPICall(installationId, requestConfig, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const installation = await ensureFreshToken(installationId);
      
      const config = {
        ...requestConfig,
        headers: {
          'Authorization': \`Bearer \${installation.accessToken}\`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          ...requestConfig.headers
        },
        timeout: 15000
      };
      
      const response = await axios(config);
      console.log(\`[API] Success on attempt \${attempt}\`);
      return response;
      
    } catch (error) {
      console.log(\`[API] Attempt \${attempt} failed:\`, error.response?.status, error.response?.data?.message || error.message);
      
      if (error.response?.status === 401 && attempt < maxRetries) {
        console.log(\`[RETRY] Token expired, refreshing and retrying...\`);
        await refreshAccessToken(installationId);
        continue;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}

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
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 GoHighLevel OAuth Backend</h1>
        <p>Version 5.8.0-frontend-redirect | Status: Operational</p>
    </div>
    
    <div class="status">
        <h3>System Status</h3>
        <p><strong>Installations:</strong> \${installations.size}</p>
        <p><strong>Authenticated:</strong> \${Array.from(installations.values()).filter(inst => inst.tokenStatus === 'valid').length}</p>
        <p><strong>Frontend:</strong> <a href="https://listings.engageautomations.com">listings.engageautomations.com</a></p>
        <p><strong>Environment:</strong> \${process.env.GHL_CLIENT_ID ? 'Configured' : 'Missing Config'}</p>
        <p><strong>Last Updated:</strong> \${new Date().toISOString()}</p>
    </div>
    
    <h3>🚀 Features</h3>
    <div class="feature">OAuth Processing</div>
    <div class="feature">Frontend Redirect</div>
    <div class="feature">Auto-Retry System</div>
    <div class="feature">Token Management</div>
    
    <h3>📡 API Endpoints</h3>
    <div class="endpoint"><strong>GET/POST</strong> /oauth/callback - OAuth processing with frontend redirect</div>
    <div class="endpoint"><strong>POST</strong> /api/products/create - Create products with auto-retry</div>
    <div class="endpoint"><strong>GET</strong> /installations - View installations</div>
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
    environment: {
      hasClientId: !!process.env.GHL_CLIENT_ID,
      hasClientSecret: !!process.env.GHL_CLIENT_SECRET,
      redirectUri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback'
    }
  });
});

// PRODUCT CREATION WITH AUTO-RETRY
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
    
    const response = await makeGHLAPICall(installation_id, {
      method: 'POST',
      url: 'https://services.leadconnectorhq.com/products/',
      data: productData
    });
    
    res.json({
      success: true,
      product: response.data.product || response.data,
      message: 'Product created successfully with auto-retry protection'
    });
    
  } catch (error) {
    console.error('[PRODUCT] Creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create product after retries'
    });
  }
});

app.listen(port, () => {
  console.log(\`✅ OAuth Backend v5.8.0-frontend-redirect running on port \${port}\`);
  console.log(\`🔗 OAuth processing with frontend redirect to listings.engageautomations.com\`);
  console.log(\`🔄 Auto-retry system with 3 attempts and smart token refresh\`);
  console.log(\`⚙️  Environment check:\`);
  console.log(\`   - GHL_CLIENT_ID: \${process.env.GHL_CLIENT_ID ? 'Set' : 'MISSING'}\`);
  console.log(\`   - GHL_CLIENT_SECRET: \${process.env.GHL_CLIENT_SECRET ? 'Set' : 'MISSING'}\`);
  console.log(\`   - GHL_REDIRECT_URI: \${process.env.GHL_REDIRECT_URI || 'Default'}\`);
});`;

    // Deploy the main OAuth backend file
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'v5.8.0-frontend-redirect: Force deploy OAuth redirect fix with enhanced logging',
      content: Buffer.from(backendCode).toString('base64'),
      sha: currentFile.sha
    });

    console.log('✅ OAuth redirect fix force deployed');
    console.log('🔗 Enhanced logging and frontend redirect implemented');
    console.log('⏳ Waiting for Railway deployment...');
    
    return { success: true, version: '5.8.0-frontend-redirect' };
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

deployOAuthRedirectFix();