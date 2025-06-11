#!/usr/bin/env node

// Production OAuth Server - Bypassing Build Process
// Direct deployment without frontend build complexity

import express from 'express';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
const CLIENT_ID = process.env.GHL_CLIENT_ID;
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-production-secret';
const REDIRECT_URI = 'https://dir.engageautomations.com/api/oauth/callback';

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

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

// Authentication middleware
const authenticateUser = (req, res, next) => {
  const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No session token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid session token' });
  }
};

// OAuth Routes
app.get('/api/oauth/authorize', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?` +
    `response_type=code&` +
    `client_id=${CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=locations/read%20contacts/read%20contacts/write&` +
    `state=${state}`;
  
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });
  
  res.redirect(authUrl);
});

app.get('/api/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect('/auth/error?error=' + encodeURIComponent(error));
  }
  
  if (!code) {
    return res.redirect('/auth/error?error=no_code');
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.redirect('/auth/error?error=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://services.leadconnectorhq.com/oauth/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error('User info fetch failed');
      return res.redirect('/auth/error?error=userinfo_failed');
    }

    const userData = await userResponse.json();
    
    // Create JWT session
    const sessionToken = jwt.sign({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      locationId: userData.locationId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: Date.now() + (tokenData.expires_in * 1000),
    }, JWT_SECRET, { expiresIn: '7d' });

    // Set secure cookie
    res.cookie('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to dashboard
    res.redirect('/dashboard?auth=success');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/auth/error?error=internal_server_error');
  }
});

// API Routes
app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    locationId: req.user.locationId,
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    oauth_configured: !!(CLIENT_ID && CLIENT_SECRET)
  });
});

// Error pages
app.get('/auth/error', (req, res) => {
  const error = req.query.error || 'unknown_error';
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authentication Error</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
        .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; }
        .retry { margin-top: 20px; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="error">
        <h2>Authentication Error</h2>
        <p>There was an issue with the authentication process: <strong>${error}</strong></p>
        <div class="retry">
          <a href="/api/oauth/authorize">Try Again</a> | 
          <a href="/">Return Home</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Default routes
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
        .nav { margin: 20px 0; }
        a { color: #0066cc; text-decoration: none; margin-right: 20px; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>GoHighLevel Directory Dashboard</h1>
      </div>
      ${req.query.auth === 'success' ? '<div class="success">✓ Successfully authenticated with GoHighLevel!</div>' : ''}
      <div class="nav">
        <a href="/api/auth/me">View Profile</a>
        <a href="/api/health">System Status</a>
        <a href="/api/oauth/authorize">Re-authenticate</a>
      </div>
      <p>Your OAuth integration is working correctly. You can now proceed with directory setup.</p>
    </body>
    </html>
  `);
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GoHighLevel Directory App</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
        .welcome { background: #f0f8ff; border: 1px solid #bce; padding: 30px; border-radius: 8px; }
        .auth-button { 
          display: inline-block; 
          background: #0066cc; 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 20px;
        }
        .auth-button:hover { background: #0052a3; }
      </style>
    </head>
    <body>
      <div class="welcome">
        <h1>GoHighLevel Directory Extension</h1>
        <p>Connect your GoHighLevel account to create and manage directory listings.</p>
        <a href="/api/oauth/authorize" class="auth-button">Connect GoHighLevel Account</a>
      </div>
    </body>
    </html>
  `);
});

// Start server
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 Production OAuth Server Running');
  console.log('='.repeat(50));
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Client ID: ${CLIENT_ID ? '✓ Configured' : '✗ Missing'}`);
  console.log(`Client Secret: ${CLIENT_SECRET ? '✓ Configured' : '✗ Missing'}`);
  console.log(`Redirect URI: ${REDIRECT_URI}`);
  console.log('='.repeat(50));
  
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('⚠️  OAuth credentials not configured');
  } else {
    console.log('✅ OAuth ready for production deployment');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});