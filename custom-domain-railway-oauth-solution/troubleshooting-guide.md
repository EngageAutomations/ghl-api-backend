# Troubleshooting Guide

## Common Issues and Solutions

### DNS and Domain Issues

#### Issue: Custom Domain Not Resolving
**Symptoms:**
- Domain shows "This site can't be reached"
- DNS lookup fails
- Timeout errors

**Solution:**
1. Verify DNS configuration spelling (common typo: "link" vs "listings")
2. Check DNS propagation: `nslookup your-domain.com`
3. Wait 24-48 hours for full propagation
4. Test with DNS checker tools

**Prevention:**
- Use DNS validation tools before deployment
- Keep TTL low (300) during testing

#### Issue: Domain Resolves but Shows Wrong Content
**Symptoms:**
- Domain loads but shows default/old content
- Different content than Replit domain

**Solution:**
1. Check production mode configuration in server code
2. Verify static file paths in deployment
3. Clear browser cache and DNS cache
4. Restart deployment after configuration changes

### Production Deployment Issues

#### Issue: Internal Server Error (500)
**Symptoms:**
- Custom domain shows "Internal Server Error"
- Server logs show application crashes

**Root Causes & Solutions:**

**Missing Production Assets:**
```bash
# Create required directories
mkdir -p dist/public
mkdir -p dist/beacon
echo "// Placeholder" > dist/beacon/index.global.js
```

**Environment Variable Issues:**
```javascript
// Add environment validation
if (!process.env.GHL_CLIENT_ID) {
  console.error('Missing GHL_CLIENT_ID environment variable');
  process.exit(1);
}
```

**Static File Path Errors:**
```javascript
// Correct production serving
if (forceProductionMode) {
  app.use(express.static(path.join(__dirname, '../dist/public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
}
```

#### Issue: Build Timeout During Deployment
**Symptoms:**
- Deployment fails with timeout
- Vite build hangs on Lucide icons

**Solution:**
```toml
# In replit.toml - bypass build step
[deployment]
deploymentTarget = "autoscale"
run = ["npx", "tsx", "server/index.ts"]
publicVisible = true
```

**Alternative:**
```javascript
// Use development mode for consistent serving
const forceProductionMode = false;
```

### OAuth Integration Issues

#### Issue: OAuth Callback Fails
**Symptoms:**
- Authorization redirects to error page
- "Invalid redirect URI" errors
- Token exchange failures

**Solution:**
1. Verify exact redirect URI match in GoHighLevel app settings
2. Check Railway backend URL accessibility
3. Validate CORS configuration

**Debug Steps:**
```bash
# Test Railway backend health
curl https://your-railway-domain.up.railway.app/api/health

# Check OAuth endpoint
curl https://your-railway-domain.up.railway.app/api/oauth/start
```

#### Issue: Access Tokens Not Stored
**Symptoms:**
- OAuth completes but no tokens in database
- API calls fail with authentication errors

**Solution:**
1. Check database connection in Railway
2. Verify OAuth callback handler saves tokens
3. Test database write permissions

**Database Debug:**
```sql
-- Check installations table
SELECT * FROM oauth_installations ORDER BY created_at DESC LIMIT 5;

-- Verify token storage
SELECT ghl_user_id, location_id, token_expires_at 
FROM oauth_installations 
WHERE access_token IS NOT NULL;
```

### API Integration Issues

#### Issue: GoHighLevel API Calls Fail
**Symptoms:**
- 401 Unauthorized responses
- "Invalid access token" errors
- API endpoints return authentication errors

**Solution:**
1. Verify token expiration dates
2. Implement token refresh logic
3. Check required scopes in GoHighLevel app

**Token Refresh Implementation:**
```javascript
async function refreshTokenIfNeeded(installation) {
  if (new Date() > new Date(installation.token_expires_at)) {
    const refreshedTokens = await refreshAccessToken(installation.refresh_token);
    await updateTokensInDatabase(installation.ghl_user_id, refreshedTokens);
    return refreshedTokens.access_token;
  }
  return installation.access_token;
}
```

### Performance and Reliability Issues

#### Issue: Slow Loading Times
**Symptoms:**
- Long page load times
- Timeout errors
- Poor user experience

**Solutions:**

**Frontend Optimization:**
```javascript
// Implement lazy loading
const LazyComponent = React.lazy(() => import('./Component'));

// Use React.Suspense
<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>
```

**Backend Optimization:**
```javascript
// Add response caching
app.use((req, res, next) => {
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
  }
  next();
});
```

#### Issue: Database Connection Failures
**Symptoms:**
- Intermittent database errors
- Connection timeout issues
- OAuth data not persisting

**Solution:**
```javascript
// Implement connection retry logic
const connectWithRetry = async () => {
  try {
    await db.select().from(oauth_installations).limit(1);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed, retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};
```

### Browser and Cross-Domain Issues

#### Issue: CORS Errors
**Symptoms:**
- Browser console shows CORS errors
- API calls blocked by browser
- Cross-origin request failures

**Solution:**
```javascript
// Configure CORS properly
const corsOptions = {
  origin: [
    'https://your-custom-domain.com',
    'https://your-replit-domain.replit.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-ghl-locationid']
};

app.use(cors(corsOptions));
```

#### Issue: Session Storage Problems
**Symptoms:**
- Users logged out unexpectedly
- Session data not persisting
- Authentication state lost

**Solution:**
```javascript
// Configure session for embedded access
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none' // Required for iframe embedding
  }
}));
```

## Diagnostic Tools

### Health Check Endpoints
```javascript
// Comprehensive health check
app.get('/api/diagnostics', async (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'checking...',
    oauth_backend: 'checking...',
    domain: req.get('host')
  };

  try {
    await db.select().from(oauth_installations).limit(1);
    diagnostics.database = 'connected';
  } catch (error) {
    diagnostics.database = 'failed';
  }

  try {
    const response = await fetch('https://your-railway-domain.up.railway.app/api/health');
    diagnostics.oauth_backend = response.ok ? 'connected' : 'failed';
  } catch (error) {
    diagnostics.oauth_backend = 'failed';
  }

  res.json(diagnostics);
});
```

### Debug Logging
```javascript
// Enhanced request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Headers:`, req.headers);
  console.log(`Query:`, req.query);
  console.log(`Body:`, req.body);
  next();
});
```

### Testing Scripts
```bash
#!/bin/bash
# test-deployment.sh

echo "Testing custom domain..."
curl -I https://your-custom-domain.com

echo "Testing health endpoint..."
curl https://your-custom-domain.com/api/health

echo "Testing OAuth backend..."
curl https://your-railway-domain.up.railway.app/api/health

echo "Testing database connection..."
curl https://your-custom-domain.com/api/diagnostics
```

## Emergency Recovery

### Rollback Procedures
1. **Immediate Rollback:**
   - Revert to last known working replit.toml
   - Redeploy with previous configuration
   - Monitor logs for stability

2. **DNS Rollback:**
   - Point domain to working backup deployment
   - Reduce TTL for faster propagation
   - Verify functionality before permanent fix

3. **Database Recovery:**
   - Export OAuth installations data
   - Restore from Railway backup
   - Verify token validity after restoration

### Monitoring and Alerts
```javascript
// Simple uptime monitoring
setInterval(async () => {
  try {
    const response = await fetch('https://your-custom-domain.com/api/health');
    if (!response.ok) {
      console.error(`Health check failed: ${response.status}`);
      // Send alert notification
    }
  } catch (error) {
    console.error('Health check error:', error.message);
    // Send alert notification
  }
}, 60000); // Check every minute
```

This troubleshooting guide covers the most common issues encountered during setup and operation. Keep this reference handy for quick problem resolution.