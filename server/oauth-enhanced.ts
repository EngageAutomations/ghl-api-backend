/**
 * Enhanced OAuth Implementation with Dual-Domain Architecture
 * Implements Authorization Code with PKCE for maximum security
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface OAuthInstallation {
  id: number;
  ghlUserId: string;
  locationId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string;
  userInfo?: any;
  locationInfo?: any;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  user_id?: string;
}

export class EnhancedOAuthManager {
  private readonly ghlBaseUrl = 'https://services.leadconnectorhq.com';
  private readonly redirectUri: string;

  constructor() {
    this.redirectUri = process.env.GHL_REDIRECT_URI || 
      'https://oauth-backend-production-68c5.up.railway.app/api/oauth/callback';
  }

  /**
   * Generate OAuth authorization URL with PKCE
   */
  generateAuthorizationUrl(state?: string): { url: string; codeVerifier: string } {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = this.generateCodeChallenge(codeVerifier);
    const stateParam = state || crypto.randomBytes(16).toString('hex');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.GHL_CLIENT_ID!,
      redirect_uri: this.redirectUri,
      scope: this.getRequestedScopes(),
      state: stateParam,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return {
      url: `${this.ghlBaseUrl}/oauth/chooselocation?${params}`,
      codeVerifier
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string, 
    codeVerifier: string, 
    state?: string
  ): Promise<TokenResponse> {
    const tokenResponse = await fetch(`${this.ghlBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri,
        client_id: process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!,
        code_verifier: codeVerifier
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return await tokenResponse.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${this.ghlBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.GHL_CLIENT_ID!,
        client_secret: process.env.GHL_CLIENT_SECRET!
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Get user information from GoHighLevel
   */
  async getUserInfo(accessToken: string): Promise<any> {
    const response = await fetch(`${this.ghlBaseUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get location information from GoHighLevel
   */
  async getLocationInfo(accessToken: string, locationId: string): Promise<any> {
    const response = await fetch(`${this.ghlBaseUrl}/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get location info: ${response.statusText}`);
    }

    const result = await response.json();
    return result.location;
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  async ensureValidToken(installation: OAuthInstallation): Promise<OAuthInstallation> {
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer

    if (now.getTime() >= (installation.expiresAt.getTime() - expiryBuffer)) {
      console.log('Token expired, refreshing...');
      
      try {
        const tokenData = await this.refreshAccessToken(installation.refreshToken);
        
        // Update installation with new tokens
        const updatedInstallation = {
          ...installation,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || installation.refreshToken,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
        };

        // Store updated tokens in database
        await this.updateInstallationTokens(updatedInstallation);
        
        return updatedInstallation;
      } catch (error) {
        console.error('Token refresh failed:', error);
        throw new Error('Authentication expired. Please reconnect your account.');
      }
    }

    return installation;
  }

  /**
   * Generate session token for frontend authentication
   */
  generateSessionToken(installationId: number): string {
    return jwt.sign(
      { installationId, type: 'session' },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
  }

  /**
   * Verify session token
   */
  verifySessionToken(token: string): { installationId: number } | null {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (decoded.type === 'session' && decoded.installationId) {
        return { installationId: decoded.installationId };
      }
      return null;
    } catch {
      return null;
    }
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  private getRequestedScopes(): string {
    return [
      'products.write',
      'contacts.write', 
      'contacts.readonly',
      'locations.readonly',
      'opportunities.write',
      'workflows.readonly',
      'calendars.readonly',
      'forms.readonly',
      'media.write'
    ].join(' ');
  }

  private async updateInstallationTokens(installation: OAuthInstallation): Promise<void> {
    // Import database connection
    const { db } = await import('./db.js');
    
    const query = `
      UPDATE oauth_installations 
      SET ghl_access_token = $1, 
          ghl_refresh_token = $2, 
          ghl_expires_at = $3,
          last_token_refresh = NOW(),
          updated_at = NOW()
      WHERE id = $4
    `;

    await db.query(query, [
      installation.accessToken,
      installation.refreshToken,
      installation.expiresAt,
      installation.id
    ]);
  }
}

/**
 * OAuth callback handler with enhanced security
 */
export async function handleOAuthCallback(req: Request, res: Response): Promise<void> {
  try {
    const { code, state, location_id } = req.query;
    
    if (!code || !state) {
      res.status(400).json({ error: 'Missing authorization code or state parameter' });
      return;
    }

    // Retrieve code verifier from session/state store
    // In production, you'd store this in Redis or similar
    const codeVerifier = req.session?.codeVerifier;
    if (!codeVerifier) {
      res.status(400).json({ error: 'Invalid session state' });
      return;
    }

    const oauthManager = new EnhancedOAuthManager();
    
    // Exchange code for tokens
    const tokens = await oauthManager.exchangeCodeForTokens(
      code as string,
      codeVerifier,
      state as string
    );

    // Get user and location information
    const [userInfo, locationInfo] = await Promise.all([
      oauthManager.getUserInfo(tokens.access_token),
      location_id 
        ? oauthManager.getLocationInfo(tokens.access_token, location_id as string)
        : null
    ]);

    // Store installation in database
    const installation = await storeInstallation({
      ghlUserId: userInfo.id,
      locationId: location_id as string || userInfo.locationId,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scopes: tokens.scope,
      userInfo,
      locationInfo
    });

    // Generate session token
    const sessionToken = oauthManager.generateSessionToken(installation.id);

    // Set secure session cookie
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Required for iframe embedding
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Redirect to frontend success page
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://listings.engageautomations.com'
      : 'http://localhost:5173';
    
    res.redirect(`${frontendUrl}/oauth-success?userId=${userInfo.id}&locationId=${location_id}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
}

/**
 * Store OAuth installation in database
 */
async function storeInstallation(data: Partial<OAuthInstallation>): Promise<OAuthInstallation> {
  const { db } = await import('./db.js');
  
  const query = `
    INSERT INTO oauth_installations (
      ghl_user_id, ghl_location_id, ghl_access_token, ghl_refresh_token,
      ghl_expires_at, ghl_scopes, user_info, location_info
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (ghl_user_id, ghl_location_id) 
    DO UPDATE SET
      ghl_access_token = EXCLUDED.ghl_access_token,
      ghl_refresh_token = EXCLUDED.ghl_refresh_token,
      ghl_expires_at = EXCLUDED.ghl_expires_at,
      ghl_scopes = EXCLUDED.ghl_scopes,
      user_info = EXCLUDED.user_info,
      location_info = EXCLUDED.location_info,
      updated_at = NOW()
    RETURNING *
  `;

  const result = await db.query(query, [
    data.ghlUserId,
    data.locationId,
    data.accessToken,
    data.refreshToken,
    data.expiresAt,
    data.scopes,
    JSON.stringify(data.userInfo),
    JSON.stringify(data.locationInfo)
  ]);

  return result.rows[0];
}