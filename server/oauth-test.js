// Simple OAuth test server for production deployment
const express = require('express');
const path = require('path');

const app = express();

// OAuth callback - must be registered before static files
app.get('/api/oauth/callback', (req, res) => {
  console.log('OAuth callback reached:', req.query);
  res.json({
    success: true,
    code: req.query.code,
    timestamp: new Date().toISOString(),
    message: 'OAuth callback working in production'
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`OAuth test server running on port ${PORT}`);
});