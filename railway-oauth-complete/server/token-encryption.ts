import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

export class TokenEncryption {
  /**
   * Encrypt sensitive token data before storing in database
   */
  static encrypt(text: string): string {
    if (!text) return text;
    
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Combine IV and encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Token encryption failed:', error);
      return text; // Fallback to unencrypted in case of error
    }
  }

  /**
   * Decrypt token data when retrieving from database
   */
  static decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText; // Return as-is if not encrypted format
    }
    
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Token decryption failed:', error);
      return encryptedText; // Return encrypted text if decryption fails
    }
  }

  /**
   * Check if a token needs refresh based on expiry time
   */
  static needsRefresh(expiryDate: Date | null): boolean {
    if (!expiryDate) return true;
    
    // Refresh if token expires within 5 minutes
    const refreshBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
    const now = new Date().getTime();
    const expiry = new Date(expiryDate).getTime();
    
    return (expiry - now) <= refreshBuffer;
  }

  /**
   * Generate secure random state for OAuth flow
   */
  static generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}