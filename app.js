const express = require('express');
const path = require('path');
const app = express();

// Use Replit's injected PORT or fallback
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Basic API endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    port: PORT,
    timestamp: new Date().toISOString() 
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoHighLevel Marketplace</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f8fafc;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 8px; 
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }
        .status {
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 10px;
        }
        .btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            margin: 10px;
            font-size: 16px;
        }
        .btn:hover {
            background: #2563eb;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .feature-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            background: #f8fafc;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel">
        function App() {
            const [status, setStatus] = React.useState('Loading...');
            
            React.useEffect(() => {
                fetch('/api/health')
                    .then(res => res.json())
                    .then(data => setStatus(\`Server running on port \${data.port}\`))
                    .catch(err => setStatus('Server error'));
            }, []);
            
            return (
                <div className="container">
                    <div className="header">
                        <div className="status">✓ ACTIVE</div>
                        <h1>GoHighLevel Marketplace</h1>
                        <p>OAuth Integration Platform</p>
                        <p><strong>Status:</strong> {status}</p>
                    </div>
                    
                    <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <button className="btn" onClick={() => alert('OAuth integration ready!')}>
                            Connect GoHighLevel
                        </button>
                        <button className="btn" onClick={() => alert('API testing available!')}>
                            Test API
                        </button>
                    </div>
                    
                    <div className="feature-grid">
                        <div className="feature-card">
                            <h3>OAuth 2.0 Integration</h3>
                            <p>Secure authentication with GoHighLevel marketplace using Railway backend.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Universal API Router</h3>
                            <p>Dynamic endpoint mapping for all GoHighLevel API operations.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Product Management</h3>
                            <p>Create and manage products directly in GoHighLevel CRM.</p>
                        </div>
                        <div className="feature-card">
                            <h3>Database Integration</h3>
                            <p>PostgreSQL backend with Drizzle ORM for data persistence.</p>
                        </div>
                    </div>
                </div>
            );
        }
        
        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
});