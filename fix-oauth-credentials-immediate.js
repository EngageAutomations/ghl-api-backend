/**
 * Fix OAuth Credentials Immediately
 * Deploy correct GoHighLevel OAuth credentials
 */

import fs from 'fs';

async function fixOAuthCredentialsImmediate() {
  console.log('🔧 FIXING OAUTH CREDENTIALS IMMEDIATELY');
  console.log('Deploying correct GoHighLevel OAuth credentials');
  console.log('='.repeat(60));
  
  // Correct OAuth credentials from the client key file
  const correctCredentials = {
    client_id: '68474924a586bce22a6e64f7-mbpkmyu4',
    client_secret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
    redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
  };
  
  // GitHub configuration
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'EngageAutomations';
  const REPO_NAME = 'oauth-backend';
  const FILE_PATH = 'index.js';
  
  try {
    // Get current file
    console.log('📋 Getting current OAuth backend file...');
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
    console.log('✅ Current file SHA obtained');
    
    // Create OAuth backend with correct credentials
    const correctedOAuthBackend = `// OAuth Backend v7.0.2-correct-credentials - WORKING OAuth Credentials
// Uses the correct GoHighLevel OAuth credentials from client key file

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

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

// CORRECT OAuth credentials from client key file
const oauthCredentials = {
  client_id: '${correctCredentials.client_id}',
  client_secret: '${correctCredentials.client_secret}',
  redirect_uri: '${correctCredentials.redirect_uri}'
};

console.log('🚀 OAuth Backend v7.0.2-correct-credentials Starting');
console.log('OAuth Client ID:', oauthCredentials.client_id);
console.log('Features: Correct credentials, Smart location detection, Enhanced bridge communication');

// Enhanced token refresh with proper error handling
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

// Token exchange function with correct credentials
async function exchangeCode(code, redirectUri) {
  console.log('🔄 Exchanging authorization code for tokens');
  console.log('Using Client ID:', oauthCredentials.client_id);
  
  const body = new URLSearchParams();
  body.append('client_id', oauthCredentials.client_id);
  body.append('client_secret', oauthCredentials.client_secret);
  body.append('grant_type', 'authorization_code');
  body.append('code', code);
  body.append('redirect_uri', redirectUri);

  console.log('Token exchange request:', {
    url: 'https://services.leadconnectorhq.com/oauth/token',
    client_id: oauthCredentials.client_id,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });

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

// Enhanced location discovery
async function discoverAccountLocations(accessToken) {
  console.log('🔍 Attempting to discover account locations...');
  
  const endpoints = [
    'https://services.leadconnectorhq.com/locations/',
    'https://services.leadconnectorhq.com/locations',
    'https://rest.gohighlevel.com/v1/locations/',
    'https://rest.gohighlevel.com/v1/locations'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(\`Trying location endpoint: \${endpoint}\`);
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.data && Array.isArray(response.data.locations)) {
        console.log(\`✅ Found \${response.data.locations.length} locations via \${endpoint}\`);
        return response.data.locations;
      }
      
      if (response.data && Array.isArray(response.data)) {
        console.log(\`✅ Found \${response.data.length} locations via \${endpoint}\`);
        return response.data;
      }
      
    } catch (error) {
      console.log(\`❌ \${endpoint} failed: \${error.response?.status || error.message}\`);
    }
  }
  
  console.log('❌ No accessible locations found via any endpoint');
  return [];
}

// Store installation with enhanced location handling
function storeInstall(tokenData) {
  const id = \`install_\${Date.now()}\`;
  
  // Decode JWT to get location info
  const decoded = decodeJWTPayload(tokenData.access_token);
  const jwtLocationId = decoded?.authClassId || 'unknown';
  
  console.log(\`📦 Storing installation \${id}\`);
  console.log('JWT Location ID:', jwtLocationId);
  
  const installation = {
    id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    locationId: jwtLocationId,
    locationName: 'Unknown',
    locationStatus: 'pending_discovery',
    accountLocations: [],
    scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
    tokenStatus: 'valid',
    createdAt: new Date().toISOString()
  };
  
  installations.set(id, installation);
  
  // Attempt location discovery in background
  discoverAccountLocations(tokenData.access_token)
    .then(locations => {
      const inst = installations.get(id);
      if (inst) {
        inst.accountLocations = locations;
        inst.locationStatus = locations.length > 0 ? 'locations_found' : 'location_discovery_failed';
        
        if (locations.length > 0) {
          // Use first accessible location if JWT location doesn't exist
          const validLocation = locations.find(loc => loc.id === jwtLocationId) || locations[0];
          inst.locationId = validLocation.id;
          inst.locationName = validLocation.name || validLocation.businessName || 'Unknown';
          console.log(\`✅ Using location: \${inst.locationName} (\${inst.locationId})\`);
        } else {
          inst.locationName = 'No accessible locations';
          console.log('⚠️ No accessible locations found in account');
        }
      }
    })
    .catch(error => {
      console.error('Location discovery error:', error);
      const inst = installations.get(id);
      if (inst) {
        inst.locationStatus = 'location_discovery_failed';
      }
    });
  
  return id;
}

// Root endpoint with enhanced status
app.get('/', (req, res) => {
  res.json({
    status: 'OAuth Backend v7.0.2-correct-credentials',
    message: 'OAuth with CORRECT GoHighLevel credentials',
    timestamp: new Date().toISOString(),
    credentials: {
      client_id: oauthCredentials.client_id,
      redirect_uri: oauthCredentials.redirect_uri
    },
    features: [
      'CORRECT OAuth credentials from client key file',
      'Fixed OAuth callback (no installation_id required)',
      'Smart location detection',
      'Account location discovery',
      'Enhanced bridge communication',
      'Token health monitoring'
    ]
  });
});

// OAuth callback with correct credentials
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
    console.log('Using correct credentials:', {
      client_id: oauthCredentials.client_id,
      redirect_uri: redirectUri
    });
    
    const tokenData = await exchangeCode(code, redirectUri);
    console.log('✅ Token exchange successful');
    
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

// Enhanced token access with location status
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
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  
  if (timeUntilExpiry < 600000) { // Less than 10 minutes
    await enhancedRefreshAccessToken(id);
  }
  
  res.json({
    access_token: inst.accessToken,
    installation_id: id,
    location_id: inst.locationId,
    location_name: inst.locationName,
    location_status: inst.locationStatus,
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
      accountLocations: inst.accountLocations,
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
      totalLocations: inst.accountLocations.length
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
  console.log(\`✅ OAuth Backend v7.0.2-correct-credentials running on port \${port}\`);
  console.log(\`✅ OAuth callback: https://dir.engageautomations.com/api/oauth/callback\`);
  console.log(\`✅ Using CORRECT OAuth credentials:\`);
  console.log(\`   Client ID: \${oauthCredentials.client_id}\`);
  console.log(\`   Redirect URI: \${oauthCredentials.redirect_uri}\`);
  console.log(\`✅ Bridge endpoints active for API backend communication\`);
});
`;
    
    // Update the file on GitHub
    console.log('📤 Deploying correct OAuth credentials...');
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
          message: 'Fix OAuth credentials - use correct client ID and secret v7.0.2-correct-credentials',
          content: Buffer.from(correctedOAuthBackend).toString('base64'),
          sha: fileData.sha,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub update failed: ${updateResponse.status} - ${JSON.stringify(errorData)}`);
    }
    
    const updateData = await updateResponse.json();
    console.log('✅ Correct OAuth credentials deployed successfully');
    console.log(`Commit SHA: ${updateData.commit.sha}`);
    
    console.log('\n🔧 OAUTH CREDENTIALS FIX SUMMARY');
    console.log('='.repeat(60));
    console.log('Fixed Issue: Invalid OAuth client credentials');
    console.log('Solution: Deployed correct credentials from client key file');
    console.log('Version: v7.0.2-correct-credentials');
    console.log('Correct Credentials:');
    console.log(`  Client ID: ${correctCredentials.client_id}`);
    console.log(`  Client Secret: ${correctCredentials.client_secret}`);
    console.log(`  Redirect URI: ${correctCredentials.redirect_uri}`);
    console.log('');
    console.log('✅ OAuth installation should now work with correct credentials');
    console.log('🔄 Railway auto-deployment in progress...');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to fix OAuth credentials:', error.message);
    return false;
  }
}

// Run the fix
fixOAuthCredentialsImmediate()
  .then(success => {
    if (success) {
      console.log('\n✅ OAuth credentials fix completed successfully');
      console.log('OAuth installation should work in 2-3 minutes after deployment');
    } else {
      console.log('\n❌ OAuth credentials fix failed');
    }
  })
  .catch(console.error);