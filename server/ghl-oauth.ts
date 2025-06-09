import { z } from 'zod';

// GoHighLevel OAuth Configuration
export const GHL_OAUTH_CONFIG = {
  // Standard flow
  authUrl: 'https://marketplace.gohighlevel.com/oauth/chooselocation',
  // White-labeled flow (if needed)
  whitelabelAuthUrl: 'https://marketplace.leadconnectorhq.com/oauth/chooselocation',
  tokenUrl: 'https://rest.gohighlevel.com/v1/oauth/token',
  userInfoUrl: 'https://rest.gohighlevel.com/v1/users/me',
  apiBaseUrl: 'https://rest.gohighlevel.com/v1',
};

// OAuth Token Response Schema
export const GHLTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string().default('Bearer'),
  expires_in: z.number(),
  scope: z.string(),
});

export type GHLTokenResponse = z.infer<typeof GHLTokenResponseSchema>;

// User Info Response Schema
export const GHLUserInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  permissions: z.record(z.any()).optional(),
  roles: z.array(z.string()).optional(),
});

export type GHLUserInfo = z.infer<typeof GHLUserInfoSchema>;

// Location Info Schema
export const GHLLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  website: z.string().optional(),
  timezone: z.string().optional(),
});

export type GHLLocation = z.infer<typeof GHLLocationSchema>;

export class GoHighLevelOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];

  constructor() {
    this.clientId = process.env.GHL_CLIENT_ID || '';
    this.clientSecret = process.env.GHL_CLIENT_SECRET || '';
    this.redirectUri = process.env.GHL_REDIRECT_URI || '';
    this.scopes = (process.env.GHL_SCOPES || '').split(' ').filter(Boolean);

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn('GHL OAuth credentials not fully configured');
    }
  }

  /**
   * Generate the authorization URL for GoHighLevel OAuth
   */
  getAuthorizationUrl(state?: string, useWhiteLabel = false): string {
    const baseUrl = useWhiteLabel 
      ? GHL_OAUTH_CONFIG.whitelabelAuthUrl 
      : GHL_OAUTH_CONFIG.authUrl;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
    });

    if (state) {
      params.append('state', state);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(code: string): Promise<GHLTokenResponse> {
    const response = await fetch(GHL_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return GHLTokenResponseSchema.parse(data);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<GHLTokenResponse> {
    const response = await fetch(GHL_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return GHLTokenResponseSchema.parse(data);
  }

  /**
   * Get user information using access token
   */
  async getUserInfo(accessToken: string): Promise<GHLUserInfo> {
    const response = await fetch(GHL_OAUTH_CONFIG.userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get user info: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return GHLUserInfoSchema.parse(data);
  }

  /**
   * Get location information using access token
   */
  async getLocation(accessToken: string, locationId: string): Promise<GHLLocation> {
    const response = await fetch(`${GHL_OAUTH_CONFIG.apiBaseUrl}/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get location info: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return GHLLocationSchema.parse(data.location);
  }

  /**
   * Make authenticated API request to GoHighLevel
   */
  async makeAPIRequest(accessToken: string, endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${GHL_OAUTH_CONFIG.apiBaseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check rate limiting headers
    const rateHeaders = {
      dailyLimit: response.headers.get('X-RateLimit-Limit-Daily'),
      dailyRemaining: response.headers.get('X-RateLimit-Daily-Remaining'),
      intervalMs: response.headers.get('X-RateLimit-Interval-Milliseconds'),
      maxRequests: response.headers.get('X-RateLimit-Max'),
      remaining: response.headers.get('X-RateLimit-Remaining'),
    };

    console.log('GHL Rate Limit Info:', rateHeaders);

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle token expiry
      if (response.status === 401) {
        throw new Error('INVALID_TOKEN');
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }

      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  /**
   * Validate if token is still valid
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke access token
   */
  async revokeToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${GHL_OAUTH_CONFIG.apiBaseUrl}/oauth/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error revoking token:', error);
      return false;
    }
  }
}

export const ghlOAuth = new GoHighLevelOAuth();