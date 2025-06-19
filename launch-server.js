const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

console.log(`🚀 Starting GoHighLevel Directory & Collections Management System`);
console.log(`📡 Server will run on port: ${PORT}`);

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'GoHighLevel Directory & Collections Management System',
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// API routes placeholder (if needed later)
app.use('/api', (req, res, next) => {
  // Future API routes can be added here
  next();
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running successfully on port ${PORT}`);
  console.log(`🌐 Access your application at http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 Server shutting down gracefully...');
  process.exit(0);
});