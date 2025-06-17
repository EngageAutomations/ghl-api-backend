import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: __dirname,
  });
  
  // Use vite's connect instance as middleware
  app.use(vite.ssrFixStacktrace);
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  // OAuth status endpoint
  app.get('/api/oauth/status', (req, res) => {
    res.json({
      configured: true,
      backend: 'Railway',
      redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback'
    });
  });
  
  // Use Vite middleware for all other requests
  app.use('*', vite.middlewares);
  
  const port = process.env.PORT || 5000;
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

createServer().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});