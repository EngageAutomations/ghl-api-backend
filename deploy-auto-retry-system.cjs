/**
 * Deploy Production Auto-Retry System
 * Handles token expiry transparently with automatic refresh
 */

async function deployAutoRetrySystem() {
  try {
    const { Octokit } = await import('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    console.log('=== Deploying Auto-Retry System ===');
    
    const autoRetryBackend = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const installations = new Map();

// ENHANCED TOKEN MANAGEMENT
async function refreshAccessToken(id) {
  const inst = installations.get(id);
  if (!inst || !inst.refreshToken) {
    console.log(\`[REFRESH] No refresh token for \${id}\`);
    return false;
  }

  try {
    console.log(\`[REFRESH] Refreshing token for \${id}...\`);
    
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

    // Update token data
    inst.accessToken = data.access_token;
    inst.refreshToken = data.refresh_token || inst.refreshToken;
    inst.expiresIn = data.expires_in;
    inst.expiresAt = Date.now() + (data.expires_in * 1000);
    inst.tokenStatus = 'valid';
    inst.lastRefresh = new Date().toISOString();
    
    console.log(\`[REFRESH] ✅ Token refreshed for \${id}, expires: \${new Date(inst.expiresAt).toISOString()}\`);
    return true;
    
  } catch (error) {
    console.error(\`[REFRESH] ❌ Failed for \${id}:\`, error.response?.data || error.message);
    inst.tokenStatus = 'refresh_failed';
    inst.lastRefreshError = error.response?.data || error.message;
    return false;
  }
}

async function ensureFreshToken(id) {
  const inst = installations.get(id);
  if (!inst) {
    throw new Error(\`Installation \${id} not found\`);
  }
  
  // Check if token is close to expiry (80% of lifetime)
  const timeUntilExpiry = inst.expiresAt - Date.now();
  const tokenLifetime = inst.expiresIn * 1000;
  const refreshThreshold = tokenLifetime * 0.2; // Refresh at 80% lifetime
  
  console.log(\`[TOKEN] \${id}: \${Math.round(timeUntilExpiry/1000)}s until expiry\`);
  
  if (timeUntilExpiry < refreshThreshold) {
    console.log(\`[TOKEN] Token near expiry, refreshing...\`);
    const refreshed = await refreshAccessToken(id);
    if (!refreshed) {
      throw new Error(\`Token refresh failed for \${id}\`);
    }
  }
  
  if (inst.tokenStatus !== 'valid') {
    throw new Error(\`Token invalid for \${id}: \${inst.tokenStatus}\`);
  }
  
  return inst;
}

// AUTO-RETRY API WRAPPER
async function makeGHLAPICall(installation_id, requestConfig, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(\`[API] Attempt \${attempt}/\${maxRetries} for \${requestConfig.url}\`);
      
      // Ensure fresh token before each attempt
      const installation = await ensureFreshToken(installation_id);
      
      // Add authorization header
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
      console.log(\`[API] ✅ Success on attempt \${attempt}\`);
      return response;
      
    } catch (error) {
      lastError = error;
      console.log(\`[API] ❌ Attempt \${attempt} failed:\`, error.response?.data?.message || error.message);
      
      // If 401, try token refresh
      if (error.response?.status === 401 && attempt < maxRetries) {
        console.log(\`[API] 401 error - attempting token refresh...\`);
        try {
          await refreshAccessToken(installation_id);
          console.log(\`[API] Token refreshed, retrying...\`);
          continue;
        } catch (refreshError) {
          console.log(\`[API] Token refresh failed:\`, refreshError.message);
        }
      }
      
      // If not retryable or max attempts reached, break
      if (attempt === maxRetries || ![401, 429, 503].includes(error.response?.status)) {
        break;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw lastError;
}

// BASIC ROUTES
app.get('/', (req, res) => {
  res.json({
    service: "GoHighLevel OAuth Backend",
    version: "5.6.0-auto-retry",
    status: "operational",
    installs: installations.size,
    authenticated: Array.from(installations.values()).filter(inst => inst.tokenStatus === 'valid').length,
    features: ["oauth", "products", "auto-retry", "smart-refresh"],
    endpoints: ["/api/products/create", "/api/products", "/installations"],
    autoRetry: {
      maxRetries: 3,
      refreshThreshold: "80% token lifetime",
      retryableErrors: [401, 429, 503]
    }
  });
});

app.get('/installations', (req, res) => {
  const installationsArray = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: inst.expiresAt,
    timeUntilExpiry: Math.max(0, Math.round((inst.expiresAt - Date.now()) / 1000)),
    lastRefresh: inst.lastRefresh,
    lastRefreshError: inst.lastRefreshError
  }));
  
  res.json({
    installations: installationsArray,
    count: installationsArray.length
  });
});

// OAUTH CALLBACK
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
      expiresAt: Date.now() + (tokenResponse.data.expires_in * 1000),
      locationId: tokenResponse.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: tokenResponse.data.scope || '',
      tokenStatus: 'valid',
      createdAt: new Date().toISOString(),
      lastRefresh: null
    });

    console.log(\`[INSTALL] ✅ \${id} created with auto-retry protection\`);
    
    res.json({
      success: true,
      installationId: id,
      message: 'OAuth installation successful with auto-retry protection',
      features: ['auto-retry', 'smart-refresh', 'token-monitoring']
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

// ENHANCED PRODUCT CREATION WITH AUTO-RETRY
app.post('/api/products/create', async (req, res) => {
  try {
    const { name, description, productType, sku, currency, installation_id } = req.body;
    
    console.log(\`[PRODUCT] Creating: \${name} (auto-retry enabled)\`);
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'product name required' });
    }
    
    const productData = {
      name,
      description: description || '',
      productType: productType || 'DIGITAL',
      locationId: installations.get(installation_id)?.locationId || 'WAvk87RmW9rBSDJHeOpH',
      ...(sku && { sku }),
      ...(currency && { currency })
    };
    
    console.log(\`[PRODUCT] Sending to GHL with auto-retry:\`, productData);
    
    // Use auto-retry wrapper
    const productResponse = await makeGHLAPICall(installation_id, {
      method: 'POST',
      url: 'https://services.leadconnectorhq.com/products/',
      data: productData
    });
    
    console.log(\`[PRODUCT] ✅ Created successfully: \${productResponse.data.product?.id || 'unknown'}\`);
    
    res.json({
      success: true,
      product: productResponse.data.product || productResponse.data,
      message: 'Product created successfully with auto-retry protection'
    });
    
  } catch (error) {
    console.error('[PRODUCT] ❌ Final error after all retries:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      message: 'Failed to create product after all retry attempts',
      retryAttempts: 'exhausted'
    });
  }
});

// ENHANCED PRODUCT LISTING WITH AUTO-RETRY
app.get('/api/products', async (req, res) => {
  try {
    const { installation_id } = req.query;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    console.log(\`[PRODUCTS] Listing with auto-retry for \${installation_id}\`);
    
    const installation = installations.get(installation_id);
    if (!installation) {
      return res.status(400).json({ success: false, error: 'Installation not found' });
    }
    
    // Use auto-retry wrapper
    const productsResponse = await makeGHLAPICall(installation_id, {
      method: 'GET',
      url: 'https://services.leadconnectorhq.com/products/',
      params: {
        locationId: installation.locationId
      }
    });
    
    res.json({
      success: true,
      products: productsResponse.data.products || productsResponse.data,
      count: productsResponse.data.products?.length || 0
    });
    
  } catch (error) {
    console.error('[PRODUCTS] ❌ List error after retries:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

app.listen(port, () => {
  console.log(\`✅ Auto-Retry OAuth Backend running on port \${port}\`);
  console.log(\`🔄 Features: Smart token refresh, automatic retries, 401 handling\`);
  console.log(\`📊 Retry Policy: 3 attempts, 80% token refresh threshold\`);
});`;

    // Deploy the auto-retry system
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js'
    });

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: 'EngageAutomations',
      repo: 'oauth-backend',
      path: 'index.js',
      message: 'v5.6.0-auto-retry: Deploy production auto-retry system with smart token refresh',
      content: Buffer.from(autoRetryBackend).toString('base64'),
      sha: currentFile.sha
    });

    console.log('✅ Auto-retry system deployed');
    console.log('🔄 Features: 3 retry attempts, smart token refresh, 401 handling');
    
    return { success: true, version: '5.6.0-auto-retry' };
    
  } catch (error) {
    console.error('❌ Auto-retry deployment failed:', error.message);
    return { success: false, error: error.message };
  }
}

deployAutoRetrySystem();