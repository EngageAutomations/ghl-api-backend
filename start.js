#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));

// Serve attached assets
app.use('/attached_assets', express.static(path.join(__dirname, 'attached_assets')));

// Handle all routes by serving index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
});