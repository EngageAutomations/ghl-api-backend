/**
 * Enhanced OAuth Dual-Domain Architecture for Railway
 * Production-ready GoHighLevel marketplace application
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('@neondatabase/serverless');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Enhanced CORS for dual-domain architecture
app.use(cors({
  origin: [
    'https://listings.engageautomations.com',
    'https://dir.engageautomations.com', 
    /\.replit\.app$/,
    /\.repl\.co$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-location-id']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// OAuth Installation Storage
class OAuthStorage {
  async createInstallation(data) {
    const query = `
      INSERT INTO oauth_installations (
        ghl_user_id, ghl_user_name, ghl_user_email, ghl_user_phone,
        ghl_location_id, ghl_location_name, ghl_access_token, ghl_refresh_token,
        ghl_scopes, installation_date, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), true)
      RETURNING *
    `;
    
    const values = [
      data.ghl_user_id, data.ghl_user_name, data.ghl_user_email, data.ghl_user_phone,
      data.ghl_location_id, data.ghl_location_name, data.ghl_access_token, 
      data.ghl_refresh_token, data.ghl_scopes
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getInstallationByUserId(userId) {
    const query = 'SELECT * FROM oauth_installations WHERE ghl_user_id = $1 AND is_active = true';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async getAllInstallations() {
    const query = 'SELECT * FROM oauth_installations WHERE is_active = true ORDER BY installation_date DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  async updateTokens(userId, tokenData) {
    const query = `
      UPDATE oauth_installations 
      SET ghl_access_token = $2, ghl_refresh_token = $3, last_token_refresh = NOW()
      WHERE ghl_user_id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [userId, tokenData.access_token, tokenData.refresh_token]);
    return result.rows[0];
  }
}

const storage = new OAuthStorage();

// Enhanced OAuth Callback with PKCE Support
app.get('/api/oauth/callback', async (req, res) => {
  console.log('🔐 Enhanced OAuth Callback - Railway Production');
  
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect(`https://listings.engageautomations.com/?oauth_error=${error}`);
  }

  if (!code) {
    console.error('No authorization code received');
    return res.redirect('https://listings.engageautomations.com/?oauth_error=no_code');
  }

  try {
    console.log('🔄 Exchanging authorization code for tokens...');
    
    // Token exchange
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GHL_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful');

    // Get user information
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`User info fetch failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('👤 User information retrieved');

    // Get location information
    const locationResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Version': '2021-07-28'
      }
    });

    let locationData = null;
    if (locationResponse.ok) {
      const locationsData = await locationResponse.json();
      if (locationsData.locations && locationsData.locations.length > 0) {
        locationData = locationsData.locations[0];
      }
    }

    // Store installation in database
    const installationData = {
      ghl_user_id: userData.id,
      ghl_user_name: userData.name,
      ghl_user_email: userData.email,
      ghl_user_phone: userData.phone,
      ghl_location_id: locationData?.id || 'unknown',
      ghl_location_name: locationData?.name || 'Unknown Location',
      ghl_access_token: tokenData.access_token,
      ghl_refresh_token: tokenData.refresh_token,
      ghl_scopes: tokenData.scope
    };

    const installation = await storage.createInstallation(installationData);
    console.log('✅ Installation stored in database');

    // Redirect to success page with installation ID
    res.redirect(`https://listings.engageautomations.com/?oauth_success=true&installation_id=${installation.id}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`https://listings.engageautomations.com/?oauth_error=${encodeURIComponent(error.message)}`);
  }
});

// Universal API Router for GoHighLevel endpoints
app.all('/api/ghl/*', async (req, res) => {
  console.log('🌐 Universal API Router hit:', req.method, req.path);
  
  try {
    // Extract endpoint path
    const endpoint = req.path.replace('/api/ghl', '');
    
    // Get authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No access token provided' });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    
    // Get location ID from header or query
    const locationId = req.headers['x-location-id'] || req.query.locationId;
    
    // Build GoHighLevel URL
    let ghlUrl = `https://services.leadconnectorhq.com${endpoint}`;
    
    // Add location ID to URL if required and not already present
    if (locationId && !endpoint.includes('locationId') && !endpoint.startsWith('/users') && !endpoint.startsWith('/oauth')) {
      const separator = ghlUrl.includes('?') ? '&' : '?';
      ghlUrl += `${separator}locationId=${locationId}`;
    }

    // Forward request to GoHighLevel
    const options = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    };

    if (req.body && Object.keys(req.body).length > 0) {
      options.body = JSON.stringify(req.body);
    }

    const ghlResponse = await fetch(ghlUrl, options);
    const ghlData = await ghlResponse.json();

    if (ghlResponse.ok) {
      res.json(ghlData);
    } else {
      res.status(ghlResponse.status).json(ghlData);
    }

  } catch (error) {
    console.error('Universal API Router error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Installation management endpoints
app.get('/api/installations', async (req, res) => {
  try {
    const installations = await storage.getAllInstallations();
    res.json(installations);
  } catch (error) {
    console.error('Get installations error:', error);
    res.status(500).json({ error: 'Failed to retrieve installations' });
  }
});

app.get('/api/installations/:userId', async (req, res) => {
  try {
    const installation = await storage.getInstallationByUserId(req.params.userId);
    if (installation) {
      res.json(installation);
    } else {
      res.status(404).json({ error: 'Installation not found' });
    }
  } catch (error) {
    console.error('Get installation error:', error);
    res.status(500).json({ error: 'Failed to retrieve installation' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Enhanced OAuth Dual-Domain Architecture',
    version: '2.0',
    timestamp: new Date().toISOString() 
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel Enhanced OAuth Backend',
    version: '2.0',
    features: [
      'PKCE OAuth Flow',
      'Universal API Router',
      'Session Recovery',
      'Token Management',
      'Cross-Device Compatibility'
    ],
    endpoints: {
      oauth: '/api/oauth/callback',
      api: '/api/ghl/*',
      installations: '/api/installations',
      health: '/health'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Enhanced OAuth Backend running on port ${port}`);
  console.log('🔐 PKCE OAuth Flow enabled');
  console.log('🌐 Universal API Router active');
  console.log('💾 Database connection established');
});

module.exports = app;
