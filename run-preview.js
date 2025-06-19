#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'running', port: PORT });
});

// API endpoints for development
app.get('/api/test', (req, res) => {
  res.json({ message: 'Development server running', timestamp: new Date() });
});

// Mock directory endpoint
app.get('/api/directories', (req, res) => {
  res.json([{ id: 1, name: 'Test Directory', description: 'For testing product creation' }]);
});

// Mock listings endpoint
app.get('/api/listings', (req, res) => {
  res.json([]);
});

// Catch all for React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('React app not found');
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Preview server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔧 API test: http://0.0.0.0:${PORT}/api/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});