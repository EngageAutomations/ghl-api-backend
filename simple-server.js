import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Basic OAuth status endpoint
app.get('/api/oauth/status', (req, res) => {
  res.json({
    configured: true,
    redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback',
    backend: 'Railway Production'
  });
});

// Setup Vite in development mode
async function setupVite() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  
  app.use(vite.ssrFixStacktrace);
  app.use('/', vite.middlewares);
}

async function startServer() {
  try {
    console.log('🚀 Starting GoHighLevel Marketplace Application...');
    
    // Setup Vite for frontend
    await setupVite();
    console.log('✅ Vite development server configured');
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`==================================================`);
      console.log(`🚀 Server Running`);
      console.log(`==================================================`);
      console.log(`Port: ${PORT}`);
      console.log(`Host: 0.0.0.0`);
      console.log(`Environment: development`);
      console.log(`Frontend: Vite Dev Server`);
      console.log(`Backend: Express + OAuth Integration`);
      console.log(`==================================================`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();