# Complete OAuth Implementation Guide: Replit Development to Railway Production

## Table of Contents
1. [Introduction and Architecture Overview](#introduction)
2. [Replit Development Environment Setup](#replit-setup)
3. [Railway Production Deployment](#railway-deployment)
4. [OAuth Provider Configuration](#oauth-configuration)
5. [Security Best Practices](#security)
6. [Troubleshooting and Common Issues](#troubleshooting)
7. [Advanced Implementation Patterns](#advanced-patterns)
8. [Testing and Validation](#testing)
9. [Monitoring and Maintenance](#monitoring)
10. [Complete Code Examples](#code-examples)

## Introduction and Architecture Overview {#introduction}

OAuth (Open Authorization) is the industry-standard protocol for authorization, allowing applications to access user data from third-party services without exposing user credentials. This comprehensive guide demonstrates how to implement a robust OAuth system using Replit for development and Railway for production deployment.

### Why This Architecture?

**Replit Development Benefits:**
- Instant development environment setup
- Built-in collaboration features
- Automatic dependency management
- Real-time code execution and debugging
- Integrated version control
- Easy environment variable management

**Railway Production Benefits:**
- Automatic scaling and load balancing
- Global CDN distribution
- Built-in SSL/TLS certificates
- Database hosting and management
- Continuous deployment from GitHub
- Custom domain support
- Environment-specific configurations

### OAuth Flow Architecture

The OAuth 2.0 Authorization Code flow consists of several key components:

1. **Authorization Server**: The third-party service (e.g., GoHighLevel, Google, GitHub)
2. **Resource Server**: API endpoints that serve protected resources
3. **Client Application**: Your application (developed in Replit, deployed on Railway)
4. **Resource Owner**: The end user authorizing access

The complete flow involves:
1. User initiates authorization
2. Redirect to authorization server
3. User grants permissions
4. Authorization code returned to callback
5. Exchange code for access token
6. Use access token to access protected resources

## Replit Development Environment Setup {#replit-setup}

### Project Initialization

Start by creating a new Replit project with the appropriate technology stack. For Node.js applications:

```bash
# Initialize package.json with OAuth dependencies
npm init -y
npm install express cors helmet morgan compression
npm install passport passport-oauth2 jsonwebtoken
npm install dotenv cookie-parser express-session
npm install @types/node @types/express typescript tsx
```

### Environment Variable Configuration

Replit provides secure environment variable management through the Secrets tab. Configure the following essential variables:

```env
# OAuth Provider Configuration
OAUTH_CLIENT_ID=your_client_id_here
OAUTH_CLIENT_SECRET=your_client_secret_here
OAUTH_REDIRECT_URI=https://your-replit-domain.replit.dev/auth/callback

# Session Management
SESSION_SECRET=your_secure_session_secret_here
JWT_SECRET=your_jwt_signing_secret_here

# Database Configuration
DATABASE_URL=your_database_connection_string
REDIS_URL=your_redis_connection_string

# Application Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=https://your-replit-domain.replit.dev
```

### Express Application Structure

Create a modular Express application structure that separates concerns:

```typescript
// server/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import session from 'express-session';
import passport from 'passport';
import { configureOAuth } from './auth/oauth-config';
import { authRoutes } from './routes/auth';
import { apiRoutes } from './routes/api';
import { errorHandler } from './middleware/error-handler';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Configure OAuth strategies
configureOAuth();

// Route registration
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Error handling
app.use(errorHandler);

const port = parseInt(process.env.PORT || '3000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
```

### OAuth Strategy Configuration

Implement OAuth strategies using Passport.js for multiple providers:

```typescript
// server/auth/oauth-config.ts
import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/User';
import { DatabaseService } from '../services/database';

// Generic OAuth2 strategy for custom providers
passport.use('custom-oauth', new OAuth2Strategy({
  authorizationURL: 'https://provider.example.com/oauth/authorize',
  tokenURL: 'https://provider.example.com/oauth/token',
  clientID: process.env.OAUTH_CLIENT_ID!,
  clientSecret: process.env.OAUTH_CLIENT_SECRET!,
  callbackURL: process.env.OAUTH_REDIRECT_URI!,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Fetch user profile from provider
    const userProfile = await fetchUserProfile(accessToken);
    
    // Check if user exists in database
    let user = await DatabaseService.getUserByProviderId(
      userProfile.id, 
      'custom-provider'
    );
    
    if (!user) {
      // Create new user
      user = await DatabaseService.createUser({
        providerId: userProfile.id,
        provider: 'custom-provider',
        email: userProfile.email,
        name: userProfile.name,
        accessToken: accessToken,
        refreshToken: refreshToken,
        profile: userProfile,
      });
    } else {
      // Update existing user tokens
      await DatabaseService.updateUserTokens(user.id, {
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  // Similar implementation as above
}));

// GitHub OAuth strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: "/auth/github/callback"
}, async (accessToken, refreshToken, profile, done) => {
  // Similar implementation as above
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await DatabaseService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

async function fetchUserProfile(accessToken: string) {
  const response = await fetch('https://provider.example.com/api/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  
  return await response.json();
}

export function configureOAuth() {
  // Configuration is handled by the strategy definitions above
}
```

### Authentication Routes

Implement comprehensive authentication routes with proper error handling:

```typescript
// server/routes/auth.ts
import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { DatabaseService } from '../services/database';
import { validateRequest } from '../middleware/validation';

const router = express.Router();

// OAuth initiation routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}));

router.get('/custom', passport.authenticate('custom-oauth', {
  scope: ['read:user', 'read:profile']
}));

// OAuth callback routes with comprehensive error handling
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/auth/error' }),
  handleOAuthCallback
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/auth/error' }),
  handleOAuthCallback
);

router.get('/custom/callback',
  passport.authenticate('custom-oauth', { failureRedirect: '/auth/error' }),
  handleOAuthCallback
);

async function handleOAuthCallback(req: express.Request, res: express.Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.redirect('/auth/error?reason=no_user');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        provider: user.provider 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    // Set secure cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Log successful authentication
    await DatabaseService.logAuthEvent({
      userId: user.id,
      action: 'oauth_login',
      provider: user.provider,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    // Redirect to frontend with success indicator
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?auth=success`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/auth/error?reason=callback_error');
  }
}

// Logout endpoint
router.post('/logout', async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user as any;
    
    if (user) {
      await DatabaseService.logAuthEvent({
        userId: user.id,
        action: 'logout',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      
      res.clearCookie('auth_token');
      res.json({ success: true, message: 'Logged out successfully' });
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// User profile endpoint
router.get('/profile', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = req.user as any;
    const profile = await DatabaseService.getUserProfile(user.userId);
    
    res.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      provider: profile.provider,
      avatar: profile.avatar,
      createdAt: profile.createdAt,
    });
    
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Token refresh endpoint
router.post('/refresh', async (req: express.Request, res: express.Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const user = await DatabaseService.getUserByRefreshToken(refreshToken);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    
    res.json({ accessToken: newAccessToken });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Error handling route
router.get('/error', (req: express.Request, res: express.Response) => {
  const reason = req.query.reason || 'unknown';
  res.json({ error: 'Authentication failed', reason });
});

// Middleware for JWT authentication
async function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export { router as authRoutes };
```

### Database Service Implementation

Create a robust database service that handles OAuth user management:

```typescript
// server/services/database.ts
import { Pool } from 'pg';
import { createHash } from 'crypto';

class DatabaseService {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  
  async getUserByProviderId(providerId: string, provider: string) {
    const query = `
      SELECT * FROM users 
      WHERE provider_id = $1 AND provider = $2
    `;
    
    const result = await this.pool.query(query, [providerId, provider]);
    return result.rows[0] || null;
  }
  
  async createUser(userData: {
    providerId: string;
    provider: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken?: string;
    profile: any;
  }) {
    const query = `
      INSERT INTO users (
        provider_id, provider, email, name, 
        access_token, refresh_token, profile, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;
    
    const hashedAccessToken = this.hashToken(userData.accessToken);
    const hashedRefreshToken = userData.refreshToken ? this.hashToken(userData.refreshToken) : null;
    
    const values = [
      userData.providerId,
      userData.provider,
      userData.email,
      userData.name,
      hashedAccessToken,
      hashedRefreshToken,
      JSON.stringify(userData.profile)
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
  
  async updateUserTokens(userId: string, tokens: {
    accessToken: string;
    refreshToken?: string;
  }) {
    const query = `
      UPDATE users 
      SET access_token = $1, refresh_token = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const hashedAccessToken = this.hashToken(tokens.accessToken);
    const hashedRefreshToken = tokens.refreshToken ? this.hashToken(tokens.refreshToken) : null;
    
    const result = await this.pool.query(query, [
      hashedAccessToken,
      hashedRefreshToken,
      userId
    ]);
    
    return result.rows[0];
  }
  
  async getUserById(id: string) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }
  
  async getUserProfile(userId: string) {
    const query = `
      SELECT id, email, name, provider, profile->>'avatar_url' as avatar, created_at
      FROM users WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }
  
  async logAuthEvent(event: {
    userId: string;
    action: string;
    provider?: string;
    ip?: string;
    userAgent?: string;
  }) {
    const query = `
      INSERT INTO auth_logs (
        user_id, action, provider, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    
    await this.pool.query(query, [
      event.userId,
      event.action,
      event.provider || null,
      event.ip || null,
      event.userAgent || null
    ]);
  }
  
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  
  async close() {
    await this.pool.end();
  }
}

export const DatabaseService = new DatabaseService();
```

### Frontend Integration

Implement a React component for OAuth authentication:

```typescript
// client/src/components/AuthProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  provider: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (provider: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/auth/profile', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const login = (provider: string) => {
    window.location.href = `/auth/${provider}`;
  };
  
  const logout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Login component
export function LoginComponent() {
  const { login } = useAuth();
  
  return (
    <div className="login-container">
      <h2>Sign In</h2>
      <div className="oauth-buttons">
        <button onClick={() => login('google')} className="oauth-button google">
          Sign in with Google
        </button>
        <button onClick={() => login('github')} className="oauth-button github">
          Sign in with GitHub
        </button>
        <button onClick={() => login('custom')} className="oauth-button custom">
          Sign in with Custom Provider
        </button>
      </div>
    </div>
  );
}
```

## Railway Production Deployment {#railway-deployment}

### Railway Project Setup

Railway provides seamless deployment directly from GitHub repositories. Follow these steps for optimal configuration:

1. **Connect GitHub Repository:**
   - Link your Replit project to GitHub using Git integration
   - Push your code to a GitHub repository
   - Connect the repository to Railway

2. **Environment Variable Configuration:**
   Railway allows environment-specific variable management:

```env
# Production Environment Variables
NODE_ENV=production
PORT=3000

# OAuth Configuration (update URLs for production)
OAUTH_CLIENT_ID=your_production_client_id
OAUTH_CLIENT_SECRET=your_production_client_secret
OAUTH_REDIRECT_URI=https://your-app.railway.app/auth/callback

# Database (Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Session and JWT secrets (generate new ones for production)
SESSION_SECRET=your_production_session_secret
JWT_SECRET=your_production_jwt_secret

# Redis for session storage (Railway Redis)
REDIS_URL=${{Redis.REDIS_URL}}

# Frontend URL
FRONTEND_URL=https://your-app.railway.app
```

3. **Database Setup:**
   Railway provides managed PostgreSQL databases:

```sql
-- Database schema for OAuth users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  profile JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, provider)
);

CREATE TABLE auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  provider VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_provider ON users(provider_id, provider);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at);
```

### Production-Optimized Configuration

Update your application for production deployment:

```typescript
// server/config/production.ts
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

export function configureProductionMiddleware(app: express.Application) {
  // Redis session store for scalability
  const redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  
  redisClient.connect().catch(console.error);
  
  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'auth:',
  });
  
  // Production session configuration
  app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict',
    },
  }));
  
  // Enhanced security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.your-oauth-provider.com"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));
  
  // Rate limiting for authentication endpoints
  const rateLimit = require('express-rate-limit');
  
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/auth', authLimiter);
}
```

### Database Migration Strategy

Implement a robust migration system for production deployments:

```typescript
// server/migrations/migration-runner.ts
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

class MigrationRunner {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  
  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    
    await this.pool.query(query);
  }
  
  async getExecutedMigrations(): Promise<string[]> {
    const result = await this.pool.query('SELECT filename FROM migrations ORDER BY id');
    return result.rows.map(row => row.filename);
  }
  
  async executeMigration(filename: string) {
    const filePath = path.join(__dirname, 'sql', filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      
      console.log(`Migration ${filename} executed successfully`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  async runMigrations() {
    await this.createMigrationsTable();
    
    const migrationFiles = fs.readdirSync(path.join(__dirname, 'sql'))
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    const executedMigrations = await this.getExecutedMigrations();
    
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        await this.executeMigration(file);
      }
    }
  }
}

export const migrationRunner = new MigrationRunner();
```

### Continuous Deployment Configuration

Create a Railway deployment configuration:

```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "always"

[[services]]
name = "web"
source = "."

[services.web.variables]
NODE_ENV = "production"
PORT = "3000"
```

Add a health check endpoint:

```typescript
// server/routes/health.ts
import express from 'express';
import { DatabaseService } from '../services/database';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await DatabaseService.pool.query('SELECT 1');
    
    // Check Redis connectivity (if using Redis)
    // await redisClient.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as healthRoutes };
```

## OAuth Provider Configuration {#oauth-configuration}

### GoHighLevel OAuth Setup

GoHighLevel provides comprehensive OAuth 2.0 implementation for marketplace applications:

```typescript
// server/auth/strategies/gohighlevel.ts
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import passport from 'passport';

passport.use('gohighlevel', new OAuth2Strategy({
  authorizationURL: 'https://marketplace.leadconnectorhq.com/oauth/chooselocation',
  tokenURL: 'https://services.leadconnectorhq.com/oauth/token',
  clientID: process.env.GHL_CLIENT_ID!,
  clientSecret: process.env.GHL_CLIENT_SECRET!,
  callbackURL: process.env.GHL_REDIRECT_URI!,
  scope: [
    'contacts.readonly',
    'contacts.write',
    'locations.readonly',
    'opportunities.readonly',
    'opportunities.write',
    'products.readonly',
    'products.write',
    'medias.readonly',
    'medias.write'
  ].join(' '),
}, async (accessToken, refreshToken, params, profile, done) => {
  try {
    // Fetch user information
    const userResponse = await fetch('https://services.leadconnectorhq.com/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user data: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    
    // Fetch location information
    const locationsResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    let locationData = null;
    if (locationsResponse.ok) {
      const locationsResult = await locationsResponse.json();
      if (locationsResult.locations && locationsResult.locations.length > 0) {
        locationData = locationsResult.locations[0];
      }
    }
    
    // Store or update user in database
    const userRecord = await DatabaseService.createOrUpdateOAuthUser({
      providerId: userData.id,
      provider: 'gohighlevel',
      email: userData.email,
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      accessToken: accessToken,
      refreshToken: refreshToken,
      tokenExpiry: new Date(Date.now() + (params.expires_in * 1000)),
      scopes: params.scope,
      locationId: locationData?.id,
      locationName: locationData?.name,
      profile: {
        ...userData,
        location: locationData,
      },
    });
    
    return done(null, userRecord);
  } catch (error) {
    console.error('GoHighLevel OAuth error:', error);
    return done(error, null);
  }
}));
```

### Google OAuth Setup

Configure Google OAuth with proper scopes and error handling:

```typescript
// server/auth/strategies/google.ts
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: "/auth/google/callback",
  scope: ['profile', 'email'],
  accessType: 'offline',
  prompt: 'consent',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const userRecord = await DatabaseService.createOrUpdateOAuthUser({
      providerId: profile.id,
      provider: 'google',
      email: profile.emails?.[0]?.value || '',
      name: profile.displayName,
      accessToken: accessToken,
      refreshToken: refreshToken,
      profile: {
        googleId: profile.id,
        name: profile.displayName,
        firstName: profile.name?.givenName,
        lastName: profile.name?.familyName,
        email: profile.emails?.[0]?.value,
        avatar: profile.photos?.[0]?.value,
        verified: profile.emails?.[0]?.verified,
      },
    });
    
    return done(null, userRecord);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));
```

### GitHub OAuth Setup

Implement GitHub OAuth for developer-focused applications:

```typescript
// server/auth/strategies/github.ts
import { Strategy as GitHubStrategy } from 'passport-github2';
import passport from 'passport';

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  callbackURL: "/auth/github/callback",
  scope: ['user:email', 'read:user'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Fetch additional user data including private email
    const [userResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }),
    ]);
    
    const userData = await userResponse.json();
    const emailsData = await emailsResponse.json();
    
    const primaryEmail = emailsData.find((email: any) => email.primary)?.email || userData.email;
    
    const userRecord = await DatabaseService.createOrUpdateOAuthUser({
      providerId: profile.id,
      provider: 'github',
      email: primaryEmail,
      name: userData.name || profile.username,
      accessToken: accessToken,
      refreshToken: refreshToken,
      profile: {
        githubId: profile.id,
        username: profile.username,
        name: userData.name,
        email: primaryEmail,
        avatar: userData.avatar_url,
        bio: userData.bio,
        company: userData.company,
        location: userData.location,
        blog: userData.blog,
        publicRepos: userData.public_repos,
        followers: userData.followers,
        following: userData.following,
      },
    });
    
    return done(null, userRecord);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return done(error, null);
  }
}));
```

## Security Best Practices {#security}

### Token Security

Implement comprehensive token security measures:

```typescript
// server/services/token-security.ts
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

class TokenSecurityService {
  private readonly ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY!;
  private readonly IV_LENGTH = 16;
  
  encryptToken(token: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-cbc', this.ENCRYPTION_KEY);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }
  
  decryptToken(encryptedToken: string): string {
    const parts = encryptedToken.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', this.ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  generateSecureJWT(payload: any, expiresIn: string = '1h'): string {
    return jwt.sign(
      {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID(), // JWT ID for token blacklisting
      },
      process.env.JWT_SECRET!,
      {
        expiresIn,
        issuer: process.env.JWT_ISSUER || 'your-app',
        audience: process.env.JWT_AUDIENCE || 'your-app-users',
      }
    );
  }
  
  validateJWT(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!, {
        issuer: process.env.JWT_ISSUER || 'your-app',
        audience: process.env.JWT_AUDIENCE || 'your-app-users',
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
  
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    // Check Redis or database for blacklisted tokens
    // Implementation depends on your storage choice
    return false;
  }
  
  async blacklistToken(jti: string, expiresAt: Date): Promise<void> {
    // Add token to blacklist with expiration
    // Implementation depends on your storage choice
  }
}

export const tokenSecurity = new TokenSecurityService();
```

### CSRF Protection

Implement CSRF protection for OAuth flows:

```typescript
// server/middleware/csrf-protection.ts
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function csrfProtection(req: CSRFRequest, res: Response, next: NextFunction) {
  if (req.method === 'GET') {
    // Generate and store CSRF token for GET requests
    const token = generateCSRFToken();
    req.session.csrfToken = token;
    req.csrfToken = token;
    return next();
  }
  
  // Validate CSRF token for state-changing requests
  const clientToken = req.body._csrf || req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;
  
  if (!clientToken || !sessionToken || clientToken !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
}

// OAuth state parameter validation
export function validateOAuthState(req: Request, res: Response, next: NextFunction) {
  const state = req.query.state as string;
  const sessionState = req.session.oauthState;
  
  if (!state || !sessionState || state !== sessionState) {
    return res.status(400).json({ error: 'Invalid OAuth state parameter' });
  }
  
  // Clear the state after validation
  delete req.session.oauthState;
  next();
}
```

### Input Validation and Sanitization

Implement comprehensive input validation:

```typescript
// server/middleware/validation.ts
import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

export const userProfileSchema = z.object({
  name: z.string().min(1).max(255).refine(val => DOMPurify.sanitize(val) === val),
  email: z.string().email(),
  bio: z.string().max(1000).optional(),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}
```

## Troubleshooting and Common Issues {#troubleshooting}

### OAuth Callback Issues

Common OAuth callback problems and solutions:

```typescript
// server/middleware/oauth-error-handler.ts
import { Request, Response, NextFunction } from 'express';

export function oauthErrorHandler(error: any, req: Request, res: Response, next: NextFunction) {
  console.error('OAuth Error:', {
    error: error.message,
    stack: error.stack,
    query: req.query,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
  
  // Handle specific OAuth errors
  if (error.message.includes('access_denied')) {
    return res.redirect('/auth/error?reason=access_denied&message=User denied access');
  }
  
  if (error.message.includes('invalid_grant')) {
    return res.redirect('/auth/error?reason=invalid_grant&message=Authorization code expired');
  }
  
  if (error.message.includes('invalid_client')) {
    return res.redirect('/auth/error?reason=invalid_client&message=Invalid client credentials');
  }
  
  if (error.message.includes('invalid_scope')) {
    return res.redirect('/auth/error?reason=invalid_scope&message=Requested scope is invalid');
  }
  
  // Generic error handling
  res.redirect('/auth/error?reason=oauth_error&message=Authentication failed');
}

// Network error retry logic
export async function retryOAuthRequest(
  requestFn: () => Promise<any>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      console.warn(`OAuth request attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
    }
  }
}
```

### Database Connection Issues

Handle database connectivity problems:

```typescript
// server/services/database-connection.ts
import { Pool, PoolClient } from 'pg';

export class DatabaseConnectionManager {
  private pool: Pool;
  private isHealthy: boolean = true;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if no connection available
    });
    
    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
      this.isHealthy = false;
    });
    
    this.pool.on('connect', () => {
      this.isHealthy = true;
    });
    
    // Health check interval
    setInterval(() => this.healthCheck(), 30000);
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isHealthy = true;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      this.isHealthy = false;
      return false;
    }
  }
  
  async withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  get healthy(): boolean {
    return this.isHealthy;
  }
  
  get pool(): Pool {
    return this.pool;
  }
}
```

### Environment Configuration Issues

Debug environment configuration problems:

```typescript
// server/config/environment-validator.ts
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(val => parseInt(val, 10)),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // OAuth
  OAUTH_CLIENT_ID: z.string().min(1),
  OAUTH_CLIENT_SECRET: z.string().min(1),
  OAUTH_REDIRECT_URI: z.string().url(),
  
  // Security
  SESSION_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  
  // Optional
  REDIS_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),
});

export function validateEnvironment() {
  try {
    const env = environmentSchema.parse(process.env);
    console.log('Environment validation passed');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}
```

## Advanced Implementation Patterns {#advanced-patterns}

### Multi-Tenant OAuth

Implement OAuth for multi-tenant applications:

```typescript
// server/services/multi-tenant-oauth.ts
export class MultiTenantOAuthService {
  async getOAuthConfig(tenantId: string, provider: string) {
    const tenant = await this.getTenant(tenantId);
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    const config = tenant.oauthConfigs.find(c => c.provider === provider);
    
    if (!config) {
      throw new Error(`OAuth provider ${provider} not configured for tenant ${tenantId}`);
    }
    
    return {
      clientId: this.decrypt(config.clientId),
      clientSecret: this.decrypt(config.clientSecret),
      redirectUri: config.redirectUri,
      scopes: config.scopes,
    };
  }
  
  async createTenantOAuthStrategy(tenantId: string, provider: string) {
    const config = await this.getOAuthConfig(tenantId, provider);
    
    return new OAuth2Strategy({
      authorizationURL: this.getAuthorizationURL(provider),
      tokenURL: this.getTokenURL(provider),
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: `${config.redirectUri}?tenant=${tenantId}`,
    }, async (accessToken, refreshToken, profile, done) => {
      // Handle OAuth callback with tenant context
      const user = await this.createOrUpdateTenantUser(
        tenantId,
        provider,
        profile,
        accessToken,
        refreshToken
      );
      
      return done(null, user);
    });
  }
  
  private async getTenant(tenantId: string) {
    // Fetch tenant configuration from database
    const query = 'SELECT * FROM tenants WHERE id = $1';
    const result = await this.pool.query(query, [tenantId]);
    return result.rows[0];
  }
  
  private decrypt(encryptedValue: string): string {
    // Implement encryption/decryption for sensitive tenant data
    return encryptedValue; // Placeholder
  }
}
```

### OAuth Webhook Handling

Handle OAuth provider webhooks for real-time updates:

```typescript
// server/routes/webhooks.ts
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Webhook signature verification middleware
function verifyWebhookSignature(secret: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const signature = req.headers['x-webhook-signature'] as string;
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }
    
    next();
  };
}

// Handle user profile updates
router.post('/oauth/user-updated',
  verifyWebhookSignature(process.env.WEBHOOK_SECRET!),
  async (req, res) => {
    try {
      const { userId, provider, updatedProfile } = req.body;
      
      await DatabaseService.updateUserProfile(userId, provider, updatedProfile);
      
      // Trigger real-time updates to connected clients
      // Example: WebSocket notification, server-sent events, etc.
      
      res.json({ success: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// Handle token revocation
router.post('/oauth/token-revoked',
  verifyWebhookSignature(process.env.WEBHOOK_SECRET!),
  async (req, res) => {
    try {
      const { userId, provider } = req.body;
      
      await DatabaseService.revokeUserTokens(userId, provider);
      
      // Invalidate user sessions
      await SessionService.invalidateUserSessions(userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Token revocation webhook error:', error);
      res.status(500).json({ error: 'Token revocation failed' });
    }
  }
);

export { router as webhookRoutes };
```

### OAuth Scope Management

Implement dynamic scope management:

```typescript
// server/services/scope-manager.ts
export class OAuthScopeManager {
  private scopeDefinitions = new Map<string, ScopeDefinition>();
  
  constructor() {
    this.initializeScopeDefinitions();
  }
  
  private initializeScopeDefinitions() {
    // Define available scopes for each provider
    this.scopeDefinitions.set('google', {
      'profile': { description: 'Access basic profile information', required: true },
      'email': { description: 'Access email address', required: true },
      'calendar': { description: 'Access Google Calendar', required: false },
      'drive': { description: 'Access Google Drive files', required: false },
    });
    
    this.scopeDefinitions.set('github', {
      'user': { description: 'Access user profile', required: true },
      'user:email': { description: 'Access email addresses', required: true },
      'repo': { description: 'Access repositories', required: false },
      'admin:org': { description: 'Access organization data', required: false },
    });
  }
  
  validateScopes(provider: string, requestedScopes: string[]): {
    valid: boolean;
    missingRequired: string[];
    invalidScopes: string[];
  } {
    const providerScopes = this.scopeDefinitions.get(provider);
    
    if (!providerScopes) {
      return { valid: false, missingRequired: [], invalidScopes: requestedScopes };
    }
    
    const availableScopes = Object.keys(providerScopes);
    const requiredScopes = Object.entries(providerScopes)
      .filter(([_, def]) => def.required)
      .map(([scope, _]) => scope);
    
    const invalidScopes = requestedScopes.filter(scope => !availableScopes.includes(scope));
    const missingRequired = requiredScopes.filter(scope => !requestedScopes.includes(scope));
    
    return {
      valid: invalidScopes.length === 0 && missingRequired.length === 0,
      missingRequired,
      invalidScopes,
    };
  }
  
  getMinimalScopes(provider: string): string[] {
    const providerScopes = this.scopeDefinitions.get(provider);
    
    if (!providerScopes) {
      return [];
    }
    
    return Object.entries(providerScopes)
      .filter(([_, def]) => def.required)
      .map(([scope, _]) => scope);
  }
}

interface ScopeDefinition {
  [scope: string]: {
    description: string;
    required: boolean;
  };
}
```

## Testing and Validation {#testing}

### OAuth Flow Testing

Comprehensive testing for OAuth implementations:

```typescript
// tests/oauth.test.ts
import request from 'supertest';
import { app } from '../server';
import { DatabaseService } from '../server/services/database';

describe('OAuth Authentication', () => {
  beforeEach(async () => {
    await DatabaseService.clearTestData();
  });
  
  describe('OAuth Initiation', () => {
    test('should redirect to Google OAuth', async () => {
      const response = await request(app)
        .get('/auth/google')
        .expect(302);
      
      expect(response.headers.location).toContain('accounts.google.com');
      expect(response.headers.location).toContain('client_id=');
      expect(response.headers.location).toContain('scope=profile%20email');
    });
    
    test('should include CSRF state parameter', async () => {
      const response = await request(app)
        .get('/auth/google')
        .expect(302);
      
      const url = new URL(response.headers.location);
      const state = url.searchParams.get('state');
      
      expect(state).toBeTruthy();
      expect(state).toHaveLength(64); // Assuming 32-byte hex string
    });
  });
  
  describe('OAuth Callback', () => {
    test('should handle successful Google callback', async () => {
      // Mock the OAuth provider response
      const mockTokenResponse = {
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
      };
      
      const mockUserProfile = {
        id: 'google_user_123',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
      };
      
      // Mock external API calls
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokenResponse),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockUserProfile),
        } as any);
      
      const response = await request(app)
        .get('/auth/google/callback')
        .query({
          code: 'mock_authorization_code',
          state: 'valid_state_token',
        })
        .expect(302);
      
      expect(response.headers.location).toContain('/dashboard');
      
      // Verify user was created in database
      const user = await DatabaseService.getUserByEmail('test@example.com');
      expect(user).toBeTruthy();
      expect(user.provider).toBe('google');
    });
    
    test('should handle OAuth errors', async () => {
      const response = await request(app)
        .get('/auth/google/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access',
        })
        .expect(302);
      
      expect(response.headers.location).toContain('/auth/error');
      expect(response.headers.location).toContain('access_denied');
    });
  });
  
  describe('Protected Routes', () => {
    let authToken: string;
    
    beforeEach(async () => {
      // Create test user and generate auth token
      const user = await DatabaseService.createUser({
        providerId: 'test_user_123',
        provider: 'google',
        email: 'test@example.com',
        name: 'Test User',
      });
      
      authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    });
    
    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.email).toBe('test@example.com');
    });
    
    test('should reject access with invalid token', async () => {
      await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });
});
```

### Load Testing

Implement load testing for OAuth endpoints:

```typescript
// tests/load-test.ts
import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
};

export default function () {
  // Test OAuth initiation endpoint
  let response = http.get('https://your-app.railway.app/auth/google');
  check(response, {
    'OAuth initiation status is 302': (r) => r.status === 302,
    'Response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
  
  // Test protected endpoint with auth token
  const authToken = 'your_test_token_here';
  response = http.get('https://your-app.railway.app/auth/profile', {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  
  check(response, {
    'Profile fetch status is 200': (r) => r.status === 200,
    'Response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  sleep(1);
}
```

## Monitoring and Maintenance {#monitoring}

### Application Monitoring

Implement comprehensive monitoring for OAuth flows:

```typescript
// server/monitoring/oauth-metrics.ts
import { createPrometheusMetrics } from 'prom-client';

export class OAuthMetrics {
  private oauthAttempts = new Counter({
    name: 'oauth_attempts_total',
    help: 'Total number of OAuth attempts',
    labelNames: ['provider', 'result'],
  });
  
  private oauthDuration = new Histogram({
    name: 'oauth_duration_seconds',
    help: 'OAuth flow duration in seconds',
    labelNames: ['provider', 'step'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
  });
  
  private activeUsers = new Gauge({
    name: 'oauth_active_users',
    help: 'Number of active OAuth users',
    labelNames: ['provider'],
  });
  
  recordOAuthAttempt(provider: string, success: boolean) {
    this.oauthAttempts.inc({
      provider,
      result: success ? 'success' : 'failure',
    });
  }
  
  recordOAuthDuration(provider: string, step: string, duration: number) {
    this.oauthDuration.observe({ provider, step }, duration);
  }
  
  updateActiveUsers(provider: string, count: number) {
    this.activeUsers.set({ provider }, count);
  }
}

export const oauthMetrics = new OAuthMetrics();
```

### Logging and Error Tracking

Implement structured logging for OAuth events:

```typescript
// server/logging/oauth-logger.ts
import winston from 'winston';

export const oauthLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'oauth-service' },
  transports: [
    new winston.transports.File({ filename: 'oauth-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'oauth-combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  oauthLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export function logOAuthEvent(event: {
  type: 'initiation' | 'callback' | 'error' | 'success';
  provider: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  error?: Error;
  metadata?: any;
}) {
  oauthLogger.info('OAuth Event', {
    ...event,
    timestamp: new Date().toISOString(),
  });
}
```

## Complete Code Examples {#code-examples}

### Full Express Server Implementation

Here's a complete, production-ready Express server with OAuth:

```typescript
// server/app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import session from 'express-session';
import passport from 'passport';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';
import rateLimit from 'express-rate-limit';

import { validateEnvironment } from './config/environment-validator';
import { configureOAuth } from './auth/oauth-config';
import { authRoutes } from './routes/auth';
import { webhookRoutes } from './routes/webhooks';
import { healthRoutes } from './routes/health';
import { errorHandler } from './middleware/error-handler';
import { oauthErrorHandler } from './middleware/oauth-error-handler';
import { requestLogger } from './middleware/request-logger';
import { migrationRunner } from './migrations/migration-runner';

// Validate environment variables
const env = validateEnvironment();

const app = express();

// Trust proxy for Railway deployment
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
}));

// Compression and parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Session configuration
async function setupSession() {
  if (process.env.REDIS_URL) {
    const redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    
    const redisStore = new RedisStore({
      client: redisClient,
      prefix: 'sess:',
    });
    
    app.use(session({
      store: redisStore,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: 'sessionId',
      cookie: {
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict',
      },
    }));
  } else {
    // Fallback to memory store for development
    app.use(session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: 'sessionId',
      cookie: {
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict',
      },
    }));
  }
}

// Initialize application
async function initializeApp() {
  try {
    // Run database migrations
    await migrationRunner.runMigrations();
    console.log('Database migrations completed');
    
    // Setup session
    await setupSession();
    console.log('Session store configured');
    
    // Configure Passport
    app.use(passport.initialize());
    app.use(passport.session());
    configureOAuth();
    console.log('OAuth strategies configured');
    
    // Routes
    app.use('/health', healthRoutes);
    app.use('/auth', authRoutes);
    app.use('/webhooks', webhookRoutes);
    
    // OAuth error handling
    app.use('/auth', oauthErrorHandler);
    
    // Global error handler
    app.use(errorHandler);
    
    // Start server
    const port = env.PORT;
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

initializeApp();

export { app };
```

### Complete React OAuth Component

A comprehensive React component for OAuth authentication:

```tsx
// client/src/components/OAuth/OAuthManager.tsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';

interface OAuthUser {
  id: string;
  email: string;
  name: string;
  provider: string;
  avatar?: string;
  scopes: string[];
}

interface OAuthContextType {
  user: OAuthUser | null;
  loading: boolean;
  error: string | null;
  login: (provider: string, additionalScopes?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const OAuthContext = createContext<OAuthContextType | undefined>(undefined);

export function OAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<OAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    checkAuthStatus();
    
    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'oauth_success') {
        checkAuthStatus();
      } else if (event.data.type === 'oauth_error') {
        setError(event.data.error);
        setLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/auth/profile', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        setUser(null);
      } else {
        throw new Error(`Authentication check failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Auth status check failed:', err);
      setError(err instanceof Error ? err.message : 'Authentication check failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (provider: string, additionalScopes: string[] = []) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build OAuth URL with optional additional scopes
      const params = new URLSearchParams();
      if (additionalScopes.length > 0) {
        params.set('scopes', additionalScopes.join(','));
      }
      
      const oauthUrl = `/auth/${provider}${params.toString() ? `?${params}` : ''}`;
      
      // Open OAuth popup
      const popup = window.open(
        oauthUrl,
        'oauth_popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Failed to open OAuth popup. Please allow popups for this site.');
      }
      
      // Monitor popup for completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setLoading(false);
          checkAuthStatus(); // Recheck auth status after popup closes
        }
      }, 1000);
      
    } catch (err) {
      console.error('OAuth login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  };
  
  const refreshToken = async () => {
    try {
      const response = await fetch('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Token refresh failed');
      }
      
      await checkAuthStatus();
    } catch (err) {
      console.error('Token refresh failed:', err);
      setUser(null);
      setError('Session expired. Please log in again.');
    }
  };
  
  return (
    <OAuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      refreshToken,
    }}>
      {children}
    </OAuthContext.Provider>
  );
}

export function useOAuth() {
  const context = useContext(OAuthContext);
  if (context === undefined) {
    throw new Error('useOAuth must be used within an OAuthProvider');
  }
  return context;
}

// OAuth Login Component
export function OAuthLogin() {
  const { login, loading, error } = useOAuth();
  
  const providers = [
    { id: 'google', name: 'Google', icon: '🔵' },
    { id: 'github', name: 'GitHub', icon: '⚫' },
    { id: 'gohighlevel', name: 'GoHighLevel', icon: '🟢' },
  ];
  
  return (
    <div className="oauth-login">
      <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
      
      {error && (
        <ErrorMessage message={error} className="mb-4" />
      )}
      
      <div className="space-y-3">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            onClick={() => login(provider.id)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3"
            variant="outline"
          >
            <span className="text-xl">{provider.icon}</span>
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              `Continue with ${provider.name}`
            )}
          </Button>
        ))}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          By signing in, you agree to our{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}

// User Profile Component
export function OAuthProfile() {
  const { user, logout, loading } = useOAuth();
  
  if (!user) return null;
  
  return (
    <div className="oauth-profile">
      <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
        {user.avatar && (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div className="flex-1">
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email}</p>
          <p className="text-xs text-gray-500">
            Connected via {user.provider}
          </p>
        </div>
        <Button
          onClick={logout}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? <LoadingSpinner size="sm" /> : 'Sign Out'}
        </Button>
      </div>
    </div>
  );
}
```

This comprehensive guide provides everything needed to implement robust OAuth authentication using Replit for development and Railway for production deployment. The implementation includes security best practices, error handling, testing strategies, and production-ready code examples that can be adapted for various OAuth providers and application requirements.

The guide serves as a complete reference for developers building OAuth-enabled applications with modern web technologies, ensuring secure, scalable, and maintainable authentication systems.