import { Request, Response } from 'express';
import { GHL_OAUTH_CONFIG, GHLTokenResponseSchema, GHLUserInfoSchema } from './ghl-oauth';
import { storage } from './storage';
import jwt from 'jsonwebtoken';

// In-memory storage for OAuth installations
const oauthInstallations = new Map<string, any>();
const tokensByLocation = new Map<string, any>();

interface OAuthCallbackParams {
  code?: string;
  location_id?: string;
  user_id?: string;
  state?: string;
}

export async function handleOAuthCallback(req: Request, res: Response) {
  console.log('🔄 OAuth callback received:', {
    code: req.query.code ? '[PRESENT]' : '[MISSING]',
    location_id: req.query.location_id,
    user_id: req.query.user_id,
    state: req.query.state
  });

  const { code, location_id, user_id, state } = req.query as OAuthCallbackParams;

  if (!code) {
    console.error('❌ Missing authorization code');
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  // Check OAuth configuration
  if (!GHL_OAUTH_CONFIG.clientId || !GHL_OAUTH_CONFIG.clientSecret) {
    console.error('❌ OAuth credentials not configured');
    return res.status(500).json({ error: 'OAuth not configured' });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(GHL_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GHL_OAUTH_CONFIG.clientId,
        client_secret: GHL_OAUTH_CONFIG.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: GHL_OAUTH_CONFIG.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ Token exchange failed:', tokenResponse.status, errorText);
      return res.status(400).json({ error: 'OAuth token exchange failed', details: errorText });
    }

    const tokenData = await tokenResponse.json();
    const validatedTokens = GHLTokenResponseSchema.parse(tokenData);
    
    console.log('✅ Token exchange successful:', {
      access_token: validatedTokens.access_token ? '[RECEIVED]' : '[MISSING]',
      refresh_token: validatedTokens.refresh_token ? '[RECEIVED]' : '[MISSING]',
      expires_in: validatedTokens.expires_in
    });

    // Get user information
    const userResponse = await fetch(GHL_OAUTH_CONFIG.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${validatedTokens.access_token}`
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('❌ Failed to get user info:', userResponse.status, errorText);
      return res.status(400).json({ error: 'Failed to get user info', details: errorText });
    }

    const userData = await userResponse.json();
    const validatedUser = GHLUserInfoSchema.parse(userData);
    
    console.log('👤 User data received:', {
      id: validatedUser.id,
      email: validatedUser.email,
      name: validatedUser.name
    });

    // Store installation
    const installationId = `install_${Date.now()}`;
    const installation = {
      id: installationId,
      user_id: user_id || validatedUser.id,
      location_id: location_id,
      access_token: validatedTokens.access_token,
      refresh_token: validatedTokens.refresh_token,
      expires_at: Date.now() + (validatedTokens.expires_in * 1000),
      created_at: new Date().toISOString(),
      user_data: validatedUser,
      scopes: validatedTokens.scope
    };

    oauthInstallations.set(installationId, installation);
    
    // Store token by location for quick access
    if (location_id) {
      tokensByLocation.set(location_id, {
        installation_id: installationId,
        access_token: validatedTokens.access_token,
        refresh_token: validatedTokens.refresh_token,
        expires_at: installation.expires_at
      });
    }

    console.log('💾 Installation stored:', {
      id: installationId,
      location_id: location_id,
      expires_at: new Date(installation.expires_at).toISOString()
    });

    // Generate JWT for frontend authentication
    const jwtToken = jwt.sign(
      { 
        installation_id: installationId,
        location_id: location_id,
        user_id: validatedUser.id
      },
      process.env.JWT_SECRET || 'default-jwt-secret',
      { expiresIn: '7d' }
    );

    // Redirect to success page with installation ID and JWT
    const redirectUrl = `https://listings.engageautomations.com/?installation_id=${installationId}&location_id=${location_id}&jwt=${jwtToken}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth processing failed', details: error.message });
  }
}

export async function checkOAuthStatus(req: Request, res: Response) {
  const { installation_id } = req.query;
  
  if (!installation_id) {
    return res.json({ authenticated: false, error: 'Missing installation_id' });
  }

  const installation = oauthInstallations.get(installation_id as string);
  if (!installation) {
    return res.json({ authenticated: false, error: 'Installation not found' });
  }

  // Check if token is expired
  const isExpired = Date.now() > installation.expires_at;
  
  res.json({
    authenticated: !isExpired,
    installation_id: installation_id,
    location_id: installation.location_id,
    user_id: installation.user_id,
    expires_at: installation.expires_at,
    expired: isExpired,
    scopes: installation.scopes
  });
}

export function getInstallationToken(locationId: string): string | null {
  const tokenInfo = tokensByLocation.get(locationId);
  if (!tokenInfo) {
    return null;
  }

  // Check if token is expired
  if (Date.now() > tokenInfo.expires_at) {
    console.log('⚠️ Token expired for location:', locationId);
    return null;
  }

  return tokenInfo.access_token;
}

export function getAllInstallations() {
  return Array.from(oauthInstallations.values());
}

export { oauthInstallations, tokensByLocation };