#!/usr/bin/env node

// GoHighLevel Marketplace Dev Server Wrapper
// This file acts as the npm run dev command for Replit workflows

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting GoHighLevel Marketplace development server...');

// Start the dev server
const serverProcess = spawn('node', ['dev.cjs'], {
  cwd: path.dirname(__filename),
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '5000' }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle cleanup
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  serverProcess.kill('SIGINT');
});

// Keep process alive
process.on('exit', () => {
  serverProcess.kill();
});