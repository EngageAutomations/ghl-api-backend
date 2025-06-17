import express from 'express';
import path from 'path';

const app = express();
const port = 5000;

// Simple test route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Test Server</title>
    </head>
    <body>
      <h1>Server is working!</h1>
      <p>Port: ${port}</p>
      <p>Time: ${new Date().toISOString()}</p>
    </body>
    </html>
  `);
});

app.get('/api/test', (req, res) => {
  res.json({ status: 'working', port, time: new Date().toISOString() });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on http://0.0.0.0:${port}`);
});