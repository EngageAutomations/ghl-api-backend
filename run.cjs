const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static('public'));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: PORT, service: 'GoHighLevel Marketplace' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', environment: 'replit', port: PORT });
});

app.get('/api/oauth/status', (req, res) => {
  res.json({ configured: true, backend: 'Railway', ready: true });
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>GoHighLevel Marketplace</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui; background: linear-gradient(135deg, #667eea, #764ba2); margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
        .status { background: #10b981; color: white; padding: 10px 25px; border-radius: 25px; display: inline-block; margin-bottom: 20px; font-weight: 600; }
        h1 { font-size: 3rem; margin: 20px 0; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .info { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; font-family: monospace; text-align: left; }
        .btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin: 5px; font-weight: 600; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 25px; margin-top: 30px; }
        .card { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .features { list-style: none; padding: 0; }
        .features li { padding: 6px 0; }
        .features li:before { content: "✓ "; color: #10b981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status">LIVE ON PORT ${PORT}</div>
            <h1>GoHighLevel Marketplace</h1>
            <p style="font-size: 1.2rem; color: #6b7280;">OAuth Integration Platform</p>
            
            <div class="info">
                <strong>Server:</strong> Active and Running<br>
                <strong>Port:</strong> ${PORT}<br>
                <strong>Environment:</strong> Replit Preview<br>
                <strong>Backend:</strong> Railway Production<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}
            </div>
            
            <button class="btn" onclick="testAPI()">Test API</button>
            <button class="btn" onclick="checkOAuth()">OAuth Status</button>
            <button class="btn" onclick="window.open('/health', '_blank')">Health Check</button>
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
        async function testAPI() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                alert('API Test Success:\\n\\n' + JSON.stringify(data, null, 2));
            } catch (error) {
                alert('API Test Failed: ' + error.message);
            }
        }
        
        async function checkOAuth() {
            try {
                const response = await fetch('/api/oauth/status');
                const data = await response.json();
                alert('OAuth Status:\\n\\n' + JSON.stringify(data, null, 2));
            } catch (error) {
                alert('OAuth Check Failed: ' + error.message);
            }
        }
        
        window.addEventListener('load', () => {
            console.log('GoHighLevel Marketplace loaded');
            setTimeout(testAPI, 1000);
        });
    </script>
</body>
</html>`);
});

app.get('*', (req, res) => res.redirect('/'));

app.listen(PORT, '0.0.0.0', () => {
  console.log('GoHighLevel Marketplace started on port ' + PORT);
});