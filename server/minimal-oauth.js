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

// OAuth callback handler DISABLED - handled by main server in server/index.ts
// app.get(['/api/oauth/callback', '/oauth/callback'], async (req, res) => {
//   console.log('OAuth callback hit:', req.query);
//   ... handler code disabled to prevent conflicts
// });

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

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`OAuth callback server running on port ${port}`);
});