const express = require('express');
const path = require('path');
const { createServer } = require('vite');

async function startServer() {
  const app = express();
  const port = process.env.PORT || 5000;

  try {
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

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();