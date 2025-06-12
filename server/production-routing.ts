// server/production-routing.ts
import express from 'express';
import path from 'path';

export function setupProductionRouting(app: express.Express) {
  const distPath = path.join(__dirname, '..', 'dist');
  console.log('Setting up production routing - static files from:', distPath);

  // Serve static files but skip API and OAuth routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/oauth')) {
      console.log(`⚡ Skipping static serving for API/OAuth route: ${req.method} ${req.path}`);
      return next(); // Don't serve static content for API/OAuth routes
    }
    express.static(distPath)(req, res, next);
  });

  // Fallback route for frontend SPA - but ONLY for non-API routes
  app.get('*', (req, res, next) => {
    // NEVER handle API or OAuth routes here - they must be handled by Express routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/oauth')) {
      console.log(`⚠️ API/OAuth route reached fallback - this indicates a routing problem: ${req.method} ${req.path}`);
      // Return error response to help diagnose the issue
      return res.status(404).json({
        error: "API endpoint not found",
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        note: "This route should be handled by Express, not static serving"
      });
    }
    
    console.log(`📄 Serving index.html for frontend route: ${req.path}`);
    res.sendFile(path.join(distPath, 'index.html'));
  });
}