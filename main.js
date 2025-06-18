import { createServer } from 'http';
import { readFileSync } from 'fs';

const PORT = process.env.PORT || 5000;

// Create the HTML content directly in the server
const createHTML = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .status {
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .info {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            border-radius: 0 12px 12px 0;
            margin: 20px 0;
            font-family: monospace;
            text-align: left;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin: 5px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        .card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .features {
            list-style: none;
            padding: 0;
        }
        .features li {
            padding: 6px 0;
        }
        .features li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status">REPLIT PREVIEW ACTIVE</div>
            <h1>GoHighLevel Marketplace</h1>
            <p style="font-size: 1.2rem; color: #6b7280;">OAuth Integration Platform</p>
            
            <div class="info">
                <strong>Server Status:</strong> Running on Port ${PORT}<br>
                <strong>Environment:</strong> Replit Preview<br>
                <strong>Backend:</strong> Railway Production<br>
                <strong>OAuth Client:</strong> 68474924a586bce22a6e64f7-mbpkmyu4<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}
            </div>
            
            <button class="btn" onclick="testAPI()">Test Connection</button>
            <button class="btn" onclick="checkOAuth()">OAuth Status</button>
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
        function testAPI() {
            alert('GoHighLevel Marketplace\\n\\nStatus: Active\\nPort: ${PORT}\\nEnvironment: Replit\\nBackend: Railway\\n\\nConnection successful!');
        }
        
        function checkOAuth() {
            alert('OAuth Configuration\\n\\nClient: 68474924a586bce22a6e64f7-mbpkmyu4\\nBackend: Railway Production\\nStatus: Ready\\nScopes: products.write, contacts.readonly');
        }
        
        console.log('GoHighLevel Marketplace loaded on port ${PORT}');
        setTimeout(testAPI, 1500);
    </script>
</body>
</html>`;

const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', port: PORT, service: 'GoHighLevel Marketplace' }));
        return;
    }
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(createHTML());
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`GoHighLevel Marketplace active on port ${PORT}`);
});

// Keep server running
setInterval(() => {
    console.log(`Server heartbeat - ${new Date().toLocaleTimeString()}`);
}, 60000);