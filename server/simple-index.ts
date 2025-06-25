import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { WorkingGHLService } from './working-ghl-service.js';

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Working GoHighLevel product management endpoints
app.post('/api/products/create', async (req, res) => {
  try {
    const ghlService = new WorkingGHLService();
    const result = await ghlService.createProduct(req.body);
    res.json(result);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/list', async (req, res) => {
  try {
    const ghlService = new WorkingGHLService();
    const result = await ghlService.listProducts();
    res.json(result);
  } catch (error) {
    console.error('Product listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Product pricing API endpoint
app.post('/api/products/:productId/prices', async (req, res) => {
  try {
    const { productId } = req.params;
    const ghlService = new WorkingGHLService();
    const result = await ghlService.createProductPrice(productId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Product price creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Working Media library API endpoints
app.post('/api/images/upload', upload.single('file'), async (req, res) => {
  try {
    const ghlService = new WorkingGHLService();
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = await ghlService.uploadImageToMediaLibrary(
      req.file.buffer, 
      req.file.originalname, 
      req.file.mimetype
    );
    res.json(result);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/images/list', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const ghlService = new WorkingGHLService();
    const result = await ghlService.getMediaFiles(parseInt(limit as string), parseInt(offset as string));
    res.json(result);
  } catch (error) {
    console.error('Media files listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`✅ GoHighLevel Product Management Server running on port ${port}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
  console.log(`✅ Product API: http://localhost:${port}/api/products/`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;