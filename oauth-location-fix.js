const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// In-memory storage for installations
const installations = new Map();

// Extract location ID from JWT token and validate
function extractAndValidateLocation(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { locationId: null, error: 'Invalid JWT format' };
    
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = Buffer.from(paddedPayload, 'base64').toString('utf8');
    const data = JSON.parse(decodedPayload);
    
    // Get location ID from token
    const locationId = data.authClassId || data.primaryAuthClassId;
    
    console.log('Token location analysis:', {
      authClassId: data.authClassId,
      primaryAuthClassId: data.primaryAuthClassId,
      authClass: data.authClass,
      extractedLocationId: locationId
    });
    
    return { locationId, tokenData: data, error: null };
  } catch (error) {
    console.error('Token extraction error:', error.message);
    return { locationId: null, error: error.message };
  }
}

// Get alternative locations from GoHighLevel API
async function getAccountLocations(accessToken) {
  const fetch = require('node-fetch');
  const endpoints = [
    'https://services.leadconnectorhq.com/locations/',
    'https://rest.gohighlevel.com/v1/locations/',
    'https://api.gohighlevel.com/v1/locations/'
  ];
  
  console.log('Attempting to retrieve account locations...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Response: ${response.status}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('Location data structure:', Object.keys(data));
        
        if (data.locations && Array.isArray(data.locations)) {
          console.log(`Found ${data.locations.length} locations`);
          return data.locations.map(loc => ({
            id: loc.id,
            name: loc.name || 'Unnamed Location',
            type: loc.type || 'location'
          }));
        } else if (data.id) {
          console.log('Single location found');
          return [{
            id: data.id,
            name: data.name || 'Single Location',
            type: data.type || 'location'
          }];
        }
      } else {
        const errorData = await response.json();
        console.log(`Endpoint failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`Endpoint error: ${error.message}`);
    }
  }
  
  console.log('No accessible locations found via API');
  return [];
}

// Create installation with enhanced location handling
async function createEnhancedInstallation(installationData) {
  console.log('Creating enhanced installation...');
  
  const locationInfo = extractAndValidateLocation(installationData.access_token);
  
  const installation = {
    id: installationData.installation_id,
    accessToken: installationData.access_token,
    refreshToken: installationData.refresh_token,
    expiresIn: installationData.expires_in || 86400,
    expiresAt: Date.now() + ((installationData.expires_in || 86400) * 1000),
    locationId: locationInfo.locationId,
    scopes: installationData.scope || 'products.write products.readonly',
    tokenStatus: 'valid',
    createdAt: new Date().toISOString(),
    lastValidated: new Date().toISOString(),
    locationStatus: 'checking'
  };
  
  // Try to get alternative locations from account
  try {
    const accountLocations = await getAccountLocations(installation.accessToken);
    
    if (accountLocations.length > 0) {
      console.log(`Found ${accountLocations.length} account locations`);
      installation.accountLocations = accountLocations;
      installation.recommendedLocationId = accountLocations[0].id;
      installation.recommendedLocationName = accountLocations[0].name;
      installation.locationStatus = 'account_locations_available';
    } else {
      console.log('No account locations accessible');
      installation.locationStatus = 'no_accessible_locations';
    }
  } catch (error) {
    console.log('Location discovery error:', error.message);
    installation.locationStatus = 'location_discovery_failed';
    installation.locationError = error.message;
  }
  
  installations.set(installation.id, installation);
  console.log(`Installation ${installation.id} created with location status: ${installation.locationStatus}`);
  
  return installation;
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OAuth Backend v7.0.0-location-fix',
    message: 'Enhanced OAuth with proper location handling',
    timestamp: new Date().toISOString(),
    features: [
      'Smart location detection',
      'Account location discovery',
      'Enhanced bridge communication',
      'Token health monitoring'
    ]
  });
});

// OAuth callback endpoint
app.get('/api/oauth/callback', async (req, res) => {
  const { code, installation_id } = req.query;
  
  console.log(`OAuth callback received: ${installation_id}`);
  
  if (!code || !installation_id) {
    return res.status(400).json({
      success: false,
      error: 'Missing authorization code or installation ID'
    });
  }
  
  try {
    const fetch = require('node-fetch');
    
    // Exchange code for token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: '68474924a586bce22a6e64f7',
        client_secret: 'mbpkmyu4',
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.status(400).json({
        success: false,
        error: 'Token exchange failed',
        details: tokenData
      });
    }
    
    console.log('Token exchange successful, creating enhanced installation...');
    
    // Create enhanced installation with location detection
    const installation = await createEnhancedInstallation({
      installation_id: installation_id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });
    
    console.log(`Installation complete: ${installation.id}`);
    console.log(`Location status: ${installation.locationStatus}`);
    
    // Redirect to frontend with enhanced info
    const redirectParams = new URLSearchParams({
      installation_id: installation_id,
      welcome: 'true',
      location_status: installation.locationStatus,
      locations_found: installation.accountLocations?.length || 0
    });
    
    res.redirect(`https://listings.engageautomations.com/?${redirectParams}`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth processing failed',
      details: error.message
    });
  }
});

// Enhanced token access endpoint
app.get('/api/token-access/:installation_id', (req, res) => {
  const { installation_id } = req.params;
  const installation = installations.get(installation_id);
  
  if (!installation || !installation.accessToken) {
    return res.status(400).json({
      success: false,
      error: `Installation not found: ${installation_id}`
    });
  }
  
  // Check token expiration
  if (installation.expiresAt && installation.expiresAt < Date.now()) {
    console.log('Token expired, needs refresh');
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      needsRefresh: true
    });
  }
  
  // Return enhanced response with location options
  const response = {
    access_token: installation.accessToken,
    installation_id: installation_id,
    location_id: installation.recommendedLocationId || installation.locationId,
    location_name: installation.recommendedLocationName || 'Unknown Location',
    location_status: installation.locationStatus,
    status: 'active',
    expires_at: installation.expiresAt,
    token_status: installation.tokenStatus
  };
  
  // Include account locations if available
  if (installation.accountLocations && installation.accountLocations.length > 0) {
    response.account_locations = installation.accountLocations;
    response.total_locations = installation.accountLocations.length;
  }
  
  res.json(response);
});

// Installation status endpoint
app.get('/api/installation-status/:installation_id', (req, res) => {
  const { installation_id } = req.params;
  const installation = installations.get(installation_id);
  
  if (!installation) {
    return res.status(404).json({
      success: false,
      error: 'Installation not found'
    });
  }
  
  res.json({
    success: true,
    installation: {
      id: installation.id,
      locationId: installation.recommendedLocationId || installation.locationId,
      locationName: installation.recommendedLocationName || 'Unknown',
      locationStatus: installation.locationStatus,
      accountLocations: installation.accountLocations || [],
      tokenStatus: installation.tokenStatus,
      createdAt: installation.createdAt,
      expiresAt: installation.expiresAt
    }
  });
});

// Token health endpoint
app.get('/api/token-health/:installation_id', (req, res) => {
  const { installation_id } = req.params;
  const installation = installations.get(installation_id);
  
  if (!installation) {
    return res.status(404).json({
      success: false,
      error: 'Installation not found'
    });
  }
  
  const now = Date.now();
  const timeUntilExpiry = installation.expiresAt - now;
  const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
  
  res.json({
    success: true,
    tokenHealth: {
      status: timeUntilExpiry > 0 ? 'valid' : 'expired',
      expiresAt: installation.expiresAt,
      timeUntilExpiry: timeUntilExpiry,
      hoursUntilExpiry: hoursUntilExpiry,
      needsRefresh: timeUntilExpiry < (2 * 60 * 60 * 1000)
    },
    location: {
      id: installation.recommendedLocationId || installation.locationId,
      name: installation.recommendedLocationName || 'Unknown',
      status: installation.locationStatus,
      totalLocations: installation.accountLocations?.length || 0
    }
  });
});

// Installations list endpoint
app.get('/installations', (req, res) => {
  const installationsList = Array.from(installations.values()).map(installation => ({
    id: installation.id,
    accessToken: installation.accessToken,
    refreshToken: installation.refreshToken,
    expiresIn: installation.expiresIn,
    expiresAt: installation.expiresAt,
    locationId: installation.recommendedLocationId || installation.locationId,
    locationName: installation.recommendedLocationName || 'Unknown',
    locationStatus: installation.locationStatus,
    scopes: installation.scopes,
    tokenStatus: installation.tokenStatus,
    createdAt: installation.createdAt,
    accountLocations: installation.accountLocations || []
  }));
  
  res.json({
    installations: installationsList,
    count: installationsList.length
  });
});

// Initialize with existing test installation and enhance it
async function initializeTestInstallation() {
  const testToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoQ2xhc3MiOiJDb21wYW55IiwiYXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsInNvdXJjZSI6IklOVEVHUkFUSU9OIiwic291cmNlSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJjaGFubmVsIjoiT0FVVEgiLCJwcmltYXJ5QXV0aENsYXNzSWQiOiJTR3RZSGtQYk9sMldKVjA4R09wZyIsIm9hdXRoTWV0YSI6eyJzY29wZXMiOlsicHJvZHVjdHMvcHJpY2VzLndyaXRlIiwicHJvZHVjdHMvcHJpY2VzLnJlYWRvbmx5IiwicHJvZHVjdHMvY29sbGVjdGlvbi5yZWFkb25seSIsIm1lZGlhcy53cml0ZSIsIm1lZGlhcy5yZWFkb25seSIsImxvY2F0aW9ucy5yZWFkb25seSIsImNvbnRhY3RzLnJlYWRvbmx5IiwiY29udGFjdHMud3JpdGUiLCJwcm9kdWN0cy9jb2xsZWN0aW9uLndyaXRlIiwidXNlcnMucmVhZG9ubHkiLCJwcm9kdWN0cy53cml0ZSIsInByb2R1Y3RzLnJlYWRvbmx5Iiwib2F1dGgud3JpdGUiLCJvYXV0aC5yZWFkb25seSJdLCJjbGllbnQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJ2ZXJzaW9uSWQiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjciLCJjbGllbnRLZXkiOiI2ODQ3NDkyNGE1ODZiY2UyMmE2ZTY0ZjctbWJwa215dTQiLCJhZ2VuY3lQbGFuIjoiYWdlbmN5X2FubnVhbF85NyJ9LCJpYXQiOjE3NTE0MzY5NzkuODQ5LCJleHAiOjE3NTE1MjMzNzkuODQ5fQ.B42jUGbsMfPv72vFZScDOZMZ3rMWVkHnlHF8TIs1lZV5XKhRll1qKleaEcB3dwnmvcJ7z3yuIejMDHwhCBRkMcqFEShNIGXjGn9kSVpTBqo4la99BCmEUd38Hj-HS3YpEkxQZq99s3KxFqqBOAxE5FzJIHZzdwJ2JjOtG7D6yYLYeVRPGcIMpvjYvEUhzgH7feFUKoqOVzuyekL5wO6e6uo1ANgl8WyGh8DJ7sP5MhkMHq89dD-6NZrFnU5Mzl5wcYWrMTbK13gH-6k3Hh9hadUhRpr73DGmVziEvxH7L7Ifnm-7MkhzdOemr3cT91aNDYw-pslTQSWyf6n7_TBUryMDQscHE-31JGl3mZ6wjQmxRrD_zdAoRuybIzRIED_LaSY6LsinFfOjoFrJ1WF4F7p7hkmZKnfsydcwUOnfueSh7Stcsi9T54qkwMz9ODSlQRJkJ5K6MUCVlgGkIMj7VxUsgepcAELqZELCXCl0TvJ5vNTpPUoTxRuWmFfMAETpjcJJZeiNX5lKLkzf8WPXotpPiu6qOq7BP16Dydym_akT3v3zmlIDqvwa42WnHYG7WWGvMU_mGSPAw0vlxIknRfe0hkFIFqW4xjbqsOCwqJEpQSVmatXUnhcYuqZUmBwKg19l6JJMZCFHB7FnP0wjajeGEKN2KE4BnKpvy6DpW1Q';
  
  console.log('Initializing test installation with location discovery...');
  
  const installation = await createEnhancedInstallation({
    installation_id: 'install_1751436979939',
    access_token: testToken,
    refresh_token: null,
    expires_in: 86400,
    scope: 'products.write products.readonly products/prices.write'
  });
  
  console.log('Test installation initialized with enhanced location handling');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`OAuth Backend v7.0.0-location-fix running on port ${PORT}`);
  console.log('Enhanced features: Location detection, account discovery, bridge communication');
  
  // Initialize test installation
  await initializeTestInstallation();
  console.log('Ready for API workflow testing');
});