const express = require('express');
const path = require('path');

const app = express();

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 GoHighLevel Marketplace running on port ${PORT}`);
  console.log(`📡 Railway OAuth: dir.engageautomations.com`);
  console.log(`🔑 Installation: install_1750252333303`);
});