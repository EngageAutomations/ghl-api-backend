// GoHighLevel Marketplace - Main Server for Replit Preview
const express = require('express');
const app = express();

// Use Replit's injected PORT or fallback to common preview ports
const PORT = process.env.PORT || process.env.REPL_PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
    service: 'GoHighLevel Marketplace'
  });
});

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    environment: 'replit',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/oauth/status', (req, res) => {
  res.json({
    configured: true,
    backend: 'Railway Production',
    redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback',
    ready: true,
    timestamp: new Date().toISOString()
  });
});

// Main route
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: system-ui, -apple-system, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            padding: 20px;
        }
        .container { max-width: 1000px; margin: 0 auto; }
        .header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .status { 
            background: #10b981;
            color: white;
            padding: 6px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 15px;
            font-weight: 600;
        }
        h1 { 
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            font-family: monospace;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin: 5px;
            font-weight: 600;
        }
        .btn:hover { opacity: 0.9; }
        .features { list-style: none; padding: 0; }
        .features li { padding: 5px 0; }
        .features li:before { content: "✓ "; color: #10b981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status">LIVE ON PORT ${PORT}</div>
            <h1>GoHighLevel Marketplace</h1>
            <p>OAuth Integration Platform</p>
            
            <div class="info">
                <strong>Server:</strong> Active on Port ${PORT}<br>
                <strong>Environment:</strong> Replit Preview<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}<br>
                <strong>Backend:</strong> Railway Production
            </div>
            
            <button class="btn" onclick="testAPI()">Test API</button>
            <button class="btn" onclick="checkOAuth()">OAuth Status</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>OAuth 2.0 Integration</h3>
                <p>Secure GoHighLevel marketplace authentication with Railway backend.</p>
                <ul class="features">
                    <li>PKCE Security</li>
                    <li>Token Management</li>
                    <li>Scope Handling</li>
                </ul>
            </div>
            
            <div class="card">
                <h3>Universal API Router</h3>
                <p>Dynamic endpoint mapping for all GoHighLevel operations.</p>
                <ul class="features">
                    <li>Products API</li>
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
            
            <div class="card">
                <h3>Database Integration</h3>
                <p>PostgreSQL with Drizzle ORM for data persistence.</p>
                <ul class="features">
                    <li>User Management</li>
                    <li>Installation Tracking</li>
                    <li>Audit Trails</li>
                </ul>
            </div>
        </div>
    </div>
    
    <script>
        async function testAPI() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                alert('API Test Successful:\\n\\n' + JSON.stringify(data, null, 2));
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
        
        // Auto-test on load
        setTimeout(testAPI, 1000);
    </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`GoHighLevel Marketplace running on port ${PORT}`);
  console.log(`Access URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;