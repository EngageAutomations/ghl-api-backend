#!/usr/bin/env node

// Development server launcher for GoHighLevel Marketplace
// This file provides the "dev" script functionality

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting GoHighLevel Marketplace Development Server...');

// Set environment variables for development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3000';

// Start the main server
const serverPath = path.join(__dirname, 'index.cjs');
const serverProcess = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname
});

// Handle server process events
serverProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
    process.exit(code);
  }
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Handle shutdown signals
process.on('SIGINT', () => {
  console.log('\nShutting down development server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down development server...');
  serverProcess.kill('SIGTERM');
});