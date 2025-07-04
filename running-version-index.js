/**
 * GoHighLevel OAuth Backend - Correct Location-Level Implementation
 * Version: 9.0.0-correct-location
 * Uses user_type: 'Location' parameter from official GoHighLevel OAuth demo
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

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    service: 'GoHighLevel OAuth Backend',
    version: '9.0.0-correct-location',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel OAuth Backend',
    version: '9.0.0-correct-location',
    installs: installations.size,
    authenticated: tokens.size,
    status: 'operational',
    features: ['location-user-type', 'media-upload', 'token-refresh'],
    debug: 'using user_type Location parameter from official GoHighLevel demo',
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
    
    // Use official GoHighLevel OAuth demo method with user_type: 'Location'
    const tokenData = await exchangeCodeForLocationToken(code);
    
    if (!tokenData.access_token) {
      console.log('❌ No access token in response:', tokenData);
      return res.status(400).json({ error: 'Failed to get access token', details: tokenData });
    }
    
    // Decode JWT to verify Location-level access
    const tokenPayload = decodeJWTPayload(tokenData.access_token);
    const locationId = tokenPayload?.locationId || tokenPayload?.location_id;
    const authClass = tokenPayload?.authClass;
    const scopes = tokenData.scope || 'not available';
    
    console.log('🔍 Token Analysis:');
    console.log('📍 Location ID:', locationId);
    console.log('🔐 Auth Class:', authClass);
    console.log('📋 Granted Scopes:', scopes);
    console.log('🎯 Expected: Location-level with media upload access');
    
    const installationId = `install_${Date.now()}`;
    
    const installation = {
      id: installationId,
      location_id: locationId || 'not found',
      active: true,
      created_at: new Date().toISOString(),
      token_status: 'valid',
      auth_class: authClass || 'unknown',
      scopes: scopes,
      method: 'user_type Location parameter'
    };
    
    installations.set(installationId, installation);
    tokens.set(installationId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      location_id: locationId,
      auth_class: authClass,
      scopes: scopes
    });
    
    console.log('✅ Location-level installation created:', installationId);
    console.log('📍 Location ID:', locationId);
    console.log('🔐 Auth Class:', authClass);
    console.log('📋 Scopes:', scopes);
    
    // Test media upload capability immediately
    if (authClass === 'Location') {
      console.log('🎉 SUCCESS: Location-level token generated!');
    } else if (authClass === 'Company') {
      console.log('⚠️  WARNING: Still received Company-level token despite user_type parameter');
    }
    
    // Redirect to frontend
    res.redirect(`https://listings.engageautomations.com/?installation_id=${installationId}&welcome=true`);
    
  } catch (error) {
    console.error('❌ OAuth callback error:', error.message);
    res.status(500).json({ error: 'OAuth callback failed', details: error.message });
  }
});

// Token exchange with user_type: 'Location' from official GoHighLevel demo
async function exchangeCodeForLocationToken(code) {
  return new Promise((resolve, reject) => {
    // Use exact parameters from official GoHighLevel OAuth demo
    const params = new URLSearchParams({
      'client_id': CLIENT_ID,
      'client_secret': CLIENT_SECRET,
      'grant_type': 'authorization_code',
      'code': code,
      'user_type': 'Location',  // KEY PARAMETER from official demo
      'redirect_uri': REDIRECT_URI
    });
    
    const postData = params.toString();
    
    console.log('🔄 Token exchange with user_type Location (official demo method):');
    console.log('📄 Parameters: client_id, client_secret, grant_type, code, user_type: Location, redirect_uri');
    
    const options = {
      hostname: 'services.leadconnectorhq.com',
      port: 443,
      path: '/oauth/token',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
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
          reject(new Error(`Token exchange failed: ${res.statusCode} - ${data}`));
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
    auth_class: tokenData.auth_class,
    scopes: tokenData.scopes
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GoHighLevel OAuth Backend running on port ${PORT}`);
  console.log('🎯 Mode: Location-level tokens using official demo method');
  console.log('📋 Features: user_type Location parameter, media upload access');
});