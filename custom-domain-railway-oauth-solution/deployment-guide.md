# Deployment Guide: Custom Domain + Railway OAuth Solution

## Prerequisites

- Replit account with deployment capabilities
- Railway account
- Custom domain access (DNS management)
- GoHighLevel developer account

## Step 1: Railway Backend Setup

### 1.1 Create Railway Project
```bash
# Deploy the Railway backend
railway login
railway new oauth-backend
railway add postgresql
```

### 1.2 Deploy Backend Code
Copy the complete Railway backend from `/railway-backend/` folder:
- `index.js` - Main server with OAuth flows
- `schema.js` - Database schema
- `package.json` - Dependencies

### 1.3 Configure Environment Variables
```env
GHL_CLIENT_ID=your_ghl_client_id
GHL_CLIENT_SECRET=your_ghl_client_secret
GHL_REDIRECT_URI=https://your-railway-domain/api/oauth/callback
DATABASE_URL=postgresql://... (auto-generated)
```

### 1.4 Test Railway Deployment
```bash
curl https://your-railway-domain/api/health
# Should return: {"status":"healthy"}
```

## Step 2: Custom Domain Configuration

### 2.1 DNS Setup
Configure your domain DNS with these records:
```
Type: CNAME
Name: listings (or your subdomain)
Value: your-replit-deployment-domain
TTL: 300
```

**CRITICAL**: Verify exact spelling in DNS configuration
- Common mistake: "link" instead of "listings"
- Use DNS propagation checker to verify

### 2.2 Domain Verification
```bash
# Test domain connectivity
curl -I https://your-custom-domain.com
# Should return HTTP 200 or redirect
```

## Step 3: Replit Frontend Setup

### 3.1 Environment Configuration
```env
GHL_CLIENT_ID=your_ghl_client_id
GHL_CLIENT_SECRET=your_ghl_client_secret
GHL_REDIRECT_URI=https://your-railway-domain/api/oauth/callback
DATABASE_URL=your_replit_postgres_url
```

### 3.2 Production Deployment Config
File: `replit.toml`
```toml
[deployment]
deploymentTarget = "autoscale"
run = ["npx", "tsx", "server/index.ts"]
publicVisible = true

[[deployment.routes]]
source = "/(.*)"
destination = "/$1"
type = "proxy"
```

### 3.3 Server Configuration
Key settings in `server/index.ts`:
```javascript
// Production mode detection
const isDeployment = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
const forceProductionMode = isDeployment;

// Static file serving for production
if (forceProductionMode) {
  app.use(express.static(path.join(__dirname, '../dist/public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
}
```

## Step 4: Production Assets

### 4.1 Create Static Fallback
File: `dist/public/index.html`
- Professional marketplace interface
- Health check integration
- OAuth access links
- Responsive design

### 4.2 Health Monitoring
```javascript
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});
```

## Step 5: OAuth Integration

### 5.1 GoHighLevel App Configuration
- Marketplace app setup
- Redirect URI: `https://your-railway-domain/api/oauth/callback`
- Required scopes: products, media, locations, contacts

### 5.2 Test OAuth Flow
1. Access custom domain
2. Click OAuth integration
3. Complete GoHighLevel authorization
4. Verify token storage in Railway database

## Step 6: Verification Checklist

### Domain Access
- [ ] Custom domain loads without errors
- [ ] Professional interface displays
- [ ] Health endpoint responds
- [ ] OAuth links functional

### Backend Integration
- [ ] Railway backend accessible
- [ ] Database connections stable
- [ ] OAuth callbacks working
- [ ] Token storage confirmed

### Production Readiness
- [ ] Static assets served correctly
- [ ] Error handling implemented
- [ ] Session recovery functional
- [ ] API endpoints accessible

## Common Issues & Solutions

### DNS Issues
- **Problem**: Domain not resolving
- **Solution**: Verify DNS propagation (24-48 hours)
- **Tool**: whatsmydns.net

### Internal Server Error
- **Problem**: 500 errors on custom domain
- **Solution**: Check production mode configuration
- **Debug**: Review deployment logs

### OAuth Callback Failures
- **Problem**: Authorization fails
- **Solution**: Verify Railway redirect URI exact match
- **Check**: GoHighLevel app configuration

### Build Timeouts
- **Problem**: Vite build fails with timeout
- **Solution**: Use direct server execution
- **Config**: Remove build step, use tsx directly

## Success Indicators

✅ Custom domain serves professional interface
✅ OAuth flows complete end-to-end
✅ Tokens stored in Railway database
✅ API management accessible
✅ Session recovery works across devices
✅ Production deployment stable

## Deployment Time

- First-time setup: ~2 hours
- Using this guide: ~15 minutes
- DNS propagation: 24-48 hours (varies)

## Next Project Setup

1. Copy `custom-domain-railway-oauth-solution/` folder
2. Update domain names in configuration files
3. Deploy Railway backend with new credentials
4. Configure DNS for new custom domain
5. Deploy Replit frontend
6. Test complete OAuth flow

This guide eliminates the trial-and-error process for future projects.