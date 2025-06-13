// Complete OAuth Backend for Railway Deployment with Database Integration
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { eq, desc } = require('drizzle-orm');
const { pgTable, serial, text, boolean, timestamp, integer } = require('drizzle-orm/pg-core');
const ws = require('ws');

// Database setup
neonConfig.webSocketConstructor = ws;

// Database schema
const oauthInstallations = pgTable('oauth_installations', {
  id: serial('id').primaryKey(),
  ghlUserId: text('ghl_user_id').notNull(),
  ghlUserEmail: text('ghl_user_email'),
  ghlUserName: text('ghl_user_name'),
  ghlUserPhone: text('ghl_user_phone'),
  ghlUserCompany: text('ghl_user_company'),
  ghlLocationId: text('ghl_location_id'),
  ghlLocationName: text('ghl_location_name'),
  ghlLocationBusinessType: text('ghl_location_business_type'),
  ghlLocationAddress: text('ghl_location_address'),
  ghlAccessToken: text('ghl_access_token').notNull(),
  ghlRefreshToken: text('ghl_refresh_token'),
  ghlTokenType: text('ghl_token_type').default('Bearer'),
  ghlExpiresIn: integer('ghl_expires_in').default(3600),
  ghlScopes: text('ghl_scopes'),
  isActive: boolean('is_active').default(true),
  installationDate: timestamp('installation_date').defaultNow(),
  lastTokenRefresh: timestamp('last_token_refresh'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Database connection
let db;
if (process.env.DATABASE_URL) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema: { oauthInstallations } });
  console.log('✅ Database connection established');
} else {
  console.warn('⚠️ DATABASE_URL not found - database operations will fail');
}

// Storage functions
const storage = {
  async createInstallation(installationData) {
    if (!db) throw new Error('Database not connected');
    const [installation] = await db
      .insert(oauthInstallations)
      .values(installationData)
      .returning();
    return installation;
  },

  async getAllInstallations() {
    if (!db) throw new Error('Database not connected');
    return await db
      .select()
      .from(oauthInstallations)
      .orderBy(desc(oauthInstallations.installationDate));
  },

  async getInstallationByUserId(ghlUserId) {
    if (!db) throw new Error('Database not connected');
    const [installation] = await db
      .select()
      .from(oauthInstallations)
      .where(eq(oauthInstallations.ghlUserId, ghlUserId))
      .orderBy(desc(oauthInstallations.installationDate))
      .limit(1);
    return installation;
  }
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'GHL OAuth Backend', timestamp: new Date().toISOString() });
});

// OAuth URL generation endpoint
app.get('/api/oauth/url', (req, res) => {
  console.log('=== GENERATING OAUTH URL ===');
  
  const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
  const redirectUri = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';
  const scopes = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write';
  
  // Generate state for security
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Build OAuth URL
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}`;
  
  console.log('Generated OAuth URL:', authUrl);
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state,
    timestamp: Date.now()
  });
});

// OAuth callback endpoint - Complete token exchange handler
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== RAILWAY OAUTH CALLBACK ===');
  console.log('Query params:', req.query);

  const { code, state, error } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error from GoHighLevel:', error);
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(error)}`;
    return res.redirect(errorUrl);
  }

  // Validate authorization code
  if (!code) {
    console.error('Missing authorization code');
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent('Missing authorization code')}`;
    return res.redirect(errorUrl);
  }

  try {
    console.log('=== EXCHANGING CODE FOR TOKEN ===');
    console.log('Authorization code:', code);

    // Exchange authorization code for access token
    const tokenRequest = {
      grant_type: 'authorization_code',
      client_id: process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4',
      client_secret: process.env.GHL_CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback'
    };

    console.log('Token request payload:', {
      grant_type: tokenRequest.grant_type,
      client_id: tokenRequest.client_id,
      client_secret: tokenRequest.client_secret ? '[HIDDEN]' : 'MISSING',
      code: tokenRequest.code,
      redirect_uri: tokenRequest.redirect_uri
    });

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', tokenRequest, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    console.log('Token exchange successful:', {
      access_token: response.data.access_token ? '[RECEIVED]' : 'MISSING',
      refresh_token: response.data.refresh_token ? '[RECEIVED]' : 'MISSING',
      expires_in: response.data.expires_in,
      scope: response.data.scope
    });

    // Get user info to extract locationId and companyId
    let userInfo = null;
    try {
      const userResponse = await axios.get('https://services.leadconnectorhq.com/oauth/userinfo', {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        },
        timeout: 5000
      });
      userInfo = userResponse.data;
      console.log('User info retrieved:', {
        locationId: userInfo.locationId,
        companyId: userInfo.companyId
      });
    } catch (userError) {
      console.warn('Failed to get user info:', userError.message);
    }

    // Store OAuth installation data in database
    try {
      console.log('=== STORING OAUTH INSTALLATION ===');
      
      // Fetch additional user data from GoHighLevel API
      let userData = null;
      try {
        const userDataResponse = await axios.get('https://services.leadconnectorhq.com/users/me', {
          headers: {
            'Authorization': `Bearer ${response.data.access_token}`,
            'Version': '2021-07-28'
          },
          timeout: 5000
        });
        userData = userDataResponse.data;
        console.log('User data retrieved:', {
          id: userData.id,
          email: userData.email,
          name: userData.name
        });
      } catch (userError) {
        console.warn('Failed to get detailed user data:', userError.message);
      }

      // Fetch location data if locationId is available
      let locationData = null;
      if (userInfo?.locationId) {
        try {
          const locationResponse = await axios.get(`https://services.leadconnectorhq.com/locations/${userInfo.locationId}`, {
            headers: {
              'Authorization': `Bearer ${response.data.access_token}`,
              'Version': '2021-07-28'
            },
            timeout: 5000
          });
          locationData = locationResponse.data.location;
          console.log('Location data retrieved:', {
            id: locationData.id,
            name: locationData.name,
            businessType: locationData.businessType
          });
        } catch (locationError) {
          console.warn('Failed to get location data:', locationError.message);
        }
      }

      const installationData = {
        ghlUserId: userData?.id || userInfo?.userId || `user_${Date.now()}`,
        ghlUserEmail: userData?.email,
        ghlUserName: userData?.name || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
        ghlUserPhone: userData?.phone,
        ghlUserCompany: userData?.companyName,
        ghlLocationId: userInfo?.locationId || locationData?.id,
        ghlLocationName: locationData?.name,
        ghlLocationBusinessType: locationData?.businessType,
        ghlLocationAddress: locationData?.address,
        ghlAccessToken: response.data.access_token,
        ghlRefreshToken: response.data.refresh_token,
        ghlTokenType: response.data.token_type || 'Bearer',
        ghlExpiresIn: response.data.expires_in || 3600,
        ghlScopes: response.data.scope,
        isActive: true
      };

      const savedInstallation = await storage.createInstallation(installationData);
      console.log('✅ OAuth installation saved to database with ID:', savedInstallation.id);
      
    } catch (dbError) {
      console.error('⚠️ Failed to save OAuth installation to database:', dbError);
      // Continue with the flow even if database save fails
    }

    // Redirect to success page with minimal, non-sensitive data
    const params = new URLSearchParams({
      success: 'true',
      timestamp: Date.now().toString()
    });
    
    if (userInfo?.locationId) {
      params.append('locationId', userInfo.locationId);
    }
    if (userInfo?.companyId) {
      params.append('companyId', userInfo.companyId);
    }
    if (state) {
      params.append('state', String(state));
    }

    const successUrl = `https://dir.engageautomations.com/oauth-success?${params.toString()}`;
    console.log('✅ OAuth complete! Redirecting to success page:', successUrl);
    
    return res.redirect(successUrl);

  } catch (error) {
    console.error('=== TOKEN EXCHANGE FAILED ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    
    const errorMessage = error.response?.data?.error || error.message || 'Token exchange failed';
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(error.response?.status || 'Unknown')}`;
    
    return res.redirect(errorUrl);
  }
});

// Debug endpoint - Get all OAuth installations
app.get('/api/debug/installations', async (req, res) => {
  try {
    const installations = await storage.getAllInstallations();
    res.json({
      success: true,
      count: installations.length,
      installations: installations.map(install => ({
        id: install.id,
        ghlUserId: install.ghlUserId,
        ghlUserEmail: install.ghlUserEmail,
        ghlUserName: install.ghlUserName,
        ghlLocationId: install.ghlLocationId,
        ghlLocationName: install.ghlLocationName,
        hasAccessToken: !!install.ghlAccessToken,
        hasRefreshToken: !!install.ghlRefreshToken,
        tokenType: install.ghlTokenType,
        scopes: install.ghlScopes,
        isActive: install.isActive,
        installationDate: install.installationDate
      }))
    });
  } catch (error) {
    console.error('Debug installations error:', error);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

// Debug endpoint - Get installation by user ID
app.get('/api/debug/installation/:userId', async (req, res) => {
  try {
    const installation = await storage.getInstallationByUserId(req.params.userId);
    if (!installation) {
      return res.status(404).json({ success: false, error: 'Installation not found' });
    }
    
    res.json({
      success: true,
      installation: {
        id: installation.id,
        ghlUserId: installation.ghlUserId,
        ghlUserEmail: installation.ghlUserEmail,
        ghlUserName: installation.ghlUserName,
        ghlLocationId: installation.ghlLocationId,
        ghlLocationName: installation.ghlLocationName,
        hasAccessToken: !!installation.ghlAccessToken,
        hasRefreshToken: !!installation.ghlRefreshToken,
        tokenType: installation.ghlTokenType,
        scopes: installation.ghlScopes,
        isActive: installation.isActive,
        installationDate: installation.installationDate
      }
    });
  } catch (error) {
    console.error('Debug installation error:', error);
    res.status(500).json({ success: false, error: 'Database query failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ OAuth Backend Server Running`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`OAuth URL: http://0.0.0.0:${PORT}/api/oauth/url`);
  console.log(`OAuth Callback: http://0.0.0.0:${PORT}/api/oauth/callback`);
});

module.exports = app;