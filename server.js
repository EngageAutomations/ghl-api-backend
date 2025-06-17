import express from 'express';
import { createServer } from 'vite';

const app = express();
const PORT = 5000;

// Basic middleware
app.use(express.json());

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', server: 'Express + Vite' });
});

app.get('/api/oauth/status', (req, res) => {
  res.json({
    configured: true,
    backend: 'Railway',
    redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback'
  });
});

// Start server immediately
const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  
  try {
    // Setup Vite after server is running
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    
    app.use(vite.ssrFixStacktrace);
    app.use('*', vite.middlewares);
    console.log('Vite middleware attached');
  } catch (error) {
    console.log('Running without Vite middleware');
    
    // Fallback static file serving
    app.get('*', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>GoHighLevel Marketplace</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .status { background: #e8f5e8; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>GoHighLevel Marketplace Application</h1>
          <div class="status">
            <h2>✅ Server Status: Running</h2>
            <p>Port: ${PORT}</p>
            <p>OAuth Backend: Railway Production</p>
            <p>API Health: <a href="/api/health">Check</a></p>
            <p>OAuth Status: <a href="/api/oauth/status">Check</a></p>
          </div>
        </body>
        </html>
      `);
    });
  }
});