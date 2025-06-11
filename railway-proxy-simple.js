// Simple OAuth callback proxy - forwards to your Replit backend
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'OAuth Callback Proxy' });
});

// OAuth callback proxy - forwards to your existing Replit OAuth handler
app.get('/api/oauth/callback', async (req, res) => {
  console.log('=== OAUTH CALLBACK RECEIVED ===');
  console.log('Query params:', req.query);

  const { code, state, error } = req.query;
  
  // Build the query string to forward to Replit
  const queryParams = new URLSearchParams(req.query).toString();
  
  // Forward to your Replit OAuth endpoint
  const replitOAuthUrl = `https://dir.engageautomations.com/api/oauth/callback?${queryParams}`;
  
  console.log('Forwarding to Replit:', replitOAuthUrl);
  
  // Redirect to your Replit backend to handle the actual OAuth
  res.redirect(replitOAuthUrl);
});

app.listen(PORT, () => {
  console.log(`✅ OAuth Proxy listening on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});