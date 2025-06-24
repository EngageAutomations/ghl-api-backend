const createApp = require('./src/app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('Config check:', {
  CLIENT_ID: process.env.CLIENT_ID ? '[set]' : '[MISSING - REQUIRED]',
  CLIENT_SECRET: process.env.CLIENT_SECRET ? '[set]' : '[MISSING - REQUIRED]',
  REDIRECT: '/api/oauth/callback',
  PORT
});

if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
  console.error('');
  console.error('⚠️  CRITICAL: OAuth credentials missing!');
  console.error('   Set CLIENT_ID and CLIENT_SECRET environment variables');
  console.error('   OAuth flow will fail without these credentials');
  console.error('');
}

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`🚀 GHL proxy (modular) listening on ${HOST}:${PORT}`);
  console.log('📋 Routes registered:');
  console.log('   - OAuth: /api/oauth/callback, /api/oauth/status');
  console.log('   - Media: /api/ghl/locations/:locationId/media');
  console.log('   - Products: /api/ghl/locations/:locationId/products');
  console.log('   - Legacy: /api/ghl/products/create (deprecated)');
  console.log('   - Health: /, /health');
  console.log('');
  console.log('✅ Ready for OAuth installation flow');
});