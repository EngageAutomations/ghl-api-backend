import fetch from 'node-fetch';

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface RefreshTokenError {
  error: string;
  error_description?: string;
}

/**
 * Refresh GoHighLevel access token using refresh token
 */
export async function refreshGHLAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const tokenUrl = 'https://services.leadconnectorhq.com/oauth/token';
  
  const tokenData = {
    grant_type: 'refresh_token',
    client_id: process.env.GHL_CLIENT_ID!,
    client_secret: process.env.GHL_CLIENT_SECRET!,
    refresh_token: refreshToken,
  };

  console.log('🔄 Refreshing GoHighLevel access token...');
  
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenData),
    });

    if (!response.ok) {
      const errorData = await response.json() as RefreshTokenError;
      console.error('❌ Token refresh failed:', response.status, errorData);
      throw new Error(`Token refresh failed: ${errorData.error} - ${errorData.error_description}`);
    }

    const refreshResult = await response.json() as RefreshTokenResponse;
    console.log('✅ Token refresh successful');
    console.log('New token expires in:', refreshResult.expires_in, 'seconds');
    
    return refreshResult;
    
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    throw error;
  }
}

/**
 * Check if access token is expired or near expiry
 */
export function isTokenExpired(tokenExpiry: Date, bufferMinutes: number = 5): boolean {
  const now = new Date();
  const expiryWithBuffer = new Date(tokenExpiry.getTime() - (bufferMinutes * 60 * 1000));
  return now >= expiryWithBuffer;
}

/**
 * Refresh token and update user record in database
 */
export async function refreshUserToken(storage: any, userId: number): Promise<RefreshTokenResponse> {
  console.log(`🔄 Refreshing token for user ${userId}`);
  
  // Get user from database
  const user = await storage.getUserById(userId);
  if (!user || !user.ghlRefreshToken) {
    throw new Error('User not found or no refresh token available');
  }

  // Check if token actually needs refresh
  if (!isTokenExpired(new Date(user.ghlTokenExpiry))) {
    console.log('Token still valid, no refresh needed');
    return {
      access_token: user.ghlAccessToken,
      refresh_token: user.ghlRefreshToken,
      expires_in: Math.floor((new Date(user.ghlTokenExpiry).getTime() - Date.now()) / 1000),
      token_type: 'Bearer',
      scope: user.ghlScopes
    };
  }

  // Refresh the token
  const refreshResult = await refreshGHLAccessToken(user.ghlRefreshToken);
  
  // Update user record with new tokens
  const newExpiry = new Date(Date.now() + (refreshResult.expires_in * 1000));
  
  await storage.updateUserOAuthTokens(userId, {
    ghlAccessToken: refreshResult.access_token,
    ghlRefreshToken: refreshResult.refresh_token,
    ghlTokenExpiry: newExpiry,
    ghlScopes: refreshResult.scope,
  });

  console.log(`✅ Token refreshed and updated for user ${userId}`);
  return refreshResult;
}

/**
 * Get valid access token for user (refresh if needed)
 */
export async function getValidAccessToken(storage: any, userId: number): Promise<string> {
  const user = await storage.getUserById(userId);
  if (!user || !user.ghlAccessToken) {
    throw new Error('User not found or no access token available');
  }

  // Check if token needs refresh
  if (isTokenExpired(new Date(user.ghlTokenExpiry))) {
    console.log('Token expired, refreshing...');
    const refreshResult = await refreshUserToken(storage, userId);
    return refreshResult.access_token;
  }

  return user.ghlAccessToken;
}