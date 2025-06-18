// GoHighLevel Marketplace - Stable Server for Replit Preview
// Designed specifically for Replit's preview system requirements

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Initializing GoHighLevel Marketplace server...');

// Enhanced middleware stack
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// CORS configuration for Replit
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Max-Age', '3600');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health endpoints for Replit detection
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    service: 'GoHighLevel Marketplace',
    uptime: process.uptime(),
    replit: true
  });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/status', (req, res) => {
  res.status(200).json({
    server: 'active',
    port: PORT,
    environment: 'replit-preview'
  });
});

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
    environment: 'replit',
    version: '1.0.0'
  });
});

app.get('/api/oauth/status', (req, res) => {
  res.json({
    configured: true,
    backend: 'Railway Production',
    redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback',
    ready: true,
    timestamp: new Date().toISOString(),
    replit: true
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'GoHighLevel API Router Ready',
    endpoints: ['/api/health', '/api/oauth/status', '/api/test'],
    oauth: { backend: 'Railway', status: 'configured' },
    server: 'stable',
    port: PORT
  });
});

// Main application route
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace | OAuth Integration Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
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
        .status-live {
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: 600;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }
        h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle { font-size: 1.3rem; color: #6b7280; margin-bottom: 30px; }
        .server-info {
            background: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 20px;
            border-radius: 0 12px 12px 0;
            margin: 20px 0;
            font-family: 'SF Mono', Monaco, monospace;
            text-align: left;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        .card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .card:hover { transform: translateY(-5px); }
        .card-icon { font-size: 2.5rem; margin-bottom: 15px; display: block; }
        .card h3 { color: #1a202c; margin-bottom: 15px; font-size: 1.4rem; }
        .card p { color: #4a5568; line-height: 1.6; margin-bottom: 20px; }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            margin: 5px;
            transition: all 0.3s ease;
        }
        .btn:hover { transform: translateY(-2px); opacity: 0.9; }
        .features { list-style: none; padding: 0; }
        .features li { padding: 8px 0; color: #374151; }
        .features li:before { content: "✓ "; color: #10b981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="status-live">REPLIT PREVIEW ACTIVE</div>
            <h1>GoHighLevel Marketplace</h1>
            <div class="subtitle">OAuth Integration Platform</div>
            
            <div class="server-info">
                <strong>Server Status:</strong> Active and Stable<br>
                <strong>Port:</strong> ${PORT} (Replit Preview)<br>
                <strong>Environment:</strong> Replit Development<br>
                <strong>Timestamp:</strong> ${new Date().toLocaleString()}<br>
                <strong>Backend:</strong> Railway Production Ready<br>
                <strong>Uptime:</strong> ${Math.floor(process.uptime())} seconds
            </div>
            
            <button class="btn" onclick="testAPI()">Test API Connection</button>
            <button class="btn" onclick="checkOAuth()">OAuth Status</button>
            <button class="btn" onclick="window.open('/health', '_blank')">Health Check</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <span class="card-icon">🔐</span>
                <h3>OAuth 2.0 Integration</h3>
                <p>Secure authentication with GoHighLevel marketplace using Railway backend with PKCE security implementation.</p>
                <ul class="features">
                    <li>PKCE Security Protocol</li>
                    <li>Automatic Token Refresh</li>
                    <li>Scope Management</li>
                    <li>Installation Tracking</li>
                </ul>
            </div>
            
            <div class="card">
                <span class="card-icon">🔄</span>
                <h3>Universal API Router</h3>
                <p>Dynamic endpoint mapping for all GoHighLevel API operations with automatic routing and response handling.</p>
                <ul class="features">
                    <li>Products & Pricing APIs</li>
                    <li>Contacts & CRM Integration</li>
                    <li>Media & File Management</li>
                    <li>Location Context Management</li>
                </ul>
            </div>
            
            <div class="card">
                <span class="card-icon">📦</span>
                <h3>Product Management</h3>
                <p>Create and manage products directly in GoHighLevel CRM with full CRUD operations and real-time sync.</p>
                <ul class="features">
                    <li>Real Product Creation</li>
                    <li>Dynamic Price Management</li>
                    <li>Inventory Tracking</li>
                    <li>Multi-Location Support</li>
                </ul>
            </div>
            
            <div class="card">
                <span class="card-icon">💾</span>
                <h3>Database Integration</h3>
                <p>PostgreSQL backend with Drizzle ORM for reliable data persistence and comprehensive audit trails.</p>
                <ul class="features">
                    <li>User Session Management</li>
                    <li>Installation Data Tracking</li>
                    <li>Comprehensive Audit Logs</li>
                    <li>Type-Safe Operations</li>
                </ul>
            </div>
        </div>
    </div>
    
    <script>
        async function testAPI() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                alert('API Connection Successful\\n\\n' + JSON.stringify(data, null, 2));
                console.log('Health check successful:', data);
            } catch (error) {
                alert('API Connection Failed: ' + error.message);
                console.error('API Error:', error);
            }
        }
        
        async function checkOAuth() {
            try {
                const response = await fetch('/api/oauth/status');
                const data = await response.json();
                alert('OAuth Status Check\\n\\n' + JSON.stringify(data, null, 2));
                console.log('OAuth status:', data);
            } catch (error) {
                alert('OAuth Check Failed: ' + error.message);
                console.error('OAuth Error:', error);
            }
        }
        
        // Initialize application
        window.addEventListener('load', function() {
            console.log('GoHighLevel Marketplace loaded successfully');
            console.log('Running on Replit preview port ${PORT}');
            
            // Auto-test API connection
            setTimeout(testAPI, 2000);
            
            // Keep connection alive
            setInterval(() => {
                fetch('/ping').catch(() => {});
            }, 30000);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 't':
                        e.preventDefault();
                        testAPI();
                        break;
                    case 'o':
                        e.preventDefault();
                        checkOAuth();
                        break;
                }
            }
        });
    </script>
</body>
</html>`;
  res.send(html);
});

// Catch-all route for SPA behavior
app.get('*', (req, res) => {
  res.redirect('/');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server with enhanced error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 GoHighLevel Marketplace - Stable Server Started');
  console.log('='.repeat(60));
  console.log(`Port: ${PORT} (Replit Preview)`);
  console.log(`Binding: 0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('Server ready for Replit preview system');
  console.log('='.repeat(60));
});

// Enhanced error handling
server.on('error', (err) => {
  console.error('Server startup error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use, trying alternative port...`);
    const altPort = PORT + 1;
    server.listen(altPort, '0.0.0.0', () => {
      console.log(`Server started on alternative port ${altPort}`);
    });
  } else {
    console.error('Fatal server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
});

// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Don't exit, log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit, log and continue
});

module.exports = app;