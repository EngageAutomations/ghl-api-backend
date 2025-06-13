#!/bin/bash

# Commit Railway backend updates to GitHub
echo "Committing Railway backend updates with database integration..."

cd railway-backend

# Add all changes
git add package.json
git add index.js
git add db.js
git add schema.js

# Commit with descriptive message
git commit -m "Add complete PostgreSQL database integration for OAuth token storage

- Added database schema for oauth_installations table
- Integrated token storage in OAuth callback handler
- Added debug endpoints for installation verification
- Updated dependencies for database connectivity
- Full OAuth installation tracking with access tokens, refresh tokens, user data, and location data"

# Push to main branch
git push origin main

echo "✅ Railway backend updates committed to GitHub"
echo "Railway will automatically redeploy with database functionality"