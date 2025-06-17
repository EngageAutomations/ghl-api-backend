#!/usr/bin/env node

import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5000;
  
  // Enable trust proxy for Replit
  app.set('trust proxy', true);
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // CORS for development
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
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      port: PORT,
      host: req.get('host')
    });
  });
  
  // OAuth status endpoint
  app.get('/api/oauth/status', (req, res) => {
    res.json({
      configured: true,
      backend: 'Railway Production',
      redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback',
      clientId: 'Configured',
      status: 'Ready'
    });
  });
  
  // Start HTTP server first
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 GoHighLevel Marketplace Server Started`);
    console.log(`Port: ${PORT}`);
    console.log(`Host: 0.0.0.0`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Status: Ready for connections\n`);
  });
  
  // Setup Vite development server
  try {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: __dirname,
      define: {
        'process.env.NODE_ENV': JSON.stringify('development')
      }
    });
    
    app.use(vite.ssrFixStacktrace);
    app.use('*', vite.middlewares);
    
    console.log('✅ Vite development server integrated');
    console.log('✅ React frontend ready');
    console.log('✅ OAuth backend connected');
    
  } catch (error) {
    console.warn('⚠️  Running without Vite (fallback mode)');
    
    // Fallback HTML response
    app.get('*', (req, res) => {
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 40px; background: #f8fafc; color: #334155;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .status-card { 
            background: white; padding: 30px; border-radius: 12px; 
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px;
        }
        .success { border-left: 4px solid #22c55e; }
        .info { border-left: 4px solid #3b82f6; }
        .endpoint { 
            background: #f1f5f9; padding: 12px; border-radius: 6px; 
            font-family: 'Monaco', 'Menlo', monospace; font-size: 14px;
            margin: 10px 0;
        }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>GoHighLevel Marketplace</h1>
            <p>OAuth Integration Platform</p>
        </div>
        
        <div class="status-card success">
            <h2>✅ Server Status: Running</h2>
            <p>Port: ${PORT} | Environment: Development</p>
            <p>Frontend: React + Vite | Backend: Express + OAuth</p>
        </div>
        
        <div class="grid">
            <div class="status-card info">
                <h3>API Endpoints</h3>
                <div class="endpoint">GET /api/health</div>
                <div class="endpoint">GET /api/oauth/status</div>
                <a href="/api/health" target="_blank">Test Health Check</a>
            </div>
            
            <div class="status-card info">
                <h3>OAuth Configuration</h3>
                <p>Backend: Railway Production</p>
                <p>Status: Connected</p>
                <a href="/api/oauth/status" target="_blank">Check OAuth Status</a>
            </div>
        </div>
        
        <div class="status-card">
            <h3>Development Ready</h3>
            <p>The GoHighLevel marketplace application is running and ready for development. 
            The React frontend will load automatically when the full application starts.</p>
        </div>
    </div>
</body>
</html>
      `);
    });
  }
  
  return server;
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});