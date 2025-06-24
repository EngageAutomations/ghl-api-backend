const express = require('express');
const cors = require('cors');
const path = require('path');

function createApp() {
  const app = express();
  
  app.use(cors({
    origin: [
      'https://listings.engageautomations.com',
      'https://dir.engageautomations.com',
      'http://localhost:3000',
      'http://localhost:5000'
    ],
    credentials: true
  }));
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  
  app.get('/', (req, res) => {
    const { store } = require('./utils/install-store');
    const installations = store.getAllInstallations();
    
    res.json({
      service: 'GHL proxy',
      version: '1.5.0-modular',
      installs: installations.length,
      authenticated: installations.filter(i => i.authenticated).length,
      ts: Date.now()
    });
  });
  
  app.get('/health', (req, res) => {
    res.json({ ok: true, service: 'modular', ts: Date.now() });
  });
  
  app.use(require('./routes/oauth'));
  app.use('/api/ghl', require('./routes/media'));
  app.use('/api/ghl', require('./routes/products'));
  app.use('/api/ghl', require('./routes/legacy'));
  
  app.use((err, req, res, next) => {
    console.error('Server error:', err.message);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: err.message 
    });
  });
  
  return app;
}

module.exports = createApp;