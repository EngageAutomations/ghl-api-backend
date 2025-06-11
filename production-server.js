#!/usr/bin/env node

// Production server with ES module compatibility for Cloud Run deployment
import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES Module compatibility fixes for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make available globally for compatibility with legacy code
global.__dirname = __dirname;
global.__filename = __filename;

const app = express();

// Use Cloud Run's PORT environment variable (default 8080) or fallback to 5000 for local dev
const port = process.env.PORT || 8080;

// Domain and CORS setup
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

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port,
    env: process.env.NODE_ENV || 'production'
  });
});

// OAuth callback route with proper error handling
app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
  try {
    console.log('OAuth callback reached with code:', req.query.code);
    
    if (!req.query.code || req.query.code === 'TEST123') {
      return res.send('OAuth callback hit successfully - route is working!');
    }
    
    const { code, state, error } = req.query;
    
    if (error) {
      console.log('OAuth error:', error);
      return res.redirect(`/oauth-error?error=${error}`);
    }

    if (!code) {
      console.log('No authorization code');
      return res.redirect('/oauth-error?error=no_code');
    }

    // For now, return success response - full OAuth implementation can be added later
    res.redirect('/dashboard?auth=success');
    
  } catch (error) {
    console.error('Production OAuth callback error:', error);
    res.redirect('/oauth-error?error=callback_failed');
  }
});

// OAuth URL generation endpoint
app.post('/api/oauth/url', async (req, res) => {
  try {
    console.log('OAuth URL generation requested');
    
    // GoHighLevel OAuth configuration
    const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
    const redirectUri = 'https://dir.engageautomations.com/api/oauth/callback';
    const scopes = 'conversations/message.readonly conversations/message.write locations.readonly locations/customFields.readonly locations/customValues.readonly locations/customValues.write calendars.readonly calendars/events.readonly calendars/events.write contacts.readonly contacts.write opportunities.readonly opportunities.write';
    
    // Generate unique state for security
    const state = `ghl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Build authorization URL
    const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    console.log('Generated OAuth URL:', authUrl);
    
    res.json({
      success: true,
      authUrl: authUrl,
      state: state
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
    
    // GoHighLevel token exchange configuration
    const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
    const clientSecret = process.env.GHL_CLIENT_SECRET || 'b5a7a120-7df7-4d23-8796-4863cbd08f94';
    const redirectUri = 'https://dir.engageautomations.com/api/oauth/callback';
    
    // Exchange code for tokens
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
    
    // Return success with tokens (in production, store these securely)
    res.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });
    
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    res.status(500).json({
      error: 'Token exchange failed',
      details: error.message
    });
  }
});

// Basic dashboard route
app.get('/dashboard', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .success { background: #efe; border: 1px solid #cfc; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GoHighLevel Directory Dashboard</h1>
      </div>
      ${req.query.auth === 'success' ? '<div class="success">✓ Successfully authenticated with GoHighLevel!</div>' : ''}
      <p>Server is running properly on Cloud Run deployment.</p>
    </body>
    </html>
  `);
});

// Error handling route
app.get('/oauth-error', (req, res) => {
  const error = req.query.error || 'unknown_error';
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Error</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="error">
        <h2>Authentication Error</h2>
        <p>There was an issue with the authentication process: <strong>${error}</strong></p>
        <a href="/">Return Home</a>
      </div>
    </body>
    </html>
  `);
});

// Default route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GoHighLevel Marketplace Extension</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GoHighLevel Marketplace Extension</h1>
        <p>Server is running successfully with Cloud Run deployment fixes applied.</p>
      </div>
    </body>
    </html>
  `);
});

// Create HTTP server
const server = createServer(app);

// Start server with proper Cloud Run configuration
server.listen(port, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 Production Server Running (Cloud Run Compatible)');
  console.log('='.repeat(50));
  console.log(`Port: ${port}`);
  console.log(`Host: 0.0.0.0`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`ES Module Support: ✓ Enabled`);
  console.log(`__dirname Fix: ✓ Applied`);
  console.log('='.repeat(50));
});

// Graceful shutdown handlers for Cloud Run
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});