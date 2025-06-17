import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  try {
    // Check for session token in cookies
    const sessionToken = req.cookies?.session_token;
    
    if (!sessionToken) {
      return res.status(401).json({ 
        success: false,
        error: 'No session found',
        needsAuth: true
      });
    }

    // Verify JWT session token
    const decoded = jwt.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    // Get OAuth installation from database
    const installation = await storage.getOAuthInstallation(decoded.ghlUserId);
    
    if (!installation) {
      return res.status(401).json({ 
        success: false,
        error: 'Installation not found',
        needsAuth: true
      });
    }

    // Return user information
    return res.json({
      success: true,
      user: {
        id: installation.id,
        ghlUserId: installation.ghlUserId,
        name: installation.ghlUserName,
        email: installation.ghlUserEmail,
        locationId: installation.ghlLocationId,
        locationName: installation.ghlLocationName,
        scopes: installation.ghlScopes?.split(' ') || [],
        isAuthenticated: true,
        authType: 'oauth'
      }
    });

  } catch (error) {
    console.error('Current user error:', error);
    return res.status(401).json({ 
      success: false,
      error: 'Invalid session',
      needsAuth: true
    });
  }
}

export async function logoutUser(req: Request, res: Response) {
  try {
    // Clear session cookies
    res.clearCookie('session_token');
    res.clearCookie('user_info');
    
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}