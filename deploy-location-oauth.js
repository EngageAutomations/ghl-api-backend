/**
 * Deploy Location-Level OAuth Backend
 * Attempt to get Location-level tokens through proper OAuth configuration
 */

import fs from 'fs';
import { Octokit } from '@octokit/rest';

async function deployLocationOAuth() {
  console.log('🎯 DEPLOYING LOCATION-LEVEL OAUTH BACKEND');
  console.log('='.repeat(50));
  
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.log('❌ GITHUB_TOKEN not found');
      return;
    }

    const octokit = new Octokit({ auth: githubToken });
    const owner = 'EngageAutomations';
    const repo = 'oauth-backend';
    
    // Create OAuth backend that properly requests Location-level tokens
    const locationOAuthBackend = `/**
 * GoHighLevel OAuth Backend - Location-Level Access
 * Version: 8.8.0-location-access
 * Properly configured for Location-level token generation
 */

const express = require('express');
const https = require('https');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// OAuth Credentials - verified working
const CLIENT_ID = '68474924a586bce22a6e64f7-mbpkmyu4';
const CLIENT_SECRET = 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
const REDIRECT_URI = 'https://dir.engageautomations.com/api/oauth/callback';

// In-memory storage
const installations = new Map();
const tokens = new Map();

app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel OAuth Backend',
    version: '8.8.0-location-access',
    installs: installations.size,
    authenticated: tokens.size,
    status: 'operational',
    features: ['location-oauth', 'token-refresh', 'media-access'],
    debug: 'configured for Location-level token generation',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/installations', (req, res) => {
  const installList = Array.from(installations.values());
  res.json({
    count: installList.length,
    installations: installList
  });
});

// OAuth authorization - redirect to GoHighLevel with Location-level scope
app.get('/api/oauth/authorize', (req, res) => {
  console.log('🔄 Initiating Location-level OAuth authorization');
  
  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'locations.readonly locations.write medias.write medias.readonly products.write products.readonly', // Location-specific scopes
    access_type: 'offline', // Request refresh token
    state: req.query.state || 'location_level_auth'
  });
  
  const authUrl = \`https://marketplace.gohighlevel.com/oauth/chooselocation?\${authParams.toString()}\`;
  
  console.log('📄 Authorization URL:', authUrl);
  res.redirect(authUrl);
});

app.get('/api/oauth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  console.log('🔄 OAuth callback received');
  console.log('📄 Code:', code ? 'present' : 'missing');
  console.log('📄 State:', state);
  
  if (!code) {
    console.log('❌ No authorization code received');
    return res.status(400).json({ error: 'No authorization code received' });
  }

  try {
    console.log('🔄 Exchanging code for Location-level token...');
    
    // Exchange code for Location-level token
    const tokenData = await exchangeForLocationToken(code);
    
    if (!tokenData.access_token) {
      console.log('❌ No access token in response:', tokenData);
      return res.status(400).json({ error: 'Failed to get access token', details: tokenData });
    }
    
    // Extract token details
    const tokenPayload = decodeJWTPayload(tokenData.access_token);
    const locationId = tokenPayload?.locationId || tokenPayload?.location_id;
    const authClass = tokenPayload?.authClass;
    
    console.log('🔍 Token payload analysis:');
    console.log('📍 Location ID:', locationId);
    console.log('🔐 Auth Class:', authClass);
    console.log('📄 Full payload:', tokenPayload);
    
    const installationId = \`install_\${Date.now()}\`;
    
    const installation = {
      id: installationId,
      location_id: locationId || 'not found',
      active: true,
      created_at: new Date().toISOString(),
      token_status: 'valid',
      auth_class: authClass || 'unknown',
      scopes: tokenData.scope || 'not available'
    };
    
    installations.set(installationId, installation);
    tokens.set(installationId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      location_id: locationId,
      auth_class: authClass
    });
    
    console.log('✅ Location-level installation created:', installationId);
    console.log('📍 Location ID:', locationId);
    console.log('🔐 Auth Class:', authClass);
    
    // Redirect to frontend
    res.redirect(\`https://listings.engageautomations.com/?installation_id=\${installationId}&welcome=true\`);
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error.message);
    res.status(500).json({ error: 'OAuth callback failed', details: error.message });
  }
});

// Token exchange with Location-level request
async function exchangeForLocationToken(code) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: REDIRECT_URI,
      scope: 'locations.readonly locations.write medias.write medias.readonly products.write products.readonly' // Request Location-level scopes
    });
    
    const postData = params.toString();
    
    console.log('🔄 Token exchange request for Location-level access:');
    console.log('📄 Scope: Location-level permissions requested');
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('📄 Token exchange response status:', res.statusCode);
        console.log('📄 Token exchange response:', data);
        
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(\`Token exchange failed: \${res.statusCode} - \${data}\`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Token exchange request error:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

function decodeJWTPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('❌ Error decoding JWT payload:', error);
    return null;
  }
}

app.get('/api/token-access/:installationId', (req, res) => {
  const { installationId } = req.params;
  const tokenData = tokens.get(installationId);
  
  if (!tokenData) {
    return res.status(404).json({ error: 'Installation not found' });
  }
  
  // Check if token is expired
  if (Date.now() > tokenData.expires_at) {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  res.json({
    access_token: tokenData.access_token,
    token_type: 'Bearer',
    expires_in: Math.floor((tokenData.expires_at - Date.now()) / 1000),
    location_id: tokenData.location_id,
    auth_class: tokenData.auth_class
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 GoHighLevel OAuth Backend running on port \${PORT}\`);
  console.log('🎯 Mode: Location-level token generation');
  console.log('📊 Features: Location-specific scopes, media upload access');
});`;
    
    console.log('1. Creating Location-level OAuth backend...');
    
    await updateFile(octokit, owner, repo, 'index.js', locationOAuthBackend, 
      'Deploy Location-Level OAuth v8.8.0 - Proper Location token configuration');
    
    console.log('✅ Location-level OAuth backend deployed!');
    console.log('');
    console.log('🎯 LOCATION-LEVEL FEATURES:');
    console.log('• Authorization with Location-specific scopes');
    console.log('• Token exchange requests Location-level permissions');
    console.log('• Enhanced JWT payload analysis and logging');
    console.log('• Explicit Location-level scope configuration');
    console.log('• Version: 8.8.0-location-access');
    console.log('');
    console.log('📋 LOCATION-SPECIFIC SCOPES:');
    console.log('• locations.readonly, locations.write');
    console.log('• medias.write, medias.readonly');
    console.log('• products.write, products.readonly');
    console.log('');
    console.log('⚠️  FRESH OAUTH INSTALLATION REQUIRED');
    console.log('Use authorization endpoint: /api/oauth/authorize');
    console.log('Or direct URL: https://marketplace.gohighlevel.com/app/68474924a586bce22a6e64f7');
    
  } catch (error) {
    console.error('❌ Location OAuth deployment failed:', error.message);
  }
}

async function updateFile(octokit, owner, repo, path, content, message) {
  try {
    let sha;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });
      sha = data.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
      sha
    });
    
    console.log(`✅ Updated ${path}`);
    
  } catch (error) {
    console.error(`❌ Failed to update ${path}:`, error.message);
    throw error;
  }
}

deployLocationOAuth().catch(console.error);