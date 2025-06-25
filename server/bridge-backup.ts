/**
 * Bridge Backup System
 * Emergency standalone bridge server for development protection
 */

import express from 'express';

export function createBackupBridge(): express.Application {
  const backupApp = express();
  
  backupApp.use(express.json());
  
  // Backup health endpoint
  backupApp.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'Backup Bridge Server',
      timestamp: new Date().toISOString(),
      mode: 'emergency'
    });
  });
  
  // Backup OAuth credentials endpoint
  backupApp.get('/api/bridge/oauth-credentials', (req, res) => {
    try {
      const credentials = {
        clientId: process.env.GHL_CLIENT_ID,
        clientSecret: process.env.GHL_CLIENT_SECRET,
        redirectBase: 'https://dir.engageautomations.com',
        scopes: 'contacts.readonly contacts.write locations.readonly products.write medias.write products.readonly medias.readonly products/prices.write products/prices.readonly',
        version: 'backup-1.0.0',
        emergency: true
      };
      
      if (!credentials.clientId || !credentials.clientSecret) {
        return res.status(500).json({ 
          error: 'OAuth credentials not configured',
          emergency: true 
        });
      }
      
      res.json(credentials);
    } catch (error) {
      console.error('Backup bridge error:', error);
      res.status(500).json({ 
        error: 'Backup bridge failure',
        emergency: true 
      });
    }
  });
  
  return backupApp;
}

/**
 * Start emergency backup bridge on different port
 */
export function startEmergencyBridge(): Promise<number> {
  return new Promise((resolve, reject) => {
    const backupApp = createBackupBridge();
    const emergencyPort = 3001;
    
    const server = backupApp.listen(emergencyPort, () => {
      console.log(`🚨 Emergency backup bridge started on port ${emergencyPort}`);
      console.log(`🔗 Backup bridge URL: http://localhost:${emergencyPort}/api/bridge/oauth-credentials`);
      resolve(emergencyPort);
    });
    
    server.on('error', (error) => {
      console.error('Emergency bridge failed to start:', error);
      reject(error);
    });
  });
}