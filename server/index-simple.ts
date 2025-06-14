import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { setupDomainRedirects, setupCORS } from "./domain-config";
import { DatabaseStorage } from "./storage";
import { setupVite, serveStatic } from "./vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// ES Module compatibility fixes for __dirname error
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "5000");

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Domain and CORS setup
app.use(setupDomainRedirects);
app.use(setupCORS);

// Development bypass route for direct listings access
app.get('/dev', (req, res) => {
  res.redirect('/listings');
});

// Basic API routes for listings functionality
app.get('/api/listings', (req, res) => {
  // Mock listings data for development
  const mockListings = [
    {
      id: 1,
      title: "Premium Laptop Stand",
      description: "Ergonomic laptop stand for better productivity",
      category: "Electronics",
      price: "$49.99",
      status: "Active",
      location: "New York, NY",
      createdAt: new Date().toISOString(),
      slug: "premium-laptop-stand"
    },
    {
      id: 2,
      title: "Organic Coffee Beans",
      description: "Fresh roasted organic coffee from local farms",
      category: "Food & Beverage",
      price: "$24.99",
      status: "Active",
      location: "Portland, OR",
      createdAt: new Date().toISOString(),
      slug: "organic-coffee-beans"
    },
    {
      id: 3,
      title: "Yoga Mat Premium",
      description: "Non-slip premium yoga mat for all levels",
      category: "Fitness",
      price: "$34.99",
      status: "Inactive",
      location: "Los Angeles, CA",
      createdAt: new Date().toISOString(),
      slug: "yoga-mat-premium"
    }
  ];
  
  res.json(mockListings);
});

app.get('/api/directories', (req, res) => {
  // Mock directories data
  const mockDirectories = [
    {
      id: 1,
      name: "Electronics Directory",
      slug: "electronics",
      description: "Tech products and gadgets",
      listingCount: 15
    },
    {
      id: 2,
      name: "Food & Beverage Directory", 
      slug: "food-beverage",
      description: "Local food and drink businesses",
      listingCount: 8
    }
  ];
  
  res.json(mockDirectories);
});

function getEnhancedOAuthAppHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GoHighLevel Directory App</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 0; 
      padding: 40px;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container { 
      max-width: 600px; 
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center; 
    }
    .btn { 
      background: #0079F2; 
      color: white; 
      padding: 12px 24px; 
      border: none; 
      border-radius: 6px; 
      text-decoration: none; 
      display: inline-block; 
      margin: 10px;
      cursor: pointer;
      font-size: 16px;
    }
    .btn:hover { background: #0066D9; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #0079F2;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
      display: none;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .status {
      margin-top: 20px;
      padding: 15px;
      border-radius: 6px;
      display: none;
    }
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .status.loading {
      background: #e3f2fd;
      color: #1976d2;
    }
    .status.error {
      background: #ffebee;
      color: #c62828;
    }
    .oauth-connected {
      background: #28a745;
      padding: 20px;
      border-radius: 8px;
      color: white;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>GoHighLevel Directory App</h1>
    <p>Connect your GoHighLevel account to get started.</p>
    <button onclick="startOAuth()" class="btn" id="oauthBtn">Connect with GoHighLevel</button>
    
    <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
      <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;"><strong>Development Access:</strong></p>
      <button onclick="window.location.href='/dev'" class="btn" style="background: #28a745;">Access Listings Directory</button>
    </div>
    
    <div class="spinner" id="spinner"></div>
    <div id="status"></div>
  </div>

  <script>
    console.log('OAuth app initialized - Marketplace Installation v3.1');
    
    const oauthConfig = {
      clientId: '67472ecce8b57dd9eda067a8',
      redirectUri: 'https://listings.engageautomations.com/',
      scopes: [
        'products/prices.write',
        'products/prices.readonly', 
        'products/collection.write',
        'products/collection.readonly',
        'medias.write',
        'medias.readonly',
        'locations.readonly',
        'contacts.readonly',
        'contacts.write'
      ]
    };

    function startOAuth() {
      console.log('Starting OAuth flow...');
      document.getElementById('oauthBtn').disabled = true;
      document.getElementById('spinner').style.display = 'block';
      showStatus('Initiating OAuth...', 'loading');
      
      window.location.href = '/api/oauth/start';
    }

    function showStatus(message, type = 'info') {
      const statusDiv = document.getElementById('status');
      statusDiv.className = 'status ' + type;
      statusDiv.innerHTML = message;
      statusDiv.style.display = 'block';
    }

    function goToDashboard() {
      window.location.href = '/api-management';
    }
  </script>
</body>
</html>`;
}

// OAuth route specifically for root path only
app.get('/', async (req, res) => {
  const { code, state, error, action, ghl_user_id, ghl_location_id, embedded } = req.query;
  
  // Handle embedded CRM tab access with session recovery
  if ((ghl_user_id || ghl_location_id) && !code) {
    console.log('Embedded CRM tab access detected, attempting session recovery...');
  }
  
  // Serve OAuth app HTML with data extraction capability
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(getEnhancedOAuthAppHTML());
});

// API Management route
app.get('/api-management', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GoHighLevel API Management</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 40px;
          background: #f5f5f5;
        }
        .container { 
          max-width: 1200px; 
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .btn { 
          background: #0079F2; 
          color: white; 
          padding: 12px 24px; 
          border: none; 
          border-radius: 6px; 
          text-decoration: none; 
          display: inline-block; 
          margin: 10px;
          cursor: pointer;
          font-size: 16px;
        }
        .btn:hover { background: #0066D9; }
        .success { color: #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>GoHighLevel API Management Interface</h1>
        <p class="success">✓ Successfully accessed the API management interface!</p>
        <p>This is where you can manage your GoHighLevel API operations with 50+ available endpoints.</p>
        <button onclick="window.location.href='/'" class="btn">Back to OAuth Page</button>
      </div>
    </body>
    </html>
  `);
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Setup Vite for React frontend
const server = createServer(app);

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV !== "production";

async function startServer() {
  if (isDevelopment) {
    // Setup Vite development server for React frontend
    await setupVite(app, server);
  } else {
    // Serve static files in production
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    
    // SPA fallback for client-side routing
    app.get('*', (req, res) => {
      // Don't override the OAuth root route or API routes
      if (req.path === '/' || req.path.startsWith('/api/')) {
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    console.log(`Frontend: http://localhost:${port}`);
    console.log(`Listings: http://localhost:${port}/listings`);
    console.log("Server ready with green bypass button to listings");
  });
}

startServer().catch(console.error);