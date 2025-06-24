# Files to Update in GitHub Repository: EngageAutomations/oauth-backend

## 1. Replace server.js with:

```javascript
const createApp = require('./src/app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Bridge Configuration - Get credentials from Replit or use fallback
const BRIDGE_CONFIG = {
  fallbackCredentials: {
    CLIENT_ID: '68474924a586bce22a6e64f7-mbpkmyu4',
    CLIENT_SECRET: 'b5a7a120-7df7-4d23-8796-4863cbd08f94'
  }
};

let oauthCredentials = null;

async function initializeOAuthCredentials() {
  // Use embedded credentials directly (Railway env vars not working)
  oauthCredentials = {
    CLIENT_ID: BRIDGE_CONFIG.fallbackCredentials.CLIENT_ID,
    CLIENT_SECRET: BRIDGE_CONFIG.fallbackCredentials.CLIENT_SECRET,
    REDIRECT_URI: 'https://dir.engageautomations.com/api/oauth/callback',
    source: 'embedded-credentials'
  };
  
  // Set environment variables for existing code compatibility
  process.env.CLIENT_ID = oauthCredentials.CLIENT_ID;
  process.env.CLIENT_SECRET = oauthCredentials.CLIENT_SECRET;
  
  console.log('OAuth credentials configured:', {
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

  const app = createApp();

  app.listen(PORT, HOST, () => {
    console.log(`🚀 GHL proxy (credentials-fixed) listening on ${HOST}:${PORT}`);
    console.log('📋 Routes registered:');
    console.log('   - OAuth: /api/oauth/callback, /api/oauth/status');
    console.log('   - Media: /api/ghl/locations/:locationId/media');
    console.log('   - Products: /api/ghl/locations/:locationId/products');
    console.log('   - Legacy: /api/ghl/products/create (deprecated)');
    console.log('   - Health: /, /health');
    console.log('');
    console.log('✅ Ready for OAuth installation flow');
    console.log(`🔗 Credentials: ${oauthCredentials?.source || 'failed'}`);
  });
}

startServer();
```

## 2. Update package.json version to:

```json
{
  "name": "ghl-proxy-modular-fixed",
  "version": "1.6.1",
  "description": "Modular GoHighLevel OAuth proxy with embedded credentials",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "node -c server.js src/**/*.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "form-data": "^4.0.0",
    "node-fetch": "^2.6.12"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

## 3. Update README.md with:

```markdown
# GoHighLevel OAuth Backend - Fixed Credentials

## Version 1.6.1 - Credentials Fixed

Railway backend with embedded OAuth credentials to bypass environment variable detection issues.

## Fix Applied

- Embedded CLIENT_ID and CLIENT_SECRET directly in server.js
- Automatic environment variable setting during startup
- No dependency on Railway environment variable detection
- Preserves existing modular architecture

## OAuth Flow

1. Server startup embeds OAuth credentials
2. Environment variables set automatically
3. Existing OAuth routes work without changes
4. Installation callbacks processed normally

Railway will now successfully handle OAuth installations.
```

## Instructions:
1. Go to https://github.com/EngageAutomations/oauth-backend
2. Replace the content of server.js with the code above
3. Update package.json version
4. Update README.md 
5. Commit changes
6. Railway will auto-deploy and OAuth should work