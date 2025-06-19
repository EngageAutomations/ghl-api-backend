const express = require('express');
const { createServer } = require('vite');
const path = require('path');

async function createDevServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Create Vite server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.resolve(__dirname, 'client'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'client/src'),
        '@shared': path.resolve(__dirname, 'shared'),
        '@assets': path.resolve(__dirname, 'attached_assets'),
      },
    },
  });

  // Use vite's connect instance as middleware
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', port: PORT, timestamp: Date.now() });
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Development server running on port ${PORT}`);
    console.log(`Access at: http://localhost:${PORT}`);
  });

  return server;
}

// Start the server
createDevServer().catch(err => {
  console.error('Error starting development server:', err);
  process.exit(1);
});