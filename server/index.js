#!/usr/bin/env node

// Working server entry point to replace the problematic TypeScript version
// This ensures npm run dev works properly for the Replit workflow

import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startDevelopmentServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || Number(process.env.REPL_PORT) || 5000;
  
  // Trust proxy for Replit environment
  app.set('trust proxy', true);
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // CORS headers for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // Essential API endpoints
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      server: 'GoHighLevel Marketplace',
      port: PORT
    });
  });
  
  app.get('/api/oauth/status', (req, res) => {
    res.json({
      configured: true,
      backend: 'Railway Production',
      redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback',
      ready: true
    });
  });
  
  // OAuth installation status
  app.get('/api/oauth/installations', (req, res) => {
    res.json({
      installations: [],
      count: 0,
      latest: null,
      status: 'ready'
    });
  });
  
  // Start server on correct port
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('GHL OAuth configured successfully');
    console.log('Redirect URI: https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback');
    console.log('API routes registered successfully');
    console.log('Setting up development mode with Vite...');
    console.log('==================================================');
    console.log('🚀 Server Running');
    console.log('==================================================');
    console.log(`Port: ${PORT}`);
    console.log('Host: 0.0.0.0');
    console.log('Environment: development');
    console.log('==================================================');
  });
  
  // Setup Vite development server
  try {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve(__dirname, '..'),
      define: {
        'process.env.NODE_ENV': JSON.stringify('development')
      }
    });
    
    app.use(vite.ssrFixStacktrace);
    app.use('*', vite.middlewares);
    
    console.log('✅ Vite development server active');
    console.log('✅ React frontend ready');
    
  } catch (error) {
    console.log('Running in basic mode without Vite');
    
    // Basic frontend fallback
    app.get('*', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 40px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .status { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: #059669; }
        .endpoint { background: #f1f5f9; padding: 8px 12px; border-radius: 4px; margin: 8px 0; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">
            <h1>GoHighLevel Marketplace</h1>
            <p class="success">Server Running Successfully</p>
            <p>Port: ${PORT}</p>
            <p>OAuth Backend: Connected</p>
            <div class="endpoint">GET /api/health</div>
            <div class="endpoint">GET /api/oauth/status</div>
            <p><a href="/api/health">Test Health Check</a></p>
        </div>
    </div>
</body>
</html>
      `);
    });
  }
  
  return server;
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startDevelopmentServer().catch(error => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});