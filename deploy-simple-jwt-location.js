/**
 * Deploy Simple JWT Location Extraction
 * Use location ID directly from JWT token - no complex discovery
 */

import fs from 'fs';

async function deploySimpleJWTLocation() {
  console.log('🎯 DEPLOYING SIMPLE JWT LOCATION EXTRACTION');
  console.log('Using location ID directly from JWT token');
  console.log('='.repeat(50));
  
  // GitHub configuration
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'EngageAutomations';
  const REPO_NAME = 'oauth-backend';
  const FILE_PATH = 'index.js';
  
  try {
    // Get current file
    console.log('Getting current OAuth backend file...');
    const getResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!getResponse.ok) {
      throw new Error(`Failed to fetch file: ${getResponse.status}`);
    }
    
    const fileData = await getResponse.json();
    console.log('Current file SHA obtained');
    
    // Create simple OAuth backend with direct JWT location extraction
    const simpleOAuthBackend = `// OAuth Backend v8.1.0-simple-jwt - Direct JWT Location Extraction
// Uses location ID directly from JWT token - simple and reliable

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');

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

// OAuth credentials
const oauthCredentials = {
  client_id: '68474924a586bce22a6e64f7-mbpkmyu4',
  client_secret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
  redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
};

console.log('🚀 OAuth Backend v8.1.0-simple-jwt Starting');
console.log('✅ Simple JWT Location Extraction: Direct and reliable');
console.log('✅ No complex discovery - uses JWT location directly');

// Enhanced token refresh
async function enhancedRefreshAccessToken(id) {
  const inst = installations.get(id);
  
  if (!inst) {
    console.log(\`[REFRESH] Installation \${id} not found\`);
    return false;
  }

  if (!inst.refreshToken) {
    console.log(\`[REFRESH] No refresh token for \${id} - OAuth reinstall required\`);
    inst.tokenStatus = 'refresh_required';
    return false;
  }

  try {
    console.log(\`[REFRESH] Attempting token refresh for \${id}\`);
    
    const body = new URLSearchParams({
      client_id: oauthCredentials.client_id,
      client_secret: oauthCredentials.client_secret,
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
    inst.refreshToken = data.refresh_token || inst.refreshToken;
    inst.expiresIn = data.expires_in;
    inst.expiresAt = Date.now() + data.expires_in * 1000;
    inst.tokenStatus = 'valid';
    inst.lastRefresh = new Date().toISOString();
    
    console.log(\`[REFRESH] ✅ Token refreshed successfully for \${id}\`);
    return true;
    
  } catch (error) {
    console.error(\`[REFRESH] ❌ Failed to refresh token for \${id}:\`, error.response?.data || error.message);
    inst.tokenStatus = 'refresh_failed';
    return false;
  }
}

// Token exchange function
async function exchangeCode(code, redirectUri) {
  console.log('🔄 Exchanging authorization code for tokens');
  
  const body = new URLSearchParams();
  body.append('client_id', oauthCredentials.client_id);
  body.append('client_secret', oauthCredentials.client_secret);
  body.append('grant_type', 'authorization_code');
  body.append('code', code);
  body.append('redirect_uri', redirectUri);

  const response = await axios.post(
    'https://services.leadconnectorhq.com/oauth/token',
    body,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000
    }
  );

  console.log('✅ Token exchange successful');
  return response.data;
}

// JWT token decoder
function decodeJWTPayload(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Simple location extraction from JWT
function extractLocationFromJWT(token) {
  console.log('🎯 Extracting location ID from JWT token');
  
  const decoded = decodeJWTPayload(token);
  
  if (!decoded) {
    console.log('❌ Failed to decode JWT token');
    return { error: 'invalid_jwt' };
  }
  
  console.log('JWT payload fields:');
  console.log(\`  authClass: \${decoded.authClass}\`);
  console.log(\`  authClassId: \${decoded.authClassId}\`);
  console.log(\`  primaryAuthClassId: \${decoded.primaryAuthClassId}\`);
  
  let locationId = null;
  let locationContext = null;
  
  if (decoded.authClass === 'Location') {
    // App installed directly on a location
    locationId = decoded.authClassId;
    locationContext = 'location_install';
    console.log(\`✅ Location install detected - using authClassId: \${locationId}\`);
  } else if (decoded.authClass === 'Company') {
    // App installed on company - use primary location
    locationId = decoded.primaryAuthClassId;
    locationContext = 'company_install';
    console.log(\`✅ Company install detected - using primaryAuthClassId: \${locationId}\`);
  } else {
    // Fallback - try authClassId first, then primaryAuthClassId
    locationId = decoded.authClassId || decoded.primaryAuthClassId;
    locationContext = 'fallback_extraction';
    console.log(\`⚠️ Unknown authClass (\${decoded.authClass}) - using fallback: \${locationId}\`);
  }
  
  if (!locationId) {
    console.log('❌ No location ID found in JWT token');
    return { error: 'no_location_id' };
  }
  
  return {
    locationId: locationId,
    context: locationContext,
    authClass: decoded.authClass,
    decoded: decoded
  };
}

// Store installation with simple JWT location extraction
function storeInstall(tokenData) {
  const id = \`install_\${Date.now()}\`;
  
  console.log(\`📦 Storing installation \${id}\`);
  
  // Extract location from JWT
  const locationResult = extractLocationFromJWT(tokenData.access_token);
  
  let locationId, locationName, locationStatus;
  
  if (locationResult.error) {
    locationId = 'unknown';
    locationName = 'JWT extraction failed';
    locationStatus = locationResult.error;
    console.log(\`❌ Location extraction failed: \${locationResult.error}\`);
  } else {
    locationId = locationResult.locationId;
    locationName = locationResult.context;
    locationStatus = 'jwt_extracted';
    console.log(\`✅ Location extracted: \${locationId} (context: \${locationResult.context})\`);
  }
  
  const installation = {
    id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    locationId: locationId,
    locationName: locationName,
    locationStatus: locationStatus,
    locationContext: locationResult.context,
    authClass: locationResult.authClass,
    scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
    tokenStatus: 'valid',
    createdAt: new Date().toISOString()
  };
  
  installations.set(id, installation);
  
  console.log(\`✅ Installation stored with location: \${locationId}\`);
  
  return id;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OAuth Backend v8.1.0-simple-jwt',
    message: 'Simple JWT location extraction - direct and reliable',
    timestamp: new Date().toISOString(),
    approach: {
      description: 'Extract location ID directly from JWT token',
      method: 'Simple and straightforward - no complex discovery',
      supports: [
        'Location installs (authClassId)',
        'Company installs (primaryAuthClassId)',
        'Fallback extraction for edge cases'
      ]
    },
    features: [
      'SIMPLE JWT location extraction',
      'Direct location ID from token',
      'No complex discovery needed',
      'Correct OAuth credentials',
      'Fixed OAuth callback',
      'Enhanced bridge communication',
      'Token health monitoring'
    ]
  });
});

// OAuth callback with simple JWT location extraction
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  console.log('=== OAUTH CALLBACK RECEIVED ===');
  console.log('Query params:', req.query);
  
  const { code, error, state } = req.query;
  
  if (error) {
    console.error('OAuth error from GHL:', error);
    return res.status(400).json({ 
      success: false, 
      error: 'OAuth authorization error', 
      details: error 
    });
  }
  
  if (!code) {
    console.error('No authorization code received');
    return res.status(400).json({ 
      success: false, 
      error: 'Authorization code is required' 
    });
  }
  
  try {
    const redirectUri = req.path.startsWith('/api')
      ? 'https://dir.engageautomations.com/api/oauth/callback'
      : 'https://dir.engageautomations.com/oauth/callback';

    console.log('Exchanging code for tokens...');
    
    const tokenData = await exchangeCode(code, redirectUri);
    console.log('✅ Token exchange successful');
    
    console.log('🎯 Extracting location from JWT...');
    const installationId = storeInstall(tokenData);
    console.log(\`✅ Installation stored with ID: \${installationId}\`);
    
    // Redirect to frontend with installation ID
    const frontendUrl = \`https://listings.engageautomations.com/?installation_id=\${installationId}&welcome=true\`;
    console.log('Redirecting to:', frontendUrl);
    
    res.redirect(frontendUrl);
    
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: 'OAuth processing failed', 
      details: error.response?.data || error.message 
    });
  }
});

// Enhanced token access
app.get('/api/token-access/:id', async (req, res) => {
  const { id } = req.params;
  const inst = installations.get(id);
  
  if (!inst) {
    return res.status(404).json({ 
      success: false, 
      error: \`Installation \${id} not found\` 
    });
  }
  
  // Check if token needs refresh
  const now = Date.now();
  const timeUntilExpiry = inst.expiresAt - now;
  
  if (timeUntilExpiry < 600000) { // Less than 10 minutes
    await enhancedRefreshAccessToken(id);
  }
  
  res.json({
    access_token: inst.accessToken,
    installation_id: id,
    location_id: inst.locationId,
    location_name: inst.locationName,
    location_status: inst.locationStatus,
    location_context: inst.locationContext,
    auth_class: inst.authClass,
    status: inst.tokenStatus,
    expires_at: inst.expiresAt,
    token_status: inst.tokenStatus
  });
});

// Installation status endpoint
app.get('/api/installation-status/:id', (req, res) => {
  const { id } = req.params;
  const inst = installations.get(id);
  
  if (!inst) {
    return res.status(404).json({ 
      success: false, 
      error: \`Installation \${id} not found\` 
    });
  }
  
  res.json({
    success: true,
    installation: {
      id: inst.id,
      locationId: inst.locationId,
      locationName: inst.locationName,
      locationStatus: inst.locationStatus,
      locationContext: inst.locationContext,
      authClass: inst.authClass,
      tokenStatus: inst.tokenStatus,
      createdAt: inst.createdAt,
      expiresAt: inst.expiresAt
    }
  });
});

// Token health endpoint
app.get('/api/token-health/:id', (req, res) => {
  const { id } = req.params;
  const inst = installations.get(id);
  
  if (!inst) {
    return res.status(404).json({ 
      success: false, 
      error: \`Installation \${id} not found\` 
    });
  }
  
  const now = Date.now();
  const timeUntilExpiry = inst.expiresAt - now;
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  const needsRefresh = timeUntilExpiry < 3600000; // Less than 1 hour
  
  res.json({
    success: true,
    tokenHealth: {
      status: inst.tokenStatus,
      expiresAt: inst.expiresAt,
      timeUntilExpiry,
      hoursUntilExpiry,
      needsRefresh
    },
    location: {
      id: inst.locationId,
      name: inst.locationName,
      status: inst.locationStatus,
      context: inst.locationContext,
      authClass: inst.authClass
    }
  });
});

// Bridge endpoints for API backend communication
app.get('/api/bridge/oauth-credentials', (req, res) => {
  res.json({
    success: true,
    credentials: oauthCredentials
  });
});

app.post('/api/bridge/process-oauth', async (req, res) => {
  const { code, redirect_uri } = req.body;
  
  if (!code) {
    return res.status(400).json({ 
      success: false, 
      error: 'Authorization code required' 
    });
  }
  
  try {
    const tokenData = await exchangeCode(code, redirect_uri);
    const installationId = storeInstall(tokenData);
    
    res.json({
      success: true,
      installation_id: installationId,
      location_id: installations.get(installationId).locationId
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'OAuth processing failed',
      details: error.response?.data || error.message
    });
  }
});

app.get('/api/bridge/installation/:id', (req, res) => {
  const { id } = req.params;
  const inst = installations.get(id);
  
  if (!inst) {
    return res.status(404).json({ 
      success: false, 
      error: 'Installation not found' 
    });
  }
  
  res.json({
    success: true,
    installation: {
      id: inst.id,
      active: inst.tokenStatus === 'valid',
      location_id: inst.locationId,
      location_name: inst.locationName,
      expires_at: inst.expiresAt
    }
  });
});

// Legacy endpoints for compatibility
app.get('/installations', (req, res) => {
  const activeInstallations = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    locationName: inst.locationName,
    locationStatus: inst.locationStatus,
    locationContext: inst.locationContext,
    authClass: inst.authClass,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt
  }));
  
  res.json({
    installations: activeInstallations,
    count: activeInstallations.length
  });
});

app.get('/api/oauth/status', (req, res) => {
  const inst = installations.get(req.query.installation_id);
  if (!inst) return res.json({ authenticated: false });
  res.json({ 
    authenticated: true, 
    tokenStatus: inst.tokenStatus, 
    locationId: inst.locationId 
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    installations: installations.size
  });
});

// Start server
app.listen(port, () => {
  console.log(\`✅ OAuth Backend v8.1.0-simple-jwt running on port \${port}\`);
  console.log(\`✅ OAuth callback: https://dir.engageautomations.com/api/oauth/callback\`);
  console.log(\`✅ Simple JWT Location Extraction:\`);
  console.log(\`   → Direct location ID from JWT token\`);
  console.log(\`   → No complex discovery needed\`);
  console.log(\`   → Works with location and company installs\`);
  console.log(\`✅ Bridge endpoints active for API backend communication\`);
});
`;
    
    // Update the file on GitHub
    console.log('Deploying simple JWT location extraction...');
    const updateResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Deploy simple JWT location extraction v8.1.0-simple-jwt',
          content: Buffer.from(simpleOAuthBackend).toString('base64'),
          sha: fileData.sha,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub update failed: ${updateResponse.status} - ${JSON.stringify(errorData)}`);
    }
    
    const updateData = await updateResponse.json();
    console.log('Simple JWT location extraction deployed successfully');
    console.log(`Commit SHA: ${updateData.commit.sha}`);
    
    console.log('\n🎯 SIMPLE JWT LOCATION EXTRACTION DEPLOYED');
    console.log('='.repeat(50));
    console.log('Approach:');
    console.log('  ✅ Extract location ID directly from JWT token');
    console.log('  ✅ authClass = "Location" → use authClassId');
    console.log('  ✅ authClass = "Company" → use primaryAuthClassId');
    console.log('  ✅ Fallback extraction for edge cases');
    console.log('  ✅ No complex discovery or scanning needed');
    console.log('');
    console.log('Ready for fresh OAuth installation test');
    console.log('Railway auto-deployment in progress...');
    
    return true;
    
  } catch (error) {
    console.error('Failed to deploy simple JWT location extraction:', error.message);
    return false;
  }
}

// Run the deployment
deploySimpleJWTLocation()
  .then(success => {
    if (success) {
      console.log('\nSimple JWT location extraction deployment completed');
      console.log('Try a fresh OAuth installation in 2-3 minutes');
    } else {
      console.log('\nSimple JWT location extraction deployment failed');
    }
  })
  .catch(console.error);