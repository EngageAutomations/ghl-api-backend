import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { setupVite } from "./vite";
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

// OAuth page for root path only
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
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
      </style>
    </head>
    <body>
      <div class="container">
        <h1>GoHighLevel Directory App</h1>
        <p>Connect your GoHighLevel account to get started.</p>
        <button onclick="startOAuth()" class="btn" id="oauthBtn">Connect with GoHighLevel</button>
        
        <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;"><strong>Development Access:</strong></p>
          <button onclick="window.location.href='/listings'" class="btn" style="background: #28a745;">Access Listings Directory</button>
        </div>
      </div>

      <script>
        function startOAuth() {
          window.location.href = '/api/oauth/start';
        }
      </script>
    </body>
    </html>
  `);
});

// Development bypass route
app.get('/dev', (req, res) => {
  res.redirect('/listings');
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Setup server with Vite for React frontend
const server = createServer(app);

async function startServer() {
  // Setup Vite development server for React frontend
  await setupVite(app, server);
  
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    console.log(`OAuth: http://localhost:${port}/`);
    console.log(`Listings: http://localhost:${port}/listings`);
    console.log("Server ready - green button goes to listings directory");
  });
}

startServer().catch(console.error);