const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT;

console.log(`[${new Date().toISOString()}] Starting GoHighLevel Directory & Collections Management System...`);

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    application: 'GoHighLevel Directory & Collections Management System',
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

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Health check: http://localhost:${PORT}/health`);
  console.log(`[${new Date().toISOString()}] Application: http://localhost:${PORT}`);
});

// Keep process alive
setInterval(() => {
  console.log(`[${new Date().toISOString()}] Server heartbeat - port ${PORT}`);
}, 30000);

process.on('SIGTERM', () => {
  console.log(`[${new Date().toISOString()}] Received SIGTERM, shutting down gracefully`);
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log(`[${new Date().toISOString()}] Received SIGINT, shutting down gracefully`);
  server.close(() => {
    process.exit(0);
  });
});