#!/usr/bin/env node

// Development script for npm run dev
const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'main.cjs');

console.log('Starting GoHighLevel Marketplace...');

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env, PORT: process.env.PORT || '5000' }
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});