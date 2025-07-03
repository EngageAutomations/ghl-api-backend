const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for installations
const installations = new Map();

// OAuth credentials
const CLIENT_ID = '68474924a586bce22a6e64f7';
const CLIENT_SECRET = 'mbpkmyu4';

// OAuth callback with location-level authentication
app.get('/api/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    console.error('❌ No authorization code provided');
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    console.log('🔄 Exchanging authorization code for LOCATION-LEVEL tokens...');
    
    // Use user_type: "location" for location-level authentication
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        user_type: 'location',
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorText);
      return res.status(400).json({ error: 'Token exchange failed', details: errorText });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Location-level token exchange successful');
    
    // Extract location_id from response
    const locationId = tokenData.location_id;
    console.log('🎯 LOCATION ID:', locationId);
    
    // Verify token is location-level
    if (tokenData.access_token) {
      try {
        const tokenParts = tokenData.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('🔍 Token verification:');
          console.log('   Auth Class:', payload.authClass);
          console.log('   Location ID:', payload.authClassId);
          
          if (payload.authClass === 'Location') {
            console.log('✅ SUCCESS: Token is Location-level!');
          } else {
            console.log('⚠️  WARNING: Still getting Company-level token');
          }
        }
      } catch (decodeError) {
        console.log('⚠️  Could not decode token');
      }
    }

    // Create installation record
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      location_id: locationId,
      auth_level: 'location',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
    };

    installations.set(installationId, installation);
    
    console.log('💾 Location-level installation stored:', installationId);

    // Redirect to frontend
    const frontendUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&welcome=true&auth_level=location`;
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed', details: error.message });
  }
});

// Get installation by ID
app.get('/api/installation/:id', (req, res) => {
  const installation = installations.get(req.params.id);
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }
  
  res.json({
    id: installation.id,
    location_id: installation.location_id,
    auth_level: installation.auth_level,
    created_at: installation.created_at,
    expires_at: installation.expires_at,
    active: new Date() < new Date(installation.expires_at)
  });
});

// Get access token for API calls
app.get('/api/token-access/:id', (req, res) => {
  const installation = installations.get(req.params.id);
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }
  
  if (new Date() >= new Date(installation.expires_at)) {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  res.json({
    access_token: installation.access_token,
    location_id: installation.location_id,
    auth_level: installation.auth_level,
    expires_at: installation.expires_at
  });
});

// List all installations
app.get('/installations', (req, res) => {
  const installationList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    location_id: inst.location_id,
    auth_level: inst.auth_level,
    created_at: inst.created_at,
    expires_at: inst.expires_at,
    active: new Date() < new Date(inst.expires_at)
  }));
  
  res.json({
    count: installationList.length,
    installations: installationList
  });
});

// Token refresh
async function refreshAccessToken(installationId) {
  const installation = installations.get(installationId);
  if (!installation) return;

  try {
    console.log(`🔄 Refreshing location-level token for ${installationId}`);
    
    const refreshResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: installation.refresh_token,
        user_type: 'location'
      }).toString()
    });

    if (refreshResponse.ok) {
      const newTokenData = await refreshResponse.json();
      
      installation.access_token = newTokenData.access_token;
      installation.expires_in = newTokenData.expires_in;
      installation.expires_at = new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString();
      
      if (newTokenData.location_id) {
        installation.location_id = newTokenData.location_id;
      }
      
      if (newTokenData.refresh_token) {
        installation.refresh_token = newTokenData.refresh_token;
      }
      
      installations.set(installationId, installation);
      console.log(`✅ Location-level token refreshed for ${installationId}`);
    }
  } catch (error) {
    console.error(`❌ Token refresh error for ${installationId}:`, error);
  }
}

// Background token refresh
cron.schedule('*/10 * * * *', () => {
  const now = new Date();
  
  for (const [id, installation] of installations) {
    const expiryTime = new Date(installation.expires_at);
    const timeUntilExpiry = expiryTime - now;
    const tenMinutes = 10 * 60 * 1000;
    
    if (timeUntilExpiry < tenMinutes && timeUntilExpiry > 0) {
      refreshAccessToken(id);
    }
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    version: '8.5.2-location-working',
    installations: installations.size,
    auth_type: 'location',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OAuth backend running on port ${PORT}`);
  console.log('📍 Version: 8.5.2-location-working');
  console.log('✅ Using LOCATION-LEVEL authentication');
});