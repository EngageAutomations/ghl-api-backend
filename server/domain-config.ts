// Custom domain configuration and middleware
export interface DomainConfig {
  domain: string;
  isPrimary: boolean;
  redirectToHttps: boolean;
  corsOrigins: string[];
}

export const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    domain: 'listings.engageautomations.com',
    isPrimary: true,
    redirectToHttps: true,
    corsOrigins: ['*']
  },
  {
    domain: process.env.REPLIT_DOMAINS || '',
    isPrimary: false,
    redirectToHttps: true,
    corsOrigins: ['*']
  }
].filter(config => config.domain);

export function getDomainConfig(host: string): DomainConfig | undefined {
  return DOMAIN_CONFIGS.find(config => 
    config.domain === host || 
    host.endsWith(config.domain)
  );
}

export function setupDomainRedirects(req: any, res: any, next: any) {
  const host = req.get('host');
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  
  // Get domain configuration
  const domainConfig = getDomainConfig(host);
  
  if (domainConfig?.redirectToHttps && protocol === 'http') {
    return res.redirect(301, `https://${host}${req.url}`);
  }
  
  // Add domain info to request for use in application
  req.domainConfig = domainConfig;
  
  next();
}

export function setupCORS(req: any, res: any, next: any) {
  const host = req.get('host');
  const domainConfig = getDomainConfig(host);
  
  if (domainConfig) {
    const allowedOrigins = domainConfig.corsOrigins.includes('*') 
      ? '*' 
      : domainConfig.corsOrigins;
      
    res.header('Access-Control-Allow-Origin', allowedOrigins);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  next();
}