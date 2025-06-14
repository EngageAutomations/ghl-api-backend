/**
 * Generate OAuth URL for Replit Instance
 */

// Generate OAuth URL for this Replit instance
const clientId = process.env.GHL_CLIENT_ID;
const replitDomain = process.env.REPLIT_DEV_DOMAIN;

if (!clientId || !replitDomain) {
  console.log('Missing configuration');
  process.exit(1);
}

const scopes = 'products/prices.write products/prices.readonly products/collection.write products/collection.readonly medias.write medias.readonly locations.readonly contacts.readonly contacts.write';
const state = `replit_${Date.now()}`;
const redirectUri = `https://${replitDomain}/api/oauth/callback`;

const authUrl = `https://marketplace.leadconnectorhq.com/oauth/chooselocation?` +
  `response_type=code&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `client_id=${clientId}&` +
  `scope=${encodeURIComponent(scopes)}&` +
  `state=${state}`;

console.log('\n🔗 OAuth URL for Replit Instance:');
console.log('==================================');
console.log(authUrl);
console.log('\n📋 Redirect URI:', redirectUri);
console.log('💡 Visit this URL to install on Replit instance');