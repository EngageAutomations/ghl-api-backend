import express, { type Request, Response } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// ES Module compatibility fixes
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

global.__dirname = __dirname;
global.__filename = __filename;

// OAuth credential validation
function getOAuthCredentials() {
  const envCredentials = {
    client_id: process.env.GHL_CLIENT_ID,
    client_secret: process.env.GHL_CLIENT_SECRET,
    redirect_uri: process.env.GHL_REDIRECT_URI
  };
  
  if (envCredentials.client_id && envCredentials.client_secret && envCredentials.redirect_uri) {
    console.log('GHL OAuth configured successfully');
    console.log(`Redirect URI: ${envCredentials.redirect_uri}`);
    return envCredentials;
  }
  
  console.log('OAuth credentials not available');
  return null;
}

async function startServer(): Promise<void> {
  const app = express();
  const server = createServer(app);
  
  app.use(cookieParser());
  app.use(express.json());
  
  // Configure OAuth if available
  const oauthCredentials = getOAuthCredentials();
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  // OAuth status endpoint
  app.get('/api/oauth/status', (req, res) => {
    res.json({
      configured: !!oauthCredentials,
      redirectUri: oauthCredentials?.redirect_uri || null
    });
  });
  
  // Register API routes
  try {
    await registerRoutes(app);
    console.log('✅ API routes registered successfully');
  } catch (error) {
    console.log('⚠️  API routes registration failed, continuing with basic setup');
  }
  
  // Setup Vite development server
  console.log('Setting up development mode with Vite...');
  await setupVite(app, server);
  
  const port = 5000;
  
  server.listen(port, "0.0.0.0", () => {
    console.log('==================================================');
    console.log('🚀 Server Running');
    console.log('==================================================');
    console.log(`Port: ${port}`);
    console.log(`Host: 0.0.0.0`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`ES Module compatibility: ✓`);
    console.log(`__dirname available: ${__dirname}`);
    console.log('==================================================');
    log(`serving on port ${port}`);
  });
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});