const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic setup
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Catch all for React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Preview running on port ${PORT}`);
});

// Keep alive
setInterval(() => {
  console.log('Server active:', new Date().toLocaleTimeString());
}, 30000);