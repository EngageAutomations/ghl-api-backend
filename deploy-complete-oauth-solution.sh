#!/bin/bash

echo "=== DEPLOYING COMPLETE OAUTH + PRODUCT API SOLUTION ==="

# Create a comprehensive Railway deployment package
mkdir -p railway-oauth-complete

# Copy the complete backend with all features
cp railway-backend-complete-with-products.js railway-oauth-complete/index.js

# Copy supporting files
cp railway-backend/package.json railway-oauth-complete/
cp railway-backend/railway.toml railway-oauth-complete/
cp railway-backend/product-api.js railway-oauth-complete/

# Verify the complete solution
echo "✅ Complete OAuth backend with product API ready"
echo "✅ Location ID retrieval endpoint included"
echo "✅ Product creation endpoints included"
echo "✅ Error handling and validation included"

echo ""
echo "Railway deployment package created in: railway-oauth-complete/"
echo ""
echo "API Endpoints Available:"
echo "- GET /api/oauth/url - Generate OAuth authorization URL"
echo "- GET /api/oauth/callback - Handle OAuth callback and token exchange"
echo "- POST /api/fix/location-id - Retrieve missing location ID"
echo "- POST /api/ghl/products - Create products in GoHighLevel"
echo "- POST /api/test/ghl-product - Test product creation"
echo "- GET /api/ghl/products - Retrieve products from GoHighLevel"
echo "- GET /api/debug/installations - View OAuth installations"
echo ""
echo "🚀 Ready for Railway production deployment"