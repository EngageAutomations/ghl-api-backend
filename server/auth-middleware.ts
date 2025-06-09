import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { ghlOAuth } from './ghl-oauth';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: any;
  sessionToken?: string;
}

export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check for session token in cookies or Authorization header
    const sessionToken = req.cookies?.session_token || 
                        req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({ error: 'No session token provided' });
    }

    // Verify JWT session token
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // Get user and OAuth session from database
    const user = await storage.getUserById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    // If OAuth user, validate GHL token
    if (user.authType === 'oauth') {
      // Check if GHL token is expired
      if (user.ghlTokenExpiry && new Date() > user.ghlTokenExpiry) {
        // Try to refresh token
        if (user.ghlRefreshToken) {
          try {
            const refreshedTokens = await ghlOAuth.refreshAccessToken(user.ghlRefreshToken);
            
            // Update user with new tokens
            await storage.updateUserOAuthTokens(user.id, {
              accessToken: refreshedTokens.access_token,
              refreshToken: refreshedTokens.refresh_token,
              expiresIn: refreshedTokens.expires_in,
            });
            
            // Update user object for this request
            user.ghlAccessToken = refreshedTokens.access_token;
            user.ghlTokenExpiry = new Date(Date.now() + refreshedTokens.expires_in * 1000);
          } catch (refreshError) {
            return res.status(401).json({ error: 'Token refresh failed', needsReauth: true });
          }
        } else {
          return res.status(401).json({ error: 'Token expired', needsReauth: true });
        }
      }

      // Validate current GHL token
      if (user.ghlAccessToken) {
        const isValid = await ghlOAuth.validateToken(user.ghlAccessToken);
        if (!isValid) {
          return res.status(401).json({ error: 'Invalid GHL token', needsReauth: true });
        }
      }
    }

    // Add user to request object
    req.user = user;
    req.sessionToken = sessionToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

export function requireOAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.authType !== 'oauth') {
    return res.status(401).json({ error: 'OAuth authentication required' });
  }
  next();
}

export function requireValidGHLToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user?.ghlAccessToken) {
    return res.status(401).json({ error: 'Valid GHL access token required' });
  }
  next();
}