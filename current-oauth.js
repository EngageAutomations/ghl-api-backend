/**
 * Pure OAuth Backend - Correct Credentials
 * Uses the correct GoHighLevel OAuth credentials
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

// GoHighLevel OAuth Configuration - CORRECT CREDENTIALS
const CLIENT_ID = '68474924a586bce22a6e64f7-mbpkmyu4';
const CLIENT_SECRET = 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
const REDIRECT_URI = 'https://dir.engageautomations.com/api/oauth/callback';

// Enhanced OAuth Callback Handler
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAuth Callback Received ===');
  console.log('Query params:', req.query);
  
  const { code, location_id, error, error_description } = req.query;
  
  if (error) {
    console.log('❌ OAuth error:', error, error_description);
    return res.status(400).send(`<html><body>
      <h2>OAuth Error</h2>
      <p>Error: ${error}</p>
      <p>Description: ${error_description}</p>
      <a href="https://listings.engageautomations.com">Return to Application</a>
    </body></html>`);
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
    const installation_id = `install_${Date.now()}`;
    
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
    
    console.log(`✅ Installation ${installation_id} stored successfully`);
    console.log('   Total installations:', installations.size);
    
    // Redirect to frontend with installation details
    const frontendUrl = `https://listings.engageautomations.com/?installation_id=${installation_id}&welcome=true`;
    
    res.send(`<html><head><title>OAuth Success</title></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
      <div style="text-align: center; background: #f0f9ff; padding: 30px; border-radius: 10px; border: 2px solid #0ea5e9;">
        <h2 style="color: #0ea5e9; margin-bottom: 20px;">🎉 OAuth Installation Successful!</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Installation ID:</strong> <code>${installation_id}</code></p>
          <p><strong>Location ID:</strong> <code>${location_id}</code></p>
          <p><strong>Token Status:</strong> <span style="color: green;">✅ Valid</span></p>
          <p><strong>Scopes:</strong> <code>${scope}</code></p>
        </div>
        <p style="color: #666;">Redirecting to application in 3 seconds...</p>
        <div style="margin-top: 20px;">
          <a href="${frontendUrl}" style="background: #0ea5e9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Application</a>
        </div>
      </div>
      <script>
        console.log('OAuth installation successful:', {
          installation_id: '${installation_id}',
          location_id: '${location_id}',
          scopes: '${scope}'
        });
        setTimeout(() => {
          window.location.href = '${frontendUrl}';
        }, 3000);
      </script>
    </body></html>`);
    
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
    
    res.status(statusCode).send(`<html><head><title>OAuth Failed</title></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
      <div style="text-align: center; background: #fef2f2; padding: 30px; border-radius: 10px; border: 2px solid #ef4444;">
        <h2 style="color: #ef4444;">❌ OAuth Installation Failed</h2>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Details:</strong> ${errorDetails}</p>
          <p><strong>Status Code:</strong> ${statusCode}</p>
        </div>
        <p>Please try the installation again or contact support.</p>
        <a href="https://listings.engageautomations.com" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to Application</a>
        
        <details style="margin-top: 20px; text-align: left;">
          <summary style="cursor: pointer; font-weight: bold;">Debug Information</summary>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;">
Client ID: ${CLIENT_ID}
Redirect URI: ${REDIRECT_URI}
Authorization Code: ${code?.substring(0, 20)}...
Location ID: ${location_id}
          </pre>
        </details>
      </div>
    </body></html>`);
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
      console.log(`🔄 Refreshing token for installation ${installation_id}`);
      
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
        
        console.log(`✅ Token refreshed for installation ${installation_id}`);
        
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

// Installation Status
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

// Debug endpoint
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
    version: '6.1.0-correct-credentials',
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
    version: '6.1.0-correct-credentials', 
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
  console.log(`Pure OAuth Backend v6.1.0 running on port ${port}`);
  console.log('OAuth Credentials: UPDATED with correct client_id and client_secret');
  console.log('Purpose: OAuth authentication and token management only');
  console.log('API Backend: Separate service handles GoHighLevel API calls');
});