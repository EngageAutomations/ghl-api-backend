import { Request, Response, NextFunction } from 'express';

// Environment-based access control
export function privateDeploymentGuard(req: Request, res: Response, next: NextFunction) {
  // Allow access in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Check for deployment access key
  const deploymentKey = process.env.DEPLOYMENT_ACCESS_KEY;
  if (!deploymentKey) {
    return next(); // No restriction if key not set
  }

  // Check access key in header or query parameter
  const providedKey = req.headers['x-access-key'] || req.query.access_key;
  
  if (providedKey !== deploymentKey) {
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'This is a private deployment'
    });
  }

  next();
}

// IP whitelist middleware
export function ipWhitelist(req: Request, res: Response, next: NextFunction) {
  const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
  
  if (allowedIPs.length === 0) {
    return next(); // No IP restriction if not configured
  }

  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({
      error: 'IP not allowed',
      message: 'Your IP address is not authorized to access this deployment'
    });
  }

  next();
}

// Authentication check for sensitive routes
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please log in to access this resource'
    });
  }
  next();
}