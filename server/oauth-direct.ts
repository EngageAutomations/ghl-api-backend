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
      const redirectUri = 'https://dir.engageautomations.com/oauth/callback';
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
    res.send('OAuth routing interceptor is working! OAuth flow should now be functional.');
  });

  // Check for captured OAuth data from database
  app.get('/oauth/installation-data', async (req, res) => {
    try {
      const { storage } = await import('./storage');
      const latestInstallation = await storage.getLatestOAuthInstallation();
      
      if (latestInstallation) {
        console.log('Retrieved OAuth installation data from database');
        res.json({
          success: true,
          installation: {
            timestamp: latestInstallation.installationDate?.toISOString(),
            user: {
              id: latestInstallation.ghlUserId,
              email: latestInstallation.ghlUserEmail,
              name: latestInstallation.ghlUserName,
              phone: latestInstallation.ghlUserPhone,
              company: latestInstallation.ghlUserCompany
            },
            tokens: {
              hasAccessToken: !!latestInstallation.ghlAccessToken,
              hasRefreshToken: !!latestInstallation.ghlRefreshToken,
              tokenType: latestInstallation.ghlTokenType,
              expiresIn: latestInstallation.ghlExpiresIn,
              scopes: latestInstallation.ghlScopes
            },
            location: latestInstallation.ghlLocationId ? {
              id: latestInstallation.ghlLocationId,
              name: latestInstallation.ghlLocationName,
              businessType: latestInstallation.ghlLocationBusinessType,
              address: latestInstallation.ghlLocationAddress
            } : null
          },
          message: 'OAuth installation data found'
        });
      } else {
        res.json({
          success: false,
          installation: null,
          message: 'No OAuth installation data found'
        });
      }
    } catch (error) {
      console.error('Error retrieving OAuth installation data:', error);
      res.status(500).json({
        success: false,
        installation: null,
        message: 'Error retrieving installation data'
      });
    }
  });

  // OAuth callback route with complete token exchange
  app.get('/oauth/callback', async (req, res) => {
    try {
      console.log('🔄 Direct OAuth callback hit:', req.query);
      
      const { code, state, error, action } = req.query;
      
      // Handle OAuth URL generation requests
      if (action === 'generate-url') {
        try {
          console.log('Generating OAuth URL via direct callback endpoint');
          const generatedState = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const clientId = process.env.GHL_CLIENT_ID;
          const redirectUri = 'https://dir.engageautomations.com/oauth/callback';
          const scopes = 'locations.readonly locations.write contacts.readonly contacts.write opportunities.readonly opportunities.write calendars.readonly calendars.write forms.readonly forms.write surveys.readonly surveys.write workflows.readonly workflows.write snapshots.readonly snapshots.write';
          
          const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}&state=${generatedState}&scope=${encodeURIComponent(scopes)}`;
          
          return res.json({
            success: true,
            authUrl,
            state: generatedState,
            clientId: process.env.GHL_CLIENT_ID,
            redirectUri: 'https://dir.engageautomations.com/oauth/callback'
          });
        } catch (error) {
          console.error('OAuth URL generation error:', error);
          return res.status(500).json({
            success: false,
            error: 'Failed to generate OAuth URL',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      if (error) {
        console.error('OAuth error from GoHighLevel:', error);
        return res.redirect('/?error=oauth_denied');
      }
      
      if (!code) {
        console.error('No authorization code received');
        return res.redirect('/?error=no_code');
      }
      
      // Verify state parameter (flexible for marketplace installations)
      const storedState = req.cookies?.oauth_state;
      if (storedState && storedState !== state) {
        console.error('State mismatch - possible CSRF attack');
        return res.redirect('/?error=invalid_state');
      }
      
      // For marketplace installations, state validation is optional
      if (!storedState) {
        console.log('No stored state found - assuming marketplace installation');
      }
      
      // Exchange code for tokens
      const tokenUrl = 'https://services.leadconnectorhq.com/oauth/token';
      const tokenData = {
        grant_type: 'authorization_code',
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        code: code as string,
        redirect_uri: 'https://dir.engageautomations.com/oauth/callback'
      };
      
      console.log('Exchanging code for tokens...');
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(tokenData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', response.status, errorText);
        return res.redirect('/?error=token_exchange_failed');
      }

      const tokens = await response.json();
      console.log('✅ Token exchange successful');
      console.log('Token type:', tokens.token_type);
      console.log('Scope:', tokens.scope);
      console.log('Expires in:', tokens.expires_in, 'seconds');

      // Fetch user information
      console.log('🔍 Fetching user information...');
      const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Version': '2021-07-28'
        }
      });

      if (!userResponse.ok) {
        console.error('Failed to fetch user data:', userResponse.status);
        return res.redirect('/?error=user_fetch_failed');
      }

      const userData = await userResponse.json();
      console.log('✅ User data retrieved');
      console.log('User ID:', userData.id);
      console.log('Email:', userData.email);
      console.log('Name:', userData.name);

      // Fetch location information if available
      let locationData = null;
      try {
        console.log('🏢 Fetching location information...');
        const locationResponse = await fetch('https://services.leadconnectorhq.com/locations', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Version': '2021-07-28'
          }
        });

        if (locationResponse.ok) {
          const locations = await locationResponse.json();
          locationData = locations.locations?.[0] || null;
          if (locationData) {
            console.log('✅ Location data retrieved');
            console.log('Location ID:', locationData.id);
            console.log('Location Name:', locationData.name);
          }
        }
      } catch (locationError) {
        console.log('ℹ️ Location data not available or not accessible');
      }

      // Store captured data globally for retrieval
      global.lastOAuthInstallation = {
        timestamp: new Date().toISOString(),
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          phone: userData.phone,
          company: userData.companyName
        },
        tokens: {
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresIn: tokens.expires_in,
          scopes: tokens.scope
        },
        location: locationData ? {
          id: locationData.id,
          name: locationData.name,
          businessType: locationData.businessType,
          address: locationData.address
        } : null
      };

      // Log captured OAuth data for testing
      console.log('💾 OAuth Account Data Captured Successfully:');
      console.log('=== USER INFORMATION ===');
      console.log('User ID:', userData.id);
      console.log('Email:', userData.email);
      console.log('Name:', userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim());
      console.log('Phone:', userData.phone);
      console.log('Company:', userData.companyName);
      
      console.log('=== TOKEN INFORMATION ===');
      console.log('Access Token:', tokens.access_token ? 'Present' : 'Missing');
      console.log('Refresh Token:', tokens.refresh_token ? 'Present' : 'Missing');
      console.log('Token Type:', tokens.token_type);
      console.log('Expires In:', tokens.expires_in, 'seconds');
      console.log('Scopes:', tokens.scope);
      
      console.log('=== LOCATION INFORMATION ===');
      if (locationData) {
        console.log('Location ID:', locationData.id);
        console.log('Location Name:', locationData.name);
        console.log('Business Type:', locationData.businessType);
        console.log('Address:', locationData.address);
      } else {
        console.log('No location data available');
      }

      // Redirect to success page with user info
      const successUrl = `https://dir.engageautomations.com/oauth-success.html?success=true&user=${encodeURIComponent(userData.name || userData.email)}&timestamp=${Date.now()}`;
      console.log('🎉 OAuth flow complete, redirecting to:', successUrl);
      
      res.redirect(successUrl);
      
    } catch (error) {
      console.error('Direct OAuth callback error:', error);
      res.redirect('/?error=callback_failed');
    }
  });

  console.log('Direct OAuth routes registered successfully');
}