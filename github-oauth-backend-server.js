const createApp = require('./src/app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Bridge Configuration - Get credentials from Replit or use fallback
const BRIDGE_CONFIG = {
  replitUrl: 'https://your-replit-domain.replit.app',
  fallbackCredentials: {
    CLIENT_ID: '68474924a586bce22a6e64f7-mbpkmyu4',
    CLIENT_SECRET: 'b5a7a120-7df7-4d23-8796-4863cbd08f94'
  }
};

let oauthCredentials = null;

async function initializeOAuthCredentials() {
  try {
    // Try to get credentials from Replit bridge
    const fetch = require('node-fetch');
    const response = await fetch(`${BRIDGE_CONFIG.replitUrl}/api/bridge/oauth-credentials`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        oauthCredentials = {
          CLIENT_ID: data.credentials.client_id,
          CLIENT_SECRET: data.credentials.client_secret,
          REDIRECT_URI: data.credentials.redirect_uri,
          source: 'replit-bridge'
        };
        
        // Set environment variables for existing code compatibility
        process.env.CLIENT_ID = oauthCredentials.CLIENT_ID;
        process.env.CLIENT_SECRET = oauthCredentials.CLIENT_SECRET;
        
        console.log('OAuth credentials loaded from Replit bridge:', {
          CLIENT_ID: oauthCredentials.CLIENT_ID ? '[CONFIGURED]' : '[MISSING]',
          CLIENT_SECRET: oauthCredentials.CLIENT_SECRET ? '[CONFIGURED]' : '[MISSING]',
          source: oauthCredentials.source
        });
        return;
      }
    }
  } catch (error) {
    console.log('Bridge connection failed, using fallback credentials:', error.message);
  }
  
  // Fallback to embedded credentials
  oauthCredentials = {
    CLIENT_ID: BRIDGE_CONFIG.fallbackCredentials.CLIENT_ID,
    CLIENT_SECRET: BRIDGE_CONFIG.fallbackCredentials.CLIENT_SECRET,
    REDIRECT_URI: 'https://dir.engageautomations.com/api/oauth/callback',
    source: 'embedded-fallback'
  };
  
  // Set environment variables for existing code compatibility
  process.env.CLIENT_ID = oauthCredentials.CLIENT_ID;
  process.env.CLIENT_SECRET = oauthCredentials.CLIENT_SECRET;
  
  console.log('OAuth credentials using fallback:', {
    CLIENT_ID: oauthCredentials.CLIENT_ID ? '[CONFIGURED]' : '[MISSING]',
    CLIENT_SECRET: oauthCredentials.CLIENT_SECRET ? '[CONFIGURED]' : '[MISSING]',
    source: oauthCredentials.source
  });
}

async function startServer() {
  // Initialize OAuth credentials first
  await initializeOAuthCredentials();
  
  console.log('Config check:', {
    CLIENT_ID: process.env.CLIENT_ID ? '[set]' : '[MISSING - REQUIRED]',
    CLIENT_SECRET: process.env.CLIENT_SECRET ? '[set]' : '[MISSING - REQUIRED]',
    REDIRECT: '/api/oauth/callback',
    PORT,
    source: oauthCredentials?.source || 'none'
  });

  if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    console.error('');
    console.error('⚠️  CRITICAL: OAuth credentials missing after bridge initialization!');
    console.error('   Bridge connection and fallback both failed');
    console.error('   OAuth flow will fail without these credentials');
    console.error('');
  }

  const app = createApp();
  
  // Add bridge endpoints for self-hosting capability
  app.get('/api/bridge/oauth-credentials', (req, res) => {
    if (!oauthCredentials) {
      return res.status(500).json({
        error: 'OAuth not initialized',
        bridge_source: 'railway'
      });
    }
    
    res.json({
      success: true,
      credentials: {
        client_id: oauthCredentials.CLIENT_ID,
        client_secret: oauthCredentials.CLIENT_SECRET,
        redirect_uri: oauthCredentials.REDIRECT_URI
      },
      bridge_source: 'railway',
      original_source: oauthCredentials.source,
      timestamp: Date.now()
    });
  });

  app.listen(PORT, HOST, () => {
    console.log(`🚀 GHL proxy (bridge-enabled) listening on ${HOST}:${PORT}`);
    console.log('📋 Routes registered:');
    console.log('   - OAuth: /api/oauth/callback, /api/oauth/status');
    console.log('   - Bridge: /api/bridge/oauth-credentials');
    console.log('   - Media: /api/ghl/locations/:locationId/media');
    console.log('   - Products: /api/ghl/locations/:locationId/products');
    console.log('   - Legacy: /api/ghl/products/create (deprecated)');
    console.log('   - Health: /, /health');
    console.log('');
    console.log('✅ Ready for OAuth installation flow');
    console.log(`🔗 Bridge mode: ${oauthCredentials?.source || 'failed'}`);
  });
}

startServer();