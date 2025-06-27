const { Pool, neonConfig } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const { eq, desc } = require('drizzle-orm');
const ws = require('ws');
const schema = require('./schema');

neonConfig.webSocketConstructor = ws;

let db = null;
let pool = null;

function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL not set - using in-memory fallback');
    return;
  }
  
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
  }
}

// OAuth Installation Storage
class InstallationStorage {
  constructor() {
    this.memoryStore = new Map(); // Fallback for development
  }
  
  async saveInstallation(installationData) {
    if (db) {
      try {
        const [installation] = await db
          .insert(schema.oauthInstallations)
          .values({
            ghlUserId: installationData.userId || `user_${Date.now()}`,
            ghlLocationId: installationData.locationId,
            ghlAccessToken: installationData.accessToken,
            ghlRefreshToken: installationData.refreshToken,
            ghlExpiresIn: installationData.expiresIn,
            ghlScopes: installationData.scopes,
            isActive: true
          })
          .returning();
        return installation;
      } catch (error) {
        console.error('Database save failed, using memory:', error.message);
      }
    }
    
    // Fallback to memory
    const id = `install_${Date.now()}`;
    const installation = { id, ...installationData };
    this.memoryStore.set(id, installation);
    return installation;
  }
  
  async getInstallations() {
    if (db) {
      try {
        const installations = await db
          .select()
          .from(schema.oauthInstallations)
          .where(eq(schema.oauthInstallations.isActive, true))
          .orderBy(desc(schema.oauthInstallations.installationDate));
        return installations;
      } catch (error) {
        console.error('Database query failed:', error.message);
      }
    }
    
    // Fallback to memory
    return Array.from(this.memoryStore.values());
  }
  
  async getActiveToken() {
    const installations = await this.getInstallations();
    return installations.find(i => i.ghlAccessToken || i.accessToken);
  }
}

const storage = new InstallationStorage();

module.exports = {
  initializeDatabase,
  storage,
  db
};