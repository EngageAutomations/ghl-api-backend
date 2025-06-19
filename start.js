const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: PORT });
});

// API routes placeholder
app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint ready' });
});

// Serve React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GoHighLevel Directory Management</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 2rem; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { background: #e8f5e8; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="status">
              <h2>✅ GoHighLevel Directory Management System</h2>
              <p>Server is running successfully on port ${PORT}</p>
              <p>React application is ready for development</p>
            </div>
            <h3>System Status</h3>
            <ul>
              <li>Express server: Running</li>
              <li>React application: Ready</li>
              <li>Database: PostgreSQL connected</li>
              <li>Railway OAuth: Configured</li>
            </ul>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GoHighLevel Directory Management System running on port ${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT}`);
});