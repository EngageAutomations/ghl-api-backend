#!/usr/bin/env node

// Minimal OAuth server to bypass routing issues
const express = require('express');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');

const app = express();
const port = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// CORS for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// OAuth URL generation endpoint
app.post('/api/oauth/url', async (req, res) => {
  try {
    console.log('OAuth URL generation requested');
    
    const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
    const redirectUri = 'https://dir.engageautomations.com/api/oauth/callback';
    const scopes = 'conversations/message.readonly conversations/message.write locations.readonly locations/customFields.readonly locations/customValues.readonly locations/customValues.write calendars.readonly calendars/events.readonly calendars/events.write contacts.readonly contacts.write opportunities.readonly opportunities.write';
    
    const state = `ghl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    console.log('Generated OAuth URL:', authUrl);
    
    res.json({
      success: true,
      authUrl: authUrl,
      state: state,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({
      error: 'Failed to generate OAuth URL',
      details: error.message
    });
  }
});

// OAuth token exchange endpoint
app.post('/api/oauth/exchange', async (req, res) => {
  try {
    console.log('OAuth token exchange requested');
    const { code, state } = req.body;
    
    if (!code) {
      return res.status(400).json({
        error: 'Authorization code is required'
      });
    }
    
    const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
    const clientSecret = process.env.GHL_CLIENT_SECRET || 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
    const redirectUri = 'https://dir.engageautomations.com/api/oauth/callback';
    
    // Exchange code for tokens with GoHighLevel
    const fetch = (await import('node-fetch')).default;
    
    const tokenResponse = await fetch('https://marketplace.gohighlevel.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.status(400).json({
        error: 'Token exchange failed',
        details: tokenData
      });
    }
    
    console.log('Token exchange successful');
    
    res.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    res.status(500).json({
      error: 'Token exchange failed',
      details: error.message
    });
  }
});

// OAuth callback endpoint
app.get(['/api/oauth/callback', '/oauth/callback'], (req, res) => {
  console.log('OAuth callback reached');
  console.log('Query params:', req.query);
  
  const { code, state, error } = req.query;
  
  if (error) {
    return res.redirect(`/oauth-error?error=${error}`);
  }
  
  if (!code) {
    return res.send('OAuth callback endpoint is working - no code parameter provided');
  }
  
  // Redirect to frontend with parameters
  const params = new URLSearchParams();
  if (code) params.set('code', code);
  if (state) params.set('state', state);
  
  res.redirect(`/oauth-complete.html?${params.toString()}`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    server: 'oauth-server',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'OAuth server is running',
    endpoints: [
      'POST /api/oauth/url',
      'POST /api/oauth/exchange',
      'GET /api/oauth/callback'
    ],
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>OAuth Server Running</h1>
      <p>Port: ${port}</p>
      <h2>Available Endpoints:</h2>
      <div class="endpoint">POST /api/oauth/url - Generate OAuth authorization URL</div>
      <div class="endpoint">POST /api/oauth/exchange - Exchange code for tokens</div>
      <div class="endpoint">GET /api/oauth/callback - Handle OAuth callback</div>
      <div class="endpoint">GET /health - Health check</div>
      <div class="endpoint">GET /test - Test endpoint</div>
    </body>
    </html>
  `);
});

// Start server
const server = createServer(app);

server.listen(port, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 OAuth Server Running');
  console.log('='.repeat(50));
  console.log(`Port: ${port}`);
  console.log(`Host: 0.0.0.0`);
  console.log(`OAuth Endpoints:`);
  console.log(`  POST /api/oauth/url`);
  console.log(`  POST /api/oauth/exchange`);
  console.log(`  GET /api/oauth/callback`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('OAuth server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('OAuth server closed');
    process.exit(0);
  });
});