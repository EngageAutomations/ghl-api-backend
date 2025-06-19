#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting GoHighLevel Marketplace Application...');

// Start the development server
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

devProcess.on('error', (error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});

devProcess.on('close', (code) => {
  console.log(`Development server exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  devProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  devProcess.kill('SIGTERM');
});