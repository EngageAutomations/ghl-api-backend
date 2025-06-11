#!/usr/bin/env node

// Cloud Run compatible deployment script
// Fixes __dirname issues and ensures proper ES module compatibility

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Creating Cloud Run compatible deployment...');

// Step 1: Create minimal production server with ES module fixes
console.log('1. Creating production server...');
const productionServer = `#!/usr/bin/env node

// Production server with ES module compatibility for Cloud Run
import express from 'express';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES Module compatibility fixes
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Make available globally for compatibility
global.__dirname = __dirname;
global.__filename = __filename;

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public')));

// CORS for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// OAuth configuration
const CLIENT_ID = process.env.GHL_CLIENT_ID;
const CLIENT_SECRET = process.env.GHL_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-production-secret';
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';

// Basic authentication (simplified for deployment)
const authenticateUser = (req, res, next) => {
  // Basic authentication check - extend as needed
  next();
};

// Health check endpoint (required for Cloud Run)
app.get(['/health', '/api/health'], (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    oauth_configured: !!(CLIENT_ID && CLIENT_SECRET)
  });
});

// OAuth endpoints
app.get('/api/oauth/authorize', (req, res) => {
  if (!CLIENT_ID) {
    return res.status(500).json({ error: 'OAuth not configured' });
  }
  
  const state = Math.random().toString(36).substring(2, 15);
  const authUrl = \`https://marketplace.gohighlevel.com/oauth/chooselocation?\` +
    \`response_type=code&\` +
    \`client_id=\${CLIENT_ID}&\` +
    \`redirect_uri=\${encodeURIComponent(REDIRECT_URI)}&\` +
    \`scope=locations/read%20contacts/read%20contacts/write&\` +
    \`state=\${state}\`;
  
  res.cookie('oauth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000 
  });
  
  res.redirect(authUrl);
});

app.get('/api/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('OAuth error:', error);
    return res.redirect('/auth/error?error=' + encodeURIComponent(error));
  }
  
  if (!code) {
    return res.redirect('/auth/error?error=no_code');
  }
  
  res.json({ message: 'OAuth callback received', code: !!code });
});

// Default routes
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GoHighLevel Directory Extension</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center; }
        .welcome { background: #f0f8ff; border: 1px solid #bce; padding: 30px; border-radius: 8px; }
        .auth-button { 
          display: inline-block; 
          background: #0066cc; 
          color: white; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 5px; 
          margin-top: 20px;
        }
        .auth-button:hover { background: #0052a3; }
      </style>
    </head>
    <body>
      <div class="welcome">
        <h1>GoHighLevel Directory Extension</h1>
        <p>Cloud Run deployment ready. Connect your GoHighLevel account to begin.</p>
        <a href="/api/oauth/authorize" class="auth-button">Connect GoHighLevel Account</a>
        <p><small>Version: 1.0.0 | Status: \${process.env.NODE_ENV || 'production'}</small></p>
      </div>
    </body>
    </html>
  \`);
});

// Start server with Cloud Run compatibility
const port = process.env.PORT || 8080; // Cloud Run default port
server.listen(port, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 Cloud Run Server Running');
  console.log('='.repeat(50));
  console.log(\`Port: \${port}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'production'}\`);
  console.log(\`OAuth Client ID: \${CLIENT_ID ? '✓ Configured' : '✗ Missing'}\`);
  console.log(\`OAuth Client Secret: \${CLIENT_SECRET ? '✓ Configured' : '✗ Missing'}\`);
  console.log(\`Redirect URI: \${REDIRECT_URI}\`);
  console.log('Ready for Cloud Run deployment');
  console.log('='.repeat(50));
});

// Graceful shutdown for Cloud Run
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
`;

fs.writeFileSync('dist/server.js', productionServer);
console.log('✅ Production server created');

// Step 2: Create Cloud Run package.json
console.log('2. Creating Cloud Run package.json...');
const cloudRunPackage = {
  "name": "ghl-marketplace-cloud-run",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "express": "^4.21.2",
    "cookie-parser": "^1.4.7"
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(cloudRunPackage, null, 2));
console.log('✅ Cloud Run package.json created');

// Step 3: Create public directory
console.log('3. Creating public directory...');
if (!fs.existsSync('dist/public')) {
  fs.mkdirSync('dist/public', { recursive: true });
}
console.log('✅ Public directory created');

// Step 4: Create Dockerfile for Cloud Run
console.log('4. Creating Dockerfile...');
const dockerfile = `# Use Node.js 18 alpine for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (Cloud Run sets PORT env var)
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
`;

fs.writeFileSync('dist/Dockerfile', dockerfile);
console.log('✅ Dockerfile created');

// Step 5: Create .dockerignore
console.log('5. Creating .dockerignore...');
const dockerignore = `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.idea
`;

fs.writeFileSync('dist/.dockerignore', dockerignore);
console.log('✅ .dockerignore created');

console.log('\n🎉 Cloud Run deployment ready!');
console.log('\nFiles created in dist/:');
console.log('  - server.js (ES module compatible)');
console.log('  - package.json (minimal dependencies)');
console.log('  - Dockerfile (Cloud Run optimized)');
console.log('  - .dockerignore');
console.log('\nDeployment instructions:');
console.log('1. cd dist');
console.log('2. Test locally: npm install && npm start');
console.log('3. Deploy to Cloud Run using the Dockerfile');
console.log('\nEnvironment variables needed:');
console.log('  - GHL_CLIENT_ID');
console.log('  - GHL_CLIENT_SECRET');
console.log('  - JWT_SECRET (optional)');
console.log('  - REDIRECT_URI (optional)');