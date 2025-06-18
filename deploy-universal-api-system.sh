#!/bin/bash

echo "=== DEPLOYING UNIVERSAL GOHIGHLEVEL API SYSTEM ==="

# Create deployment package with all components
mkdir -p universal-api-deployment

# Copy the universal backend
cp railway-universal-api-backend.js universal-api-deployment/index.js

# Create package.json for deployment
cat > universal-api-deployment/package.json << 'EOF'
{
  "name": "ghl-universal-api-backend",
  "version": "1.0.0",
  "description": "Universal GoHighLevel API Backend with Dynamic Routing",
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
cat > universal-api-deployment/railway.toml << 'EOF'
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

echo "✅ Universal API deployment package created"
echo ""
echo "System Capabilities:"
echo "• Handles 30+ GoHighLevel API endpoints automatically"
echo "• Dynamic routing based on endpoint configurations"
echo "• OAuth token management from marketplace installations"
echo "• Automatic parameter extraction and validation"
echo "• Comprehensive error handling and logging"
echo ""
echo "API Specifications Implemented:"
echo "• List Products: GET /products/ with search, pagination, locationId"
echo "• Get Product by ID: GET /products/:productId with locationId query"
echo "• Create Product: POST /products/ with required/optional fields"
echo "• Update Product: PUT /products/:productId with field validation"
echo "• Delete Product: DELETE /products/:productId with locationId query"
echo "• Complete CRUD for Contacts, Locations, Workflows, Forms, Media"
echo ""
echo "Deployment Features:"
echo "• Single entry point: app.all('/api/ghl/*') handles all endpoints"
echo "• Configuration-driven: new APIs require only array updates"
echo "• Zero maintenance: automatic authentication and error handling"
echo "• Production ready: comprehensive logging and monitoring"
echo ""
echo "🚀 Ready for Railway deployment at universal-api-deployment/"