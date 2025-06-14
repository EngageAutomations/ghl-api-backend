# Custom Domain Setup Guide

## Current Status
- Domain: `listings.engageautomations.com`
- Configuration: Set as primary domain in code
- Issue: Domain shows "not found" because not linked to deployment

## Steps to Make Custom Domain Primary

### 1. Deploy Your App First
Click "Deploy" in Replit to create the deployment.

### 2. Add Custom Domain in Replit
1. Go to your Replit deployment dashboard
2. Click on your deployed app
3. Go to "Domains" or "Custom Domains" section
4. Click "Add Custom Domain"
5. Enter: `listings.engageautomations.com`
6. Follow the DNS configuration instructions

### 3. DNS Configuration Required
You'll need to add these DNS records in your domain provider:

**Option A: CNAME Record (Recommended)**
```
Type: CNAME
Name: listings
Value: [your-replit-app-url]
```

**Option B: A Record**
```
Type: A
Name: listings
Value: [Replit's IP address - provided in dashboard]
```

### 4. Verification
- DNS changes take 5-60 minutes to propagate
- Replit will verify the domain connection
- Once verified, your custom domain will work

## Current Code Configuration
Your app is already configured to:
- Treat `listings.engageautomations.com` as primary domain
- Handle HTTPS redirects properly
- Set correct CORS headers for the custom domain

## Next Steps
1. Complete Replit deployment
2. Add custom domain in Replit dashboard
3. Configure DNS records with your domain provider
4. Wait for propagation and verification