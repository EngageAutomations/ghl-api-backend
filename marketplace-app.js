const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('Initializing GoHighLevel Marketplace...');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable comprehensive CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Static file serving from dist
const distDirectory = path.join(__dirname, 'dist');
console.log('Serving static files from:', distDirectory);

if (fs.existsSync(distDirectory)) {
  app.use(express.static(distDirectory, {
    maxAge: 0,
    etag: false
  }));
} else {
  console.error('ERROR: dist directory not found at', distDirectory);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'GoHighLevel Marketplace',
    timestamp: new Date().toISOString(),
    railwayBackend: 'dir.engageautomations.com'
  });
});

// SPA routing - serve index.html for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(distDirectory, 'index.html');
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send(`
      <h1>Application Not Built</h1>
      <p>The application needs to be built first.</p>
      <p>Run: <code>npm run build</code></p>
    `);
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with proper error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 GoHighLevel Marketplace Application');
  console.log(`📍 Server running at: http://0.0.0.0:${PORT}`);
  console.log('🔗 Railway OAuth backend: dir.engageautomations.com');
  console.log('📦 Installation ID: install_1750252333303');
  console.log('✅ Ready for product creation testing');
  console.log('');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log('Port 5000 is in use, trying port 5001...');
    server.listen(5001, '0.0.0.0');
  }
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep process alive and handle crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.log('Attempting to restart...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;