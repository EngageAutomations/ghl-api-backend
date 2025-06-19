#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Start the Express server
const serverProcess = spawn('node', ['start.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: process.env.PORT || '5000' },
  stdio: 'inherit'
});

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

console.log('Starting GoHighLevel Directory & Collections Management System...');