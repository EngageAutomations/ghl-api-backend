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
  });
} else {
  serveStatic(app);
}

// Start server
const server = createServer(app);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API Management: http://localhost:${PORT}/api-management`);
});

export { app };