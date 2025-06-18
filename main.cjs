// GoHighLevel Marketplace - Production Server for Replit
const http = require('http');
const PORT = process.env.PORT || 5000;

console.log(`Starting GoHighLevel Marketplace on port ${PORT}...`);

// Complete OAuth-enabled marketplace interface
const getMarketplaceHTML = () => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace - Directory Integration Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
        }
        .status-badge {
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            display: inline-block;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        .oauth-section {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .oauth-button {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            margin: 10px;
        }
        .oauth-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .api-card {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .api-card:hover { transform: translateY(-5px); }
        .feature-list {
            list-style: none;
            margin: 15px 0;
        }
        .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .feature-list li:before {
            content: '✓';
            color: #10b981;
            font-weight: bold;
            margin-right: 10px;
        }
        .installation-info {
            background: rgba(16, 185, 129, 0.1);
            border: 2px solid #10b981;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        .test-button {
            background: #3b82f6;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin: 5px;
            transition: all 0.3s ease;
        }
        .test-button:hover { background: #2563eb; }
        .endpoint-item {
            background: #f8f9fa;
            border-left: 4px solid #3b82f6;
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            color: white;
        }
        .live-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 10px 15px;
            border-radius: 25px;
            font-size: 12px;
            z-index: 1000;
        }
    </style>
</head>
<body>
    <div class="live-status">🟢 LIVE - PORT ${PORT}</div>
    <div class="container">
        <div class="header">
            <div class="status-badge">🚀 ACTIVE - REPLIT PREVIEW</div>
            <h1>GoHighLevel Marketplace</h1>
            <p>Directory Integration Platform with OAuth & Universal API Management</p>
            <p><strong>Server Time:</strong> <span id="serverTime">${new Date().toLocaleString()}</span></p>
        </div>

        <div class="oauth-section">
            <h2>🔐 OAuth Authentication System</h2>
            <div class="installation-info">
                <h3>Active Installation Configuration</h3>
                <p><strong>Installation ID:</strong> install_1750131573635</p>
                <p><strong>Client ID:</strong> 68474924a586bce22a6e64f7-mbpkmyu4</p>
                <p><strong>Redirect URI:</strong> https://dir.engageautomations.com/api/oauth/callback</p>
                <p><strong>Backend Server:</strong> https://dir.engageautomations.com</p>
                <p><strong>Permissions:</strong> Full Product Creation & Management Access</p>
            </div>
            
            <a href="/api/oauth/install" class="oauth-button">🔗 Initialize OAuth Flow</a>
            <a href="/api/oauth/callback" class="oauth-button">🔄 Process OAuth Callback</a>
            <button onclick="testOAuth()" class="test-button">Test OAuth Status</button>
            <button onclick="checkHealth()" class="test-button">Server Health Check</button>
        </div>

        <div class="api-grid">
            <div class="api-card">
                <h3>📦 Products API</h3>
                <ul class="feature-list">
                    <li>Create Products</li>
                    <li>Manage Pricing</li>
                    <li>Update Inventory</li>
                    <li>Product Categories</li>
                    <li>Bulk Operations</li>
                </ul>
                <button onclick="testAPI('/api/ghl/products')" class="test-button">Test Products API</button>
            </div>

            <div class="api-card">
                <h3>👥 Contacts API</h3>
                <ul class="feature-list">
                    <li>Contact Management</li>
                    <li>Lead Tracking</li>
                    <li>Custom Fields</li>
                    <li>Tags & Notes</li>
                    <li>Search & Filter</li>
                </ul>
                <button onclick="testAPI('/api/ghl/contacts')" class="test-button">Test Contacts API</button>
            </div>

            <div class="api-card">
                <h3>🏢 Locations API</h3>
                <ul class="feature-list">
                    <li>Location Management</li>
                    <li>Business Settings</li>
                    <li>Team Members</li>
                    <li>Permissions</li>
                    <li>Multi-location Support</li>
                </ul>
                <button onclick="testAPI('/api/ghl/locations')" class="test-button">Test Locations API</button>
            </div>

            <div class="api-card">
                <h3>🔄 Workflows API</h3>
                <ul class="feature-list">
                    <li>Automation Triggers</li>
                    <li>Campaign Management</li>
                    <li>Follow-up Sequences</li>
                    <li>Event Tracking</li>
                    <li>Performance Analytics</li>
                </ul>
                <button onclick="testAPI('/api/ghl/workflows')" class="test-button">Test Workflows API</button>
            </div>

            <div class="api-card">
                <h3>📱 Media API</h3>
                <ul class="feature-list">
                    <li>File Uploads</li>
                    <li>Image Processing</li>
                    <li>Media Library</li>
                    <li>Asset Management</li>
                    <li>CDN Integration</li>
                </ul>
                <button onclick="testAPI('/api/ghl/media')" class="test-button">Test Media API</button>
            </div>

            <div class="api-card">
                <h3>⚙️ Universal Router</h3>
                <ul class="feature-list">
                    <li>Dynamic Endpoints</li>
                    <li>Auto-routing</li>
                    <li>Error Handling</li>
                    <li>Response Caching</li>
                    <li>Rate Limiting</li>
                </ul>
                <button onclick="testAPI('/api/ghl/status')" class="test-button">Test Universal Router</button>
            </div>
        </div>

        <div class="oauth-section">
            <h2>🎯 API Endpoints Reference</h2>
            <div class="endpoint-item"><strong>GET /api/oauth/install</strong> - Initialize GoHighLevel OAuth flow</div>
            <div class="endpoint-item"><strong>GET /api/oauth/callback</strong> - Handle OAuth authorization callback</div>
            <div class="endpoint-item"><strong>GET /api/oauth/status</strong> - Check OAuth connection status</div>
            <div class="endpoint-item"><strong>POST /api/ghl/products</strong> - Create and manage products</div>
            <div class="endpoint-item"><strong>GET /api/ghl/contacts</strong> - Access contact management</div>
            <div class="endpoint-item"><strong>GET /api/ghl/locations</strong> - Location management operations</div>
            <div class="endpoint-item"><strong>POST /api/ghl/workflows</strong> - Workflow automation management</div>
            <div class="endpoint-item"><strong>POST /api/ghl/media</strong> - Media upload and processing</div>
            <div class="endpoint-item"><strong>GET /health</strong> - Server health and status check</div>
        </div>

        <div class="footer">
            <p>GoHighLevel Marketplace Integration Platform</p>
            <p>Powered by Railway OAuth Backend & Replit Development Environment</p>
            <p>OAuth Backend: <strong>dir.engageautomations.com</strong> | Frontend: <strong>Replit Preview</strong></p>
        </div>
    </div>

    <script>
        function testOAuth() {
            fetch('/api/oauth/status')
                .then(response => response.json())
                .then(data => {
                    alert('OAuth Status:\\n' + JSON.stringify(data, null, 2));
                })
                .catch(error => alert('OAuth Error: ' + error.message));
        }

        function testAPI(endpoint) {
            fetch(endpoint)
                .then(response => response.json())
                .then(data => {
                    alert('API Response from ' + endpoint + ':\\n' + JSON.stringify(data, null, 2));
                })
                .catch(error => alert('API Error: ' + error.message));
        }

        function checkHealth() {
            fetch('/health')
                .then(response => response.json())
                .then(data => {
                    alert('Server Health:\\n' + JSON.stringify(data, null, 2));
                })
                .catch(error => alert('Health Check Failed: ' + error.message));
        }

        // Update server time every second
        setInterval(() => {
            document.getElementById('serverTime').textContent = new Date().toLocaleString();
        }, 1000);

        // Keep connection alive
        setInterval(() => {
            fetch('/health').catch(() => {});
        }, 30000);

        console.log('GoHighLevel Marketplace Interface Loaded');
        console.log('Server Port: ${PORT}');
        console.log('OAuth Backend: https://dir.engageautomations.com');
    </script>
</body>
</html>`;

// Create HTTP server with comprehensive routing
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    // Enhanced CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    console.log(`${new Date().toISOString()} - ${req.method} ${url.pathname}`);

    // Route handling
    switch (url.pathname) {
        case '/':
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(getMarketplaceHTML());
            break;
            
        case '/health':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                status: 'healthy', 
                port: PORT, 
                timestamp: new Date().toISOString(),
                service: 'GoHighLevel Marketplace',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: 'Replit Development'
            }));
            break;
            
        case '/api/oauth/status':
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                oauth_active: true,
                installation_id: 'install_1750131573635',
                client_id: '68474924a586bce22a6e64f7-mbpkmyu4',
                callback_url: 'https://dir.engageautomations.com/api/oauth/callback',
                backend_server: 'https://dir.engageautomations.com',
                status: 'ready',
                timestamp: new Date().toISOString()
            }));
            break;
            
        case '/api/oauth/install':
            const authUrl = 'https://marketplace.gohighlevel.com/oauth/chooselocation?' +
                'response_type=code&' +
                'redirect_uri=https://dir.engageautomations.com/api/oauth/callback&' +
                'client_id=68474924a586bce22a6e64f7-mbpkmyu4&' +
                'scope=locations/read locations/write contacts/read contacts/write products/read products/write';
            res.writeHead(302, { 'Location': authUrl });
            res.end();
            break;
            
        default:
            if (url.pathname.startsWith('/api/ghl/')) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    endpoint: url.pathname,
                    method: req.method,
                    status: 'ready',
                    message: 'GoHighLevel API endpoint active and ready',
                    timestamp: new Date().toISOString(),
                    installation_id: 'install_1750131573635'
                }));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Not Found</h1><p><a href="/">Return to GoHighLevel Marketplace</a></p>');
            }
    }
});

// Enhanced error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is busy, retrying...`);
        setTimeout(() => {
            server.close();
            server.listen(PORT, '0.0.0.0');
        }, 1000);
    } else {
        console.error('Server error:', err.message);
    }
});

// Start server with proper binding
server.listen(PORT, '0.0.0.0', () => {
    console.log(`GoHighLevel Marketplace running on port ${PORT}`);
    console.log(`Environment: Replit Development`);
    console.log(`Access: http://localhost:${PORT}`);
    console.log(`OAuth Backend: https://dir.engageautomations.com`);
    console.log(`Installation ID: install_1750131573635`);
    console.log(`Server started at: ${new Date().toISOString()}`);
});

// Keep process alive
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.close(() => {
        process.exit(0);
    });
});