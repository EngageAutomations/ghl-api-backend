#!/usr/bin/env node

// Simple application starter for Replit workflow compatibility
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting GoHighLevel Marketplace Application...');

// Start the TypeScript server
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});