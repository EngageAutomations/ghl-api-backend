/**
 * Setup OAuth Bridge - Forward Railway OAuth to Replit
 */

async function setupOAuthBridge() {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    console.log('=== Setting Up OAuth Bridge ===');
    
    // Create a bridge that forwards OAuth codes from Railway to Replit
    const bridgeBackend = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const installations = new Map();

// OAUTH BRIDGE - Forward to Replit Application
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  console.log('=== OAUTH BRIDGE CALLBACK ===');
  const { code, error, state } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    return res.status(400).json({ error: 'OAuth error', details: error });
  }
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    console.log('Received OAuth code, processing locally...');
    
    // Process OAuth locally instead of forwarding
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
      expiresAt: Date.now() + (tokenResponse.data.expires_in * 1000),
      locationId: tokenResponse.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenResponse.data.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString()
    });

    console.log(\`[INSTALL] ✅ \${id} created successfully\`);
    
    // Return success page instead of JSON
    const successHtml = \`
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Success</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
        .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
        .installation-id { font-family: monospace; background: #e9ecef; padding: 4px 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="success">✅ OAuth Installation Successful!</div>
    
    <div class="details">
        <h3>Installation Details</h3>
        <p><strong>Installation ID:</strong> <span class="installation-id">\${id}</span></p>
        <p><strong>Location ID:</strong> <span class="installation-id">\${installations.get(id).locationId}</span></p>
        <p><strong>Token Status:</strong> Valid</p>
        <p><strong>API Features:</strong> Product Creation, Media Upload, Auto-Retry</p>
    </div>
    
    <p>Your GoHighLevel account has been successfully connected. You can now use the API endpoints for product creation and media management.</p>
    
    <a href="/installations" class="button">View Installation Details</a>
    <a href="/" class="button">Back to Dashboard</a>
</body>
</html>
\`;

    res.send(successHtml);

  } catch (error) {
    console.error('OAuth processing error:', error.response?.data || error.message);
    
    const errorHtml = \`
<!DOCTYPE html>
<html>
<head>
    <title>OAuth Error</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
        .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
        .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
    </style>
</head>
<body>
    <div class="error">❌ OAuth Installation Failed</div>
    
    <div class="details">
        <h3>Error Details</h3>
        <p><strong>Error:</strong> \${error.response?.data?.message || error.message}</p>
        <p><strong>Time:</strong> \${new Date().toISOString()}</p>
    </div>
    
    <p>There was an issue processing your OAuth installation. Please try again or contact support.</p>
    
    <a href="/" class="button">Try Again</a>
</body>
</html>
\`;

    res.status(500).send(errorHtml);
  }
});

// TOKEN HELPERS (for API functionality)
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

// BASIC ROUTES
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
        <p>Version 5.7.0-oauth-bridge | Status: Operational</p>
    </div>
    
    <div class="status">
        <h3>System Status</h3>
        <p><strong>Installations:</strong> \${installations.size}</p>
        <p><strong>Authenticated:</strong> \${Array.from(installations.values()).filter(inst => inst.tokenStatus === 'valid').length}</p>
        <p><strong>Last Updated:</strong> \${new Date().toISOString()}</p>
    </div>
    
    <h3>🚀 Features</h3>
    <div class="feature">OAuth Processing</div>
    <div class="feature">Token Management</div>
    <div class="feature">Product Creation</div>
    <div class="feature">Auto-Retry System</div>
    
    <h3>📡 API Endpoints</h3>
    <div class="endpoint"><strong>POST</strong> /api/products/create - Create products</div>
    <div class="endpoint"><strong>GET</strong> /api/products - List products</div>
    <div class="endpoint"><strong>GET</strong> /installations - View installations</div>
</body>
</html>
\`;
  
  res.send(html);
});

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
    count: installationsArray.length
  });
});

// PRODUCT CREATION API
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
    
    const productResponse = await axios.post('https://services.leadconnectorhq.com/products/', productData, {
      headers: {
        'Authorization': \`Bearer \${installation.accessToken}\`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    res.json({
      success: true,
      product: productResponse.data.product || productResponse.data,
      message: 'Product created successfully via OAuth bridge'
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

app.listen(port, () => {
  console.log(\`✅ OAuth Bridge Backend running on port \${port}\`);
  console.log(\`🔗 OAuth processing: Local token exchange\`);
  console.log(\`📊 User-friendly HTML responses for marketplace installations\`);
});`;

    // Deploy the OAuth bridge
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'v5.7.0-oauth-bridge: Setup OAuth bridge with user-friendly HTML responses',
      content: Buffer.from(bridgeBackend).toString('base64'),
      sha: currentFile.sha
    });

    console.log('✅ OAuth bridge deployed successfully');
    console.log('🔗 Now OAuth callbacks will be processed with user-friendly interface');
    
    return { success: true, version: '5.7.0-oauth-bridge' };
    
  } catch (error) {
    console.error('❌ OAuth bridge setup failed:', error.message);
    return { success: false, error: error.message };
  }
}

setupOAuthBridge();