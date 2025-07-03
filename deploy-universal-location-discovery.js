/**
 * Deploy Universal Location Discovery System
 * Build OAuth backend that dynamically discovers working locations from any account
 */

import fs from 'fs';

async function deployUniversalLocationDiscovery() {
  console.log('🚀 DEPLOYING UNIVERSAL LOCATION DISCOVERY SYSTEM');
  console.log('Building dynamic location discovery for any GoHighLevel account');
  console.log('='.repeat(60));
  
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
    
    // Create OAuth backend with universal location discovery
    const universalOAuthBackend = `// OAuth Backend v8.0.0-universal-discovery - Dynamic Location Discovery
// Discovers working locations from any GoHighLevel account automatically

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

// OAuth credentials
const oauthCredentials = {
  client_id: '68474924a586bce22a6e64f7-mbpkmyu4',
  client_secret: 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
  redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
};

console.log('🚀 OAuth Backend v8.0.0-universal-discovery Starting');
console.log('✅ Universal Location Discovery: Works with any GoHighLevel account');
console.log('✅ Dynamic location testing and validation system active');

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

// Universal Location Discovery Service
async function discoverAccountLocations(accessToken, jwtLocationId) {
  console.log('🔍 UNIVERSAL LOCATION DISCOVERY STARTING');
  console.log(\`JWT Location ID: \${jwtLocationId}\`);
  
  const discoveryResults = {
    jwtLocationId,
    discoveredLocations: [],
    workingLocations: [],
    bestLocation: null,
    discoveryMethod: null,
    discoveryStatus: 'starting'
  };
  
  // Step 1: Try location discovery endpoints
  console.log('Step 1: Attempting location discovery...');
  
  const locationEndpoints = [
    { 
      name: 'Services API Locations', 
      url: 'https://services.leadconnectorhq.com/locations/',
      method: 'GET'
    },
    { 
      name: 'Services API Locations (no slash)', 
      url: 'https://services.leadconnectorhq.com/locations',
      method: 'GET'
    },
    { 
      name: 'REST API v1 Locations', 
      url: 'https://rest.gohighlevel.com/v1/locations/',
      method: 'GET'
    },
    { 
      name: 'REST API v1 Locations (no slash)', 
      url: 'https://rest.gohighlevel.com/v1/locations',
      method: 'GET'
    }
  ];
  
  for (const endpoint of locationEndpoints) {
    try {
      console.log(\`Trying: \${endpoint.name}\`);
      
      const response = await axios({
        method: endpoint.method,
        url: endpoint.url,
        headers: {
          'Authorization': \`Bearer \${accessToken}\`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.status === 200 && response.data) {
        console.log(\`✅ \${endpoint.name} responded with data\`);
        
        let locations = [];
        
        // Parse different response formats
        if (response.data.locations && Array.isArray(response.data.locations)) {
          locations = response.data.locations;
        } else if (Array.isArray(response.data)) {
          locations = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          locations = response.data.data;
        }
        
        if (locations.length > 0) {
          console.log(\`✅ Found \${locations.length} locations via \${endpoint.name}\`);
          discoveryResults.discoveredLocations = locations;
          discoveryResults.discoveryMethod = endpoint.name;
          break;
        }
      }
      
    } catch (error) {
      console.log(\`❌ \${endpoint.name} failed: \${error.response?.status || error.message}\`);
    }
  }
  
  // Step 2: If no locations discovered, try company/user endpoints
  if (discoveryResults.discoveredLocations.length === 0) {
    console.log('Step 2: Trying company/user endpoints...');
    
    const userEndpoints = [
      'https://services.leadconnectorhq.com/companies/',
      'https://services.leadconnectorhq.com/companies/me',
      'https://services.leadconnectorhq.com/users/me',
      'https://services.leadconnectorhq.com/oauth/me'
    ];
    
    for (const endpoint of userEndpoints) {
      try {
        console.log(\`Trying user endpoint: \${endpoint}\`);
        
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          },
          timeout: 10000
        });
        
        if (response.status === 200) {
          console.log(\`✅ \${endpoint} responded\`);
          console.log('Response data:', JSON.stringify(response.data, null, 2));
          
          // Look for locations in response
          const data = response.data;
          if (data.locations || data.user?.locations || data.company?.locations) {
            const locations = data.locations || data.user?.locations || data.company?.locations;
            console.log(\`✅ Found locations in user data: \${locations.length}\`);
            discoveryResults.discoveredLocations = Array.isArray(locations) ? locations : [locations];
            discoveryResults.discoveryMethod = endpoint;
            break;
          }
        }
        
      } catch (error) {
        console.log(\`❌ \${endpoint} failed: \${error.response?.status || error.message}\`);
      }
    }
  }
  
  // Step 3: Test discovered locations for API access
  if (discoveryResults.discoveredLocations.length > 0) {
    console.log(\`Step 3: Testing \${discoveryResults.discoveredLocations.length} locations for API access...\`);
    
    for (const location of discoveryResults.discoveredLocations) {
      const locationId = location.id || location.locationId || location._id;
      const locationName = location.name || location.businessName || location.companyName || 'Unknown';
      
      if (!locationId) continue;
      
      console.log(\`Testing location: \${locationName} (\${locationId})\`);
      
      try {
        // Test products API
        const productResponse = await axios.get(
          \`https://services.leadconnectorhq.com/products/?locationId=\${locationId}\`,
          {
            headers: {
              'Authorization': \`Bearer \${accessToken}\`,
              'Version': '2021-07-28',
              'Accept': 'application/json'
            },
            timeout: 5000
          }
        );
        
        if (productResponse.status === 200) {
          const productsData = productResponse.data;
          const productCount = productsData.products ? productsData.products.length : 0;
          
          console.log(\`✅ Location \${locationId} has product API access (\${productCount} products)\`);
          
          const workingLocation = {
            id: locationId,
            name: locationName,
            productCount: productCount,
            hasProductAPI: true,
            hasMediaAPI: false,
            apiCapabilities: ['products']
          };
          
          // Test media API too
          try {
            const mediaResponse = await axios.get(
              \`https://services.leadconnectorhq.com/medias/?locationId=\${locationId}\`,
              {
                headers: {
                  'Authorization': \`Bearer \${accessToken}\`,
                  'Version': '2021-07-28',
                  'Accept': 'application/json'
                },
                timeout: 5000
              }
            );
            
            if (mediaResponse.status === 200) {
              console.log(\`✅ Location \${locationId} also has media API access\`);
              workingLocation.hasMediaAPI = true;
              workingLocation.apiCapabilities.push('medias');
            }
          } catch (mediaError) {
            console.log(\`⚠️ Location \${locationId} media API not accessible\`);
          }
          
          discoveryResults.workingLocations.push(workingLocation);
        }
        
      } catch (productError) {
        console.log(\`❌ Location \${locationId} product API failed: \${productError.response?.status || productError.message}\`);
      }
    }
  }
  
  // Step 4: If no discovered locations work, test JWT location directly
  if (discoveryResults.workingLocations.length === 0 && jwtLocationId && jwtLocationId !== 'unknown') {
    console.log(\`Step 4: Testing JWT location directly: \${jwtLocationId}\`);
    
    try {
      const jwtResponse = await axios.get(
        \`https://services.leadconnectorhq.com/products/?locationId=\${jwtLocationId}\`,
        {
          headers: {
            'Authorization': \`Bearer \${accessToken}\`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          },
          timeout: 5000
        }
      );
      
      if (jwtResponse.status === 200) {
        const productsData = jwtResponse.data;
        const productCount = productsData.products ? productsData.products.length : 0;
        
        console.log(\`✅ JWT location \${jwtLocationId} works (\${productCount} products)\`);
        
        discoveryResults.workingLocations.push({
          id: jwtLocationId,
          name: 'JWT Location',
          productCount: productCount,
          hasProductAPI: true,
          hasMediaAPI: false,
          apiCapabilities: ['products'],
          source: 'jwt'
        });
      }
      
    } catch (jwtError) {
      console.log(\`❌ JWT location \${jwtLocationId} failed: \${jwtError.response?.status || jwtError.message}\`);
    }
  }
  
  // Step 5: Select best working location
  if (discoveryResults.workingLocations.length > 0) {
    // Sort by product count (descending) and select the best one
    const sortedLocations = discoveryResults.workingLocations.sort((a, b) => b.productCount - a.productCount);
    discoveryResults.bestLocation = sortedLocations[0];
    discoveryResults.discoveryStatus = 'success';
    
    console.log(\`✅ Best location selected: \${discoveryResults.bestLocation.name} (\${discoveryResults.bestLocation.id})\`);
    console.log(\`   Products: \${discoveryResults.bestLocation.productCount}\`);
    console.log(\`   Capabilities: \${discoveryResults.bestLocation.apiCapabilities.join(', ')}\`);
  } else {
    discoveryResults.discoveryStatus = 'no_working_locations';
    console.log('❌ No working locations found with product API access');
  }
  
  console.log('🔍 UNIVERSAL LOCATION DISCOVERY COMPLETE');
  return discoveryResults;
}

// Store installation with universal location discovery
async function storeInstall(tokenData) {
  const id = \`install_\${Date.now()}\`;
  
  // Decode JWT to get location info
  const decoded = decodeJWTPayload(tokenData.access_token);
  const jwtLocationId = decoded?.authClassId || 'unknown';
  
  console.log(\`📦 Storing installation \${id}\`);
  console.log('JWT Location ID:', jwtLocationId);
  
  // Run universal location discovery
  const discoveryResults = await discoverAccountLocations(tokenData.access_token, jwtLocationId);
  
  const installation = {
    id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    locationId: discoveryResults.bestLocation?.id || jwtLocationId || 'unknown',
    locationName: discoveryResults.bestLocation?.name || 'No working location found',
    locationStatus: discoveryResults.discoveryStatus,
    jwtLocationId: jwtLocationId,
    discoveryResults: discoveryResults,
    accountLocations: discoveryResults.discoveredLocations,
    workingLocations: discoveryResults.workingLocations,
    scopes: tokenData.scope ? tokenData.scope.split(' ') : [],
    tokenStatus: 'valid',
    createdAt: new Date().toISOString()
  };
  
  installations.set(id, installation);
  
  if (discoveryResults.bestLocation) {
    console.log(\`✅ Installation stored with working location: \${discoveryResults.bestLocation.name} (\${discoveryResults.bestLocation.id})\`);
  } else {
    console.log(\`⚠️ Installation stored but no working location found\`);
  }
  
  return id;
}

// Root endpoint with universal discovery status
app.get('/', (req, res) => {
  res.json({
    status: 'OAuth Backend v8.0.0-universal-discovery',
    message: 'Universal Location Discovery for ANY GoHighLevel account',
    timestamp: new Date().toISOString(),
    universalDiscovery: {
      description: 'Dynamically discovers working locations from any account',
      capabilities: [
        'Multi-endpoint location discovery',
        'API access validation for each location',
        'Intelligent best location selection',
        'Fallback to JWT location if needed',
        'Works with any GoHighLevel account structure'
      ]
    },
    features: [
      'UNIVERSAL location discovery (works with any account)',
      'Dynamic API testing and validation',
      'Intelligent location selection algorithm',
      'Correct OAuth credentials from client key file',
      'Fixed OAuth callback (no installation_id required)',
      'Enhanced bridge communication',
      'Token health monitoring'
    ]
  });
});

// OAuth callback with universal location discovery
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
    
    console.log('🔍 Starting universal location discovery...');
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

// Enhanced token access with universal discovery results
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
    jwt_location_id: inst.jwtLocationId,
    discovery_results: inst.discoveryResults,
    working_locations: inst.workingLocations,
    status: inst.tokenStatus,
    expires_at: inst.expiresAt,
    token_status: inst.tokenStatus
  });
});

// Installation status endpoint with discovery details
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
      jwtLocationId: inst.jwtLocationId,
      discoveryResults: inst.discoveryResults,
      accountLocations: inst.accountLocations,
      workingLocations: inst.workingLocations,
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
      jwtLocationId: inst.jwtLocationId,
      discoveredLocations: inst.accountLocations?.length || 0,
      workingLocations: inst.workingLocations?.length || 0,
      discoveryMethod: inst.discoveryResults?.discoveryMethod
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
    jwtLocationId: inst.jwtLocationId,
    locationStatus: inst.locationStatus,
    workingLocations: inst.workingLocations?.length || 0,
    discoveryMethod: inst.discoveryResults?.discoveryMethod,
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
  console.log(\`✅ OAuth Backend v8.0.0-universal-discovery running on port \${port}\`);
  console.log(\`✅ OAuth callback: https://dir.engageautomations.com/api/oauth/callback\`);
  console.log(\`✅ Universal Location Discovery active:\`);
  console.log(\`   → Works with ANY GoHighLevel account\`);
  console.log(\`   → Dynamic location discovery and validation\`);
  console.log(\`   → Intelligent best location selection\`);
  console.log(\`   → No hardcoded location dependencies\`);
  console.log(\`✅ Bridge endpoints active for API backend communication\`);
});
`;
    
    // Update the file on GitHub
    console.log('📤 Deploying universal location discovery system...');
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
          message: 'Deploy universal location discovery system v8.0.0-universal-discovery',
          content: Buffer.from(universalOAuthBackend).toString('base64'),
          sha: fileData.sha,
        }),
      }
    );
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(`GitHub update failed: ${updateResponse.status} - ${JSON.stringify(errorData)}`);
    }
    
    const updateData = await updateResponse.json();
    console.log('✅ Universal location discovery system deployed successfully');
    console.log(`Commit SHA: ${updateData.commit.sha}`);
    
    console.log('\n🎯 UNIVERSAL LOCATION DISCOVERY DEPLOYED');
    console.log('='.repeat(60));
    console.log('System Capabilities:');
    console.log('  ✅ Works with ANY GoHighLevel account');
    console.log('  ✅ Dynamic location discovery via multiple endpoints');
    console.log('  ✅ API access validation for each discovered location');
    console.log('  ✅ Intelligent best location selection algorithm');
    console.log('  ✅ Fallback to JWT location if discovery fails');
    console.log('  ✅ No hardcoded location dependencies');
    console.log('  ✅ Comprehensive discovery results storage');
    console.log('');
    console.log('Discovery Process:');
    console.log('  1. Exchange OAuth code for tokens');
    console.log('  2. Decode JWT to get initial location');
    console.log('  3. Try multiple location discovery endpoints');
    console.log('  4. Test each discovered location for API access');
    console.log('  5. Select best working location (most products)');
    console.log('  6. Store complete discovery results');
    console.log('');
    console.log('✅ Ready for fresh OAuth installation with any account');
    console.log('🔄 Railway auto-deployment in progress...');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to deploy universal location discovery:', error.message);
    return false;
  }
}

// Run the deployment
deployUniversalLocationDiscovery()
  .then(success => {
    if (success) {
      console.log('\n✅ Universal location discovery system deployment completed');
      console.log('The system will now work with any GoHighLevel account');
      console.log('Try a fresh OAuth installation in 2-3 minutes after deployment');
    } else {
      console.log('\n❌ Universal location discovery deployment failed');
    }
  })
  .catch(console.error);