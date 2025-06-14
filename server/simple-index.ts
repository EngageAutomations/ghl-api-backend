import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { setupVite, serveStatic } from "./vite";
import { setupDomainRedirects, setupCORS } from "./domain-config";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Domain and CORS setup
app.use(setupDomainRedirects);
app.use(setupCORS);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Force React app load - bypass any cached content
app.get('/force-react', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GoHighLevel API Management</title>
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
      <meta http-equiv="Pragma" content="no-cache">
      <meta http-equiv="Expires" content="0">
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx?t=${Date.now()}"></script>
    </body>
    </html>
  `);
});

// Basic OAuth success page
app.get('/oauth-success', (req, res) => {
  res.redirect('/api-management');
});

// Installation required page
app.get('/installation-required', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html><head><title>Installation Required</title></head>
    <body>
      <h1>GoHighLevel Installation Required</h1>
      <p>Please install this app from the GoHighLevel Marketplace to continue.</p>
    </body></html>
  `);
});

// Setup Vite in development
if (process.env.NODE_ENV !== "production") {
  setupVite(app).then(() => {
    console.log('Vite development server ready');
  }).catch((error) => {
    console.error('Vite setup error:', error);
  });
} else {
  serveStatic(app);
}

// Start server
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Add error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API Management: http://localhost:${PORT}/api-management`);
});

export { app };