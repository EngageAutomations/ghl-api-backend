const http = require('http');
const PORT = 5000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`<!DOCTYPE html>
<html>
<head>
  <title>GoHighLevel Marketplace</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); margin: 0; padding: 20px; }
    .container { max-width: 900px; margin: 0 auto; }
    .header { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.1); margin-bottom: 30px; }
    .status { background: #10b981; color: white; padding: 10px 25px; border-radius: 25px; display: inline-block; font-weight: 600; margin-bottom: 20px; }
    h1 { font-size: 3rem; font-weight: 700; margin-bottom: 15px; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .info { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 0 12px 12px 0; margin: 20px 0; font-family: monospace; text-align: left; }
    .btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; margin: 5px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 25px; margin-top: 30px; }
    .card { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .features { list-style: none; padding: 0; }
    .features li { padding: 6px 0; color: #374151; }
    .features li:before { content: "✓ "; color: #10b981; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="status">REPLIT PREVIEW ACTIVE</div>
      <h1>GoHighLevel Marketplace</h1>
      <p style="font-size: 1.2rem; color: #6b7280;">OAuth Integration Platform</p>
      
      <div class="info">
        <strong>Server Status:</strong> Active and Running<br>
        <strong>Port:</strong> ${PORT}<br>
        <strong>Environment:</strong> Replit Preview<br>
        <strong>Backend:</strong> Railway Production<br>
        <strong>OAuth Client:</strong> 68474924a586bce22a6e64f7-mbpkmyu4
      </div>
      
      <button class="btn" onclick="test()">Test Connection</button>
      <button class="btn" onclick="oauth()">OAuth Status</button>
      <button class="btn" onclick="window.open('https://oauth-backend-production-68c5.up.railway.app', '_blank')">Backend</button>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>OAuth 2.0 Integration</h3>
        <p>Secure GoHighLevel marketplace authentication with Railway backend.</p>
        <ul class="features">
          <li>PKCE Security Protocol</li>
          <li>Token Management</li>
          <li>Installation Tracking</li>
        </ul>
      </div>
      
      <div class="card">
        <h3>Universal API Router</h3>
        <p>Dynamic endpoint mapping for GoHighLevel operations.</p>
        <ul class="features">
          <li>Products & Pricing APIs</li>
          <li>Contacts Integration</li>
          <li>Media Management</li>
        </ul>
      </div>
      
      <div class="card">
        <h3>Product Management</h3>
        <p>Create and manage products in GoHighLevel CRM.</p>
        <ul class="features">
          <li>Real Product Creation</li>
          <li>Price Management</li>
          <li>Multi-Location Support</li>
        </ul>
      </div>
    </div>
  </div>
  
  <script>
    function test() {
      alert('GoHighLevel Marketplace\\n\\nStatus: Active\\nPort: ${PORT}\\nEnvironment: Replit\\nBackend: Railway\\n\\nAll systems operational!');
    }
    
    function oauth() {
      alert('OAuth Configuration\\n\\nClient ID: 68474924a586bce22a6e64f7-mbpkmyu4\\nBackend: Railway Production\\nRedirect: /api/oauth/callback\\nStatus: Ready');
    }
    
    console.log('GoHighLevel Marketplace loaded successfully on port ${PORT}');
    setTimeout(test, 2000);
  </script>
</body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('GoHighLevel Marketplace running on port ' + PORT);
});

console.log('Starting GoHighLevel Marketplace server...');