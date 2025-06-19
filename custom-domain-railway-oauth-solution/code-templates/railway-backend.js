/**
 * Railway OAuth Backend Template
 * Complete backend for handling GoHighLevel OAuth flows and token storage
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_DOMAIN || 'https://your-custom-domain.com',
    process.env.REPLIT_DOMAIN || 'https://your-replit-domain.replit.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-ghl-locationid']
};

app.use(cors(corsOptions));

// Database initialization
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oauth_installations (
        id SERIAL PRIMARY KEY,
        ghl_user_id VARCHAR(255) UNIQUE NOT NULL,
        ghl_user_email VARCHAR(255),
        ghl_user_name VARCHAR(255),
        ghl_user_phone VARCHAR(255),
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        location_id VARCHAR(255),
        location_name VARCHAR(255),
        installation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ghl_user_id ON oauth_installations(ghl_user_id);
      CREATE INDEX IF NOT EXISTS idx_location_id ON oauth_installations(location_id);
      CREATE INDEX IF NOT EXISTS idx_access_token ON oauth_installations(access_token);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// OAuth Storage Class
class OAuthStorage {
  async createInstallation(installationData) {
    const query = `
      INSERT INTO oauth_installations (
        ghl_user_id, ghl_user_email, ghl_user_name, ghl_user_phone,
        access_token, refresh_token, token_expires_at,
        location_id, location_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (ghl_user_id) 
      DO UPDATE SET
        ghl_user_email = EXCLUDED.ghl_user_email,
        ghl_user_name = EXCLUDED.ghl_user_name,
        ghl_user_phone = EXCLUDED.ghl_user_phone,
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        location_id = EXCLUDED.location_id,
        location_name = EXCLUDED.location_name,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      installationData.ghl_user_id,
      installationData.ghl_user_email,
      installationData.ghl_user_name,
      installationData.ghl_user_phone,
      installationData.access_token,
      installationData.refresh_token,
      installationData.token_expires_at,
      installationData.location_id,
      installationData.location_name
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getInstallationByUserId(ghlUserId) {
    const query = 'SELECT * FROM oauth_installations WHERE ghl_user_id = $1';
    const result = await pool.query(query, [ghlUserId]);
    return result.rows[0];
  }

  async getAllInstallations() {
    const query = 'SELECT * FROM oauth_installations ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  async updateTokens(ghlUserId, tokenData) {
    const query = `
      UPDATE oauth_installations 
      SET access_token = $2, refresh_token = $3, token_expires_at = $4, updated_at = NOW()
      WHERE ghl_user_id = $1
      RETURNING *;
    `;
    
    const values = [
      ghlUserId,
      tokenData.access_token,
      tokenData.refresh_token,
      tokenData.token_expires_at
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

const storage = new OAuthStorage();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// OAuth start endpoint
app.get('/api/oauth/start', (req, res) => {
  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(process.env.GHL_REDIRECT_URI)}&client_id=${process.env.GHL_CLIENT_ID}&scope=contacts.readonly contacts.write locations.readonly locations.write products.readonly products.write media.readonly media.write`;
  
  res.redirect(authUrl);
});

// OAuth callback endpoint
app.get('/api/oauth/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user information
    const userResponse = await axios.get('https://services.leadconnectorhq.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const userData = userResponse.data;

    // Get location information
    const locationsResponse = await axios.get('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Version': '2021-07-28'
      }
    });

    const locations = locationsResponse.data.locations || [];
    const primaryLocation = locations[0] || {};

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

    // Store installation data
    const installationData = {
      ghl_user_id: userData.id,
      ghl_user_email: userData.email,
      ghl_user_name: userData.name,
      ghl_user_phone: userData.phone,
      access_token: access_token,
      refresh_token: refresh_token,
      token_expires_at: tokenExpiresAt,
      location_id: primaryLocation.id,
      location_name: primaryLocation.name
    };

    const savedInstallation = await storage.createInstallation(installationData);
    
    console.log('OAuth installation saved:', {
      userId: userData.id,
      locationId: primaryLocation.id,
      installationId: savedInstallation.id
    });

    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_DOMAIN || 'https://your-custom-domain.com'}/oauth-success?installation_id=${savedInstallation.id}`);

  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'OAuth callback failed',
      details: error.response?.data || error.message
    });
  }
});

// Get installations endpoint
app.get('/api/installations', async (req, res) => {
  try {
    const installations = await storage.getAllInstallations();
    
    // Remove sensitive data from response
    const sanitizedInstallations = installations.map(installation => ({
      id: installation.id,
      ghl_user_id: installation.ghl_user_id,
      ghl_user_email: installation.ghl_user_email,
      ghl_user_name: installation.ghl_user_name,
      location_id: installation.location_id,
      location_name: installation.location_name,
      installation_date: installation.installation_date,
      token_expires_at: installation.token_expires_at,
      // Note: access_token and refresh_token are intentionally excluded
    }));

    res.json({ installations: sanitizedInstallations });
  } catch (error) {
    console.error('Error fetching installations:', error);
    res.status(500).json({ error: 'Failed to fetch installations' });
  }
});

// Get specific installation
app.get('/api/installations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const installation = await storage.getInstallationByUserId(userId);
    
    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    // Include access token for authenticated requests
    res.json({ installation });
  } catch (error) {
    console.error('Error fetching installation:', error);
    res.status(500).json({ error: 'Failed to fetch installation' });
  }
});

// Token refresh endpoint
app.post('/api/oauth/refresh', async (req, res) => {
  const { refresh_token, user_id } = req.body;

  if (!refresh_token || !user_id) {
    return res.status(400).json({ error: 'Refresh token and user ID required' });
  }

  try {
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token: new_refresh_token, expires_in } = tokenResponse.data;
    const tokenExpiresAt = new Date(Date.now() + (expires_in * 1000));

    // Update tokens in database
    const updatedInstallation = await storage.updateTokens(user_id, {
      access_token,
      refresh_token: new_refresh_token || refresh_token,
      token_expires_at: tokenExpiresAt
    });

    res.json({ 
      success: true,
      access_token,
      expires_at: tokenExpiresAt
    });

  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Token refresh failed',
      details: error.response?.data || error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const port = process.env.PORT || 3000;

async function startServer() {
  await initializeDatabase();
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Railway OAuth Backend running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`GHL Client ID: ${process.env.GHL_CLIENT_ID ? 'configured' : 'missing'}`);
    console.log(`GHL Redirect URI: ${process.env.GHL_REDIRECT_URI}`);
  });
}

startServer().catch(console.error);

module.exports = app;