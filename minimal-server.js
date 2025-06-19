const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Custom Domain Test</title>
    </head>
    <body>
        <h1>SUCCESS: Custom Domain Working</h1>
        <p>Domain: ${req.get('host')}</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>User-Agent: ${req.get('user-agent')}</p>
    </body>
    </html>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${port}`);
});