// Production server with ES module compatibility fixes
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cookieParser from 'cookie-parser';
import { registerRoutes } from './routes.js';
import { setupProductionRouting } from './production-router.js';
import { setupDomainRedirects, setupCORS } from './domain-config.js';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Domain and CORS setup
app.use(setupDomainRedirects);
app.use(setupCORS);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Setup routes and production routing
async function initializeServer() {
  try {
    // Register API routes
    registerRoutes(app);
    
    // Setup production static file serving
    setupProductionRouting(app);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Start server on all interfaces for Cloud Run
    const port = process.env.PORT || 5000;
    server.listen(port, '0.0.0.0', () => {
      console.log(`=== Production Server Started ===`);
      console.log(`Port: ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`Time: ${new Date().toISOString()}`);
      console.log(`Ready for connections on 0.0.0.0:${port}`);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

initializeServer();