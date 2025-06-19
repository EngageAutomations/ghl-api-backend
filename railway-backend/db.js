// Database connection for Railway OAuth backend
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq, desc } from 'drizzle-orm';
import ws from "ws";
import * as schema from "./schema.js";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Storage functions for OAuth installations
export class OAuthStorage {
  async createInstallation(installationData) {
    try {
      const [installation] = await db
        .insert(schema.oauthInstallations)
        .values(installationData)
        .returning();
      return installation;
    } catch (error) {
      console.error('Database insertion error:', error);
      throw error;
    }
  }

  async getInstallationByUserId(ghlUserId) {
    try {
      const [installation] = await db
        .select()
        .from(schema.oauthInstallations)
        .where(eq(schema.oauthInstallations.ghlUserId, ghlUserId))
        .orderBy(desc(schema.oauthInstallations.installationDate))
        .limit(1);
      return installation;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async getAllInstallations() {
    try {
      const installations = await db
        .select()
        .from(schema.oauthInstallations)
        .orderBy(desc(schema.oauthInstallations.installationDate));
      return installations;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async updateTokens(ghlUserId, tokenData) {
    try {
      const [updated] = await db
        .update(schema.oauthInstallations)
        .set({
          ghlAccessToken: tokenData.access_token,
          ghlRefreshToken: tokenData.refresh_token,
          ghlExpiresIn: tokenData.expires_in,
          lastTokenRefresh: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.oauthInstallations.ghlUserId, ghlUserId))
        .returning();
      return updated;
    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  }
}

export const storage = new OAuthStorage();