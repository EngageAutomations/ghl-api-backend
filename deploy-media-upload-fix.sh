#!/bin/bash

# Deploy Media Upload Fix to Railway
# This script creates and deploys the fixed backend with media upload support

echo "🚀 Deploying Railway Backend with Media Upload Support"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf railway-media-upload-deployment.tar.gz railway-media-upload-fix.js

echo "✅ Deployment package created: railway-media-upload-deployment.tar.gz"
echo ""
echo "📋 Manual Deployment Instructions:"
echo "1. Extract railway-media-upload-fix.js to your Railway project"
echo "2. Rename it to index.js in your Railway root directory"
echo "3. Ensure package.json includes these dependencies:"
echo "   - express"
echo "   - cors" 
echo "   - axios"
echo "   - multer"
echo "   - form-data"
echo "4. Deploy to Railway"
echo ""
echo "🔍 After deployment, test with:"
echo "curl -X POST https://dir.engageautomations.com/api/ghl/media/upload -F \"file=@test.jpg\""
echo ""
echo "🎯 Expected result: Media upload endpoint should now be available"