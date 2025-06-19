const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    pid: process.pid,
    port: PORT
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'GoHighLevel Directory System Running',
    timestamp: new Date().toISOString(),
    features: ['directories', 'collections', 'listings', 'ghl-integration']
  });
});

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Application: http://localhost:${PORT}`);
});