const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

if (!PORT) {
  console.error('PORT environment variable not set');
  process.exit(1);
}

console.log('Starting GoHighLevel Directory Management System');

// Static file serving
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: 0,
  etag: false
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  try {
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not found');
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).send('Server error');
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Process ID: ${process.pid}`);
});

// Error handling
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Keep alive mechanism
const keepAlive = setInterval(() => {
  console.log(`Heartbeat - uptime: ${Math.floor(process.uptime())}s`);
}, 30000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down');
  clearInterval(keepAlive);
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down');
  clearInterval(keepAlive);
  server.close(() => process.exit(0));
});

// Prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});