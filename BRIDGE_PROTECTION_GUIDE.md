# Bridge Protection Guide

## What Can Break the Bridge

1. **Server crashes** - If main server goes down, bridge goes down
2. **Code changes to server/index.ts** - Bridge setup could get removed
3. **Import errors** - Breaking bridge-integration.ts imports
4. **Environment variables** - Missing OAuth credentials
5. **Route conflicts** - New routes overriding bridge endpoints

## Protection Systems Implemented

### 1. Bridge Health Monitoring
- Automatic validation every 5 minutes
- Checks endpoint registration and OAuth credentials
- Logs warnings when bridge health degrades

### 2. Emergency Recovery
- `BridgeProtection.emergencyRecovery()` can restore bridge
- Automatically re-imports and re-configures endpoints
- Validates recovery was successful

### 3. Backup Bridge Server
- Standalone bridge server on port 3001
- Can run independently if main server fails
- Emergency OAuth credential serving

### 4. Bridge Test Script
- Quick health check: `npm run test:bridge`
- Validates all bridge functionality
- Tests Railway accessibility

## How to Use During Development

### Before Making Changes
```bash
npm run test:bridge
```

### After Making Changes
```bash
npm run test:bridge
```

### If Bridge Breaks
```bash
# Option 1: Start backup bridge
npm run bridge:backup

# Option 2: Emergency recovery (in code)
BridgeProtection.emergencyRecovery(app);
```

### Manual Recovery Steps
1. Check server is running: `curl localhost:3000/health`
2. Check credentials endpoint: `curl localhost:3000/api/bridge/oauth-credentials`
3. Verify environment variables are set
4. Re-run bridge setup if needed

## Critical Files to Protect

- `server/bridge-integration.ts` - Core bridge logic
- `server/index.ts` - Bridge setup calls
- `.env` - OAuth credentials
- `server/bridge-protection.ts` - Protection system

## Railway Configuration

Once bridge is stable, Railway needs:
```
BRIDGE_URL = https://your-replit-domain/api/bridge/oauth-credentials
```

## Warning Signs

- OAuth installations start failing
- Railway gets 502 errors
- Bridge test script fails
- Health monitoring reports issues

## Emergency Contacts

If all protection fails:
1. Use backup bridge server
2. Restore from working bridge-integration.ts
3. Check Railway logs for specific errors
4. Verify external accessibility via Replit domains