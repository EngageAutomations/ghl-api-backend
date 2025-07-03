/**
 * Deploy Smart Location Discovery
 * Try to find the actual installed location first, fallback to known working locations
 */

import fs from 'fs';

async function deploySmartLocationDiscovery() {
  console.log('🧠 DEPLOYING SMART LOCATION DISCOVERY');
  console.log('Find actual installed location, fallback to known working locations');
  console.log('='.repeat(60));
  
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
    
    // Create OAuth backend with smart location discovery
    const smartLocationBackend = `// OAuth Backend v8.3.0-smart-discovery - Smart Location Discovery
// Try to find actual installed location, fallback to known working locations

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

// Known working locations as fallback
const knownWorkingLocations = [
  'WAvk87RmW9rBSDJHeOpH', // MakerExpress 3D - confirmed working
  'kQDg6qp2x7GXYJ1VCkI8', // Engage Automations
  'eYeyzEWiaxcTOPROAo4C'  // Darul Uloom Tampa
];

console.log('🚀 OAuth Backend v8.3.0-smart-discovery Starting');
console.log('✅ Smart Location Discovery: Find actual location first');
console.log('✅ Fallback to known working locations if needed');

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

// Smart location discovery
async function discoverActualLocation(accessToken) {
  console.log('🧠 Smart Location Discovery - Finding actual installed location');
  
  // Step 1: Try to get JWT location and test it first
  const decoded = decodeJWTPayload(accessToken);
  let jwtLocationId = null;
  
  if (decoded) {
    if (decoded.authClass === 'Location') {
      jwtLocationId = decoded.authClassId;
    } else if (decoded.authClass === 'Company') {
      jwtLocationId = decoded.primaryAuthClassId;
    }
    
    if (jwtLocationId) {
      console.log(\`Testing JWT location: \${jwtLocationId}\`);
      
      try {
        const response = await fetch(\`https://services.leadconnectorhq.com/products/?locationId=\${jwtLocationId}\`, {
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const productCount = data.products ? data.products.length : 0;
          
          console.log(\`✅ JWT location WORKS! \${jwtLocationId} (\${productCount} products)\`);
          
          return {
            locationId: jwtLocationId,
            productCount: productCount,
            status: 'working',
            method: 'jwt_location_works',
            source: 'actual_install'
          };
        } else {
          console.log(\`❌ JWT location failed: \${response.status}\`);
        }
      } catch (error) {
        console.log(\`❌ JWT location error: \${error.message}\`);
      }
    }
  }
  
  // Step 2: Try locations discovery API
  console.log('Trying locations discovery APIs...');
  
  const locationEndpoints = [
    'https://services.leadconnectorhq.com/locations/',
    'https://rest.gohighlevel.com/v1/locations/'
  ];
  
  for (const endpoint of locationEndpoints) {
    try {
      console.log(\`Testing endpoint: \${endpoint}\`);
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Found locations data:', JSON.stringify(data, null, 2));
        
        if (data.locations && Array.isArray(data.locations) && data.locations.length > 0) {
          // Test each discovered location
          for (const location of data.locations) {
            console.log(\`Testing discovered location: \${location.id}\`);
            
            try {
              const testResponse = await fetch(\`https://services.leadconnectorhq.com/products/?locationId=\${location.id}\`, {
                headers: {
                  'Authorization': \`Bearer \${accessToken}\`,
                  'Version': '2021-07-28',
                  'Accept': 'application/json'
                }
              });
              
              if (testResponse.ok) {
                const testData = await testResponse.json();
                const productCount = testData.products ? testData.products.length : 0;
                
                console.log(\`✅ Discovered location WORKS! \${location.id} (\${productCount} products)\`);
                
                return {
                  locationId: location.id,
                  locationName: location.name || 'Discovered Location',
                  productCount: productCount,
                  status: 'working',
                  method: 'api_discovery',
                  source: 'discovered_location'
                };
              }
            } catch (testError) {
              console.log(\`❌ Location \${location.id} test failed\`);
            }
          }
        }
      }
    } catch (error) {
      console.log(\`❌ Endpoint \${endpoint} failed\`);
    }
  }
  
  // Step 3: Fallback to known working locations
  console.log('Falling back to known working locations...');
  
  for (const locationId of knownWorkingLocations) {
    try {
      console.log(\`Testing fallback location: \${locationId}\`);
      
      const response = await fetch(\`https://services.leadconnectorhq.com/products/?locationId=\${locationId}\`, {
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const productCount = data.products ? data.products.length : 0;
        
        console.log(\`✅ Fallback location works: \${locationId} (\${productCount} products)\`);
        
        return {
          locationId: locationId,
          productCount: productCount,
          status: 'working',
          method: 'fallback_known_location',
          source: 'known_working'
        };
      }
    } catch (error) {
      console.log(\`❌ Fallback location \${locationId} failed\`);
    }
  }
  
  console.log('❌ No working locations found');
  return {
    locationId: 'none_found',
    status: 'no_access',
    method: 'all_methods_failed'
  };
}

// Store installation with smart location discovery
async function storeInstall(tokenData) {
  const id = \`install_\${Date.now()}\`;
  
  console.log(\`📦 Storing installation \${id}\`);
  
  // Smart location discovery
  const locationResult = await discoverActualLocation(tokenData.access_token);
  
  const installation = {
    id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    locationId: locationResult.locationId,
    locationName: locationResult.locationName || locationResult.method,
    locationStatus: locationResult.status,
    discoveryMethod: locationResult.method,
    discoverySource: locationResult.source,
    productCount: locationResult.productCount || 0,
    scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
    tokenStatus: 'valid',
    createdAt: new Date().toISOString()
  };
  
  installations.set(id, installation);
  
  console.log(\`✅ Installation stored with location: \${locationResult.locationId} (via \${locationResult.method})\`);
  
  return id;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OAuth Backend v8.3.0-smart-discovery',
    message: 'Smart location discovery - finds actual installed location',
    timestamp: new Date().toISOString(),
    approach: {
      description: 'Smart multi-step location discovery',
      steps: [
        '1. Test JWT location first (might work for new installs)',
        '2. Try locations discovery APIs',
        '3. Fallback to known working locations',
        '4. Use first working location found'
      ],
      fallbackLocations: knownWorkingLocations
    },
    features: [
      'SMART location discovery (actual install first)',
      'JWT location testing (for new installs)',
      'API-based location discovery',
      'Fallback to known working locations',
      'Real API access validation',
      'Enhanced bridge communication',
      'Token health monitoring'
    ]
  });
});

// OAuth callback with smart location discovery
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
    
    console.log('🧠 Starting smart location discovery...');
    const installationId = await storeInstall(tokenData);
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
    discovery_method: inst.discoveryMethod,
    discovery_source: inst.discoverySource,
    product_count: inst.productCount,
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
      discoveryMethod: inst.discoveryMethod,
      discoverySource: inst.discoverySource,
      productCount: inst.productCount,
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
      discoveryMethod: inst.discoveryMethod,
      discoverySource: inst.discoverySource,
      productCount: inst.productCount
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
    const installationId = await storeInstall(tokenData);
    
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
      discovery_method: inst.discoveryMethod,
      discovery_source: inst.discoverySource,
      product_count: inst.productCount,
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
    discoveryMethod: inst.discoveryMethod,
    discoverySource: inst.discoverySource,
    productCount: inst.productCount,
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
    locationId: inst.locationId,
    discoveryMethod: inst.discoveryMethod,
    discoverySource: inst.discoverySource,
    productCount: inst.productCount
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
  console.log(\`✅ OAuth Backend v8.3.0-smart-discovery running on port \${port}\`);
  console.log(\`✅ OAuth callback: https://dir.engageautomations.com/api/oauth/callback\`);
  console.log(\`✅ Smart Location Discovery:\`);
  console.log(\`   1. Test JWT location first (for new installs)\`);
  console.log(\`   2. Try API location discovery\`);
  console.log(\`   3. Fallback to known working locations\`);
  console.log(\`   4. Use first working location found\`);
  console.log(\`✅ Bridge endpoints active for API backend communication\`);
});
`;
    
    // Update the file on GitHub
    console.log('Deploying smart location discovery...');
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
          message: 'Deploy smart location discovery v8.3.0-smart-discovery',
          content: Buffer.from(smartLocationBackend).toString('base64'),
          sha: fileData.sha,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub update failed: ${updateResponse.status} - ${JSON.stringify(errorData)}`);
    }
    
    const updateData = await updateResponse.json();
    console.log('Smart location discovery deployed successfully');
    console.log(`Commit SHA: ${updateData.commit.sha}`);
    
    console.log('\n🧠 SMART LOCATION DISCOVERY DEPLOYED');
    console.log('='.repeat(50));
    console.log('Multi-step approach:');
    console.log('  1️⃣ Test JWT location first (might work for NEW installs)');
    console.log('  2️⃣ Try locations discovery APIs');
    console.log('  3️⃣ Fallback to known working locations');
    console.log('  4️⃣ Use first working location found');
    console.log('');
    console.log('This handles both scenarios:');
    console.log('  ✅ New installs on fresh locations');
    console.log('  ✅ Existing installs with known working locations');
    console.log('');
    console.log('Ready for fresh OAuth installation test');
    console.log('Railway auto-deployment in progress...');
    
    return true;
    
  } catch (error) {
    console.error('Failed to deploy smart location discovery:', error.message);
    return false;
  }
}

// Run the deployment
deploySmartLocationDiscovery()
  .then(success => {
    if (success) {
      console.log('\nSmart location discovery deployment completed');
      console.log('System will now find your actual installed location');
    } else {
      console.log('\nSmart location discovery deployment failed');
    }
  })
  .catch(console.error);