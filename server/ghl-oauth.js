/**
 * GoHighLevel OAuth Configuration
 * Updated to match the correct OAuth URL and scopes
 */

const GHL_OAUTH_CONFIG = {
  baseUrl: 'https://marketplace.leadconnectorhq.com',
  clientId: process.env.GHL_CLIENT_ID || '68474924a586bce22a6e64f7-mbpkmyu4',
  clientSecret: process.env.GHL_CLIENT_SECRET || 'b5a7a120-7df7-4d23-8796-4863cbd08f94',
  redirectUri: 'https://dir.engageautomations.com/oauth/callback',
  scopes: 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write'
};

class GHLOAuth {
  constructor() {
    this.config = GHL_OAUTH_CONFIG;
  }

  /**
   * Generate OAuth authorization URL
   * @param {string} state - Random state parameter for security
   * @param {boolean} useCorrectParams - Use the corrected OAuth parameters
   * @returns {string} OAuth authorization URL
   */
  getAuthorizationUrl(state = null, useCorrectParams = true) {
    if (!state) {
      state = 'oauth_' + Math.random().toString(36).substring(2, 15);
    }

    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      client_id: this.config.clientId,
      scope: this.config.scopes
    });

    // Add state parameter if provided
    if (state) {
      params.append('state', state);
    }

    const authUrl = `${this.config.baseUrl}/oauth/chooselocation?${params.toString()}`;
    
    console.log('Generated OAuth URL:', authUrl);
    console.log('OAuth Configuration:', {
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      scopes: this.config.scopes,
      state: state
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for access tokens
   * @param {string} code - Authorization code from OAuth callback
   * @param {string} state - State parameter for validation
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForTokens(code, state) {
    const tokenUrl = 'https://services.leadconnectorhq.com/oauth/token';
    
    const tokenData = {
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: code,
      redirect_uri: this.config.redirectUri
    };

    console.log('Exchanging code for tokens:', {
      tokenUrl,
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
      code: code.substring(0, 10) + '...',
      state
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(tokenData).toString()
      });

      const responseText = await response.text();
      console.log('Token exchange response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      if (!response.ok) {
        console.error('Token exchange failed:', response.status, responseText);
        throw new Error(`Token exchange failed: ${response.status} ${responseText}`);
      }

      let tokens;
      try {
        tokens = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse token response as JSON:', parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      console.log('Token exchange successful:', {
        access_token: tokens.access_token ? 'received' : 'missing',
        refresh_token: tokens.refresh_token ? 'received' : 'missing',
        expires_in: tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope
      });

      return tokens;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Get user information using access token
   * @param {string} accessToken - Access token from OAuth flow
   * @returns {Promise<Object>} User information
   */
  async getUserInfo(accessToken) {
    const userInfoUrl = `${this.config.baseUrl.replace('marketplace.', 'services.')}/oauth/userinfo`;
    
    try {
      const response = await fetch(userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('User info request failed:', response.status, errorText);
        throw new Error(`User info request failed: ${response.status} ${errorText}`);
      }

      const userInfo = await response.json();
      console.log('User info retrieved:', {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || userInfo.firstName + ' ' + userInfo.lastName
      });

      return userInfo;
    } catch (error) {
      console.error('User info error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const ghlOAuth = new GHLOAuth();

module.exports = { ghlOAuth, GHLOAuth };