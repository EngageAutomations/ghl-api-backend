const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

console.log('Starting development server...');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check accessed');
  res.json({ 
    status: 'running', 
    port: PORT, 
    timestamp: new Date().toISOString(),
    message: 'Development server is active'
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  console.log('API test endpoint accessed');
  res.json({ 
    message: 'API working correctly',
    server: 'development',
    timestamp: new Date().toISOString()
  });
});

// Mock endpoints for development
app.get('/api/directories', (req, res) => {
  res.json([
    { id: 1, name: 'Sample Directory', description: 'Test directory for product creation' }
  ]);
});

app.get('/api/listings', (req, res) => {
  res.json([]);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'index.html');
  console.log(`Serving index.html for route: ${req.path}`);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('index.html not found at:', indexPath);
    res.status(404).send(`
      <html>
        <body>
          <h1>Development Server Running</h1>
          <p>Server is active on port ${PORT}</p>
          <p>React app files not found at: ${indexPath}</p>
          <p><a href="/health">Health Check</a></p>
          <p><a href="/api/test">API Test</a></p>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Development server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`API test: http://0.0.0.0:${PORT}/api/test`);
  console.log(`Client directory: ${path.join(__dirname, 'client')}`);
  
  // Log file structure
  const clientDir = path.join(__dirname, 'client');
  if (fs.existsSync(clientDir)) {
    console.log('Client directory contents:');
    fs.readdirSync(clientDir).forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    console.log('Client directory does not exist');
  }
});