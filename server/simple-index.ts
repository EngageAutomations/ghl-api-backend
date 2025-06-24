import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import path from 'path';

const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register API routes
registerRoutes(app);

// Simple static file serving
app.get('*', (req, res) => {
  res.json({ 
    message: 'GoHighLevel Marketplace API',
    endpoints: ['/health', '/api/listings', '/api/directories', '/api/collections'],
    version: '1.0.0'
  });
});

const port = parseInt(process.env.PORT || '5000', 10);
server.listen(port, "0.0.0.0", () => {
  console.log('🚀 GoHighLevel Marketplace Server Running');
  console.log(`Port: ${port}`);
  console.log(`Health: http://localhost:${port}/health`);
});