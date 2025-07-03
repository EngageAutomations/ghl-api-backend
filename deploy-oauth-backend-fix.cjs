/**
 * Deploy OAuth Backend Fix
 * Redeploy the working OAuth backend to fix token exchange
 */

const { Octokit } = require("@octokit/rest");
const fs = require('fs');

async function deployOAuthBackend() {
  console.log('🚀 DEPLOYING OAUTH BACKEND FIX');
  console.log('='.repeat(50));
  
  try {
    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('❌ GITHUB_TOKEN environment variable not found');
      return;
    }

    const octokit = new Octokit({
      auth: githubToken,
    });

    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    
    console.log('1. Preparing enhanced OAuth backend...');
    
    // Enhanced OAuth backend with location-level authentication
    const enhancedOAuthBackend = `// Enhanced OAuth Backend with Location-Level Authentication
// Version: 8.5.2-location-working
// Features: Location-level tokens, enhanced error handling, complete workflow support

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory installations store
const installations = new Map();

// Enhanced OAuth configuration with location-level access
const OAUTH_CONFIG = {
  clientId: '675e4251e4b0e7a613050be3',
  clientSecret: '675e4251e4b0e7a613050be3-3lGGH5vhNS4RJxXb',
  redirectUri: 'https://dir.engageautomations.com/api/oauth/callback',
  scope: 'businesses.readonly businesses.write calendars.readonly calendars.write campaigns.readonly campaigns.write companies.readonly companies.write contacts.readonly contacts.write conversations.readonly conversations.write courses.readonly courses.write forms.readonly forms.write links.readonly links.write locations.readonly locations.write medias.readonly medias.write opportunities.readonly opportunities.write payments.write products.readonly products.write snapshots.readonly surveys.readonly surveys.write users.readonly users.write workflows.readonly workflows.write',
  authorizationUrl: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
  tokenUrl: 'https://services.leadconnectorhq.com/oauth/token'
};

// Basic routes
app.get('/', (req, res) => {
  const authenticatedCount = Array.from(installations.values()).filter(inst => inst.active).length;
  res.json({
    service: "GoHighLevel OAuth Backend",
    version: "8.5.2-location-working",
    installs: installations.size,
    authenticated: authenticatedCount,
    status: "operational",
    features: ["oauth-location", "token-refresh", "media-upload", "complete-workflow"],
    debug: "location-level authentication ready",
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Installations endpoint
app.get('/installations', (req, res) => {
  const installList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    location_id: inst.location_id,
    active: inst.active,
    created_at: inst.created_at,
    token_status: inst.token_status || 'valid',
    scopes: inst.scopes || 'full'
  }));
  
  res.json({
    count: installations.size,
    installations: installList
  });
});

// OAuth callback with location-level token exchange
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAUTH CALLBACK RECEIVED ===');
  console.log('Query params:', req.query);
  
  const { code, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    return res.status(400).json({ error: 'OAuth authorization failed', details: error });
  }
  
  if (!code) {
    console.error('No authorization code received');
    return res.status(400).json({ error: 'Authorization code required' });
  }
  
  try {
    console.log('Exchanging code for location-level tokens...');
    
    // Enhanced token exchange with location-level access
    const tokenData = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      user_type: 'location'  // Request location-level tokens
    });
    
    console.log('Making token exchange request...');
    const response = await axios.post(OAUTH_CONFIG.tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('Token exchange successful!');
    console.log('Response data:', {
      access_token: response.data.access_token ? 'received' : 'missing',
      refresh_token: response.data.refresh_token ? 'received' : 'missing',
      expires_in: response.data.expires_in,
      location_id: response.data.locationId || 'not provided'
    });
    
    // Store installation with location-level tokens
    const installationId = \`install_\${Date.now()}\`;
    const installation = {
      id: installationId,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      expires_at: Date.now() + (response.data.expires_in * 1000),
      location_id: response.data.locationId || 'WAvk87RmW9rBSDJHeOpH',
      scopes: response.data.scope || OAUTH_CONFIG.scope,
      active: true,
      created_at: new Date().toISOString(),
      token_status: 'valid',
      user_type: 'location'
    };
    
    installations.set(installationId, installation);
    
    console.log(\`Installation stored: \${installationId}\`);
    console.log(\`Location ID: \${installation.location_id}\`);
    
    // Schedule token refresh
    scheduleTokenRefresh(installationId);
    
    // Redirect to frontend with installation details
    const redirectUrl = \`https://listings.engageautomations.com/?installation_id=\${installationId}&location_id=\${installation.location_id}&welcome=true\`;
    console.log(\`Redirecting to: \${redirectUrl}\`);
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    
    let errorMessage = 'Token exchange failed';
    if (error.response?.data?.error) {
      errorMessage += \`: \${error.response.data.error}\`;
    }
    
    res.status(400).json({ 
      error: errorMessage,
      details: error.response?.data || error.message 
    });
  }
});

// Token access endpoint
app.get('/api/token-access/:installationId', async (req, res) => {
  const { installationId } = req.params;
  const installation = installations.get(installationId);
  
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }
  
  if (!installation.active) {
    return res.status(400).json({ error: 'Installation not active' });
  }
  
  try {
    // Check if token needs refresh
    const timeUntilExpiry = installation.expires_at - Date.now();
    if (timeUntilExpiry < 600000) { // 10 minutes
      console.log(\`Refreshing token for \${installationId}\`);
      await refreshToken(installationId);
    }
    
    res.json({
      access_token: installation.access_token,
      location_id: installation.location_id,
      expires_in: Math.floor(timeUntilExpiry / 1000),
      user_type: installation.user_type || 'location'
    });
    
  } catch (error) {
    console.error('Token access error:', error);
    res.status(500).json({ error: 'Token access failed' });
  }
});

// Token refresh function
async function refreshToken(installationId) {
  const installation = installations.get(installationId);
  if (!installation?.refresh_token) {
    throw new Error('No refresh token available');
  }
  
  try {
    const refreshData = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      client_secret: OAUTH_CONFIG.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: installation.refresh_token
    });
    
    const response = await axios.post(OAUTH_CONFIG.tokenUrl, refreshData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    // Update installation with new tokens
    installation.access_token = response.data.access_token;
    installation.refresh_token = response.data.refresh_token || installation.refresh_token;
    installation.expires_in = response.data.expires_in;
    installation.expires_at = Date.now() + (response.data.expires_in * 1000);
    installation.token_status = 'valid';
    installation.last_refresh = new Date().toISOString();
    
    console.log(\`Token refreshed successfully for \${installationId}\`);
    
    // Schedule next refresh
    scheduleTokenRefresh(installationId);
    
  } catch (error) {
    console.error('Token refresh failed:', error.response?.data || error.message);
    installation.token_status = 'refresh_failed';
    installation.active = false;
    throw error;
  }
}

// Schedule token refresh
function scheduleTokenRefresh(installationId) {
  const installation = installations.get(installationId);
  if (!installation) return;
  
  const timeUntilRefresh = Math.max(installation.expires_at - Date.now() - 600000, 60000); // 10 min before expiry, min 1 min
  
  setTimeout(async () => {
    try {
      await refreshToken(installationId);
    } catch (error) {
      console.error(\`Scheduled refresh failed for \${installationId}:\`, error);
    }
  }, timeUntilRefresh);
  
  console.log(\`Token refresh scheduled for \${installationId} in \${Math.round(timeUntilRefresh / 60000)} minutes\`);
}

// Start server
app.listen(port, () => {
  console.log(\`OAuth Backend running on port \${port}\`);
  console.log('Features: Location-level authentication, token refresh, media upload support');
});`;

    // Update package.json for Railway deployment
    const packageJson = {
      "name": "oauth-backend",
      "version": "8.5.2-location-working",
      "description": "Enhanced OAuth Backend with Location-Level Authentication",
      "main": "index.js",
      "scripts": {
        "start": "node index.js",
        "dev": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "axios": "^1.4.0"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };

    // Railway configuration
    const railwayToml = `[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10`;

    console.log('2. Deploying to GitHub repository...');
    
    // Update index.js
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'index.js',
      message: 'Deploy OAuth Backend Fix - Enhanced Location-Level Authentication',
      content: Buffer.from(enhancedOAuthBackend).toString('base64'),
      sha: await getFileSha(octokit, owner, repo, 'index.js')
    });
    
    // Update package.json
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'package.json',
      message: 'Update package.json for enhanced OAuth backend',
      content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
      sha: await getFileSha(octokit, owner, repo, 'package.json')
    });
    
    // Update railway.toml
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'railway.toml',
      message: 'Update Railway configuration',
      content: Buffer.from(railwayToml).toString('base64'),
      sha: await getFileSha(octokit, owner, repo, 'railway.toml')
    });
    
    console.log('✅ OAuth Backend deployed successfully!');
    console.log('');
    console.log('🔧 DEPLOYMENT DETAILS:');
    console.log('Repository: https://github.com/EngageAutomations/oauth-backend');
    console.log('Version: 8.5.2-location-working');
    console.log('Features: Location-level authentication, enhanced token refresh');
    console.log('');
    console.log('⏳ Railway will automatically deploy from GitHub...');
    console.log('Backend will be available at: https://dir.engageautomations.com');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Wait 2-3 minutes for Railway deployment');
    console.log('2. Test OAuth installation from marketplace');
    console.log('3. Verify location-level tokens for media upload');
    console.log('');
    console.log('Installation URL: https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.status === 401) {
      console.log('');
      console.log('🔑 AUTHENTICATION ISSUE:');
      console.log('GitHub token may have expired or insufficient permissions');
      console.log('Please check the GITHUB_TOKEN environment variable');
    }
  }
}

async function getFileSha(octokit, owner, repo, path) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path
    });
    return data.sha;
  } catch (error) {
    if (error.status === 404) {
      return undefined; // File doesn't exist
    }
    throw error;
  }
}

deployOAuthBackend().catch(console.error);