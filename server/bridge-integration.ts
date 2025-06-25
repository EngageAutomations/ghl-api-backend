// Bridge integration within main server
import express from 'express';

export function setupBridgeEndpoints(app: express.Express) {
  console.log('Setting up bridge endpoints...');
  
  // Health endpoint for bridge
  app.get('/health', (req, res) => {
    res.json({ ok: true, ts: Date.now(), service: 'bridge' });
  });
  
  // OAuth credentials endpoint for Railway
  app.get('/api/bridge/oauth-credentials', (req, res) => {
    console.log('Bridge credentials requested by Railway');
    
    const credentials = {
      clientId: process.env.GHL_CLIENT_ID,
      clientSecret: process.env.GHL_CLIENT_SECRET,
      scopes: "products.write medias.write",
      redirectBase: "https://dir.engageautomations.com"
    };
    
    if (!credentials.clientId || !credentials.clientSecret) {
      console.error('OAuth credentials missing in environment');
      return res.status(500).json({ 
        error: 'OAuth credentials not configured',
        missing: {
          clientId: !credentials.clientId,
          clientSecret: !credentials.clientSecret
        }
      });
    }
    
    console.log('Serving OAuth credentials to Railway:', {
      clientId: credentials.clientId.substring(0, 8) + '...',
      redirectBase: credentials.redirectBase
    });
    
    res.json(credentials);
  });
  
  console.log('Bridge endpoints configured at /health and /api/bridge/oauth-credentials');
}