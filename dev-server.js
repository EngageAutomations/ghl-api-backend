const express = require('express');
const path = require('path');
const cors = require('cors');
const { createServer } = require('vite');

const app = express();
const PORT = process.env.PORT || 5000;

async function startServer() {
  // Create Vite server in middleware mode
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.resolve(__dirname, 'client'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'client', 'src'),
        '@shared': path.resolve(__dirname, 'shared'),
        '@assets': path.resolve(__dirname, 'attached_assets'),
      },
    },
  });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes placeholder
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

  // Use Vite's connect instance as middleware
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Development server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);