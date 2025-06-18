# Railway Environment Variables Setup

## Required OAuth Credentials

Your Railway service needs these environment variables to complete the OAuth flow:

### Variables to Add in Railway Dashboard

1. **GHL_CLIENT_ID**
   - Value: [Your GoHighLevel App Client ID]
   - Location: GoHighLevel Marketplace → Your App → OAuth Settings

2. **GHL_CLIENT_SECRET** 
   - Value: [Your GoHighLevel App Client Secret]
   - Location: GoHighLevel Marketplace → Your App → OAuth Settings

3. **GHL_REDIRECT_URI**
   - Value: `https://dir.engageautomations.com/oauth/callback`
   - Must match exactly in GoHighLevel app configuration

## Setup Steps

1. Go to Railway Dashboard
2. Select your OAuth service
3. Go to "Variables" section
4. Add each environment variable above
5. Redeploy the service

## Verification

After adding variables, test with:
```
curl "https://dir.engageautomations.com/oauth/callback?code=test"
```

Should redirect to success instead of token_exchange_failed error.

## GoHighLevel App Configuration

Ensure your GoHighLevel marketplace app has:
- Redirect URI: `https://dir.engageautomations.com/oauth/callback`
- Scopes: `contacts.read`, `contacts.write`, `locations.read`, `users.read`
- Status: Approved and Active