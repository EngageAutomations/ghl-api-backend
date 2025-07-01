/**
 * Fix OAuth Backend Credentials
 * Updates OAuth backend with correct GoHighLevel credentials
 */

import { Octokit } from '@octokit/rest';

async function fixOAuthCredentials() {
  console.log('=== Fixing OAuth Backend Credentials ===');
  
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    if (!GITHUB_TOKEN) {
      console.log('❌ GITHUB_TOKEN environment variable not found');
      return;
    }
    
    const octokit = new Octokit({ auth: GITHUB_TOKEN });
    
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    const branch = 'main';
    
    console.log('1. Getting current index.js SHA...');
    
    const { data: currentIndex } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'index.js'
    });
    
    console.log('2. Creating OAuth backend with corrected credentials...');
    
    // OAuth backend with corrected credentials
    const fixedOAuthBackend = `/**
 * Pure OAuth Backend - Fixed Credentials
 * Handles OAuth callback, token management, and provides bridge for API backend
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory OAuth installation store
const installations = new Map();

// GoHighLevel OAuth Configuration - Using working credentials
const CLIENT_ID = 'Q7DGQOCn7LgdPdGCKZiKzwCfx3eUlEgEp1lM8zVqo2';
const CLIENT_SECRET = 'Q4zrAwYqKdWp8NKSHy72bGLIJpRzrlUpZ4bUhFhU';
const REDIRECT_URI = 'https://dir.engageautomations.com/api/oauth/callback';

// Enhanced OAuth Callback Handler with better error handling
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAuth Callback Received ===');
  console.log('Query params:', req.query);
  
  const { code, location_id, error, error_description } = req.query;
  
  if (error) {
    console.log('❌ OAuth error:', error, error_description);
    return res.status(400).send(\`<html><body>
      <h2>OAuth Error</h2>
      <p>Error: \${error}</p>
      <p>Description: \${error_description}</p>
      <a href="https://listings.engageautomations.com">Return to Application</a>
    </body></html>\`);
  }
  
  if (!code) {
    console.log('❌ No authorization code received');
    return res.status(400).send('<html><body><h2>Error: No authorization code received</h2><a href="https://listings.engageautomations.com">Return to Application</a></body></html>');
  }
  
  try {
    console.log('🔄 Exchanging authorization code for tokens...');
    console.log('   Code:', code.substring(0, 20) + '...');
    console.log('   Location ID:', location_id);
    console.log('   Client ID:', CLIENT_ID);
    console.log('   Redirect URI:', REDIRECT_URI);
    
    // Exchange code for tokens using URLSearchParams
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', CLIENT_ID);
    tokenParams.append('client_secret', CLIENT_SECRET);
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', REDIRECT_URI);
    
    console.log('📡 Making token exchange request to GoHighLevel...');
    
    const tokenResponse = await axios.post(
      'https://services.leadconnectorhq.com/oauth/token',
      tokenParams,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );
    
    const { access_token, refresh_token, expires_in, scope } = tokenResponse.data;
    console.log('✅ Tokens received successfully');
    console.log('   Expires in:', expires_in, 'seconds');
    console.log('   Scopes:', scope);
    console.log('   Access token (first 20 chars):', access_token.substring(0, 20) + '...');
    
    // Generate installation ID
    const installation_id = \`install_\${Date.now()}\`;
    
    // Store installation with tokens
    installations.set(installation_id, {
      id: installation_id,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      expiresAt: Date.now() + (expires_in * 1000),
      locationId: location_id,
      scopes: scope,
      tokenStatus: 'valid',
      createdAt: new Date().toISOString(),
      lastRefresh: null
    });
    
    console.log(\`✅ Installation \${installation_id} stored successfully\`);
    console.log('   Total installations:', installations.size);
    
    // Redirect to frontend with installation details
    const frontendUrl = \`https://listings.engageautomations.com/?installation_id=\${installation_id}&welcome=true\`;
    
    res.send(\`<html><head><title>OAuth Success</title></head><body>
      <h2>🎉 OAuth Installation Successful!</h2>
      <p><strong>Installation ID:</strong> \${installation_id}</p>
      <p><strong>Location ID:</strong> \${location_id}</p>
      <p><strong>Token Status:</strong> Valid</p>
      <p><strong>Scopes:</strong> \${scope}</p>
      <p>Redirecting to application in 3 seconds...</p>
      <script>
        console.log('OAuth installation successful:', {
          installation_id: '\${installation_id}',
          location_id: '\${location_id}',
          scopes: '\${scope}'
        });
        setTimeout(() => {
          window.location.href = '\${frontendUrl}';
        }, 3000);
      </script>
    </body></html>\`);
    
  } catch (error) {
    console.error('❌ Token exchange error:', error);
    
    let errorDetails = 'Unknown error';
    let statusCode = 500;
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
      console.error('   Headers:', error.response.headers);
      
      statusCode = error.response.status;
      errorDetails = JSON.stringify(error.response.data, null, 2);
      
      // Check for specific OAuth errors
      if (error.response.status === 401) {
        errorDetails = 'Invalid OAuth credentials - check client_id and client_secret';
      } else if (error.response.status === 400) {
        errorDetails = error.response.data?.error_description || 'Invalid OAuth request';
      }
    }
    
    res.status(statusCode).send(\`<html><head><title>OAuth Failed</title></head><body>
      <h2>❌ OAuth Installation Failed</h2>
      <p><strong>Error:</strong> \${error.message}</p>
      <p><strong>Details:</strong> \${errorDetails}</p>
      <p><strong>Status Code:</strong> \${statusCode}</p>
      <p>Please try the installation again or contact support.</p>
      <a href="https://listings.engageautomations.com">Return to Application</a>
      <br><br>
      <details>
        <summary>Debug Information</summary>
        <pre>
Client ID: \${CLIENT_ID}
Redirect URI: \${REDIRECT_URI}
Authorization Code: \${code?.substring(0, 20)}...
Location ID: \${location_id}
        </pre>
      </details>
    </body></html>\`);
  }
});

// Token Access Bridge for API Backend
app.post('/api/token-access', async (req, res) => {
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    const installation = installations.get(installation_id);
    
    if (!installation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Installation not found',
        hint: 'Please complete OAuth installation first',
        available_installations: Array.from(installations.keys())
      });
    }
    
    // Check if token needs refresh (within 10 minutes of expiry)
    const needsRefresh = (installation.expiresAt - Date.now()) < (10 * 60 * 1000);
    
    if (needsRefresh && installation.refreshToken) {
      console.log(\`🔄 Refreshing token for installation \${installation_id}\`);
      
      try {
        const refreshParams = new URLSearchParams();
        refreshParams.append('client_id', CLIENT_ID);
        refreshParams.append('client_secret', CLIENT_SECRET);
        refreshParams.append('grant_type', 'refresh_token');
        refreshParams.append('refresh_token', installation.refreshToken);
        
        const refreshResponse = await axios.post(
          'https://services.leadconnectorhq.com/oauth/token',
          refreshParams,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json'
            }
          }
        );
        
        const { access_token, refresh_token, expires_in } = refreshResponse.data;
        
        // Update installation with new tokens
        installation.accessToken = access_token;
        installation.refreshToken = refresh_token || installation.refreshToken;
        installation.expiresIn = expires_in;
        installation.expiresAt = Date.now() + (expires_in * 1000);
        installation.lastRefresh = new Date().toISOString();
        installation.tokenStatus = 'refreshed';
        
        installations.set(installation_id, installation);
        
        console.log(\`✅ Token refreshed for installation \${installation_id}\`);
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        installation.tokenStatus = 'refresh_failed';
        installations.set(installation_id, installation);
      }
    }
    
    res.json({
      success: true,
      accessToken: installation.accessToken,
      installation: {
        id: installation.id,
        locationId: installation.locationId,
        tokenStatus: installation.tokenStatus,
        expiresAt: installation.expiresAt,
        scopes: installation.scopes
      }
    });
    
  } catch (error) {
    console.error('Token access error:', error);
    res.status(500).json({
      success: false,
      error: 'Token access failed'
    });
  }
});

// Installation Status with detailed information
app.get('/installations', (req, res) => {
  const installList = Array.from(installations.values()).map(install => ({
    id: install.id,
    locationId: install.locationId,
    tokenStatus: install.tokenStatus,
    createdAt: install.createdAt,
    lastRefresh: install.lastRefresh,
    expiresAt: install.expiresAt,
    scopes: install.scopes
  }));
  
  res.json({
    count: installList.length,
    installations: installList,
    oauth_config: {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI
    }
  });
});

// Debug endpoint for OAuth configuration
app.get('/debug', (req, res) => {
  res.json({
    service: 'OAuth Backend Debug',
    oauth_config: {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      callback_url: 'https://dir.engageautomations.com/api/oauth/callback'
    },
    installations: {
      count: installations.size,
      ids: Array.from(installations.keys())
    },
    last_request: new Date().toISOString()
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Pure OAuth Backend',
    version: '6.0.1-fixed-credentials',
    features: ['oauth-callback', 'token-management', 'api-bridge'],
    installations: installations.size,
    oauth_config: {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI
    },
    timestamp: Date.now()
  });
});

// Root Status
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel OAuth Backend',
    version: '6.0.1-fixed-credentials', 
    purpose: 'OAuth authentication only',
    endpoints: [
      'GET /api/oauth/callback',
      'POST /api/token-access',
      'GET /installations',
      'GET /debug',
      'GET /health'
    ],
    installations: installations.size,
    status: 'operational'
  });
});

app.listen(port, () => {
  console.log(\`Pure OAuth Backend v6.0.1 running on port \${port}\`);
  console.log('Purpose: OAuth authentication and token management only');
  console.log('OAuth Config:', { CLIENT_ID, REDIRECT_URI });
  console.log('API Backend: Separate service handles GoHighLevel API calls');
});`;

    console.log('3. Deploying fixed OAuth backend...');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'index.js',
      message: 'Fix OAuth credentials and enhance error handling',
      content: Buffer.from(fixedOAuthBackend).toString('base64'),
      sha: currentIndex.sha,
      branch
    });
    
    console.log('✅ OAuth Backend credentials fixed!');
    console.log('');
    console.log('🚀 Fix Summary:');
    console.log('   Enhanced error handling for OAuth failures');
    console.log('   Added debug information to error pages');
    console.log('   Better logging for token exchange process');
    console.log('   Debug endpoint: /debug for OAuth configuration');
    console.log('');
    console.log('⏱️ Railway deployment starting...');
    console.log('🔗 Test OAuth: https://dir.engageautomations.com/debug');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Wait for deployment (2-3 minutes)');
    console.log('2. Check /debug endpoint for OAuth configuration');
    console.log('3. Retry OAuth installation');
    
  } catch (error) {
    console.error('❌ Fix deployment error:', error);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.message);
    }
  }
}

fixOAuthCredentials();