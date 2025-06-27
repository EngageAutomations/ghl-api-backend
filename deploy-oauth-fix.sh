#!/bin/bash
# OAuth Encoding Fix Deployment Script

echo "Deploying OAuth encoding fix to Railway..."

# Navigate to railway-backend directory
cd railway-backend

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Fix OAuth encoding: Use explicit URLSearchParams.append() for form data"

# Push to trigger Railway deployment
git push origin main

echo "Deployment triggered. Railway will automatically deploy v7.0.3-encoding-fixed"
echo "Wait 2-3 minutes for deployment to complete, then test OAuth installation"
