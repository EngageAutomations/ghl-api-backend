# Quick Start Checklist

## Pre-Setup Requirements

- [ ] Replit account with deployment access
- [ ] Railway account 
- [ ] Custom domain with DNS management access
- [ ] GoHighLevel developer account
- [ ] GoHighLevel app created in marketplace

## Phase 1: Railway Backend (15 minutes)

### Step 1: Create Railway Project
- [ ] Login to Railway
- [ ] Create new project: `oauth-backend`
- [ ] Add PostgreSQL database service
- [ ] Note Railway domain URL

### Step 2: Deploy Backend Code
- [ ] Copy `/custom-domain-railway-oauth-solution/code-templates/railway-backend.js`
- [ ] Create `package.json` with required dependencies
- [ ] Deploy to Railway

### Step 3: Configure Environment Variables
```env
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret
GHL_REDIRECT_URI=https://your-railway-domain.up.railway.app/api/oauth/callback
DATABASE_URL=postgresql://... (auto-generated)
FRONTEND_DOMAIN=https://your-custom-domain.com
```

### Step 4: Verify Railway Backend
- [ ] Test health endpoint: `curl https://your-railway-domain.up.railway.app/api/health`
- [ ] Should return: `{"status":"healthy"}`

## Phase 2: Custom Domain Setup (10 minutes)

### Step 1: DNS Configuration
- [ ] Add CNAME record:
  - Type: CNAME
  - Name: your-subdomain (e.g., listings)
  - Value: your-replit-domain.replit.app
  - TTL: 300

### Step 2: Verify DNS Propagation
- [ ] Test resolution: `nslookup your-custom-domain.com`
- [ ] Use online DNS checker tools
- [ ] Wait up to 48 hours for full propagation

## Phase 3: Replit Frontend (15 minutes)

### Step 1: Configure Environment Variables
```env
GHL_CLIENT_ID=your_client_id
GHL_CLIENT_SECRET=your_client_secret
GHL_REDIRECT_URI=https://your-railway-domain.up.railway.app/api/oauth/callback
DATABASE_URL=your_replit_postgres_url
NODE_ENV=production
REPLIT_DEPLOYMENT=true
```

### Step 2: Update replit.toml
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

### Step 3: Create Production Assets
- [ ] Create `/dist/public/` directory
- [ ] Copy static fallback HTML from templates
- [ ] Ensure health endpoint exists in server code

### Step 4: Deploy Replit Application
- [ ] Deploy through Replit interface
- [ ] Monitor deployment logs
- [ ] Verify custom domain loads

## Phase 4: GoHighLevel Integration (10 minutes)

### Step 1: Update OAuth App Settings
- [ ] Set redirect URI to Railway backend URL
- [ ] Verify required scopes are enabled
- [ ] Test OAuth start URL

### Step 2: Test Complete Flow
- [ ] Access custom domain
- [ ] Click OAuth integration
- [ ] Complete authorization in GoHighLevel
- [ ] Verify successful redirect
- [ ] Check token storage in Railway database

## Phase 5: Verification (5 minutes)

### Production Checklist
- [ ] Custom domain loads professional interface
- [ ] Health endpoints respond correctly
- [ ] OAuth flows complete successfully
- [ ] Access tokens stored in database
- [ ] API management interface accessible
- [ ] No console errors in browser
- [ ] Mobile responsiveness works

### Database Verification
```sql
-- Check installations
SELECT COUNT(*) FROM oauth_installations;

-- Verify recent tokens
SELECT ghl_user_id, location_id, token_expires_at 
FROM oauth_installations 
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### API Testing
```bash
# Test Railway backend
curl https://your-railway-domain.up.railway.app/api/health

# Test custom domain
curl https://your-custom-domain.com/api/health

# Test OAuth start
curl -I https://your-railway-domain.up.railway.app/api/oauth/start
```

## Common Issues Checklist

### DNS Issues
- [ ] Verify exact spelling in DNS records
- [ ] Check TTL settings (use 300 for testing)
- [ ] Test with multiple DNS checkers
- [ ] Clear local DNS cache

### Deployment Issues  
- [ ] Check environment variables are set
- [ ] Verify static files exist in correct paths
- [ ] Review deployment logs for errors
- [ ] Ensure production mode detection works

### OAuth Issues
- [ ] Verify redirect URI exact match
- [ ] Check GoHighLevel app configuration
- [ ] Test Railway backend accessibility
- [ ] Validate CORS settings

## Success Indicators

✅ **Custom Domain**: Professional interface loads without errors
✅ **Railway Backend**: Health endpoint returns healthy status
✅ **OAuth Integration**: Complete flow stores tokens successfully
✅ **Database**: Installation records created with valid tokens
✅ **API Access**: Management interface accessible and functional
✅ **Session Recovery**: Works across devices and browsers

## Time Investment

- **First Time Setup**: ~2 hours (including learning)
- **Using This Guide**: ~15 minutes setup + DNS propagation time
- **DNS Propagation**: 24-48 hours (varies by provider)
- **Testing & Verification**: ~15 minutes

## Next Project Setup

For subsequent projects using this solution:

1. **Copy Template Files** (2 minutes)
   - Copy entire `/custom-domain-railway-oauth-solution/` folder
   - Update domain names in configuration files

2. **Deploy Railway Backend** (5 minutes)
   - Use existing backend template
   - Update environment variables
   - Deploy and verify

3. **Configure DNS** (3 minutes)
   - Add CNAME record for new domain
   - Wait for propagation

4. **Deploy Replit Frontend** (5 minutes)
   - Update environment variables
   - Deploy with proven configuration
   - Verify functionality

Total time for additional projects: **~15 minutes** + DNS propagation

This checklist ensures consistent, reliable deployment of the custom domain + Railway OAuth solution across all future projects.