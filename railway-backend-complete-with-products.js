// Complete OAuth Backend for Railway Deployment with Product API Integration
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// In-memory storage for OAuth installations
let oauthInstallations = [];

// Storage functions
const storage = {
  createInstallation(installationData) {
    const installation = {
      id: oauthInstallations.length + 1,
      ...installationData,
      installationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    oauthInstallations.push(installation);
    return installation;
  },

  getAllInstallations() {
    return oauthInstallations.sort((a, b) => new Date(b.installationDate) - new Date(a.installationDate));
  },

  getInstallationByUserId(ghlUserId) {
    return oauthInstallations
      .filter(install => install.ghlUserId === ghlUserId)
      .sort((a, b) => new Date(b.installationDate) - new Date(a.installationDate))[0];
  }
};

// GoHighLevel Product API functions
async function createGHLProduct(productData, accessToken) {
  try {
    console.log('=== CREATING GHL PRODUCT ===');
    console.log('Product data:', productData);
    
    if (!productData.name || !productData.locationId || !productData.productType) {
      throw new Error('Missing required fields: name, locationId, and productType are required');
    }
    
    const payload = {
      name: productData.name,
      locationId: productData.locationId,
      productType: productData.productType,
      description: productData.description || '',
      image: productData.image || undefined,
      statementDescriptor: productData.statementDescriptor || undefined,
      availableInStore: productData.availableInStore !== undefined ? productData.availableInStore : true,
      medias: productData.medias || undefined,
      variants: productData.variants || undefined
    };
    
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    
    console.log('Sending payload to GHL:', payload);
    
    const response = await axios.post('https://services.leadconnectorhq.com/products/', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      timeout: 15000
    });
    
    console.log('GHL API Response Status:', response.status);
    console.log('GHL API Response Data:', response.data);
    
    return {
      success: true,
      product: response.data,
      message: 'Product created successfully in GoHighLevel'
    };
    
  } catch (error) {
    console.error('=== GHL PRODUCT CREATION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return {
      success: false,
      error: 'Product creation failed',
      details: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

async function getGHLProducts(locationId, accessToken, limit = 100, offset = 0) {
  try {
    const response = await axios.get(`https://services.leadconnectorhq.com/locations/${locationId}/products`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28'
      },
      params: { limit, offset },
      timeout: 10000
    });
    
    return {
      success: true,
      products: response.data.products || [],
      total: response.data.total || 0
    };
    
  } catch (error) {
    console.error('Error fetching GHL products:', error.message);
    return {
      success: false,
      error: 'Failed to fetch products',
      details: error.response?.data || error.message
    };
  }
}

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ['https://dir.engageautomations.com', 'http://localhost:3000'],
  credentials: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'GHL OAuth Backend with Product API', 
    timestamp: new Date().toISOString(),
    installationsCount: oauthInstallations.length
  });
});

// OAuth URL generation endpoint
app.get('/api/oauth/url', (req, res) => {
  console.log('=== GENERATING OAUTH URL ===');
  
  const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
  const redirectUri = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';
  const scopes = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly';
  
  const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}`;
  
  console.log('Generated OAuth URL:', authUrl);
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state,
    timestamp: Date.now()
  });
});

// OAuth callback endpoint - Complete token exchange and storage handler
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== RAILWAY OAUTH CALLBACK WITH TOKEN STORAGE ===');
  console.log('Query params:', req.query);

  const { code, state, error } = req.query;

  if (error) {
    console.error('OAuth error from GoHighLevel:', error);
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(error)}`;
    return res.redirect(errorUrl);
  }

  if (!code) {
    console.error('Missing authorization code');
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent('Missing authorization code')}`;
    return res.redirect(errorUrl);
  }

  try {
    console.log('=== EXCHANGING CODE FOR TOKEN ===');
    console.log('Authorization code:', String(code).substring(0, 20) + '...');

    const tokenRequestData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4',
      client_secret: process.env.GHL_CLIENT_SECRET,
      code: String(code),
      redirect_uri: process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback'
    });

    const response = await axios.post('https://services.leadconnectorhq.com/oauth/token', 
      tokenRequestData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('=== TOKEN EXCHANGE SUCCESSFUL ===');

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

    // Store OAuth installation data
    try {
      console.log('=== STORING OAUTH INSTALLATION ===');
      
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

      const savedInstallation = storage.createInstallation(installationData);
      console.log('✅ OAuth installation saved with ID:', savedInstallation.id);
      console.log('✅ ACCESS TOKEN CAPTURED:', response.data.access_token ? 'YES' : 'NO');
      console.log('✅ REFRESH TOKEN CAPTURED:', response.data.refresh_token ? 'YES' : 'NO');
      
    } catch (storageError) {
      console.error('⚠️ Failed to save OAuth installation:', storageError);
    }

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
    }
    
    const errorMessage = error.response?.data?.error || error.message || 'Token exchange failed';
    const errorUrl = `https://dir.engageautomations.com/oauth-error?error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(error.response?.status || 'Unknown')}`;
    
    return res.redirect(errorUrl);
  }
});

// OAuth success page
app.get('/oauth-success', (req, res) => {
  const { success, timestamp, locationId, companyId, state } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OAuth Success - GoHighLevel Connected</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .container { 
          max-width: 500px; background: white; padding: 60px 40px;
          border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
        }
        h1 { color: #38a169; margin-bottom: 20px; font-size: 28px; }
        .success-icon { font-size: 48px; margin-bottom: 20px; }
        .details { 
          background: #f7fafc; padding: 20px; border-radius: 12px; 
          margin: 20px 0; text-align: left; font-size: 14px;
        }
        .btn { 
          background: #667eea; color: white; padding: 16px 32px; 
          border: none; border-radius: 12px; text-decoration: none; 
          display: inline-block; margin: 20px 0; cursor: pointer;
        }
        .btn:hover { background: #5a67d8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✅</div>
        <h1>Successfully Connected!</h1>
        <p>Your GoHighLevel account has been connected to the Directory App.</p>
        
        <div class="details">
          <strong>Connection Details:</strong><br>
          Timestamp: ${new Date(parseInt(timestamp || Date.now())).toLocaleString()}<br>
          ${locationId ? `Location ID: ${locationId}<br>` : ''}
          ${companyId ? `Company ID: ${companyId}<br>` : ''}
          Status: Active
        </div>
        
        <p>You can now create and manage product directories through your GoHighLevel account.</p>
        
        <a href="/" class="btn">Return to Dashboard</a>
      </div>
    </body>
    </html>
  `);
});

// OAuth error page
app.get('/oauth-error', (req, res) => {
  const { error, details } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OAuth Error - Connection Failed</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          margin: 0; padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
        }
        .container { 
          max-width: 500px; background: white; padding: 60px 40px;
          border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          text-align: center;
        }
        h1 { color: #e53e3e; margin-bottom: 20px; font-size: 28px; }
        .error-icon { font-size: 48px; margin-bottom: 20px; }
        .details { 
          background: #fed7d7; padding: 20px; border-radius: 12px; 
          margin: 20px 0; text-align: left; font-size: 14px; color: #c53030;
        }
        .btn { 
          background: #667eea; color: white; padding: 16px 32px; 
          border: none; border-radius: 12px; text-decoration: none; 
          display: inline-block; margin: 20px 0; cursor: pointer;
        }
        .btn:hover { background: #5a67d8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">❌</div>
        <h1>Connection Failed</h1>
        <p>There was an issue connecting your GoHighLevel account.</p>
        
        <div class="details">
          <strong>Error Details:</strong><br>
          ${error ? `Error: ${decodeURIComponent(error)}<br>` : ''}
          ${details ? `Details: ${decodeURIComponent(details)}<br>` : ''}
          Time: ${new Date().toLocaleString()}
        </div>
        
        <p>Please try connecting again or contact support if the issue persists.</p>
        
        <a href="/" class="btn">Try Again</a>
      </div>
    </body>
    </html>
  `);
});

// Debug endpoint - Get all OAuth installations
app.get('/api/debug/installations', async (req, res) => {
  try {
    const installations = storage.getAllInstallations();
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
    res.status(500).json({ success: false, error: 'Storage query failed' });
  }
});

// GoHighLevel Product Creation API
app.post('/api/ghl/products', async (req, res) => {
  try {
    console.log('=== GHL PRODUCT CREATION REQUEST ===');
    console.log('Request body:', req.body);
    
    const installations = storage.getAllInstallations();
    if (installations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No OAuth installations found. Complete OAuth installation first.'
      });
    }
    
    const installation = installations[0];
    if (!installation.ghlAccessToken) {
      return res.status(400).json({
        success: false,
        error: 'No access token available in installation'
      });
    }
    
    const productData = {
      ...req.body,
      locationId: req.body.locationId || installation.ghlLocationId
    };
    
    if (!productData.locationId) {
      return res.status(400).json({
        success: false,
        error: 'Location ID required but not found in installation or request'
      });
    }
    
    console.log('Creating product with access token from installation:', installation.id);
    
    const result = await createGHLProduct(productData, installation.ghlAccessToken);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(result.status || 400).json(result);
    }
    
  } catch (error) {
    console.error('Product creation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Test product creation endpoint
app.post('/api/test/ghl-product', async (req, res) => {
  try {
    const installations = storage.getAllInstallations();
    if (installations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No OAuth installations found'
      });
    }
    
    const installation = installations[0];
    
    const testProductData = {
      name: req.body.name || `Test Product ${Date.now()}`,
      locationId: installation.ghlLocationId,
      description: req.body.description || 'Test product created via OAuth API integration',
      productType: req.body.productType || 'DIGITAL',
      availableInStore: req.body.availableInStore !== undefined ? req.body.availableInStore : true
    };
    
    const result = await createGHLProduct(testProductData, installation.ghlAccessToken);
    
    if (result.success) {
      result.installation = {
        id: installation.id,
        ghlLocationId: installation.ghlLocationId,
        ghlLocationName: installation.ghlLocationName
      };
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Test product creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

// Get products from GoHighLevel
app.get('/api/ghl/products', async (req, res) => {
  try {
    const installations = storage.getAllInstallations();
    if (installations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No OAuth installations found'
      });
    }
    
    const installation = installations[0];
    const { limit = 100, offset = 0 } = req.query;
    
    const result = await getGHLProducts(
      installation.ghlLocationId, 
      installation.ghlAccessToken, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json(result);
    
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      details: error.message
    });
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
  console.log(`✅ OAuth Backend Server Running with Product API`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Health Check: http://0.0.0.0:${PORT}/health`);
  console.log(`OAuth URL: http://0.0.0.0:${PORT}/api/oauth/url`);
  console.log(`OAuth Callback: http://0.0.0.0:${PORT}/api/oauth/callback`);
  console.log(`Product Creation: http://0.0.0.0:${PORT}/api/ghl/products`);
  console.log(`Test Product: http://0.0.0.0:${PORT}/api/test/ghl-product`);
  console.log(`Debug Installations: http://0.0.0.0:${PORT}/api/debug/installations`);
});

module.exports = app;