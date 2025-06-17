#!/bin/bash

echo "=== Railway Deployment Fix Script ==="
echo "This script helps deploy the fixed backend to Railway"
echo ""

# Create deployment directory
mkdir -p railway-deployment-temp
cd railway-deployment-temp

# Copy the fixed files
echo "Creating deployment package..."

# Create package.json
cat > package.json << 'EOF'
{
  "name": "railway-ghl-backend",
  "version": "5.1.1",
  "description": "GoHighLevel backend with simplified multi-image upload",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "multer": "^1.4.5-lts.1",
    "form-data": "^4.0.0",
    "node-fetch": "^2.6.7"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF

# Copy the main backend file
cp ../railway-deployment-fix.js index.js

echo "Files created in railway-deployment-temp/"
echo ""
echo "Manual Railway Deployment Steps:"
echo "1. Copy the contents of railway-deployment-temp/package.json"
echo "2. Update your Railway package.json with this content"
echo "3. Copy the contents of railway-deployment-temp/index.js" 
echo "4. Update your Railway main file with this content"
echo "5. Ensure GHL_ACCESS_TOKEN environment variable is set"
echo "6. Deploy the changes"
echo ""
echo "After deployment, test with:"
echo "curl https://dir.engageautomations.com/health"
echo ""
echo "Expected response should include:"
echo '  "features": ["location-centric", "multi-image-upload", "no-jwt-simplified"]'