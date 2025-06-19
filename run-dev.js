const express = require('express');
const path = require('path');

const app = express();

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'GoHighLevel Marketplace' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});