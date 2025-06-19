#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Prevent process from exiting
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Keep process alive
setInterval(() => {
  // Heartbeat to keep process active
}, 30000);

console.log(`Starting GoHighLevel Directory Management System on port ${PORT}`);

// Serve static files
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: false
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'GoHighLevel Directory Management',
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Application not built. Run npm run build first.');
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Process ID: ${process.pid}`);
});

// Write PID file
fs.writeFileSync('daemon.pid', process.pid.toString());

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Cleanup on exit
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    fs.unlinkSync('daemon.pid');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    fs.unlinkSync('daemon.pid');
    process.exit(0);
  });
});