# Railway Setup Instructions for API Backend

## Current Architecture
- **OAuth Backend (EXISTING)**: https://dir.engageautomations.com
  - Keep untouched
  - Handles OAuth installations only
  - Database persistence ensures installations never lost

- **API Backend (NEW)**: Separate Railway project needed
  - Handles all GoHighLevel API endpoints
  - Connects to OAuth backend via bridge
  - Deploy freely without affecting installations

## Railway Setup Steps

### 1. Create New Railway Project
1. Go to railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select: `EngageAutomations/ghl-api-backend`

### 2. Configure Environment Variables
Set this required variable in Railway:
```
OAUTH_BACKEND_URL = https://dir.engageautomations.com
```

### 3. Deploy
Railway will automatically:
- Build from package.json
- Use start command: `npm start`
- Run on port 4000
- Generate a URL like: `https://ghl-api-backend-xxxxx.railway.app`

## Bridge Communication
The API backend will communicate with the OAuth backend like this:
1. API request received
2. OAuth bridge calls: `https://dir.engageautomations.com/installations`
3. Gets active installation and fresh token
4. Makes GoHighLevel API call
5. Returns response

## Benefits
- OAuth installations persist through all API deployments
- Add/modify APIs without affecting authentication
- Scale each service independently
- Isolated failures - if API breaks, OAuth still works

## Development Workflow
- **OAuth changes**: Deploy to oauth-backend project (rare)
- **API changes**: Deploy to ghl-api-backend project (frequent)
- Your installations survive all API deployments