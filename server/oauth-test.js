// Simple production OAuth callback test
const express = require('express');
const app = express();

// Register OAuth callback route FIRST
app.get(['/api/oauth/callback', '/oauth/callback'], (req, res) => {
  console.log('✅ OAuth callback reached with query:', req.query);
  res.json({
    success: true,
    message: 'OAuth callback working!',
    query: req.query,
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`OAuth test server running on port ${port}`);
});