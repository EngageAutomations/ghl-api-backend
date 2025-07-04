/**
 * Location Token Converter Service
 * Converts Company-level OAuth tokens to Location-level tokens for media upload
 * 
 * BREAKTHROUGH SOLUTION:
 * - GoHighLevel API endpoint: /oauth/locationToken converts Company → Location tokens
 * - Company tokens from marketplace app have authClass: "Company" (IAM restricted)
 * - Location tokens have authClass: "Location" (full media upload access)
 * - Automatic conversion with caching for performance
 */

interface TokenConversionCache {
  locationToken: string;
  expiresAt: number;
  companyTokenHash: string; // Track which company token was used
}

interface OAuthInstallation {
  id: string;
  accessToken: string;
  refreshToken: string;
  locationId: string;
  tokenStatus: string;
}

interface LocationTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  authClass: string; // Should be "Location"
}

class LocationTokenConverter {
  private conversionCache = new Map<string, TokenConversionCache>();
  private oauthBackendUrl: string;

  constructor(oauthBackendUrl: string = 'https://dir.engageautomations.com') {
    this.oauthBackendUrl = oauthBackendUrl;
  }

  /**
   * Get Location token for media upload operations
   * Automatically converts Company token to Location token if needed
   */
  async getLocationToken(installationId: string): Promise<string | null> {
    try {
      console.log(`[LOCATION TOKEN] Getting Location token for installation: ${installationId}`);
      
      // Get current Company token from OAuth backend
      const installation = await this.getInstallation(installationId);
      if (!installation) {
        console.error('[LOCATION TOKEN] No installation found');
        return null;
      }

      const companyToken = installation.accessToken;
      const companyTokenHash = this.hashToken(companyToken);
      
      // Check cache for existing Location token
      const cached = this.conversionCache.get(installationId);
      if (cached && 
          cached.companyTokenHash === companyTokenHash && 
          cached.expiresAt > Date.now() + 300000) { // 5-minute buffer
        console.log('[LOCATION TOKEN] Using cached Location token');
        return cached.locationToken;
      }

      // Convert Company token to Location token
      console.log('[LOCATION TOKEN] Converting Company token to Location token...');
      const locationToken = await this.convertToLocationToken(
        companyToken,
        installation.locationId
      );

      if (locationToken) {
        // Cache the Location token
        this.conversionCache.set(installationId, {
          locationToken: locationToken.access_token,
          expiresAt: Date.now() + (locationToken.expires_in * 1000),
          companyTokenHash
        });

        console.log(`[LOCATION TOKEN] ✅ Successfully converted to Location token (authClass: ${locationToken.authClass})`);
        return locationToken.access_token;
      }

      console.error('[LOCATION TOKEN] Failed to convert Company token to Location token');
      return null;

    } catch (error) {
      console.error('[LOCATION TOKEN] Conversion error:', error.message);
      return null;
    }
  }

  /**
   * Convert Company token to Location token using GoHighLevel API
   */
  private async convertToLocationToken(
    companyToken: string, 
    locationId: string
  ): Promise<LocationTokenResponse | null> {
    try {
      const response = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${companyToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          locationId: locationId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[LOCATION TOKEN] Conversion failed:', response.status, errorText);
        return null;
      }

      const tokenData = await response.json() as LocationTokenResponse;
      console.log('[LOCATION TOKEN] Conversion response:', {
        authClass: tokenData.authClass,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope
      });

      return tokenData;

    } catch (error) {
      console.error('[LOCATION TOKEN] API error during conversion:', error.message);
      return null;
    }
  }

  /**
   * Get installation data from OAuth backend
   */
  private async getInstallation(installationId: string): Promise<OAuthInstallation | null> {
    try {
      const response = await fetch(`${this.oauthBackendUrl}/api/token-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ installation_id: installationId })
      });

      if (!response.ok) {
        console.error('[LOCATION TOKEN] Failed to get installation:', response.status);
        return null;
      }

      const data = await response.json();
      if (!data.success || !data.accessToken) {
        console.error('[LOCATION TOKEN] Invalid installation response:', data);
        return null;
      }

      return {
        id: installationId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || '',
        locationId: data.locationId || '',
        tokenStatus: 'valid'
      };

    } catch (error) {
      console.error('[LOCATION TOKEN] Error fetching installation:', error.message);
      return null;
    }
  }

  /**
   * Create a simple hash of the token for cache comparison
   */
  private hashToken(token: string): string {
    // Simple hash for cache key comparison
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Clear cached tokens for an installation
   */
  clearCache(installationId: string): void {
    this.conversionCache.delete(installationId);
    console.log(`[LOCATION TOKEN] Cache cleared for installation: ${installationId}`);
  }

  /**
   * Check if Location token is available for installation
   */
  async hasLocationToken(installationId: string): Promise<boolean> {
    const locationToken = await this.getLocationToken(installationId);
    return !!locationToken;
  }
}

// Export singleton instance
export const locationTokenConverter = new LocationTokenConverter();
export { LocationTokenConverter };
export type { LocationTokenResponse, OAuthInstallation };