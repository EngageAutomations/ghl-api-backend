import { Octokit } from '@octokit/rest';

async function updateRailwayBridgeIntegration() {
  console.log('=== Updating Railway Backend to Use Bridge System ===\n');
  
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'EngageAutomations';
  const REPO_NAME = 'oauth-backend';
  
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }
  
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  // Create Railway backend that uses the bridge system
  const bridgeIntegratedBackend = `// Railway Backend with Bridge Integration - Uses Replit Bridge for OAuth
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for OAuth installations with proper token handling
const installations = new Map();

// Bridge system configuration
const BRIDGE_BASE_URL = 'https://dir.engageautomations.com'; // This would be the Replit URL in production

// Get OAuth credentials from Replit bridge
async function getBridgeCredentials() {
  try {
    console.log('[BRIDGE] Requesting OAuth credentials from Replit bridge...');
    const response = await axios.get(\`\${BRIDGE_BASE_URL}/api/bridge/oauth-credentials\`);
    
    if (response.data.success) {
      console.log('[BRIDGE] OAuth credentials received from Replit');
      return response.data.credentials;
    }
    
    throw new Error('Bridge credentials not available');
  } catch (error) {
    console.error('[BRIDGE] Failed to get credentials:', error.response?.data || error.message);
    throw new Error('OAuth credentials not available from bridge');
  }
}

// Token refresh helpers
const PADDING_MS = 5 * 60 * 1000; // 5 minutes
const refreshers = new Map();

async function refreshAccessToken(installationId) {
  const install = installations.get(installationId);
  if (!install || !install.refreshToken) {
    console.log(\`[REFRESH] No refresh token for \${installationId}\`);
    return;
  }

  try {
    const credentials = await getBridgeCredentials();
    
    const body = new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: 'refresh_token',
      refresh_token: install.refreshToken
    });

    const response = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      body,
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000 
      }
    );

    const data = response.data;
    
    // Update installation with new tokens
    install.accessToken = data.access_token;
    install.refreshToken = data.refresh_token || install.refreshToken;
    install.expiresIn = data.expires_in;
    install.expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
    install.tokenStatus = 'valid';

    scheduleRefresh(installationId);
    console.log(\`[REFRESH] \${installationId} → \${(data.expires_in / 3600).toFixed(1)} hours\`);
    
    return true;
  } catch (error) {
    console.error(\`[REFRESH-FAIL] \${installationId}:\`, error.response?.data || error.message);
    install.tokenStatus = 'invalid';
    return false;
  }
}

function scheduleRefresh(installationId) {
  clearTimeout(refreshers.get(installationId));
  const install = installations.get(installationId);
  if (!install || !install.expiresAt) return;
  
  const expiryTime = new Date(install.expiresAt).getTime();
  const delay = Math.max(expiryTime - Date.now() - PADDING_MS, 0);
  
  const timeout = setTimeout(() => refreshAccessToken(installationId), delay);
  refreshers.set(installationId, timeout);
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'operational',
    version: '5.4.3-bridge-integrated',
    message: 'Railway Backend with Replit Bridge Integration',
    bridge_source: 'replit',
    endpoints: [
      'GET /installations',
      'GET /api/oauth/callback',
      'POST /api/media/upload',
      'POST /api/products/create',
      'POST /api/products/:productId/prices'
    ]
  });
});

// OAuth callback endpoint - Uses bridge system for token exchange
app.get('/api/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  console.log('[OAUTH] Callback received:', { code: !!code, state });

  if (!code) {
    console.error('[OAUTH] No authorization code received');
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Get credentials from bridge
    const credentials = await getBridgeCredentials();
    
    // Exchange code for tokens
    const tokenBody = new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: credentials.redirect_uri
    });

    const tokenResponse = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      tokenBody,
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000 
      }
    );

    const tokens = tokenResponse.data;
    console.log('[OAUTH] Tokens received via bridge:', { 
      access_token: !!tokens.access_token,
      refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expires_in 
    });

    // Get user info with the access token
    const userResponse = await axios.get('https://services.leadconnectorhq.com/oauth/userinfo', {
      headers: { 'Authorization': \`Bearer \${tokens.access_token}\` }
    });

    const userInfo = userResponse.data;
    console.log('[OAUTH] User info:', { 
      userId: userInfo.id,
      locationId: userInfo.companyId 
    });

    // Create installation record with proper token storage
    const installationId = \`install_\${Date.now()}\`;
    const installation = {
      id: installationId,
      locationId: userInfo.companyId,
      ghlUserId: userInfo.id,
      userEmail: userInfo.email,
      companyName: userInfo.companyName,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      tokenStatus: 'valid',
      scopes: tokens.scope || 'products/prices.write products/prices.readonly products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write products/collection.write users.readonly products.write products.readonly',
      createdAt: new Date().toISOString(),
      bridgeSource: 'replit'
    };

    installations.set(installationId, installation);
    scheduleRefresh(installationId);

    console.log('[OAUTH] Installation created via bridge:', installationId);

    // Redirect to success page
    res.redirect(\`https://dir.engageautomations.com/oauth-success?installation_id=\${installationId}\`);

  } catch (error) {
    console.error('[OAUTH] Bridge callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'OAuth callback failed',
      details: error.response?.data || error.message,
      bridge_source: 'replit'
    });
  }
});

// Installations endpoint with bridge info
app.get('/installations', (req, res) => {
  const allInstallations = Array.from(installations.values());
  const authenticated = allInstallations.filter(i => i.tokenStatus === 'valid' && i.accessToken);
  
  res.json({
    total: allInstallations.length,
    authenticated: authenticated.length,
    bridge_source: 'replit',
    installations: allInstallations.map(install => ({
      id: install.id,
      locationId: install.locationId,
      tokenStatus: install.tokenStatus,
      createdAt: install.createdAt,
      expiresAt: install.expiresAt,
      scopes: install.scopes,
      hasAccessToken: !!install.accessToken,
      hasRefreshToken: !!install.refreshToken,
      bridgeSource: install.bridgeSource
    }))
  });
});

// Media upload endpoint
app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    const { installation_id } = req.body;
    const install = installations.get(installation_id);
    
    if (!install || !install.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid installation or missing access token' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No file uploaded' 
      });
    }

    // Ensure fresh token
    if (new Date(install.expiresAt).getTime() - Date.now() < PADDING_MS) {
      await refreshAccessToken(installation_id);
    }

    // Upload to GoHighLevel
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), req.file.originalname);

    const uploadResponse = await axios.post(
      \`https://services.leadconnectorhq.com/locations/\${install.locationId}/medias/upload-file\`,
      formData,
      {
        headers: {
          'Authorization': \`Bearer \${install.accessToken}\`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        timeout: 60000
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      mediaUrl: uploadResponse.data.url,
      data: uploadResponse.data
    });

  } catch (error) {
    console.error('[MEDIA] Upload error:', error.response?.data || error.message);
    
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

// Product creation endpoint
app.post('/api/products/create', async (req, res) => {
  try {
    const { installation_id, name, description, productType, medias } = req.body;
    const install = installations.get(installation_id);
    
    if (!install || !install.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid installation or missing access token' 
      });
    }

    // Ensure fresh token
    if (new Date(install.expiresAt).getTime() - Date.now() < PADDING_MS) {
      await refreshAccessToken(installation_id);
    }

    const productData = {
      name,
      description,
      productType: productType || 'SERVICE',
      locationId: install.locationId
    };

    if (medias && medias.length > 0) {
      productData.medias = medias;
    }

    const productResponse = await axios.post(
      'https://services.leadconnectorhq.com/products/',
      productData,
      {
        headers: {
          'Authorization': \`Bearer \${install.accessToken}\`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      product: productResponse.data
    });

  } catch (error) {
    console.error('[PRODUCT] Creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

// Product pricing endpoint
app.post('/api/products/:productId/prices', async (req, res) => {
  try {
    const { productId } = req.params;
    const { installation_id, name, type, amount, currency } = req.body;
    const install = installations.get(installation_id);
    
    if (!install || !install.accessToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid installation or missing access token' 
      });
    }

    // Ensure fresh token
    if (new Date(install.expiresAt).getTime() - Date.now() < PADDING_MS) {
      await refreshAccessToken(installation_id);
    }

    const pricingData = {
      name,
      type: type || 'one_time',
      amount,
      currency: currency || 'USD'
    };

    const priceResponse = await axios.post(
      \`https://services.leadconnectorhq.com/products/\${productId}/prices\`,
      pricingData,
      {
        headers: {
          'Authorization': \`Bearer \${install.accessToken}\`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      price: priceResponse.data
    });

  } catch (error) {
    console.error('[PRICING] Error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message
    });
  }
});

// Background token refresh system
cron.schedule('0 * * * *', () => {
  console.log('[CRON] Running hourly token refresh check');
  
  for (const [installationId, install] of installations.entries()) {
    if (install.refreshToken && install.expiresAt) {
      const expiryTime = new Date(install.expiresAt).getTime();
      const timeToExpiry = expiryTime - Date.now();
      
      // Refresh if expiring within 2 hours
      if (timeToExpiry < 2 * 60 * 60 * 1000) {
        console.log(\`[CRON] Refreshing token for \${installationId}\`);
        refreshAccessToken(installationId);
      }
    }
  }
});

// Serve static files
app.use(express.static('.'));

// Start server
app.listen(PORT, () => {
  console.log(\`[SERVER] Railway Backend with Bridge Integration v5.4.3 running on port \${PORT}\`);
  console.log(\`[BRIDGE] Using Replit bridge at: \${BRIDGE_BASE_URL}\`);
  console.log('[BRIDGE] OAuth credentials will be requested from bridge system');
});

module.exports = app;`;

  try {
    // Get current backend file
    const currentFile = await octokit.rest.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'index.js'
    });
    
    // Update with bridge-integrated backend
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'index.js',
      message: 'Integrate Replit bridge system - OAuth credentials from bridge endpoints',
      content: Buffer.from(bridgeIntegratedBackend).toString('base64'),
      sha: currentFile.data.sha
    });
    
    console.log('✓ Railway backend updated with bridge integration');
    
    // Wait for Railway deployment
    console.log('\nWaiting for Railway to deploy bridge integration...');
    await new Promise(resolve => setTimeout(resolve, 45000));
    
    // Test the bridge integration
    console.log('Testing bridge integration...');
    
    const testResponse = await fetch('https://dir.engageautomations.com/');
    const testData = await testResponse.json();
    
    console.log(`Backend version: ${testData.version}`);
    console.log(`Bridge source: ${testData.bridge_source}`);
    
    if (testData.version === '5.4.3-bridge-integrated' && testData.bridge_source === 'replit') {
      console.log('✅ Bridge integration successful!');
      
      // Test if Railway can now get credentials from Replit bridge
      const credentialsTest = await fetch('/api/bridge/oauth-credentials');
      if (credentialsTest.ok) {
        const credentialsData = await credentialsTest.json();
        if (credentialsData.success) {
          console.log('✅ Railway can access Replit bridge credentials');
          
          return {
            success: true,
            bridgeIntegrated: true,
            readyForOAuth: true,
            version: testData.version
          };
        }
      }
    }
    
    console.log('⚠️ Bridge integration deployed but needs verification');
    return {
      bridgeDeployed: true,
      needsVerification: true
    };
    
  } catch (error) {
    console.error('Bridge integration failed:', error.message);
    return { success: false, error: error.message };
  }
}

updateRailwayBridgeIntegration();