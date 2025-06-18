import http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>GoHighLevel Marketplace - WORKING</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f9ff; }
        .success { color: #059669; font-size: 32px; margin-bottom: 20px; }
        .info { background: white; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 600px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <h1 class="success">✓ REPLIT PREVIEW WORKING</h1>
    <div class="info">
        <h2>GoHighLevel Marketplace</h2>
        <p><strong>Server Port:</strong> ${PORT}</p>
        <p><strong>Status:</strong> Active and Responding</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Request URL:</strong> ${req.url}</p>
        <p><strong>Method:</strong> ${req.method}</p>
    </div>
    <div class="info">
        <h3>What's Working Now:</h3>
        <ul style="text-align: left;">
            <li>Server running on correct port</li>
            <li>Replit preview system detecting the server</li>
            <li>HTTP responses working properly</li>
            <li>Ready for React frontend integration</li>
        </ul>
    </div>
</body>
</html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Preview should now be visible`);
});