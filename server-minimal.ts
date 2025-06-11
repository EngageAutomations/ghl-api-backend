import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';

const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// OAuth routes - directly in main file for debugging
app.post('/api/oauth/url', async (req, res) => {
  console.log('OAuth URL generation requested');
  
  const clientId = process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4';
  const redirectUri = 'https://dir.engageautomations.com/api/oauth/callback';
  const scopes = 'conversations/message.readonly conversations/message.write locations.readonly';
  const state = `ghl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&state=${state}`;
  
  res.json({
    success: true,
    authUrl: authUrl,
    state: state
  });
});

app.post('/api/oauth/exchange', async (req, res) => {
  console.log('OAuth token exchange requested');
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code is required' });
  }
  
  // Mock successful response for testing
  res.json({
    success: true,
    access_token: 'test_token',
    refresh_token: 'test_refresh',
    expires_in: 3600
  });
});

app.get(['/api/oauth/callback', '/oauth/callback'], (req, res) => {
  console.log('OAuth callback reached');
  res.send('OAuth callback working!');
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: port });
});

// Static files fallback
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>OAuth Test Server</title></head>
    <body>
      <h1>OAuth Test Server</h1>
      <p>Server is running on port ${port}</p>
      <a href="/test">Test Route</a>
    </body>
    </html>
  `);
});

// Start server
const server = createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`=== MINIMAL OAUTH SERVER ===`);
  console.log(`Port: ${port}`);
  console.log(`Host: 0.0.0.0`);
  console.log(`OAuth endpoints:`);
  console.log(`  POST /api/oauth/url`);
  console.log(`  POST /api/oauth/exchange`);
  console.log(`  GET /api/oauth/callback`);
  console.log(`============================`);
});