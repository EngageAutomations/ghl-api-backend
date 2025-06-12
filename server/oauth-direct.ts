// Direct OAuth route implementation to bypass routing conflicts
import express from 'express';

export function setupDirectOAuthRoutes(app: express.Express) {
  console.log('Setting up direct OAuth routes...');

  // Direct OAuth start route - highest priority
  app.get('/oauth/start', async (req, res) => {
    try {
      console.log('🚀 Direct OAuth start route hit');
      
      // Generate state parameter
      const state = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Build OAuth URL manually
      const clientId = process.env.GHL_CLIENT_ID;
      const redirectUri = 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback';
      const scopes = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write';
      
      const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&state=${state}&scope=${encodeURIComponent(scopes)}`;
      
      console.log('Generated OAuth URL:', authUrl);
      
      // Store state in cookie
      res.cookie('oauth_state', state, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000 // 10 minutes
      });
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('Direct OAuth start error:', error);
      res.status(500).json({ error: 'Failed to initiate OAuth' });
    }
  });

  // Test route to verify direct routing works
  app.get('/test', (req, res) => {
    console.log('✅ Direct test route hit - routing is working');
    res.send('Direct test route is working! OAuth routing should now be functional.');
  });

  // OAuth callback route (fallback if Railway proxy fails)
  app.get('/oauth/callback', async (req, res) => {
    try {
      console.log('🔄 Direct OAuth callback hit:', req.query);
      
      const { code, state, error } = req.query;
      
      if (error) {
        console.error('OAuth error from GoHighLevel:', error);
        return res.redirect('/?error=oauth_denied');
      }
      
      if (!code) {
        console.error('No authorization code received');
        return res.redirect('/?error=no_code');
      }
      
      // Verify state parameter
      const storedState = req.cookies.oauth_state;
      if (!storedState || storedState !== state) {
        console.error('State mismatch - possible CSRF attack');
        return res.redirect('/?error=invalid_state');
      }
      
      // Exchange code for tokens
      const tokenUrl = 'https://services.leadconnectorhq.com/oauth/token';
      const tokenData = {
        grant_type: 'authorization_code',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        code: code as string,
        redirect_uri: 'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback'
      };
      
      console.log('Exchanging code for tokens...');
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenData)
      });
      
      const tokenResult = await response.json();
      
      if (!response.ok) {
        console.error('Token exchange failed:', tokenResult);
        return res.redirect('/?error=token_exchange_failed');
      }
      
      console.log('Token exchange successful');
      
      // Store tokens securely
      res.cookie('ghl_access_token', tokenResult.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenResult.expires_in * 1000
      });
      
      // Clear state cookie
      res.clearCookie('oauth_state');
      
      // Redirect to success page
      res.redirect('/?oauth=success');
      
    } catch (error) {
      console.error('Direct OAuth callback error:', error);
      res.redirect('/?error=callback_failed');
    }
  });

  console.log('Direct OAuth routes registered successfully');
}