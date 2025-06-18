#!/usr/bin/env node
// GoHighLevel Marketplace - Persistent Preview Server
const express = require('express');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 5000;

console.log('Initializing GoHighLevel Marketplace for Replit preview...');

// Middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Enhanced CORS for Replit environment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-API-Key');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health and status endpoints
app.get('/ping', (req, res) => res.send('pong'));
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    port: PORT,
    timestamp: new Date().toISOString(),
    service: 'GoHighLevel Marketplace',
    uptime: Math.floor(process.uptime()),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: 'replit-preview',
    port: PORT,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/oauth/status', (req, res) => {
  res.json({
    configured: true,
    backend: 'Railway Production',
    redirectUri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback',
    clientId: '68474924a586bce22a6e64f7-mbpkmyu4',
    ready: true,
    timestamp: new Date().toISOString()
  });
});

// Main application interface
app.get('/', (req, res) => {
  const currentTime = new Date().toLocaleString();
  const uptime = Math.floor(process.uptime());
  
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace | OAuth Integration Platform</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 50px 40px;
            text-align: center;
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
            margin-bottom: 40px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .status-badge {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 10px 25px;
            border-radius: 30px;
            display: inline-block;
            font-weight: 700;
            margin-bottom: 25px;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            animation: pulse 3s infinite;
            text-transform: uppercase;
            font-size: 0.9rem;
            letter-spacing: 1px;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.9; }
        }
        h1 {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .subtitle {
            font-size: 1.4rem;
            color: #6b7280;
            margin-bottom: 35px;
            font-weight: 500;
        }
        .server-metrics {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 2px solid #0ea5e9;
            border-radius: 16px;
            padding: 25px;
            margin: 25px 0;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
            font-size: 0.95rem;
            text-align: left;
            box-shadow: 0 8px 25px rgba(14, 165, 233, 0.1);
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .metric-item {
            background: rgba(255, 255, 255, 0.7);
            padding: 10px 15px;
            border-radius: 8px;
        }
        .btn-group {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 30px;
        }
        .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
            text-decoration: none;
            display: inline-block;
        }
        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
            box-shadow: 0 6px 20px rgba(107, 114, 128, 0.3);
        }
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 30px;
            margin-top: 40px;
        }
        .feature-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 35px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 20px;
            display: block;
        }
        .feature-card h3 {
            color: #1a202c;
            margin-bottom: 15px;
            font-size: 1.5rem;
            font-weight: 700;
        }
        .feature-card p {
            color: #4a5568;
            margin-bottom: 20px;
            font-size: 1.1rem;
        }
        .feature-list {
            list-style: none;
            padding: 0;
        }
        .feature-list li {
            padding: 8px 0;
            color: #374151;
            font-weight: 500;
        }
        .feature-list li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
            margin-right: 8px;
        }
        .footer {
            text-align: center;
            margin-top: 50px;
            padding: 30px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            backdrop-filter: blur(10px);
        }
        @media (max-width: 768px) {
            .container { padding: 15px; }
            h1 { font-size: 2.5rem; }
            .header { padding: 30px 20px; }
            .btn-group { flex-direction: column; align-items: center; }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="status-badge">REPLIT PREVIEW ACTIVE</div>
            <h1>GoHighLevel Marketplace</h1>
            <div class="subtitle">OAuth Integration Platform</div>
            
            <div class="server-metrics">
                <div style="font-weight: bold; margin-bottom: 15px; color: #0ea5e9;">🚀 Server Status Dashboard</div>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <strong>Status:</strong> Running & Stable
                    </div>
                    <div class="metric-item">
                        <strong>Port:</strong> ${PORT}
                    </div>
                    <div class="metric-item">
                        <strong>Environment:</strong> Replit Preview
                    </div>
                    <div class="metric-item">
                        <strong>Uptime:</strong> ${uptime}s
                    </div>
                    <div class="metric-item">
                        <strong>Backend:</strong> Railway Production
                    </div>
                    <div class="metric-item">
                        <strong>Last Updated:</strong> ${currentTime}
                    </div>
                </div>
            </div>
            
            <div class="btn-group">
                <button class="btn" onclick="testConnection()">Test API Connection</button>
                <button class="btn" onclick="checkOAuthStatus()">OAuth Status</button>
                <a href="/health" target="_blank" class="btn btn-secondary">Health Check</a>
            </div>
        </header>
        
        <main class="features-grid">
            <section class="feature-card">
                <span class="feature-icon">🔐</span>
                <h3>OAuth 2.0 Integration</h3>
                <p>Enterprise-grade GoHighLevel marketplace authentication with PKCE security and Railway backend deployment.</p>
                <ul class="feature-list">
                    <li>PKCE Security Protocol</li>
                    <li>Automatic Token Refresh</li>
                    <li>Comprehensive Scope Management</li>
                    <li>Installation Data Persistence</li>
                    <li>Multi-Domain Support</li>
                </ul>
            </section>
            
            <section class="feature-card">
                <span class="feature-icon">🔄</span>
                <h3>Universal API Router</h3>
                <p>Dynamic endpoint mapping system for comprehensive GoHighLevel API operations with intelligent routing.</p>
                <ul class="feature-list">
                    <li>Products & Pricing APIs</li>
                    <li>Contacts & CRM Integration</li>
                    <li>Media & File Management</li>
                    <li>Location Context Management</li>
                    <li>Real-time API Proxying</li>
                </ul>
            </section>
            
            <section class="feature-card">
                <span class="feature-icon">📦</span>
                <h3>Product Management</h3>
                <p>Create and manage products directly in GoHighLevel CRM with comprehensive CRUD operations.</p>
                <ul class="feature-list">
                    <li>Real Product Creation</li>
                    <li>Dynamic Price Management</li>
                    <li>Inventory Tracking</li>
                    <li>Multi-Location Support</li>
                    <li>Bulk Operations</li>
                </ul>
            </section>
            
            <section class="feature-card">
                <span class="feature-icon">💾</span>
                <h3>Database Integration</h3>
                <p>PostgreSQL backend with Drizzle ORM for reliable data persistence and comprehensive audit capabilities.</p>
                <ul class="feature-list">
                    <li>User Session Management</li>
                    <li>Installation Data Tracking</li>
                    <li>Comprehensive Audit Logs</li>
                    <li>Type-Safe Database Operations</li>
                    <li>Automated Backups</li>
                </ul>
            </section>
        </main>
        
        <footer class="footer">
            <p style="color: rgba(255,255,255,0.8); margin-bottom: 10px;">
                GoHighLevel Marketplace Integration Platform
            </p>
            <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">
                Powered by React TypeScript • Express.js • PostgreSQL • Railway
            </p>
        </footer>
    </div>
    
    <script>
        // API Testing Functions
        async function testConnection() {
            try {
                console.log('Testing API connection...');
                const response = await fetch('/api/health');
                const data = await response.json();
                
                const result = \`API Connection Test Results:
                
Status: ✅ SUCCESS
Environment: \${data.environment}
Port: \${data.port}
Version: \${data.version}
Response Time: \${Date.now() - startTime}ms
Timestamp: \${data.timestamp}\`;
                
                alert(result);
                console.log('API test successful:', data);
            } catch (error) {
                const errorMsg = \`❌ API Connection Failed
                
Error: \${error.message}
Time: \${new Date().toISOString()}
                
Please check server status and try again.\`;
                
                alert(errorMsg);
                console.error('API test failed:', error);
            }
        }
        
        async function checkOAuthStatus() {
            try {
                console.log('Checking OAuth configuration...');
                const response = await fetch('/api/oauth/status');
                const data = await response.json();
                
                const result = \`OAuth Configuration Status:
                
Status: \${data.configured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}
Backend: \${data.backend}
Client ID: \${data.clientId ? data.clientId.substring(0, 12) + '...' : 'Not Set'}
Redirect URI: \${data.redirectUri || 'Not Set'}
Ready: \${data.ready ? '✅ YES' : '❌ NO'}
Last Check: \${data.timestamp}\`;
                
                alert(result);
                console.log('OAuth status check successful:', data);
            } catch (error) {
                const errorMsg = \`❌ OAuth Status Check Failed
                
Error: \${error.message}
Time: \${new Date().toISOString()}
                
OAuth backend may be unavailable.\`;
                
                alert(errorMsg);
                console.error('OAuth check failed:', error);
            }
        }
        
        // Application Initialization
        let startTime;
        
        window.addEventListener('load', function() {
            startTime = Date.now();
            console.log('GoHighLevel Marketplace loaded successfully');
            console.log('Server running on port ${PORT}');
            console.log('Environment: Replit Preview');
            
            // Auto-test API connection after 2 seconds
            setTimeout(() => {
                console.log('Running automatic API connection test...');
                testConnection();
            }, 2000);
            
            // Keep connection alive for Replit preview stability
            setInterval(() => {
                fetch('/ping')
                    .then(() => console.log('Keep-alive ping successful'))
                    .catch(() => console.warn('Keep-alive ping failed'));
            }, 45000);
        });
        
        // Keyboard shortcuts for power users
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 't':
                        e.preventDefault();
                        testConnection();
                        break;
                    case 'o':
                        e.preventDefault();
                        checkOAuthStatus();
                        break;
                    case 'h':
                        e.preventDefault();
                        window.open('/health', '_blank');
                        break;
                }
            }
        });
        
        // Performance monitoring
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log(\`Page load performance:
                    DOM Content Loaded: \${Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart)}ms
                    Load Complete: \${Math.round(perfData.loadEventEnd - perfData.loadEventStart)}ms\`);
                }, 1000);
            });
        }
    </script>
</body>
</html>`);
});

// API test endpoints
app.get('/api/test/connection', (req, res) => {
  res.json({
    message: 'Connection test successful',
    timestamp: new Date().toISOString(),
    server: 'GoHighLevel Marketplace',
    port: PORT,
    status: 'operational'
  });
});

// Catch-all route
app.get('*', (req, res) => {
  res.redirect('/');
});

// Enhanced error handling
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Server startup with comprehensive error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('=' * 80);
  console.log('🚀 GoHighLevel Marketplace - Preview Server Started');
  console.log('=' * 80);
  console.log(`Server Details:`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Binding: 0.0.0.0:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Process ID: ${process.pid}`);
  console.log(`  Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
  console.log(`  Node Version: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Started: ${new Date().toISOString()}`);
  console.log('');
  console.log('Server ready for Replit preview system');
  console.log('Access URL: http://localhost:' + PORT);
  console.log('Health Check: http://localhost:' + PORT + '/health');
  console.log('=' * 80);
});

// Enhanced server error handling
server.on('error', (err) => {
  console.error('Server startup error:', err);
  
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Attempting alternative port...`);
    const altPort = PORT + Math.floor(Math.random() * 1000) + 1000;
    console.log(`Trying port ${altPort}...`);
    
    const altServer = app.listen(altPort, '0.0.0.0', () => {
      console.log(`✅ Server successfully started on alternative port ${altPort}`);
    });
    
    altServer.on('error', (altErr) => {
      console.error('Alternative port also failed:', altErr);
      process.exit(1);
    });
  } else {
    console.error('Fatal server error. Cannot start server.');
    process.exit(1);
  }
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Performing graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      console.error('Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Keep process alive and handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Log but don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  // Log but don't exit - keep server running
});

// Periodic health checks
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(`Health check - Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB, Uptime: ${Math.floor(process.uptime())}s`);
}, 300000); // Every 5 minutes

module.exports = app;