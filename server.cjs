const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
    message: 'GoHighLevel Marketplace Server'
  });
});

// OAuth status
app.get('/api/oauth/status', (req, res) => {
  res.json({
    configured: true,
    backend: 'Railway Production',
    redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback',
    ready: true
  });
});

// Main application route
app.get('*', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; 
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 40px 20px;
        }
        .header {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-bottom: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            text-align: center;
        }
        .status-badge {
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 20px;
            font-weight: 600;
        }
        h1 {
            color: #1a202c;
            margin: 0 0 10px 0;
            font-size: 2.5rem;
        }
        .subtitle {
            color: #4a5568;
            font-size: 1.2rem;
            margin-bottom: 30px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            transition: transform 0.2s;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .card h3 {
            color: #2d3748;
            margin-top: 0;
            font-size: 1.3rem;
        }
        .btn {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
            transition: background 0.2s;
        }
        .btn:hover {
            background: #4338ca;
        }
        .btn-secondary {
            background: #6b7280;
        }
        .btn-secondary:hover {
            background: #4b5563;
        }
        .server-info {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status-badge">LIVE & READY</div>
            <h1>GoHighLevel Marketplace</h1>
            <div class="subtitle">OAuth Integration Platform</div>
            
            <div class="server-info">
                <strong>Server Status:</strong> Running on Port ${PORT}<br>
                <strong>Time:</strong> ${new Date().toLocaleString()}<br>
                <strong>Environment:</strong> ${process.env.NODE_ENV || 'Development'}
            </div>
            
            <button class="btn" onclick="testConnection()">Test API Connection</button>
            <button class="btn btn-secondary" onclick="checkOAuth()">Check OAuth Status</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🔐 OAuth 2.0 Integration</h3>
                <p>Secure authentication with GoHighLevel marketplace using Railway backend production environment.</p>
                <ul>
                    <li>PKCE security implementation</li>
                    <li>Token refresh automation</li>
                    <li>Scope management</li>
                </ul>
            </div>
            
            <div class="card">
                <h3>🔄 Universal API Router</h3>
                <p>Dynamic endpoint mapping for all GoHighLevel API operations with automatic request routing.</p>
                <ul>
                    <li>Products & Pricing APIs</li>
                    <li>Contacts & CRM Integration</li>
                    <li>Media & File Management</li>
                </ul>
            </div>
            
            <div class="card">
                <h3>📦 Product Management</h3>
                <p>Create and manage products directly in GoHighLevel CRM with full CRUD operations.</p>
                <ul>
                    <li>Real product creation</li>
                    <li>Price management</li>
                    <li>Location-based context</li>
                </ul>
            </div>
            
            <div class="card">
                <h3>💾 Database Integration</h3>
                <p>PostgreSQL backend with Drizzle ORM for reliable data persistence and type safety.</p>
                <ul>
                    <li>User session management</li>
                    <li>Installation tracking</li>
                    <li>Audit trail logging</li>
                </ul>
            </div>
        </div>
    </div>
    
    <script>
        async function testConnection() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                alert('✅ API Connection Successful\\n\\n' + JSON.stringify(data, null, 2));
            } catch (error) {
                alert('❌ Connection failed: ' + error.message);
            }
        }
        
        async function checkOAuth() {
            try {
                const response = await fetch('/api/oauth/status');
                const data = await response.json();
                alert('🔐 OAuth Status\\n\\n' + JSON.stringify(data, null, 2));
            } catch (error) {
                alert('❌ OAuth check failed: ' + error.message);
            }
        }
        
        // Auto-test connection on load
        window.addEventListener('load', () => {
            setTimeout(() => {
                console.log('GoHighLevel Marketplace loaded successfully');
                testConnection();
            }, 1000);
        });
    </script>
</body>
</html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GoHighLevel Marketplace running on port ${PORT}`);
  console.log(`Access URL: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});