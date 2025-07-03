const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage
const installations = new Map();

// OAuth credentials
const CLIENT_ID = '68474924a586bce22a6e64f7';
const CLIENT_SECRET = 'mbpkmyu4';

// OAuth callback with location-level authentication
app.get('/api/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    console.log('🔄 Exchanging code for location-level token...');
    
    // Import fetch dynamically for compatibility
    const fetch = (await import('node-fetch')).default;
    
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
      console.error('Token exchange failed:', errorText);
      return res.status(400).json({ error: 'Token exchange failed' });
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Location-level token received');
    
    // Verify token type
    if (tokenData.access_token) {
      try {
        const tokenParts = tokenData.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('Auth Class:', payload.authClass);
        }
      } catch (e) {
        // Ignore decode errors
      }
    }

    // Store installation
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      location_id: tokenData.location_id,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString()
    };

    installations.set(installationId, installation);
    console.log('Installation stored:', installationId);

    // Redirect to frontend
    const frontendUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&welcome=true`;
    res.redirect(frontendUrl);

  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

// Get token for API calls
app.get('/api/token-access/:id', (req, res) => {
  const installation = installations.get(req.params.id);
  if (!installation) {
    return res.status(404).json({ error: 'Installation not found' });
  }
  
  res.json({
    access_token: installation.access_token,
    location_id: installation.location_id,
    expires_at: installation.expires_at
  });
});

// List installations
app.get('/installations', (req, res) => {
  const list = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    location_id: inst.location_id,
    created_at: inst.created_at,
    active: new Date() < new Date(inst.expires_at)
  }));
  
  res.json({
    count: list.length,
    installations: list
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    version: '8.5.3-minimal-working',
    installations: installations.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`OAuth backend running on port ${PORT}`);
  console.log('Using location-level authentication');
});