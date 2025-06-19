#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;
const CLIENT_DIR = path.join(__dirname, 'client');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('File not found');
      return;
    }
    res.writeHead(200, {'Content-Type': contentType});
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Handle root
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Handle SPA routing - serve index.html for routes without file extensions
  if (!path.extname(pathname)) {
    pathname = '/index.html';
  }
  
  const filePath = path.join(CLIENT_DIR, pathname);
  
  // Security check - ensure file is within CLIENT_DIR
  if (!filePath.startsWith(CLIENT_DIR)) {
    res.writeHead(403, {'Content-Type': 'text/plain'});
    res.end('Forbidden');
    return;
  }
  
  serveFile(filePath, res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log(`Local access: http://localhost:${PORT}/`);
});

// Keep process alive
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});