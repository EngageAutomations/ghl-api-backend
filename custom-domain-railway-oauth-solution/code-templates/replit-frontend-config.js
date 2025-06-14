/**
 * Replit Frontend Configuration Template
 * Server configuration for custom domain deployment
 */

// Production mode detection
const nodeEnv = process.env.NODE_ENV || "development";
const isDevelopment = nodeEnv === "development";
const isDeployment = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
const forceProductionMode = isDeployment;

console.log(`Environment: ${nodeEnv}`);
console.log(`Production mode: ${forceProductionMode}`);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    domain: req.get('host')
  });
});

// Production static file serving
if (forceProductionMode) {
  console.log("Setting up production static serving...");
  
  // Serve static files from dist/public directory
  app.use(express.static(path.join(__dirname, '../dist/public')));
  
  // Catch-all handler: send back index.html file for SPA routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
  
} else {
  console.log("Setting up development mode with Vite...");
  await setupVite(app, server);
}

// CORS configuration for custom domain
const corsOptions = {
  origin: [
    'https://your-custom-domain.com',
    'https://your-replit-domain.replit.app',
    'https://your-railway-domain.up.railway.app',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-ghl-locationid']
};

app.use(cors(corsOptions));

// Session configuration for embedded CRM tabs
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'none' // Required for iframe embedding
  }
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});