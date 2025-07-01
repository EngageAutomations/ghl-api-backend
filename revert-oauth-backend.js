/**
 * Revert OAuth Backend to Pure OAuth Only
 * Removes image upload functionality from OAuth backend - keeps it OAuth-only
 */

import { Octokit } from '@octokit/rest';

async function revertOAuthBackend() {
  console.log('=== Reverting OAuth Backend to OAuth-Only ===');
  
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
    
    console.log('1. Getting current OAuth backend files...');
    
    // Get current index.js
    const { data: currentFile } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'index.js'
    });
    
    console.log('2. Reverting to pure OAuth-only backend...');
    
    // Pure OAuth backend without image upload functionality
    const pureOAuthBackend = `/**
 * OAuth Backend v5.8.0-frontend-redirect (REVERTED)
 * Pure OAuth functionality only - no API endpoints
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// In-memory installations storage
const installations = new Map();

// OAuth environment variables
const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID || 'YOUR_GHL_CLIENT_ID';
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET || 'YOUR_GHL_CLIENT_SECRET';
const GHL_REDIRECT_URI = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/oauth/callback';

// Token refresh utility
async function refreshTokenIfNeeded(installation) {
  const now = Date.now();
  const timeUntilExpiry = installation.expiresAt - now;
  
  // Refresh if expiring within 2 hours
  if (timeUntilExpiry < 2 * 60 * 60 * 1000) {
    console.log('Refreshing token for installation:', installation.id);
    
    try {
      const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: GHL_CLIENT_ID,
          client_secret: GHL_CLIENT_SECRET,
          refresh_token: installation.refreshToken
        })
      });

      if (response.ok) {
        const tokenData = await response.json();
        installation.accessToken = tokenData.access_token;
        installation.expiresAt = now + (tokenData.expires_in * 1000);
        installation.tokenStatus = 'valid';
        
        console.log('✅ Token refreshed successfully');
        return installation.accessToken;
      } else {
        console.error('❌ Token refresh failed:', response.status);
        installation.tokenStatus = 'expired';
        return null;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      installation.tokenStatus = 'error';
      return null;
    }
  }
  
  return installation.accessToken;
}

// OAuth callback - PURE OAuth functionality only
app.get('/oauth/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(\`https://listings.engageautomations.com/?error=\${encodeURIComponent(error)}\`);
  }
  
  if (!code) {
    return res.send('OAuth callback endpoint is working!');
  }
  
  try {
    console.log('🔄 Processing OAuth callback...');
    
    // Exchange code for token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: GHL_CLIENT_ID,
        client_secret: GHL_CLIENT_SECRET,
        code: String(code),
        redirect_uri: GHL_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(\`Token exchange failed: \${tokenResponse.status}\`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Get user info
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': \`Bearer \${tokenData.access_token}\`,
        'Version': '2021-07-28'
      }
    });

    const userData = await userResponse.json();

    // Get location info
    let locationData = null;
    try {
      const locationResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
        headers: {
          'Authorization': \`Bearer \${tokenData.access_token}\`,
          'Version': '2021-07-28'
        }
      });
      
      if (locationResponse.ok) {
        const locationResult = await locationResponse.json();
        if (locationResult.locations && locationResult.locations.length > 0) {
          locationData = locationResult.locations[0];
        }
      }
    } catch (locationError) {
      console.log('Location data not available');
    }

    // Store installation
    const installationId = \`install_\${Date.now()}\`;
    const installation = {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      tokenStatus: 'valid',
      userId: userData.id,
      userEmail: userData.email,
      userName: userData.name || \`\${userData.firstName || ''} \${userData.lastName || ''}\`.trim(),
      locationId: locationData?.id || '',
      locationName: locationData?.name || '',
      scopes: tokenData.scope || '',
      createdAt: new Date().toISOString()
    };
    
    installations.set(installationId, installation);
    
    console.log('✅ Installation stored:', installationId);
    
    // Redirect to frontend
    return res.redirect(\`https://listings.engageautomations.com/?installation_id=\${installationId}&welcome=true\`);
    
  } catch (error) {
    console.error('❌ OAuth error:', error);
    return res.redirect(\`https://listings.engageautomations.com/?error=oauth_failed\`);
  }
});

// Installations endpoint - OAuth backend provides installation data to API backend
app.get('/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    locationId: inst.locationId,
    locationName: inst.locationName,
    userName: inst.userName,
    tokenStatus: inst.tokenStatus,
    createdAt: inst.createdAt,
    expiresAt: inst.expiresAt,
    timeUntilExpiry: inst.expiresAt - Date.now()
  }));
  
  res.json({
    installations: installationList,
    count: installationList.length,
    frontend: 'https://listings.engageautomations.com',
    note: 'OAuth backend - use separate API backend for advanced features'
  });
});

// Token access endpoint - provides tokens to API backend securely
app.post('/api/token-access', async (req, res) => {
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    const installation = installations.get(installation_id);
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }
    
    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(installation);
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        error: 'Token expired or invalid',
        tokenStatus: installation.tokenStatus
      });
    }
    
    // Return token and installation info to API backend
    res.json({
      success: true,
      accessToken: accessToken,
      installation: {
        id: installation.id,
        locationId: installation.locationId,
        userId: installation.userId,
        tokenStatus: installation.tokenStatus
      }
    });
    
  } catch (error) {
    console.error('❌ Token access error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel OAuth Backend',
    version: '5.8.0-frontend-redirect',
    purpose: 'OAuth authentication only',
    endpoints: ['/oauth/callback', '/installations', '/api/token-access'],
    note: 'Use separate API backend for GoHighLevel API operations',
    status: 'operational'
  });
});

app.listen(port, () => {
  console.log(\`OAuth Backend v5.8.0 running on port \${port}\`);
  console.log('Pure OAuth functionality - no API endpoints');
  console.log('Use separate API backend for GoHighLevel operations');
});`;
    
    console.log('3. Reverting package.json to minimal dependencies...');
    
    // Get current package.json
    let packageSha;
    try {
      const { data: currentPackage } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'package.json'
      });
      packageSha = currentPackage.sha;
    } catch (error) {
      console.log('No package.json found');
    }
    
    // Minimal package.json for OAuth only
    const minimalPackage = {
      "name": "oauth-backend",
      "version": "5.8.0",
      "main": "index.js",
      "scripts": {
        "start": "node index.js"
      },
      "dependencies": {
        "express": "^4.18.2"
      },
      "engines": {
        "node": ">=18.0.0"
      }
    };
    
    // Update package.json
    if (packageSha) {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: 'package.json',
        message: 'Revert to minimal OAuth-only dependencies',
        content: Buffer.from(JSON.stringify(minimalPackage, null, 2)).toString('base64'),
        sha: packageSha,
        branch
      });
    }
    
    console.log('4. Deploying reverted OAuth backend...');
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'index.js',
      message: 'REVERT: OAuth backend to pure OAuth-only functionality',
      content: Buffer.from(pureOAuthBackend).toString('base64'),
      sha: currentFile.sha,
      branch
    });
    
    console.log('✅ OAuth backend reverted successfully!');
    console.log('');
    console.log('🔄 Revert Summary:');
    console.log('   OAuth Backend: Pure OAuth functionality only');
    console.log('   Version: v5.8.0-frontend-redirect (restored)');
    console.log('   Dependencies: Minimal (express only)');
    console.log('   Purpose: OAuth authentication and token management');
    console.log('   API Backend: Will handle all GoHighLevel API calls');
    console.log('');
    console.log('⏱️ Railway will redeploy in 2-3 minutes');
    console.log('🔗 OAuth Backend: https://dir.engageautomations.com/');
    
  } catch (error) {
    console.error('❌ Revert error:', error);
  }
}

revertOAuthBackend();