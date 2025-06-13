#!/bin/bash

# Deploy Railway OAuth Fix - Update redirect URLs to listings.engageautomations.com
echo "🚀 Deploying Railway OAuth Fix..."

# Package the updated Railway backend
echo "📦 Creating deployment package..."
tar -czf railway-oauth-fix.tar.gz \
    railway-backend/index.js \
    railway-backend/package.json \
    railway-backend/start.js \
    railway-backend/db.js \
    railway-backend/schema.js \
    railway-backend/product-api.js \
    railway-backend/railway.toml

echo "✅ Railway OAuth fix package created: railway-oauth-fix.tar.gz"
echo ""
echo "🔧 Manual deployment steps:"
echo "1. Upload railway-oauth-fix.tar.gz to your Railway project"
echo "2. Extract and deploy the updated backend"
echo "3. Verify environment variables:"
echo "   - GHL_REDIRECT_URI should be: listings.engageautomations.com"
echo "   - GHL_CLIENT_ID should be set"
echo "   - GHL_CLIENT_SECRET should be set"
echo ""
echo "🎯 Expected outcome:"
echo "- OAuth success redirects to: https://listings.engageautomations.com/oauth-success"
echo "- OAuth errors redirect to: https://listings.engageautomations.com/oauth-error"
echo ""
echo "Your OAuth installation already succeeded - you just need the correct redirect!"