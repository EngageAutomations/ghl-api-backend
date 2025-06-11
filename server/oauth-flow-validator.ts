import { storage } from './storage';
import { ghlOAuth } from './ghl-oauth';
import { TokenEncryption } from './token-encryption';

/**
 * Comprehensive OAuth flow validation service
 * Tests all aspects of the OAuth signup process
 */
export class OAuthFlowValidator {
  
  /**
   * Validate OAuth configuration and prerequisites
   */
  static async validateConfiguration(): Promise<{
    valid: boolean;
    issues: string[];
    config: any;
  }> {
    const issues: string[] = [];
    let config: any = {};

    // Check environment variables
    if (!process.env.GHL_CLIENT_ID) {
      issues.push('GHL_CLIENT_ID environment variable missing');
    } else {
      config.clientId = 'Present';
    }

    if (!process.env.GHL_CLIENT_SECRET) {
      issues.push('GHL_CLIENT_SECRET environment variable missing');
    } else {
      config.clientSecret = 'Present';
    }

    if (!process.env.GHL_REDIRECT_URI) {
      issues.push('GHL_REDIRECT_URI environment variable missing');
    } else {
      config.redirectUri = process.env.GHL_REDIRECT_URI;
    }

    // Test OAuth URL generation
    try {
      const state = TokenEncryption.generateState();
      const authUrl = ghlOAuth.getAuthorizationUrl(state, true);
      config.authUrlGeneration = 'Working';
      config.sampleAuthUrl = authUrl;
    } catch (error) {
      issues.push('OAuth URL generation failed');
      config.authUrlGeneration = 'Failed';
    }

    return {
      valid: issues.length === 0,
      issues,
      config
    };
  }

  /**
   * Validate database schema for OAuth fields
   */
  static async validateDatabaseSchema(): Promise<{
    valid: boolean;
    issues: string[];
    schema: any;
  }> {
    const issues: string[] = [];
    const schema: any = {};

    try {
      // Test OAuth user creation (with test data)
      const testUserData = {
        username: 'oauth_test_' + Date.now(),
        displayName: 'OAuth Test User',
        email: 'test@oauth.example.com',
        ghlUserId: 'test_ghl_' + Date.now(),
        ghlAccessToken: 'test_access_token',
        ghlRefreshToken: 'test_refresh_token',
        ghlTokenExpiry: new Date(Date.now() + 3600000),
        ghlScopes: 'contacts.read locations.read',
        ghlLocationId: 'test_location_123',
        ghlLocationName: 'Test Location',
        authType: 'oauth',
        isActive: true
      };

      // Test user creation
      const testUser = await storage.createOAuthUser(testUserData);
      schema.userCreation = 'Working';
      schema.userId = testUser.id;

      // Test user retrieval by GHL ID
      const retrievedUser = await storage.getUserByGhlId(testUserData.ghlUserId);
      if (retrievedUser) {
        schema.userRetrieval = 'Working';
      } else {
        issues.push('User retrieval by GHL ID failed');
      }

      // Test token update
      await storage.updateUserOAuthTokens(testUser.id, {
        accessToken: 'updated_access_token',
        refreshToken: 'updated_refresh_token',
        expiresAt: new Date(Date.now() + 7200000)
      });
      schema.tokenUpdate = 'Working';

      // Test OAuth users listing
      const oauthUsers = await storage.getOAuthUsers();
      schema.oauthUsersCount = oauthUsers.length;

      // Clean up test user (optional - you might want to keep for testing)
      // await storage.deleteUser(testUser.id);

    } catch (error) {
      issues.push(`Database schema validation failed: ${error}`);
      schema.error = String(error);
    }

    return {
      valid: issues.length === 0,
      issues,
      schema
    };
  }

  /**
   * Validate token encryption/decryption
   */
  static validateTokenEncryption(): {
    valid: boolean;
    issues: string[];
    encryption: any;
  } {
    const issues: string[] = [];
    const encryption: any = {};

    try {
      const testToken = 'test_oauth_token_' + Date.now();
      
      // Test encryption
      const encrypted = TokenEncryption.encrypt(testToken);
      encryption.encryptionWorking = encrypted !== testToken;
      
      // Test decryption
      const decrypted = TokenEncryption.decrypt(encrypted);
      encryption.decryptionWorking = decrypted === testToken;
      
      if (!encryption.encryptionWorking) {
        issues.push('Token encryption not working');
      }
      
      if (!encryption.decryptionWorking) {
        issues.push('Token decryption not working');
      }

      // Test state generation
      const state1 = TokenEncryption.generateState();
      const state2 = TokenEncryption.generateState();
      encryption.stateGeneration = state1 !== state2 && state1.length > 32;
      
      if (!encryption.stateGeneration) {
        issues.push('State generation not working properly');
      }

      // Test token expiry checking
      const futureDate = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const nearExpiry = new Date(Date.now() + 2 * 60 * 1000);  // 2 minutes
      
      encryption.expiryCheckFuture = !TokenEncryption.needsRefresh(futureDate);
      encryption.expiryCheckNear = TokenEncryption.needsRefresh(nearExpiry);
      
      if (!encryption.expiryCheckFuture || !encryption.expiryCheckNear) {
        issues.push('Token expiry checking not working correctly');
      }

    } catch (error) {
      issues.push(`Token encryption validation failed: ${error}`);
      encryption.error = String(error);
    }

    return {
      valid: issues.length === 0,
      issues,
      encryption
    };
  }

  /**
   * Run complete OAuth flow validation
   */
  static async runCompleteValidation(): Promise<{
    overall: boolean;
    results: {
      configuration: any;
      database: any;
      encryption: any;
    };
    summary: string[];
  }> {
    const results = {
      configuration: await this.validateConfiguration(),
      database: await this.validateDatabaseSchema(),
      encryption: this.validateTokenEncryption()
    };

    const summary: string[] = [];
    let overall = true;

    // Configuration summary
    if (results.configuration.valid) {
      summary.push('✓ OAuth configuration valid');
    } else {
      summary.push('✗ OAuth configuration issues found');
      overall = false;
    }

    // Database summary
    if (results.database.valid) {
      summary.push('✓ Database schema working correctly');
    } else {
      summary.push('✗ Database schema issues found');
      overall = false;
    }

    // Encryption summary
    if (results.encryption.valid) {
      summary.push('✓ Token encryption working correctly');
    } else {
      summary.push('✗ Token encryption issues found');
      overall = false;
    }

    if (overall) {
      summary.push('🎉 OAuth signup process fully functional');
    } else {
      summary.push('⚠️  OAuth signup process has issues that need attention');
    }

    return {
      overall,
      results,
      summary
    };
  }
}