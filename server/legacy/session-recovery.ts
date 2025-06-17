import { Request, Response } from 'express';
import { storage } from './storage';

interface SessionRecoveryRequest extends Request {
  query: {
    ghl_user_id?: string;
    ghl_location_id?: string;
    installation_id?: string;
    embedded?: string;
  };
}

/**
 * Session Recovery for GoHighLevel CRM Tab Access
 * Handles scenarios where cookies are cleared or different devices are used
 */
export async function recoverSession(req: SessionRecoveryRequest, res: Response) {
  try {
    const { ghl_user_id, ghl_location_id, installation_id, embedded } = req.query;
    
    console.log('Session recovery requested:', {
      ghlUserId: ghl_user_id,
      ghlLocationId: ghl_location_id,
      installationId: installation_id,
      isEmbedded: embedded === 'true'
    });

    // Method 1: Recovery by GoHighLevel User ID (most reliable)
    if (ghl_user_id) {
      const installation = await storage.getOAuthInstallation(ghl_user_id);
      
      if (installation && installation.isActive) {
        return await createSessionFromInstallation(installation, res, true);
      }
    }

    // Method 2: Recovery by Location ID (fallback)
    if (ghl_location_id && !ghl_user_id) {
      const installations = await storage.getAllOAuthInstallations();
      const locationInstallation = installations.find(
        inst => inst.ghlLocationId === ghl_location_id && inst.isActive
      );
      
      if (locationInstallation) {
        return await createSessionFromInstallation(locationInstallation, res, true);
      }
    }

    // Method 3: Recovery by Installation ID (development/testing)
    if (installation_id) {
      const installations = await storage.getAllOAuthInstallations();
      const installation = installations.find(
        inst => inst.id.toString() === installation_id && inst.isActive
      );
      
      if (installation) {
        return await createSessionFromInstallation(installation, res, true);
      }
    }

    // No valid installation found
    return res.status(404).json({
      success: false,
      error: 'No active installation found',
      needsReinstall: true,
      message: 'Please reinstall the app from the GoHighLevel Marketplace'
    });

  } catch (error) {
    console.error('Session recovery error:', error);
    return res.status(500).json({
      success: false,
      error: 'Session recovery failed',
      needsReinstall: true
    });
  }
}

/**
 * Create session from existing OAuth installation
 */
async function createSessionFromInstallation(installation: any, res: Response, isRecovery: boolean = false) {
  try {
    const jwt = await import('jsonwebtoken');
    
    // Create new session token
    const sessionToken = jwt.default.sign(
      {
        userId: installation.id,
        ghlUserId: installation.ghlUserId,
        locationId: installation.ghlLocationId,
        email: installation.ghlUserEmail,
        name: installation.ghlUserName,
        recovered: isRecovery,
        timestamp: Date.now()
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Set session cookies
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'none' // Required for iframe embedding
    });

    res.cookie('user_info', JSON.stringify({
      name: installation.ghlUserName,
      email: installation.ghlUserEmail,
      locationId: installation.ghlLocationId,
      locationName: installation.ghlLocationName,
      recovered: isRecovery
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none'
    });

    return res.json({
      success: true,
      message: isRecovery ? 'Session recovered successfully' : 'Session created',
      user: {
        id: installation.id,
        ghlUserId: installation.ghlUserId,
        name: installation.ghlUserName,
        email: installation.ghlUserEmail,
        locationId: installation.ghlLocationId,
        locationName: installation.ghlLocationName,
        isAuthenticated: true,
        authType: 'oauth',
        recovered: isRecovery
      },
      redirectTo: '/api-management'
    });

  } catch (error) {
    console.error('Session creation error:', error);
    throw error;
  }
}

/**
 * Check session status for embedded CRM tab
 */
export async function checkEmbeddedSession(req: Request, res: Response) {
  try {
    // Check existing session first
    const sessionToken = req.cookies?.session_token;
    
    if (sessionToken) {
      const jwt = await import('jsonwebtoken');
      try {
        const decoded = jwt.default.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        const installation = await storage.getOAuthInstallation(decoded.ghlUserId);
        
        if (installation && installation.isActive) {
          return res.json({
            success: true,
            authenticated: true,
            user: {
              name: installation.ghlUserName,
              email: installation.ghlUserEmail,
              locationId: installation.ghlLocationId,
              locationName: installation.ghlLocationName
            }
          });
        }
      } catch (jwtError) {
        console.log('Invalid session token, will attempt recovery');
      }
    }

    // No valid session, check for recovery parameters
    const { ghl_user_id, ghl_location_id } = req.query;
    
    return res.json({
      success: false,
      authenticated: false,
      canRecover: !!(ghl_user_id || ghl_location_id),
      recoveryParams: {
        ghlUserId: ghl_user_id,
        ghlLocationId: ghl_location_id
      }
    });

  } catch (error) {
    console.error('Session check error:', error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      error: 'Session check failed'
    });
  }
}