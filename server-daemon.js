#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting GoHighLevel Marketplace daemon...');

function startServer() {
  const serverCode = `
const express = require('express');
const path = require('path');
const app = express();

// CORS and static serving
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.static('./dist'));
app.get('/health', (req, res) => res.json({status: 'ok', service: 'GoHighLevel Marketplace'}));
app.get('*', (req, res) => res.sendFile(path.resolve('./dist/index.html')));

const server = app.listen(5000, '0.0.0.0', () => {
  console.log('🚀 GoHighLevel Marketplace running on port 5000');
  console.log('🔗 Railway OAuth: dir.engageautomations.com');
  console.log('📦 Installation: install_1750252333303');
  console.log('✅ Ready for testing');
});

process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT', () => { server.close(); process.exit(0); });
`;

  const child = spawn('node', ['-e', serverCode], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  child.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });

  child.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    if (code !== 0) {
      console.log('Restarting server in 3 seconds...');
      setTimeout(startServer, 3000);
    }
  });

  child.unref();
  
  // Save PID for cleanup
  fs.writeFileSync('/tmp/marketplace.pid', child.pid.toString());
  
  return child;
}

// Cleanup existing processes
try {
  const existingPid = fs.readFileSync('/tmp/marketplace.pid', 'utf8');
  process.kill(parseInt(existingPid), 'SIGTERM');
} catch (err) {
  // No existing process
}

// Start the server
const serverProcess = startServer();

// Handle daemon shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down daemon...');
  serverProcess.kill('SIGTERM');
  try {
    fs.unlinkSync('/tmp/marketplace.pid');
  } catch (err) {}
  process.exit(0);
});

console.log('Daemon started. Server will restart automatically if it crashes.');