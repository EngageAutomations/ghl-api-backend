/**
 * Replit Serverless Function for GoHighLevel OAuth Callback
 * This bypasses the static file serving issue by using Replit's native serverless routing
 */

export default async function handler(req, res) {
  console.log('=== SERVERLESS OAUTH CALLBACK ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  // Handle CORS for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code, state, error, action } = req.query;

  // Handle OAuth error from GoHighLevel
  if (error) {
    console.error('OAuth error from GoHighLevel:', error);
    const errorMsg = encodeURIComponent(`OAuth error: ${error}`);
    return res.redirect(302, `https://dir.engageautomations.com/oauth-error?error=${errorMsg}`);
  }

  // Handle URL generation requests
  if (action === 'generate-url') {
    try {
      const authUrl = generateOAuthUrl(state);
      return res.status(200).json({ 
        success: true, 
        authUrl,
        message: 'OAuth URL generated successfully'
      });
    } catch (error) {
      console.error('Error generating OAuth URL:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to generate OAuth URL' 
      });
    }
  }

  // Handle test endpoint
  if (!code && !error) {
    console.log('Test endpoint accessed');
    return res.status(200).send('Serverless OAuth callback working!');
  }

  // Handle OAuth token exchange
  if (code) {
    try {
      console.log('=== STARTING SERVERLESS TOKEN EXCHANGE ===');
      console.log('Code (first 20 chars):', String(code).substring(0, 20));
      console.log('State:', state);

      const tokenData = await exchangeCodeForTokens(String(code), String(state));

      console.log('=== TOKEN EXCHANGE RESULT ===');
      console.log('Token data received:', tokenData ? 'YES' : 'NO');
      
      if (tokenData && tokenData.access_token) {
        console.log('✅ OAuth tokens received successfully');
        
        // Store token in cookie
        res.setHeader('Set-Cookie', [
          `oauth_token=${tokenData.access_token}; HttpOnly; Secure; Max-Age=${7 * 24 * 60 * 60}; Path=/`,
          `oauth_refresh_token=${tokenData.refresh_token || ''}; HttpOnly; Secure; Max-Age=${30 * 24 * 60 * 60}; Path=/`
        ]);
        
        // Redirect to success page
        const successUrl = `https://dir.engageautomations.com/?success=oauth-complete&timestamp=${Date.now()}`;
        console.log('Redirecting to success page:', successUrl);
        return res.redirect(302, successUrl);
        
      } else {
        console.error('❌ No access token received from GoHighLevel');
        throw new Error('No access token received from GoHighLevel');
      }
      
    } catch (error) {
      console.error('=== SERVERLESS OAUTH TOKEN EXCHANGE FAILED ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      const errorMsg = encodeURIComponent('Token exchange failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      const redirectUrl = `https://dir.engageautomations.com/oauth-error?error=callback_failed&details=${errorMsg}`;
      console.log('Redirecting to error page:', redirectUrl);
      return res.redirect(302, redirectUrl);
    }
  }

  // Fallback response
  return res.status(400).json({ 
    success: false, 
    error: 'Invalid request parameters' 
  });
}

/**
 * Generate OAuth authorization URL
 */
function generateOAuthUrl(state) {
  const clientId = process.env.GHL_CLIENT_ID;
  const redirectUri = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';
  const scopes = 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write';
  
  if (!clientId) {
    throw new Error('GHL_CLIENT_ID not configured');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
  });

  if (state) {
    params.append('state', state);
  }

  return `https://marketplace.leadconnectorhq.com/oauth/chooselocation?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForTokens(code, state) {
  const clientId = process.env.GHL_CLIENT_ID;
  const clientSecret = process.env.GHL_CLIENT_SECRET;
  const redirectUri = process.env.GHL_REDIRECT_URI || 'https://dir.engageautomations.com/api/oauth/callback';
  
  if (!clientId || !clientSecret) {
    throw new Error('OAuth credentials not configured');
  }

  console.log('=== TOKEN EXCHANGE REQUEST ===');
  console.log('URL: https://services.leadconnectorhq.com/oauth/token');
  console.log('Client ID:', clientId ? 'present' : 'missing');
  console.log('Client Secret:', clientSecret ? 'present' : 'missing');
  console.log('Redirect URI:', redirectUri);
  console.log('Code length:', code.length);
  
  const requestBody = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });
  
  console.log('Request body params:', Object.fromEntries(requestBody.entries()));
  
  const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: requestBody.toString(),
  });
  
  console.log('=== TOKEN RESPONSE ===');
  console.log('Status:', response.status, response.statusText);
  console.log('Headers:', Object.fromEntries(response.headers.entries()));
  
  const responseText = await response.text();
  console.log('Response body:', responseText);
  
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${responseText}`);
  }
  
  try {
    const tokenData = JSON.parse(responseText);
    console.log('Parsed token data:', {
      access_token: tokenData.access_token ? 'present' : 'missing',
      refresh_token: tokenData.refresh_token ? 'present' : 'missing',
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    });
    
    return tokenData;
  } catch (parseError) {
    console.error('Failed to parse token response:', parseError);
    throw new Error(`Invalid JSON response: ${responseText}`);
  }
}