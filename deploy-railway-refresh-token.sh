#!/bin/bash
# Deploy Railway Backend with Token Refresh Support

echo "🚀 Deploying Railway Backend with OAuth Token Refresh..."

# Copy the complete Railway backend with refresh token endpoint
cp railway-backend-complete-with-products.js railway-deploy/index.js

# Create package.json for Railway deployment
cat > railway-deploy/package.json << 'EOF'
{
  "name": "ghl-oauth-backend-refresh",
  "version": "2.0.0",
  "description": "GoHighLevel OAuth Backend with Token Refresh and Product API",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create Railway configuration
cat > railway-deploy/railway.toml << 'EOF'
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "oauth-backend"

[services.build]
builder = "NIXPACKS"

[services.deploy]
healthcheckPath = "/health"
startCommand = "node index.js"
EOF

echo "✅ Railway deployment files ready with token refresh support"
echo "📁 Files created:"
echo "   - railway-deploy/index.js (with /api/oauth/refresh endpoint)"
echo "   - railway-deploy/package.json"
echo "   - railway-deploy/railway.toml"
echo ""
echo "🔗 Next steps:"
echo "1. Deploy to Railway: https://railway.app"
echo "2. Test refresh endpoint: POST /api/oauth/refresh"
echo "3. Test product creation with auto-refresh"