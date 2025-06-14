const express = require('express');
const path = require('path');

const app = express();

// Serve the HTML file directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'product-listing.html'));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Product listing UI available at http://localhost:${PORT}`);
});