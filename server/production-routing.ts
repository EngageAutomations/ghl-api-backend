// server/production-routing.ts
import express from 'express';
import path from 'path';

export function setupProductionRouting(app: express.Express) {
  const distPath = path.join(__dirname, '..', 'dist');
  console.log('Setting up production routing - static files from:', distPath);

  // Conditional static file serving - skip API/OAuth routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/oauth')) {
      // Skip static file serving for API routes - let them pass through to route handlers
      return next();
    }
    // Serve static files for all other requests
    express.static(distPath)(req, res, next);
  });

  // Final fallback for SPA routing - ONLY for non-API/OAuth routes
  app.use((req, res, next) => {
    // Skip API and OAuth routes completely
    if (req.path.startsWith('/api/') || req.path.startsWith('/oauth')) {
      // If we reach here, the API route wasn't handled
      console.log(`⚠️ Unhandled API/OAuth route: ${req.method} ${req.path}`);
      return res.status(404).json({
        error: "API endpoint not found",
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    
    // Serve index.html for frontend SPA routes
    console.log(`📄 Serving index.html for frontend route: ${req.path}`);
    res.sendFile(path.join(distPath, 'index.html'));
  });
}