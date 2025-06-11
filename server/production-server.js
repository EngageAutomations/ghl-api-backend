#!/usr/bin/env node

// Production server with ES module compatibility fixes for Cloud Run deployment
import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES Module compatibility fixes for __dirname error
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make available globally for compatibility with any legacy code
global.__dirname = __dirname;
global.__filename = __filename;

const app = express();

// Cloud Run port configuration (uses PORT env var, defaults to 8080)
const port = process.env.PORT || 8080;

// Basic middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from dist/public
app.use(express.static(join(__dirname, 'public')));

// Health check endpoint for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: port 
  });
});

// Basic API routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'running',
    environment: process.env.NODE_ENV || 'production',
    port: port
  });
});

// OAuth callback route
app.get(['/api/oauth/callback', '/oauth/callback'], (req, res) => {
  console.log('OAuth callback hit:', req.query);
  res.send('OAuth callback endpoint is working');
});

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Production server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server
const server = createServer(app);

// Server binding for Cloud Run (must bind to 0.0.0.0, not localhost)
server.listen(port, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 Production Server Running');
  console.log('='.repeat(50));
  console.log(`Port: ${port}`);
  console.log(`Host: 0.0.0.0`);
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`ES Module compatibility: ✓`);
  console.log(`__dirname available: ${__dirname}`);
  console.log('Ready for Cloud Run deployment');
  console.log('='.repeat(50));
});

// Graceful shutdown handlers for Cloud Run
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;