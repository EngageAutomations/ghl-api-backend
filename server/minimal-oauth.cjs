// Production OAuth callback server - bypasses TypeScript issues
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
app.use(cookieParser());
app.use(express.json());

// Environment variables
const GHL_CLIENT_ID = process.env.GHL_CLIENT_ID;
const GHL_CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'oauth-jwt-secret-2024';
const REDIRECT_URI = 'https://dir.engageautomations.com/api/oauth/callback';

console.log('OAuth Production Server Starting');
console.log('Client ID:', GHL_CLIENT_ID ? 'configured' : 'MISSING');
console.log('Client Secret:', GHL_CLIENT_SECRET ? 'configured' : 'MISSING');
console.log('Redirect URI:', REDIRECT_URI);

// OAuth callback handler - registered FIRST
app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
  console.log('OAuth callback hit:', req.query);
  
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.log('OAuth error:', error);
      return res.redirect(`/oauth-error?error=${error}`);
    }

    if (!code) {
      console.log('No authorization code');
      return res.redirect('/oauth-error?error=no_code');
    }

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokenResponse = await fetch('https://api.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: GHL_CLIENT_ID,
        client_secret: GHL_CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return res.redirect('/oauth-error?error=token_exchange_failed');
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received:', { access_token: tokens.access_token ? 'present' : 'missing' });

    // Get user info
    const userResponse = await fetch('https://api.leadconnectorhq.com/users/me', {
      headers: { 'Authorization': `Bearer ${tokens.access_token}` }
    });

    if (!userResponse.ok) {
      console.error('User info failed');
      return res.redirect('/oauth-error?error=user_info_failed');
    }

    const userInfo = await userResponse.json();
    console.log('User info:', { id: userInfo.id, email: userInfo.email });

    // Create session token
    const sessionToken = jwt.sign(
      { userId: userInfo.id, email: userInfo.email, authType: 'oauth' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie and redirect
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log('OAuth success - redirecting to dashboard');
    res.redirect('/dashboard');

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/oauth-error?error=callback_failed');
  }
});

// Test endpoint
app.get('/oauth-test', (req, res) => {
  res.json({
    message: 'OAuth server running',
    timestamp: new Date().toISOString(),
    env: {
      client_id: GHL_CLIENT_ID ? 'configured' : 'missing',
      client_secret: GHL_CLIENT_SECRET ? 'configured' : 'missing'
    }
  });
});

// Start OAuth endpoint
app.get('/oauth/start', (req, res) => {
  const authUrl = new URL('https://marketplace.leadconnectorhq.com/oauth/chooselocation');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('client_id', GHL_CLIENT_ID);
  authUrl.searchParams.set('scope', 'locations/read locations/write users.readonly users.write');
  
  console.log('Redirecting to OAuth:', authUrl.toString());
  res.redirect(authUrl.toString());
});

// Serve static files if they exist
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`OAuth callback server running on port ${port}`);
});