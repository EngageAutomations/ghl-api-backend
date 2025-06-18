const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>GoHighLevel Marketplace - WORKING</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .success { color: green; font-size: 24px; }
    </style>
</head>
<body>
    <h1 class="success">✓ SERVER IS WORKING</h1>
    <p>Port: ${PORT}</p>
    <p>Time: ${new Date().toISOString()}</p>
    <p>Request: ${req.url}</p>
</body>
</html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on port ${PORT}`);
});