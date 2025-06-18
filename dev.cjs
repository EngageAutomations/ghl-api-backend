const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      port: PORT,
      service: 'GoHighLevel Marketplace',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Serve the HTML page
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const htmlPath = path.join(__dirname, 'page.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(500);
      res.end('Error loading page');
    }
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`GoHighLevel Marketplace running on port ${PORT}`);
  console.log(`Environment: Replit Development`);
  console.log(`Access: http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} in use, exiting`);
    process.exit(1);
  }
});

// Keep alive
process.on('SIGTERM', () => {
  console.log('Received SIGTERM');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('Received SIGINT');
  server.close(() => process.exit(0));
});

module.exports = server;