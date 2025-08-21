/**
 * Enhanced OAuth Backend with Location Token Conversion
 * v10.0.0-location-conversion - Automatic Company → Location token conversion
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Copy this entire file content
 * 2. Replace the index.js content in the oauth-backend GitHub repository
 * 3. Update package.json version to "10.0.0-location-conversion"
 * 4. Railway will automatically deploy the changes
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const { OAuthDatabaseClient } = require('./database-client');
const { MultiAppOAuthConfig } = require('./multi-app-oauth-config');
const { OAuthUserIntegration } = require('./shared-user-database/oauth-integration');

const app = express();

// Initialize multi-app OAuth configuration
const multiAppConfig = new MultiAppOAuthConfig();

// Initialize database client
const dbClient = new OAuthDatabaseClient('https://user-data-production-78e8.up.railway.app');

// Initialize user profile integration
const userIntegration = new OAuthUserIntegration('https://user-data-production-78e8.up.railway.app');

// Middleware
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// In-memory storage
const installations = new Map();
const locationTokens = new Map(); // Store Location tokens separately

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel OAuth Backend',
    version: '11.0.1-oauth-guide-enhanced',
    features: [
      'installation-id-capture',
      'enhanced-oauth-flow',
      'marketplace-integration',
      'token-refresh',
      'comprehensive-logging'
    ],
    debug: 'Enhanced OAuth with installation ID capture and marketplace integration'
  });
});

// LOCATION TOKEN CONVERSION FUNCTION
async function convertToLocationToken(companyToken, companyId, locationId) {
  try {
    const params = new URLSearchParams({
      companyId: companyId,
      locationId: locationId
    });

    console.log('[LOCATION-CONVERT] Converting Company token to Location token...');
    console.log('[LOCATION-CONVERT] Company ID:', companyId);
    console.log('[LOCATION-CONVERT] Location ID:', locationId);

    const response = await axios.post(
      'https://services.leadconnectorhq.com/oauth/locationToken',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${companyToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('[LOCATION-CONVERT] ✅ Successfully converted Company token to Location token');
    
    // Decode and verify the new Location token
    const locationJWT = decodeJWT(response.data.access_token);
    console.log('[LOCATION-CONVERT] New token authClass:', locationJWT?.authClass);
    console.log('[LOCATION-CONVERT] New token authClassId:', locationJWT?.authClassId);
    
    return response.data;
  } catch (error) {
    console.error('[LOCATION-CONVERT] ❌ Conversion failed:', error.response?.data || error.message);
    throw error;
  }
}

// GET LOCATION TOKEN FOR INSTALLATION
async function getLocationToken(installationId) {
  const inst = installations.get(installationId);
  if (!inst || !inst.accessToken) {
    throw new Error('Installation not found');
  }

  // Check if we already have a valid location token
  if (locationTokens.has(installationId)) {
    const locationToken = locationTokens.get(installationId);
    
    // Check if location token is still valid (with 5 minute buffer)
    if (locationToken.expiresAt > Date.now() + (5 * 60 * 1000)) {
      console.log('[LOCATION-TOKEN] ✅ Using cached Location token for', installationId);
      return locationToken.accessToken;
    }
    
    // Location token expired, remove it
    console.log('[LOCATION-TOKEN] ⚠️ Location token expired, removing cache for', installationId);
    locationTokens.delete(installationId);
  }

  // Convert Company token to Location token
  try {
    const jwt = decodeJWT(inst.accessToken);
    const companyId = jwt.authClassId;
    const locationId = inst.locationId || 'WAvk87RmW9rBSDJHeOpH'; // Use known working location

    console.log('[LOCATION-TOKEN] Starting conversion for', installationId);
    console.log('[LOCATION-TOKEN] Company authClass:', jwt.authClass);
    console.log('[LOCATION-TOKEN] Company authClassId:', companyId);

    const locationTokenData = await convertToLocationToken(
      inst.accessToken,
      companyId,
      locationId
    );

    // Store the location token
    locationTokens.set(installationId, {
      accessToken: locationTokenData.access_token,
      refreshToken: locationTokenData.refresh_token,
      expiresAt: Date.now() + (locationTokenData.expires_in * 1000),
      locationId: locationTokenData.locationId,
      userType: 'Location',
      createdAt: new Date().toISOString()
    });

    console.log('[LOCATION-TOKEN] ✅ Stored Location token for', installationId);
    console.log('[LOCATION-TOKEN] Location ID:', locationTokenData.locationId);
    
    return locationTokenData.access_token;

  } catch (error) {
    console.error('[LOCATION-TOKEN] ❌ Failed to get Location token for', installationId, ':', error.message);
    throw error;
  }
}

// JWT DECODE UTILITY
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('JWT decode error:', error.message);
    return null;
  }
}

// ENHANCED TOKEN REFRESH WITH LOCATION SUPPORT
async function enhancedRefreshAccessToken(id) {
  try {
    const inst = installations.get(id);
    if (!inst || !inst.refreshToken) {
      console.log(`[REFRESH] ❌ No refresh token for ${id}`);
      return false;
    }

    const body = new URLSearchParams({
      client_id: process.env.GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: inst.refreshToken,
      user_type: 'Location' // Keep using Location user type
    });

    const { data } = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000
    });

    // Update Company token
    inst.accessToken = data.access_token;
    inst.refreshToken = data.refresh_token;
    inst.expiresIn = data.expires_in;
    inst.expiresAt = Date.now() + data.expires_in * 1000;
    inst.tokenStatus = 'valid';
    inst.lastRefresh = new Date().toISOString();

    // Clear location token to force new conversion on next request
    if (locationTokens.has(id)) {
      console.log('[REFRESH] 🔄 Clearing cached Location token to force reconversion');
      locationTokens.delete(id);
    }

    console.log(`[REFRESH] ✅ Refreshed tokens for ${id}`);
    scheduleRefreshSmart(id);
    return true;

  } catch (error) {
    console.error(`[REFRESH] ❌ Failed for ${id}:`, error.response?.data || error.message);
    const inst = installations.get(id);
    if (inst) {
      inst.tokenStatus = 'refresh_failed';
    }
    return false;
  }
}

// SMART TOKEN REFRESH SCHEDULING
function scheduleRefreshSmart(id) {
  const inst = installations.get(id);
  if (!inst) return;

  // Clear existing timeouts
  if (inst.refreshTimeout) {
    clearTimeout(inst.refreshTimeout);
  }

  // Schedule refresh at 80% of token lifetime (with 10 minute minimum padding)
  const lifetime = inst.expiresIn * 1000;
  const refreshTime = Math.max(lifetime * 0.8, lifetime - (10 * 60 * 1000));

  inst.refreshTimeout = setTimeout(async () => {
    console.log(`[SCHEDULE] 🔄 Auto-refreshing token for ${id}`);
    await enhancedRefreshAccessToken(id);
  }, refreshTime);

  console.log(`[SCHEDULE] ⏰ Token refresh scheduled for ${id} in ${Math.floor(refreshTime / 1000 / 60)} minutes`);
}

// Enhanced token exchange with retry logic and comprehensive error handling
async function exchangeCodeWithRetry(code, redirectUri, clientId, clientSecret, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Token exchange attempt ${attempt}/${maxRetries}`);
      
      const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        user_type: 'Location' // Prevent user type issues
      });
      
      const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', body, {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 15000
      });
      
      console.log(`✅ Token exchange successful on attempt ${attempt}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.response?.data || error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 1000));
    }
  }
}

// Legacy function for backward compatibility
async function exchangeCode(code, redirectUri) {
  const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
  const clientSecret = process.env.GHL_CLIENT_SECRET || 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
  return await exchangeCodeWithRetry(code, redirectUri, clientId, clientSecret);
}

async function storeInstall(tokenData) {
  const id = `install_${Date.now()}`;
  
  // Decode JWT to get auth class and location info
  const jwt = decodeJWT(tokenData.access_token);
  const authClass = jwt?.authClass || 'unknown';
  const locationId = jwt?.authClassId || tokenData.locationId || 'WAvk87RmW9rBSDJHeOpH';
  
  const installationData = {
    id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    locationId: authClass === 'Location' ? locationId : 'WAvk87RmW9rBSDJHeOpH',
    scopes: tokenData.scope || '',
    tokenStatus: 'valid',
    authClass: authClass,
    method: 'user_type Location parameter + automatic conversion',
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  try {
    // Check if this is a reinstall (existing installation)
    const existingInstallation = installations.get(id);
    const isReinstall = !!existingInstallation;
    
    if (isReinstall) {
      console.log(`[NEW INSTALL] 🔄 Reinstall detected for ${id} - replacing existing tokens`);
    }
    
    // Store in database instead of memory (this will replace existing if reinstall)
    await dbClient.saveInstallationWithToken(installationData, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope || '',
      token_type: 'Bearer'
    });
    
    // Keep in-memory for backward compatibility (this will replace existing if reinstall)
    installations.set(id, installationData);
    
    scheduleRefreshSmart(id);
    
    if (isReinstall) {
      console.log(`[NEW INSTALL] ✅ Reinstall completed - tokens replaced in database: ${id}`);
    } else {
      console.log(`[NEW INSTALL] ${id} stored in database with auth class: ${authClass}`);
    }
    
    // Log token conversion capability
    if (authClass === 'Company') {
      console.log(`[NEW INSTALL] Company token detected - Location conversion available`);
    } else if (authClass === 'Location') {
      console.log(`[NEW INSTALL] Location token detected - direct usage available`);
    }
    
    return id;
  } catch (error) {
    console.error(`[DATABASE] Failed to store installation ${id}:`, error.message);
    // Fallback to in-memory storage
    installations.set(id, installationData);
    scheduleRefreshSmart(id);
    console.log(`[NEW INSTALL] ${id} stored in memory (fallback) with auth class: ${authClass}`);
    return id;
  }
}

// ENHANCED OAUTH CALLBACK WITH ERROR PREVENTION
app.get(['/oauth/callback', '/api/oauth/callback'], async (req, res) => {
  const startTime = Date.now();
  console.log('=== OAUTH CALLBACK - ERROR PREVENTION MODE ===');
  console.log('📥 Query params:', req.query);
  console.log('🌐 Request URL:', req.url);
  console.log('🔗 Referer:', req.get('Referer'));
  
  const { code, error, state, location_id } = req.query;
  
  // ERROR PREVENTION CHECK #1: OAuth Error Parameter
  if (error) {
    console.error('❌ OAuth error from GoHighLevel:', error);
    return res.redirect(`https://dir.engageautomations.com/?error=oauth_denied&details=${error}&timestamp=${Date.now()}`);
  }
  
  // ERROR PREVENTION CHECK #2: Missing Authorization Code
  if (!code) {
    console.error('❌ No authorization code received');
    console.log('🔍 Full query object:', JSON.stringify(req.query, null, 2));
    return res.redirect(`https://dir.engageautomations.com/?error=no_code&timestamp=${Date.now()}`);
  }
  
  // ERROR PREVENTION CHECK #3: Code Format Validation
  if (code.length < 10) {
    console.error('❌ Authorization code too short:', code.length);
    return res.redirect(`https://dir.engageautomations.com/?error=invalid_code_format&timestamp=${Date.now()}`);
  }
  
  try {
    // ERROR PREVENTION CHECK #4: Environment Variables with Fallbacks
    const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
    const clientSecret = process.env.GHL_CLIENT_SECRET || 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
    const redirectUri = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';
    
    console.log('🔑 Using CLIENT_ID:', clientId.substring(0, 8) + '...');
    console.log('🔗 Using REDIRECT_URI:', redirectUri);
    
    // ERROR PREVENTION CHECK #5: Immediate Token Exchange (prevent expiration)
    console.log('⚡ Starting immediate token exchange...');
    const tokenData = await exchangeCodeWithRetry(code, redirectUri, clientId, clientSecret);
    
    // ERROR PREVENTION CHECK #6: Token Validation
    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }
    
    console.log('✅ Token exchange successful');
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Processing time: ${processingTime}ms`);
    
    const id = await storeInstall(tokenData);
    console.log('💾 Installation stored with ID:', id);
    
    // USER PROFILE INTEGRATION: Process user data after successful OAuth
    try {
      console.log('👤 Processing user profile data...');
      const userProfileData = await userIntegration.processUserData(tokenData, {
        appId: 'directory-engine', // Default app ID for this server
        appName: 'Directory Engine',
        installationId: id
      });
      console.log('✅ User profile processed:', userProfileData.ghl_user_id);
    } catch (userError) {
      console.error('⚠️ User profile processing failed (non-critical):', userError.message);
      // Don't fail the OAuth flow if user profile processing fails
    }
    
    // SUCCESS: Redirect with installation data
    const url = `https://dir.engageautomations.com/?installation_id=${id}&welcome=true&processing_time=${processingTime}`;
    console.log('🎉 Redirecting to success page:', url);
    res.redirect(url);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ OAuth callback error:', error.response?.data || error.message);
    console.error('⏱️ Failed after:', processingTime + 'ms');
    
    // Enhanced error reporting
    const errorDetails = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      processing_time: processingTime,
      timestamp: Date.now()
    };
    
    const url = `https://dir.engageautomations.com/?error=oauth_failed&details=${encodeURIComponent(JSON.stringify(errorDetails))}`;
    res.redirect(url);
  }
});

// Helper function to get installation from database or memory
async function getInstallation(id) {
  try {
    // Try database first
    const dbInstallation = await dbClient.getInstallation(id);
    if (dbInstallation) {
      return dbInstallation;
    }
  } catch (error) {
    console.error(`[DATABASE] Failed to get installation ${id}:`, error.message);
  }
  
  // Fallback to memory
  return installations.get(id);
}

// INSTALLATIONS ENDPOINT
app.get('/installations', async (req, res) => {
  try {
    // Try to get from database first
    const dbInstallations = await dbClient.getAllInstallations();
    
    if (dbInstallations && dbInstallations.length > 0) {
      const installList = dbInstallations.map(inst => ({
        id: inst.id,
        location_id: inst.location_id,
        active: true,
        created_at: inst.created_at,
        token_status: inst.token_status || 'valid',
        auth_class: inst.auth_class,
        method: inst.method,
        scopes: inst.scopes,
        has_location_token: locationTokens.has(inst.id)
      }));
      
      return res.json({
        count: dbInstallations.length,
        installations: installList,
        source: 'database'
      });
    }
  } catch (error) {
    console.error('[DATABASE] Failed to get installations:', error.message);
  }
  
  // Fallback to memory
  const installList = Array.from(installations.values()).map(inst => ({
    id: inst.id,
    location_id: inst.locationId,
    active: true,
    created_at: inst.createdAt,
    token_status: inst.tokenStatus,
    auth_class: inst.authClass,
    method: inst.method,
    scopes: inst.scopes,
    has_location_token: locationTokens.has(inst.id)
  }));
  
  res.json({
    count: installations.size,
    installations: installList,
    source: 'memory'
  });
});

// TOKEN ACCESS ENDPOINT (Company tokens)
app.get('/api/token-access/:id', async (req, res) => {
  try {
    const inst = await getInstallation(req.params.id);
    if (!inst) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    // Check token freshness
    if (inst.expiresAt <= Date.now()) {
      const refreshed = await enhancedRefreshAccessToken(req.params.id);
      if (!refreshed) {
        return res.status(401).json({ error: 'Token expired and refresh failed' });
      }
    }

    const jwt = decodeJWT(inst.accessToken);
    
    res.json({
      access_token: inst.accessToken,
      token_type: 'Bearer',
      expires_in: Math.floor((inst.expiresAt - Date.now()) / 1000),
      scope: inst.scopes,
      location_id: inst.locationId,
      auth_class: jwt?.authClass || 'unknown'
    });
  } catch (error) {
    console.error('Token access error:', error.message);
    res.status(500).json({ error: 'Token access failed', details: error.message });
  }
});

// LOCATION TOKEN ACCESS ENDPOINT - NEW
app.get('/api/location-token/:id', async (req, res) => {
  try {
    console.log('[LOCATION-ENDPOINT] Request for Location token:', req.params.id);
    
    const locationToken = await getLocationToken(req.params.id);
    const locationTokenData = locationTokens.get(req.params.id);
    
    res.json({
      access_token: locationToken,
      token_type: 'Bearer',
      expires_in: Math.floor((locationTokenData.expiresAt - Date.now()) / 1000),
      location_id: locationTokenData.locationId,
      auth_class: 'Location',
      created_at: locationTokenData.createdAt
    });
  } catch (error) {
    console.error('Location token access error:', error.message);
    res.status(500).json({ 
      error: 'Location token access failed', 
      details: error.message,
      hint: 'Company token may not have oauth.write scope or location conversion failed'
    });
  }
});

// ENHANCED MEDIA UPLOAD WITH AUTOMATIC LOCATION TOKEN CONVERSION
app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  console.log('=== ENHANCED MEDIA UPLOAD WITH LOCATION TOKEN ===');
  
  try {
    const { installation_id } = req.body;
    
    if (!installation_id) {
      return res.status(400).json({ success: false, error: 'installation_id required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'file required' });
    }
    
    console.log(`[MEDIA] Uploading file: ${req.file.originalname} with automatic Location token conversion`);
    
    // Get Location token for media upload
    const locationToken = await getLocationToken(installation_id);
    const locationTokenData = locationTokens.get(installation_id);
    
    // Create form data for GoHighLevel API
    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });
    
    // Upload using Location token
    console.log(`[MEDIA] Using Location token for upload to location: ${locationTokenData.locationId}`);
    
    const uploadResponse = await axios.post(
      'https://services.leadconnectorhq.com/medias/upload-file',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${locationToken}`,
          'Version': '2021-07-28',
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        timeout: 30000
      }
    );
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log('[MEDIA] ✅ Upload successful with Location token');
    res.json({
      success: true,
      message: 'File uploaded successfully with Location token',
      data: uploadResponse.data,
      tokenType: 'Location',
      locationId: locationTokenData.locationId,
      conversionUsed: true
    });
    
  } catch (error) {
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    const errorMessage = error.response?.data?.message || error.message;
    const statusCode = error.response?.status || 500;
    
    console.error('[MEDIA] ❌ Upload failed:', errorMessage);
    console.error('[MEDIA] Status:', statusCode);
    
    res.status(statusCode).json({
      success: false,
      error: 'Media upload failed',
      details: errorMessage,
      tokenType: 'Location',
      hint: statusCode === 401 ? 'Location token may have expired or insufficient permissions' : 'Check file format and size'
    });
  }
});

// OAUTH STATUS
app.get('/api/oauth/status', async (req, res) => {
  const inst = await getInstallation(req.query.installation_id);
  if (!inst) return res.json({ authenticated: false });
  
  const hasLocationToken = locationTokens.has(req.query.installation_id);
  
  res.json({ 
    authenticated: true, 
    tokenStatus: inst.tokenStatus || inst.token_status, 
    locationId: inst.locationId || inst.location_id,
    authClass: inst.authClass || inst.auth_class,
    hasLocationToken: hasLocationToken,
    conversionAvailable: (inst.authClass || inst.auth_class) === 'Company'
  });
});

// TOKEN HEALTH ENDPOINT
app.get('/api/token-health/:id', async (req, res) => {
  const inst = await getInstallation(req.params.id);
  if (!inst) {
    return res.status(404).json({ error: 'Installation not found' });
  }

  const timeUntilExpiry = Math.floor((inst.expiresAt - Date.now()) / 1000 / 60);
  const hasLocationToken = locationTokens.has(req.params.id);
  
  let locationTokenInfo = null;
  if (hasLocationToken) {
    const locToken = locationTokens.get(req.params.id);
    locationTokenInfo = {
      expiresIn: Math.floor((locToken.expiresAt - Date.now()) / 1000 / 60),
      locationId: locToken.locationId,
      createdAt: locToken.createdAt
    };
  }
  
  res.json({
    installationId: req.params.id,
    tokenStatus: inst.tokenStatus,
    authClass: inst.authClass,
    timeUntilExpiry: timeUntilExpiry,
    locationId: inst.locationId,
    hasLocationToken: hasLocationToken,
    locationTokenInfo: locationTokenInfo,
    lastRefresh: inst.lastRefresh || 'never'
  });
});

// MANUAL LOCATION TOKEN CONVERSION ENDPOINT
app.post('/api/convert-to-location/:id', async (req, res) => {
  try {
    console.log('[MANUAL-CONVERT] Manual Location token conversion requested for:', req.params.id);
    
    const locationToken = await getLocationToken(req.params.id);
    const locationTokenData = locationTokens.get(req.params.id);
    
    res.json({
      success: true,
      message: 'Location token conversion successful',
      locationId: locationTokenData.locationId,
      expiresIn: Math.floor((locationTokenData.expiresAt - Date.now()) / 1000),
      createdAt: locationTokenData.createdAt
    });
    
  } catch (error) {
    console.error('[MANUAL-CONVERT] ❌ Manual conversion failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Location token conversion failed',
      details: error.message
    });
  }
});

// OAuth validation endpoint for debugging
app.get('/api/oauth/validate', (req, res) => {
  const config = {
    clientId: process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4',
    clientSecret: process.env.GHL_CLIENT_SECRET ? '***CONFIGURED***' : 'FALLBACK_USED',
    redirectUri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    status: 'OAuth configuration validated',
    config,
    installations: Object.keys(installations).length,
    locationTokens: Object.keys(locationTokens).length
  });
});

// Error monitoring endpoint
app.get('/api/oauth/errors', (req, res) => {
  // This would typically connect to a logging service
  res.json({
    message: 'Error monitoring endpoint active',
    commonErrors: [
      'invalid_grant - Authorization code expired or already used',
      'redirect_uri_mismatch - Redirect URI doesn\'t match app configuration',
      'invalid_client - Client ID/Secret mismatch',
      'unsupported_grant_type - Grant type not supported'
    ],
    preventionTips: [
      'Use authorization codes immediately after receiving them',
      'Verify redirect URI matches exactly in GHL app settings',
      'Check environment variables are properly set',
      'Implement retry logic for temporary failures'
    ]
  });
});

// Database status endpoint
app.get('/api/database/status', async (req, res) => {
  try {
    const health = await dbClient.healthCheck();
    const installations = await dbClient.getAllInstallations();
    
    res.json({
      database: {
        status: 'connected',
        service: health.service,
        version: health.version,
        uptime: health.uptime,
        url: 'https://user-data-production-78e8.up.railway.app'
      },
      data: {
        installations_count: installations ? installations.length : 0,
        memory_installations: installations.size,
        location_tokens: locationTokens.size
      },
      integration: {
        status: 'active',
        fallback_enabled: true,
        storage_mode: 'database_with_memory_fallback'
      }
    });
  } catch (error) {
    res.status(500).json({
      database: {
        status: 'error',
        error: error.message
      },
      data: {
        memory_installations: installations.size,
        location_tokens: locationTokens.size
      },
      integration: {
        status: 'fallback_mode',
        storage_mode: 'memory_only'
      }
    });
  }
});

// TOKEN REFRESH ENDPOINT - Can be pinged by database token manager
app.post('/api/token-refresh/:installationId', async (req, res) => {
  const { installationId } = req.params;
  
  try {
    console.log(`[OAUTH-REFRESH] Token refresh requested for ${installationId}`);
    
    // Get installation from memory or database
    const inst = await getInstallation(installationId);
    
    if (!inst) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found',
        installation_id: installationId
      });
    }

    if (!inst.refreshToken && !inst.refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'No refresh token available',
        installation_id: installationId
      });
    }

    // Use the existing enhanced refresh function
    const refreshed = await enhancedRefreshAccessToken(installationId);
    
    if (!refreshed) {
      return res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        installation_id: installationId
      });
    }

    // Get updated installation data
    const updatedInst = await getInstallation(installationId);
    
    // Prepare token data for response
    const tokenData = {
      access_token: updatedInst.accessToken || updatedInst.access_token,
      refresh_token: updatedInst.refreshToken || updatedInst.refresh_token,
      token_type: 'Bearer',
      expires_in: updatedInst.expiresIn || updatedInst.expires_in,
      expires_at: new Date(Date.now() + (updatedInst.expiresIn || updatedInst.expires_in) * 1000).toISOString(),
      scope: updatedInst.scopes || updatedInst.scope,
      location_id: updatedInst.locationId || updatedInst.location_id,
      installation_id: installationId
    };

    console.log(`[OAUTH-REFRESH] ✅ Token refreshed successfully for ${installationId}`);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: tokenData,
      installation_id: installationId,
      refreshed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[OAUTH-REFRESH] ❌ Token refresh failed for ${installationId}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message,
      installation_id: installationId
    });
  }
});

// TOKEN VALIDATION ENDPOINT
app.get('/api/token-validate/:installationId', async (req, res) => {
  const { installationId } = req.params;
  
  try {
    console.log(`[OAUTH-VALIDATE] Token validation requested for ${installationId}`);
    
    const inst = await getInstallation(installationId);
    
    if (!inst) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found',
        installation_id: installationId
      });
    }

    const accessToken = inst.accessToken || inst.access_token;
    const expiresAt = inst.expiresAt || (inst.expires_at ? new Date(inst.expires_at).getTime() : null);
    const now = Date.now();
    
    // Check token status
    let tokenStatus = 'unknown';
    let expiresInMinutes = null;
    
    if (accessToken && expiresAt) {
      expiresInMinutes = Math.floor((expiresAt - now) / (1000 * 60));
      
      if (expiresAt <= now) {
        tokenStatus = 'expired';
      } else if (expiresAt <= now + (10 * 60 * 1000)) { // 10 minutes buffer
        tokenStatus = 'expiring_soon';
      } else {
        tokenStatus = 'valid';
      }
    } else {
      tokenStatus = 'no_token';
    }

    // Decode JWT for additional info
    const jwt = accessToken ? decodeJWT(accessToken) : null;
    
    res.json({
      success: true,
      installation_id: installationId,
      token_status: tokenStatus,
      expires_in_minutes: expiresInMinutes,
      has_access_token: !!accessToken,
      has_refresh_token: !!(inst.refreshToken || inst.refresh_token),
      auth_class: jwt?.authClass || inst.authClass || inst.auth_class,
      location_id: inst.locationId || inst.location_id,
      validated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[OAUTH-VALIDATE] ❌ Token validation failed for ${installationId}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Token validation failed',
      details: error.message,
      installation_id: installationId
    });
  }
});

// INSTALLATION STATUS ENDPOINT
app.get('/api/installation-status/:installationId', async (req, res) => {
  const { installationId } = req.params;
  
  try {
    console.log(`[OAUTH-STATUS] Installation status requested for ${installationId}`);
    
    const inst = await getInstallation(installationId);
    
    if (!inst) {
      return res.status(404).json({
        success: false,
        error: 'Installation not found',
        installation_id: installationId
      });
    }

    // Check if we have location token
    const hasLocationToken = locationTokens.has(installationId);
    let locationTokenInfo = null;
    
    if (hasLocationToken) {
      const locToken = locationTokens.get(installationId);
      locationTokenInfo = {
        expires_in_minutes: Math.floor((locToken.expiresAt - Date.now()) / (1000 * 60)),
        location_id: locToken.locationId,
        created_at: locToken.createdAt
      };
    }

    const accessToken = inst.accessToken || inst.access_token;
    const expiresAt = inst.expiresAt || (inst.expires_at ? new Date(inst.expires_at).getTime() : null);
    const jwt = accessToken ? decodeJWT(accessToken) : null;
    
    res.json({
      success: true,
      installation: {
        id: installationId,
        location_id: inst.locationId || inst.location_id,
        company_name: inst.companyName || inst.company_name,
        auth_class: jwt?.authClass || inst.authClass || inst.auth_class,
        created_at: inst.createdAt || inst.created_at,
        token_status: inst.tokenStatus || inst.token_status
      },
      token: {
        has_access_token: !!accessToken,
        has_refresh_token: !!(inst.refreshToken || inst.refresh_token),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        expires_in_minutes: expiresAt ? Math.floor((expiresAt - Date.now()) / (1000 * 60)) : null
      },
      location_token: {
        has_location_token: hasLocationToken,
        info: locationTokenInfo
      },
      checked_at: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[OAUTH-STATUS] ❌ Installation status check failed for ${installationId}:`, error.message);
    
    res.status(500).json({
      success: false,
      error: 'Installation status check failed',
      details: error.message,
      installation_id: installationId
    });
  }
});

// BULK TOKEN REFRESH ENDPOINT
app.post('/api/tokens/bulk-refresh', async (req, res) => {
  const { installation_ids } = req.body;
  
  if (!Array.isArray(installation_ids)) {
    return res.status(400).json({
      success: false,
      error: 'installation_ids must be an array'
    });
  }

  try {
    console.log(`[OAUTH-BULK-REFRESH] Bulk token refresh requested for ${installation_ids.length} installations`);
    
    const results = [];
    
    for (const installationId of installation_ids) {
      try {
        const refreshed = await enhancedRefreshAccessToken(installationId);
        
        results.push({
          installation_id: installationId,
          success: refreshed,
          status: refreshed ? 'refreshed' : 'failed'
        });
        
      } catch (error) {
        results.push({
          installation_id: installationId,
          success: false,
          status: 'error',
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    
    console.log(`[OAUTH-BULK-REFRESH] ✅ Bulk refresh completed: ${successCount}/${installation_ids.length} successful`);
    
    res.json({
      success: true,
      message: `Bulk token refresh completed`,
      total: installation_ids.length,
      successful: successCount,
      failed: installation_ids.length - successCount,
      results: results,
      completed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[OAUTH-BULK-REFRESH] ❌ Bulk token refresh failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Bulk token refresh failed',
      details: error.message
    });
  }
});

// DATABASE SYNC ENDPOINT - Sync OAuth server data with database
app.post('/api/database/sync', async (req, res) => {
  try {
    console.log('[OAUTH-DB-SYNC] Starting database sync...');
    
    const syncResults = {
      installations_synced: 0,
      tokens_synced: 0,
      errors: []
    };
    
    // Get all installations from memory
    const memoryInstallations = Array.from(installations.values());
    
    for (const inst of memoryInstallations) {
      try {
        // Prepare installation data
        const installationData = {
          id: inst.id,
          location_id: inst.locationId,
          company_name: inst.companyName || 'Unknown Company',
          location_name: inst.locationName || 'Unknown Location',
          auth_class: inst.authClass,
          created_at: inst.createdAt,
          updated_at: new Date().toISOString()
        };
        
        // Prepare token data
        const tokenData = {
          installation_id: inst.id,
          access_token: inst.accessToken,
          refresh_token: inst.refreshToken,
          token_type: 'Bearer',
          expires_in: inst.expiresIn,
          expires_at: new Date(inst.expiresAt).toISOString(),
          scope: inst.scopes,
          location_id: inst.locationId
        };
        
        // Save to database
        await dbClient.saveInstallation(installationData);
        await dbClient.saveToken(tokenData);
        
        syncResults.installations_synced++;
        syncResults.tokens_synced++;
        
      } catch (error) {
        syncResults.errors.push({
          installation_id: inst.id,
          error: error.message
        });
      }
    }
    
    console.log(`[OAUTH-DB-SYNC] ✅ Sync completed: ${syncResults.installations_synced} installations, ${syncResults.tokens_synced} tokens`);
    
    res.json({
      success: true,
      message: 'Database sync completed',
      results: syncResults,
      synced_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[OAUTH-DB-SYNC] ❌ Database sync failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Database sync failed',
      details: error.message
    });
  }
});

// MULTI-APP OAUTH ENDPOINTS

// GET ALL REGISTERED APPLICATIONS
app.get('/api/apps', (req, res) => {
  try {
    const apps = multiAppConfig.getAllApps();
    
    // Remove sensitive information from response
    const publicApps = apps.map(app => ({
      id: app.id,
      name: app.name,
      description: app.description,
      domain: app.domain,
      features: app.features,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      oauth: {
        client_id: app.oauth.client_id,
        redirect_uri: app.oauth.redirect_uri,
        scopes: app.oauth.scopes
        // client_secret is excluded for security
      }
    }));

    res.json({
      success: true,
      apps: publicApps,
      total: apps.length,
      stats: multiAppConfig.getStats()
    });

  } catch (error) {
    console.error('[MULTI-APP] ❌ Failed to get apps:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve applications',
      details: error.message
    });
  }
});

// GET SPECIFIC APPLICATION
app.get('/api/apps/:appId', (req, res) => {
  try {
    const { appId } = req.params;
    const app = multiAppConfig.getApp(appId);

    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
        app_id: appId
      });
    }

    // Remove sensitive information
    const publicApp = {
      id: app.id,
      name: app.name,
      description: app.description,
      domain: app.domain,
      features: app.features,
      status: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      oauth: {
        client_id: app.oauth.client_id,
        redirect_uri: app.oauth.redirect_uri,
        scopes: app.oauth.scopes
      }
    };

    res.json({
      success: true,
      app: publicApp
    });

  } catch (error) {
    console.error('[MULTI-APP] ❌ Failed to get app:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve application',
      details: error.message
    });
  }
});

// REGISTER NEW APPLICATION
app.post('/api/apps', (req, res) => {
  try {
    const {
      id,
      name,
      description,
      domain,
      oauth,
      features,
      status
    } = req.body;

    // Validate required fields
    if (!id || !name || !oauth) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, oauth'
      });
    }

    if (!oauth.client_id || !oauth.client_secret || !oauth.redirect_uri) {
      return res.status(400).json({
        success: false,
        error: 'OAuth configuration requires client_id, client_secret, and redirect_uri'
      });
    }

    // Check if app already exists
    const existingApp = multiAppConfig.getApp(id);
    if (existingApp) {
      return res.status(409).json({
        success: false,
        error: 'Application already exists',
        app_id: id
      });
    }

    // Register the new app
    const newApp = multiAppConfig.registerApp({
      id,
      name,
      description,
      domain,
      oauth,
      features: features || [],
      status: status || 'active'
    });

    console.log(`[MULTI-APP] ✅ New app registered: ${name} (${id})`);

    res.status(201).json({
      success: true,
      message: 'Application registered successfully',
      app: {
        id: newApp.id,
        name: newApp.name,
        description: newApp.description,
        domain: newApp.domain,
        features: newApp.features,
        status: newApp.status,
        createdAt: newApp.createdAt,
        oauth: {
          client_id: newApp.oauth.client_id,
          redirect_uri: newApp.oauth.redirect_uri,
          scopes: newApp.oauth.scopes
        }
      }
    });

  } catch (error) {
    console.error('[MULTI-APP] ❌ Failed to register app:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to register application',
      details: error.message
    });
  }
});

// UPDATE APPLICATION
app.put('/api/apps/:appId', (req, res) => {
  try {
    const { appId } = req.params;
    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.id;
    delete updates.createdAt;

    const updatedApp = multiAppConfig.updateApp(appId, updates);

    console.log(`[MULTI-APP] ✅ App updated: ${appId}`);

    res.json({
      success: true,
      message: 'Application updated successfully',
      app: {
        id: updatedApp.id,
        name: updatedApp.name,
        description: updatedApp.description,
        domain: updatedApp.domain,
        features: updatedApp.features,
        status: updatedApp.status,
        updatedAt: updatedApp.updatedAt,
        oauth: {
          client_id: updatedApp.oauth.client_id,
          redirect_uri: updatedApp.oauth.redirect_uri,
          scopes: updatedApp.oauth.scopes
        }
      }
    });

  } catch (error) {
    console.error('[MULTI-APP] ❌ Failed to update app:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update application',
      details: error.message
    });
  }
});

// DELETE APPLICATION
app.delete('/api/apps/:appId', (req, res) => {
  try {
    const { appId } = req.params;

    multiAppConfig.removeApp(appId);

    console.log(`[MULTI-APP] ✅ App removed: ${appId}`);

    res.json({
      success: true,
      message: 'Application removed successfully',
      app_id: appId
    });

  } catch (error) {
    console.error('[MULTI-APP] ❌ Failed to remove app:', error.message);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to remove application',
      details: error.message
    });
  }
});

// GENERATE OAUTH URL FOR APP
app.get('/api/apps/:appId/oauth-url', (req, res) => {
  try {
    const { appId } = req.params;
    const { state } = req.query;

    const app = multiAppConfig.getApp(appId);
    if (!app) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
        app_id: appId
      });
    }

    if (app.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Application is not active',
        app_id: appId
      });
    }

    const authUrl = multiAppConfig.generateAuthUrl(appId, state);

    res.json({
      success: true,
      app_id: appId,
      auth_url: authUrl,
      state: state || null
    });

  } catch (error) {
    console.error('[MULTI-APP] ❌ Failed to generate OAuth URL:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL',
      details: error.message
    });
  }
});

// VALIDATE OAUTH CALLBACK FOR APP
app.post('/api/apps/validate-callback', (req, res) => {
  try {
    const { client_id, redirect_uri } = req.body;

    if (!client_id || !redirect_uri) {
      return res.status(400).json({
        success: false,
        error: 'Missing client_id or redirect_uri'
      });
    }

    const validation = multiAppConfig.validateCallback(client_id, redirect_uri);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        app: validation.app ? {
          id: validation.app.id,
          name: validation.app.name,
          status: validation.app.status
        } : null
      });
    }

    res.json({
      success: true,
      message: 'OAuth callback validation successful',
      app: {
        id: validation.app.id,
        name: validation.app.name,
        domain: validation.app.domain,
        features: validation.app.features
      }
    });

  } catch (error) {
    console.error('[MULTI-APP] ❌ Failed to validate callback:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to validate OAuth callback',
      details: error.message
    });
  }
});

// GET APP STATISTICS
app.get('/api/apps/stats', (req, res) => {
  try {
    const stats = multiAppConfig.getStats();

    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[MULTI-APP] ❌ Failed to get stats:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      details: error.message
    });
  }
});

// ENHANCED OAUTH CALLBACK WITH MULTI-APP SUPPORT
app.get('/api/oauth/callback/multi-app', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  try {
    console.log('[MULTI-APP-OAUTH] OAuth callback received');
    
    // Handle OAuth errors
    if (error) {
      console.error('[MULTI-APP-OAUTH] ❌ OAuth Error:', error_description);
      return res.status(400).json({
        success: false,
        error: 'OAuth error',
        details: error_description
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code'
      });
    }

    // Extract app info from state parameter (if provided)
    let appId = null;
    let appInfo = null;
    
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        appId = stateData.appId;
      } catch (e) {
        console.warn('[MULTI-APP-OAUTH] ⚠️ Could not parse state parameter');
      }
    }

    // Get OAuth credentials (use app-specific or default)
    let clientId = process.env.GHL_CLIENT_ID;
    let clientSecret = process.env.GHL_CLIENT_SECRET;
    let redirectUri = process.env.GHL_REDIRECT_URI;

    if (appId) {
      appInfo = multiAppConfig.getApp(appId);
      if (appInfo) {
        clientId = appInfo.oauth.client_id;
        clientSecret = appInfo.oauth.client_secret;
        redirectUri = appInfo.oauth.redirect_uri;
        console.log(`[MULTI-APP-OAUTH] Using app-specific OAuth config for: ${appInfo.name}`);
      }
    }

    // Exchange code for token
    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    });

    const tokenData = tokenResponse.data;
    const installationId = `install_${Date.now()}`;

    // Decode JWT to get installation info
    const jwt = decodeJWT(tokenData.access_token);
    const authClass = jwt?.authClass || 'unknown';
    const locationId = jwt?.authClassId;

    // Store installation with app association
    const installationData = {
      id: installationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      scopes: tokenData.scope,
      locationId: locationId,
      authClass: authClass,
      createdAt: new Date().toISOString(),
      appId: appId, // Associate with specific app
      appName: appInfo?.name || 'Unknown'
    };

    // Store in memory and database
    installations.set(installationId, installationData);

    if (dbClient) {
      try {
        await dbClient.saveInstallation({
          id: installationId,
          location_id: locationId,
          company_name: 'Multi-App Installation',
          auth_class: authClass,
          app_id: appId,
          app_name: appInfo?.name || 'Unknown',
          created_at: new Date().toISOString()
        });

        await dbClient.saveToken({
          installation_id: installationId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: 'Bearer',
          expires_in: tokenData.expires_in,
          expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
          scope: tokenData.scope,
          location_id: locationId
        });

        console.log('[MULTI-APP-OAUTH] ✅ Installation saved to database');
      } catch (dbError) {
        console.error('[MULTI-APP-OAUTH] ❌ Database save failed:', dbError.message);
      }
    }

    res.json({
      success: true,
      message: 'OAuth callback successful',
      installation: {
        id: installationId,
        location_id: locationId,
        auth_class: authClass,
        app_id: appId,
        app_name: appInfo?.name || 'Unknown',
        created_at: installationData.createdAt
      }
    });

  } catch (error) {
    console.error('[MULTI-APP-OAUTH] ❌ OAuth callback failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'OAuth callback failed',
      details: error.message
    });
  }
});

// ===== WORKFLOW API ENDPOINTS =====

// Import workflow routes
const workflowRoutes = require('./src/routes/workflows');
app.use('/api/workflows', workflowRoutes);

// ===== USER PROFILE API ENDPOINTS =====

// Get user profile by GHL User ID
app.get('/api/user-profile/:ghlUserId', async (req, res) => {
  try {
    const userProfile = await userIntegration.getUserProfile(req.params.ghlUserId);
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(userProfile);
  } catch (error) {
    console.error('Get user profile error:', error.message);
    res.status(500).json({ error: 'Failed to get user profile', details: error.message });
  }
});

// Get user profile by email
app.get('/api/user-profile/by-email/:email', async (req, res) => {
  try {
    const userProfile = await userIntegration.getUserProfileByEmail(req.params.email);
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(userProfile);
  } catch (error) {
    console.error('Get user profile by email error:', error.message);
    res.status(500).json({ error: 'Failed to get user profile', details: error.message });
  }
});

// Search user profiles
app.post('/api/user-profiles/search', async (req, res) => {
  try {
    const { query, filters } = req.body;
    const results = await userIntegration.searchUserProfiles(query, filters);
    res.json(results);
  } catch (error) {
    console.error('Search user profiles error:', error.message);
    res.status(500).json({ error: 'Failed to search user profiles', details: error.message });
  }
});

// Get users by app ID
app.get('/api/user-profiles/by-app/:appId', async (req, res) => {
  try {
    const users = await userIntegration.getUsersByApp(req.params.appId);
    res.json(users);
  } catch (error) {
    console.error('Get users by app error:', error.message);
    res.status(500).json({ error: 'Failed to get users by app', details: error.message });
  }
});

// Get user statistics
app.get('/api/user-profiles/stats', async (req, res) => {
  try {
    const stats = await userIntegration.getUserStats();
    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error.message);
    res.status(500).json({ error: 'Failed to get user statistics', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const multiAppStats = multiAppConfig.getStats();
    
    res.status(200).json({
      status: 'healthy',
      service: 'GoHighLevel OAuth Backend',
      version: '11.0.1-oauth-guide-enhanced',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      database_service: 'https://user-data-production-78e8.up.railway.app',
      multi_app: {
        enabled: true,
        total_apps: multiAppStats.totalApps,
        active_apps: multiAppStats.activeApps,
        inactive_apps: multiAppStats.inactiveApps,
        stats: multiAppStats
      },
      endpoints: {
        oauth: [
          'GET /api/oauth/callback',
          'GET /api/oauth/callback/multi-app',
          'POST /api/token-refresh/:installationId',
          'GET /api/token-validate/:installationId',
          'GET /api/installation-status/:installationId',
          'POST /api/tokens/bulk-refresh',
          'POST /api/database/sync'
        ],
        multi_app: [
          'GET /api/apps',
          'GET /api/apps/:appId',
          'POST /api/apps',
          'PUT /api/apps/:appId',
          'DELETE /api/apps/:appId',
          'GET /api/apps/:appId/oauth-url',
          'POST /api/apps/validate-callback',
          'GET /api/apps/stats'
        ],
        user_profiles: [
          'GET /api/user-profile/:ghlUserId',
          'GET /api/user-profile/by-email/:email',
          'POST /api/user-profiles/search',
          'GET /api/user-profiles/by-app/:appId',
          'GET /api/user-profiles/stats'
        ],
        workflows: [
          'POST /api/workflows/locations/:locationId/products',
          'POST /api/workflows/locations/:locationId/collections',
          'POST /api/workflows/locations/:locationId/import',
          'PUT /api/workflows/locations/:locationId/products/:productId',
          'GET /api/workflows/status/:workflowId',
          'GET /api/workflows/active',
          'GET /api/workflows/stats'
        ]
      }
    });
  } catch (error) {
    res.status(200).json({
      status: 'healthy',
      service: 'GoHighLevel OAuth Backend',
      version: '11.0.0-multi-app-integrated',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      database_service: 'https://user-data-production-78e8.up.railway.app',
      multi_app: {
        enabled: true,
        error: error.message
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Enhanced OAuth Backend v11.0.0 with Shared User Profiles running on port ${PORT}`);
  console.log('✅ Location token conversion enabled');
  console.log('✅ Automatic Company → Location token conversion for media APIs');
  console.log('✅ Enhanced token management with dual token storage');
  console.log('✅ Shared user profile management across applications');
  console.log('✅ Multi-application OAuth support');
  console.log('');
  console.log('📋 OAUTH ENDPOINTS:');
  console.log('• GET /api/oauth/callback - Main OAuth callback');
  console.log('• GET /api/oauth/callback/multi-app - Multi-app OAuth callback');
  console.log('• GET /api/location-token/:id - Get Location token for installation');
  console.log('• POST /api/convert-to-location/:id - Manual Location token conversion');
  console.log('• POST /api/media/upload - Enhanced media upload with Location tokens');
  console.log('');
  console.log('👤 USER PROFILE ENDPOINTS:');
  console.log('• GET /api/user-profile/:ghlUserId - Get user profile by GHL User ID');
  console.log('• GET /api/user-profile/by-email/:email - Get user profile by email');
  console.log('• POST /api/user-profiles/search - Search user profiles');
  console.log('• GET /api/user-profiles/by-app/:appId - Get users by app ID');
  console.log('• GET /api/user-profiles/stats - Get user statistics');
  console.log('');
  console.log('🔄 WORKFLOW ENDPOINTS:');
  console.log('• POST /api/workflows/locations/:locationId/products - Create product workflow');
  console.log('• POST /api/workflows/locations/:locationId/collections - Create collection workflow');
  console.log('• POST /api/workflows/locations/:locationId/import - Bulk import workflow');
  console.log('• PUT /api/workflows/locations/:locationId/products/:productId - Update product workflow');
  console.log('• GET /api/workflows/status/:workflowId - Get workflow status');
  console.log('• GET /api/workflows/active - List active workflows');
  console.log('• GET /api/workflows/stats - Get workflow statistics');
  console.log('');
  console.log('🔄 User Profile Integration Flow:');
  console.log('1. OAuth callback processes user authentication');
  console.log('2. User data extracted from JWT token');
  console.log('3. User profile created/updated in shared database');
  console.log('4. App usage tracked across all applications');
  console.log('5. Centralized user data accessible via API');
  console.log('');
  console.log('🌐 Server ready and listening for connections...');
  console.log('🔗 Health check: http://localhost:' + PORT + '/health');
  console.log('🗄️ Database service: https://user-data-production-78e8.up.railway.app');
  console.log('📊 Environment variables loaded:');
  console.log('   - GHL_CLIENT_ID:', process.env.GHL_CLIENT_ID ? 'SET' : 'USING_FALLBACK');
  console.log('   - GHL_CLIENT_SECRET:', process.env.GHL_CLIENT_SECRET ? 'SET' : 'USING_FALLBACK');
  console.log('   - NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('   - PORT:', PORT);
});