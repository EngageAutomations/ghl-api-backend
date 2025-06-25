/**
 * Bridge Protection System
 * Ensures bridge endpoints remain functional during development
 */

import { Application } from 'express';

export class BridgeProtection {
  private static bridgeHealthy = false;
  private static lastHealthCheck = 0;
  
  /**
   * Validates bridge is properly configured and functional
   */
  static validateBridge(app: Application): boolean {
    try {
      // Check if bridge endpoints are registered
      const routes = app._router?.stack || [];
      const hasBridgeRoutes = routes.some((layer: any) => {
        const route = layer.route;
        return route && (
          route.path === '/health' || 
          route.path === '/api/bridge/oauth-credentials'
        );
      });
      
      if (!hasBridgeRoutes) {
        console.error('🚨 BRIDGE VALIDATION FAILED: Bridge endpoints not found');
        return false;
      }
      
      // Check OAuth credentials are available
      const clientId = process.env.GHL_CLIENT_ID;
      const clientSecret = process.env.GHL_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        console.error('🚨 BRIDGE VALIDATION FAILED: OAuth credentials missing');
        return false;
      }
      
      console.log('✅ Bridge validation passed');
      this.bridgeHealthy = true;
      this.lastHealthCheck = Date.now();
      return true;
      
    } catch (error) {
      console.error('🚨 BRIDGE VALIDATION ERROR:', error);
      this.bridgeHealthy = false;
      return false;
    }
  }
  
  /**
   * Monitors bridge health continuously
   */
  static startHealthMonitoring(app: Application) {
    // Initial validation
    this.validateBridge(app);
    
    // Periodic health checks every 5 minutes
    setInterval(() => {
      this.validateBridge(app);
    }, 5 * 60 * 1000);
    
    console.log('🛡️ Bridge health monitoring started');
  }
  
  /**
   * Emergency bridge recovery
   */
  static emergencyRecovery(app: Application): boolean {
    console.log('🚨 Attempting bridge emergency recovery...');
    
    try {
      // Re-import and setup bridge endpoints
      const { setupBridgeEndpoints } = require('./bridge-integration');
      setupBridgeEndpoints(app);
      
      // Validate recovery
      if (this.validateBridge(app)) {
        console.log('✅ Bridge emergency recovery successful');
        return true;
      } else {
        console.error('❌ Bridge emergency recovery failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Bridge emergency recovery error:', error);
      return false;
    }
  }
  
  /**
   * Get current bridge status
   */
  static getStatus() {
    return {
      healthy: this.bridgeHealthy,
      lastCheck: this.lastHealthCheck,
      timeSinceCheck: Date.now() - this.lastHealthCheck
    };
  }
}

/**
 * Critical bridge endpoint validator middleware
 */
export function validateBridgeEndpoints(req: any, res: any, next: any) {
  // Only validate bridge-related requests
  if (req.path === '/health' || req.path.startsWith('/api/bridge/')) {
    const status = BridgeProtection.getStatus();
    
    if (!status.healthy || status.timeSinceCheck > 10 * 60 * 1000) {
      console.warn('⚠️ Bridge health check required');
      BridgeProtection.validateBridge(req.app);
    }
  }
  
  next();
}