import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '..', 'client')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'running', 
    port: PORT, 
    timestamp: new Date().toISOString() 
  });
});

// API endpoints
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API working correctly',
    timestamp: new Date().toISOString()
  });
});

// Mock endpoints for development
app.get('/api/directories', (req, res) => {
  res.json([
    { id: 1, name: 'Sample Directory', description: 'Test directory for product creation' }
  ]);
});

app.get('/api/listings', (req, res) => {
  res.json([]);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'client', 'index.html');
  res.sendFile(indexPath);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
});