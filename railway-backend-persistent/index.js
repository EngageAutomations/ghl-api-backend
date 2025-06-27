const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');

// Import route modules
const oauthRoutes = require('./routes/oauth');
const productRoutes = require('./routes/products'); 
const mediaRoutes = require('./routes/media');
const pricingRoutes = require('./routes/pricing');

const app = express();
const port = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase();

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel OAuth Backend - Persistent Modular',
    version: '8.0.0-persistent',
    status: 'operational',
    modules: ['oauth', 'products', 'media', 'pricing'],
    architecture: 'modular-persistent',
    storage: 'database',
    ts: Date.now()
  });
});

// Mount route modules
app.use('/api/oauth', oauthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/media', mediaRoutes); 
app.use('/api/pricing', pricingRoutes);

// Legacy compatibility routes
app.use('/', oauthRoutes);

app.listen(port, () => {
  console.log(`Persistent modular backend running on port ${port}`);
});