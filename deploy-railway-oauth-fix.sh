#!/bin/bash

# Deploy Railway OAuth Fix - Environment Variable Validation
# This script deploys the updated Railway backend with environment variable debugging

echo "🚀 Deploying Railway OAuth Fix with Environment Variable Validation"
echo "=================================================================="

# Create deployment package
echo "📦 Creating deployment package..."

# Copy the updated railway-index.js with environment variable validation
cp railway-index.js railway-oauth-fixed.js

# Verify the environment variable validation is in place
echo "✅ Verifying environment variable validation..."
if grep -q "Environment Variables Check" railway-oauth-fixed.js; then
    echo "   ✓ Environment variable validation added"
else
    echo "   ❌ Environment variable validation missing"
    exit 1
fi

# Create package.json for Railway
cat > railway-fixed-package.json << 'EOF'
{
  "name": "gohighlevel-oauth-backend",
  "version": "2.0.1",
  "description": "GoHighLevel OAuth Backend with Environment Variable Validation",
  "main": "railway-oauth-fixed.js",
  "scripts": {
    "start": "node railway-oauth-fixed.js",
    "dev": "node railway-oauth-fixed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

echo "✅ Package.json created for Railway deployment"

# Create Railway configuration
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
EOF

echo "✅ Railway configuration created"

# Package everything
echo "📦 Creating deployment archive..."
tar -czf railway-oauth-fix.tar.gz railway-oauth-fixed.js railway-fixed-package.json railway.json

echo ""
echo "🎯 Deployment Package Ready"
echo "=========================="
echo "Files created:"
echo "  - railway-oauth-fixed.js (Updated backend with env validation)"
echo "  - railway-fixed-package.json (Package configuration)"
echo "  - railway.json (Railway deployment config)"
echo "  - railway-oauth-fix.tar.gz (Complete deployment package)"
echo ""
echo "📋 Deployment Instructions:"
echo "1. Go to your Railway dashboard"
echo "2. Select your OAuth backend service"
echo "3. Go to Settings → Deploy"
echo "4. Upload railway-oauth-fix.tar.gz"
echo "5. Check the logs for environment variable validation output"
echo ""
echo "🔍 Expected Log Output:"
echo "=== Environment Variables Check ==="
echo "GHL_CLIENT_ID: SET"
echo "GHL_CLIENT_SECRET: SET" 
echo "GHL_REDIRECT_URI: https://dir.engageautomations.com/oauth/callback"
echo ""
echo "If any variables show 'NOT SET', add them in Railway Variables section"

ls -la railway-oauth-fix.tar.gz railway-oauth-fixed.js railway-fixed-package.json