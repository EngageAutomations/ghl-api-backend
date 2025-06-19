const { spawn } = require('child_process');
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

console.log(`Initializing GoHighLevel Directory Management System on port ${PORT}`);

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist'), {
  index: 'index.html',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache');
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'GoHighLevel Directory Management',
    port: PORT,
    pid: process.pid,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// API placeholder
app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint ready for implementation' });
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Application error');
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PID: ${process.pid}`);
  console.log(`Ready for preview access`);
});

// Keep alive
const keepAlive = setInterval(() => {
  console.log(`Server alive - uptime: ${Math.floor(process.uptime())}s`);
}, 60000);

// Graceful shutdown
process.on('SIGTERM', () => {
  clearInterval(keepAlive);
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  clearInterval(keepAlive);
  server.close(() => process.exit(0));
});

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});