/**
 * Railway-Replit Bridge Endpoints
 * Provides OAuth credentials and processing for Railway backend
 */

import { Request, Response } from 'express';

export class RailwayBridge {
  /**
   * OAuth Credentials Endpoint for Railway Backend Initialization
   * GET /api/bridge/oauth-credentials
   */
  static getOAuthCredentials(req: Request, res: Response) {
    try {
      const credentials = {
        client_id: '68474924a586bce22a6e64f7-mbpkmyu4',
        client_secret: process.env.GHL_CLIENT_SECRET || '',
        redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback',
        bridge_source: 'replit',
        timestamp: Date.now()
      };

      if (!credentials.client_secret) {
        return res.status(500).json({
          error: 'OAuth credentials not available',
          bridge_source: 'replit'
        });
      }

      res.json({
        success: true,
        credentials,
        message: 'OAuth credentials provided by Replit bridge'
      });

    } catch (error) {
      res.status(500).json({
        error: 'Bridge endpoint error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * OAuth Authorization Code Processing Endpoint
   * POST /api/bridge/process-oauth
   */
  static async processOAuthCode(req: Request, res: Response) {
    try {
      const { code, location_id, user_id } = req.body;

      if (!code) {
        return res.status(400).json({
          error: 'Authorization code required',
          bridge_source: 'replit'
        });
      }

      // OAuth token exchange
      const tokenData = await RailwayBridge.exchangeOAuthToken(code);
      
      if (!tokenData.success) {
        return res.status(400).json({
          error: 'OAuth token exchange failed',
          details: tokenData.error,
          bridge_source: 'replit'
        });
      }

      // Store installation data
      const installationId = `install_${Date.now()}`;
      const installationData = {
        id: installationId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        location_id: tokenData.location_id || location_id,
        user_id: tokenData.user_id || user_id,
        expires_at: Date.now() + (tokenData.expires_in * 1000),
        created_at: new Date().toISOString(),
        bridge_source: 'replit'
      };

      res.json({
        success: true,
        installation: installationData,
        message: 'OAuth processed by Replit bridge',
        redirect_url: `https://listings.engageautomations.com/?installation_id=${installationId}`
      });

    } catch (error) {
      res.status(500).json({
        error: 'OAuth processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        bridge_source: 'replit'
      });
    }
  }

  /**
   * OAuth Token Exchange with GoHighLevel
   */
  private static async exchangeOAuthToken(code: string) {
    try {
      const tokenUrl = 'https://services.leadconnectorhq.com/oauth/token';
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: '68474924a586bce22a6e64f7-mbpkmyu4',
          client_secret: process.env.GHL_CLIENT_SECRET || '',
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: 'https://dir.engageautomations.com/api/oauth/callback'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Token exchange failed: ${response.status} - ${errorText}`
        };
      }

      const tokenData = await response.json();
      return {
        success: true,
        ...tokenData
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token exchange error'
      };
    }
  }

  /**
   * Installation Status Check for Railway
   * GET /api/bridge/installation/:id
   */
  static getInstallationStatus(req: Request, res: Response) {
    const { id } = req.params;
    
    // In production, this would query actual storage
    // For now, return bridge-ready status
    res.json({
      installation_id: id,
      status: 'bridge_ready',
      bridge_source: 'replit',
      message: 'Installation data available through bridge'
    });
  }
}

/**
 * Railway Bridge Routes Configuration
 */
export const bridgeRoutes = [
  {
    method: 'GET',
    path: '/api/bridge/oauth-credentials',
    handler: RailwayBridge.getOAuthCredentials
  },
  {
    method: 'POST', 
    path: '/api/bridge/process-oauth',
    handler: RailwayBridge.processOAuthCode
  },
  {
    method: 'GET',
    path: '/api/bridge/installation/:id',
    handler: RailwayBridge.getInstallationStatus
  }
];