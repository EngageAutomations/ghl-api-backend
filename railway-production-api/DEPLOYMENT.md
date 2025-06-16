# Railway Production API Deployment

## Quick Deploy (5 minutes)
1. Upload files to Railway service
2. Set environment variable: GHL_ACCESS_TOKEN=<your_real_token>
3. Deploy and test

## Test Commands
```bash
# Test connection
curl "https://dir.engageautomations.com/api/ghl/test-connection?installationId=install_1750106970265"

# Create product
curl -X POST "https://dir.engageautomations.com/api/ghl/products/create" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Product", "description": "API Test", "installationId": "install_1750106970265"}'
```

## Frontend Integration
Your Replit frontend forms will automatically work once Railway backend is deployed.
No frontend changes needed - forms already integrated with GoHighLevel sync.
