const express = require('express');
const { createServer } = require('vite');
const path = require('path');

async function createDevServer() {
  const app = express();
  
  // Create Vite server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: './client'
  });
  
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
  
  // Serve static files from dist for production assets
  app.use('/dist', express.static(path.join(__dirname, 'dist')));
  
  const PORT = 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Development server running on http://0.0.0.0:${PORT}`);
    console.log('Railway OAuth: dir.engageautomations.com');
  });
}

createDevServer().catch(console.error);