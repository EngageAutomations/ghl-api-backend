#!/bin/bash

# Deploy Updated Railway Backend with Installation Detail Endpoints
# This script deploys the complete Railway backend to expose OAuth credentials

echo "🚀 Deploying Railway OAuth Backend with Installation Detail Endpoints..."

# Create deployment package
echo "📦 Creating deployment package..."
cp railway-backend-complete-index.js railway-deploy/index.js

# Add package.json for Railway deployment
cat > railway-deploy/package.json << 'EOF'
{
  "name": "ghl-oauth-backend",
  "version": "1.0.0",
  "description": "GoHighLevel Universal API Backend with OAuth Installation Management",
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
startCommand = "npm start"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[deploy.environmentVariables]]
name = "NODE_ENV"
value = "production"

[[deploy.environmentVariables]]
name = "PORT"
value = "5000"
EOF

echo "✅ Deployment package created in railway-deploy/"
echo ""
echo "📋 Next Steps:"
echo "1. Upload the contents of railway-deploy/ to your Railway project"
echo "2. Set environment variables in Railway:"
echo "   - GHL_CLIENT_ID: 68474924a586bce22a6e64f7-mbpkmyu4"
echo "   - GHL_CLIENT_SECRET: [your client secret]"
echo "   - GHL_REDIRECT_URI: https://dir.engageautomations.com/api/oauth/callback"
echo ""
echo "3. Deploy the updated backend"
echo "4. Test the new endpoints:"
echo "   - GET https://dir.engageautomations.com/api/installations/latest"
echo "   - GET https://dir.engageautomations.com/api/installations/2/details"
echo ""
echo "🎯 This will expose your real OAuth credentials for API testing!"