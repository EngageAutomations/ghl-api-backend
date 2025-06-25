// server.js - Main entry point for Railway deployment
// Loads and starts the OAuth backend with installation tracking

const path = require('path');

console.log('Starting OAuth backend server...');
console.log('Loading main application from index.js...');

// Load the main application
require('./index.js');

console.log('OAuth backend server started successfully');
