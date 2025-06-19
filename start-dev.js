const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API endpoints for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', env: process.env.NODE_ENV });
});

// Mock API endpoints for development
app.get('/api/directories', (req, res) => {
  res.json([
    { id: 1, name: 'Sample Directory', description: 'A test directory for development' }
  ]);
});

app.get('/api/listings', (req, res) => {
  res.json([
    { 
      id: 1, 
      title: 'Sample Listing', 
      description: 'A test listing for development',
      price: 99.99,
      imageUrl: 'https://via.placeholder.com/300x200'
    }
  ]);
});

// Static files middleware - serve from client directory for development
app.use('/src', express.static(path.join(__dirname, 'client/src')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'client')));

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Index file not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Development server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving client files from: ${path.join(__dirname, 'client')}`);
  console.log(`🔍 Health check available at: http://0.0.0.0:${PORT}/health`);
});