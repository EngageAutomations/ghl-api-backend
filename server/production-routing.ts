// server/production-routing.ts
import express from 'express';
import path from 'path';

export function setupProductionRouting(app: express.Express) {
  const distPath = path.join(__dirname, '..', 'dist');
  console.log('Setting up production routing - static files from:', distPath);

  // Serve static files for all non-API/OAuth requests
  app.use(express.static(distPath));

  // Fallback route for frontend SPA - ONLY for non-API/OAuth routes
  // This must come AFTER all API routes are registered
  app.use((req, res, next) => {
    // Skip API and OAuth routes completely - they should be handled by specific routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/oauth')) {
      console.log(`⚠️ Unhandled API/OAuth route: ${req.method} ${req.path}`);
      return res.status(404).json({
        error: "API endpoint not found",
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    
    // Serve index.html for all other routes (SPA routing)
    console.log(`📄 Serving index.html for frontend route: ${req.path}`);
    res.sendFile(path.join(distPath, 'index.html'));
  });
}