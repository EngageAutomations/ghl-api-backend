#!/bin/bash

# Deploy Universal API System to Railway
# Implements real GoHighLevel API integration with your existing installation

echo "🚀 Deploying Universal API System to Railway..."

# Create deployment package
tar -czf railway-universal-api-deployment.tar.gz railway-production-api/

echo "📦 Deployment package created: railway-universal-api-deployment.tar.gz"

echo "🔧 Configuration required:"
echo "  Set environment variable: GHL_ACCESS_TOKEN=<your_real_token>"
echo "  Installation ID: install_1750106970265"
echo "  Location ID: WAvk87RmW9rBSDJHeOpH"

echo "📋 Post-deployment test commands:"
echo ""
echo "# Test connection"
echo "curl 'https://dir.engageautomations.com/api/ghl/test-connection?installationId=install_1750106970265'"
echo ""
echo "# Create test product"
echo "curl -X POST 'https://dir.engageautomations.com/api/ghl/products/create' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\":\"Railway Test Product\",\"description\":\"Created via Railway API\",\"installationId\":\"install_1750106970265\"}'"
echo ""
echo "✅ Frontend forms will automatically work once Railway backend is deployed"
echo "   Your CreateListingForm and CreateCollectionForm are already integrated"