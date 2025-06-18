#!/usr/bin/env node

// Direct server startup for Replit preview system
const { spawn } = require('child_process');

console.log('Starting GoHighLevel Marketplace server...');

const serverProcess = spawn('node', ['server.cjs'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: process.env.PORT || '3000'
  }
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
});

process.on('SIGINT', () => {
  console.log('Stopping server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});