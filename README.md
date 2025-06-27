# GoHighLevel API Backend

API backend deployed at: **https://api.engageautomations.com**

## Architecture
- **OAuth Backend**: https://dir.engageautomations.com (handles installations)
- **API Backend**: https://api.engageautomations.com (handles API calls)
- **Bridge**: OAuth bridge middleware connects the two backends

## Deployment Status
✅ Deployed to Railway with custom domain
✅ Connected to OAuth backend via bridge
✅ OAuth installations persist through API deployments

## API Endpoints
All endpoints available at https://api.engageautomations.com

- `GET /` - Health check and service info
- `POST /api/products` - Create product  
- `GET /api/products` - List products
- `POST /api/media/upload` - Upload media files
- `GET /api/media` - List media files
- `POST /api/pricing/:productId` - Create product pricing
- `GET /api/pricing/:productId` - Get product prices
- `POST /api/contacts` - Create contact
- `GET /api/contacts` - List contacts
- `GET /api/workflows` - List workflows

## Development
All API changes can be deployed independently without affecting OAuth installations.

## Environment Variables
- `OAUTH_BACKEND_URL`: https://dir.engageautomations.com
- `PORT`: Auto-detected by Railway (4000)