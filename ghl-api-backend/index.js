const express = require('express');
const cors = require('cors');

console.log('Starting API backend...');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- OAUTH_BACKEND_URL:', process.env.OAUTH_BACKEND_URL);

// Import API route modules
const productRoutes = require('./routes/products');
const mediaRoutes = require('./routes/media');
const pricingRoutes = require('./routes/pricing');
const contactsRoutes = require('./routes/contacts');
const workflowsRoutes = require('./routes/workflows');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    service: 'GoHighLevel API Backend',
    version: '1.0.0',
    status: 'operational',
    apis: ['products', 'media', 'pricing', 'contacts', 'workflows'],
    oauth_backend: 'https://dir.engageautomations.com',
    description: 'API-only backend - OAuth handled separately'
  });
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/workflows', workflowsRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`API backend running on port ${port}`);
  console.log(`Custom domain: https://api.engageautomations.com`);
  console.log(`OAuth backend: https://dir.engageautomations.com`);
  console.log('Separate Railway architecture operational');
});