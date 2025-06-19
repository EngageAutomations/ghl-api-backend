const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for static files
app.use(express.static(path.join(__dirname, 'dist')));

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started on port ${PORT}`);
});