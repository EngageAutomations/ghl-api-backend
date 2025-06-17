import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import viteConfig from './vite.config.ts';

const app = express();
const port = 5000;

// Create Vite server with proper configuration
const vite = await createServer({
  ...viteConfig,
  server: { middlewareMode: true },
  appType: 'custom',
  configFile: false
});

// Use vite's connect instance as middleware
app.use(vite.middlewares);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', time: new Date().toISOString() });
});

// Catch-all handler for SPA routing
app.use('*', async (req, res, next) => {
  const url = req.originalUrl;
  try {
    const template = await vite.transformIndexHtml(url, `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.tsx"></script>
        </body>
      </html>
    `);
    res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Fixed dev server running on http://0.0.0.0:${port}`);
  console.log(`Preview should be available now`);
});