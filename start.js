const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

console.log('Starting development server...');

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// API endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running', 
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Development API working',
    timestamp: new Date().toISOString()
  });
});

// Serve React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <html>
        <head><title>Development Server</title></head>
        <body>
          <h1>Development Server Active</h1>
          <p>Port: ${PORT}</p>
          <p>Status: Running</p>
          <p><a href="/health">Health Check</a></p>
          <p><a href="/api/test">API Test</a></p>
        </body>
      </html>
    `);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Server error occurred' });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Development server running on http://0.0.0.0:${PORT}`);
  console.log(`Preview URL: http://0.0.0.0:${PORT}`);
});

// Keep server alive
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => process.exit(0));
});