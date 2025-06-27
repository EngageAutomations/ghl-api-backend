const { pgTable, serial, text, boolean, timestamp, integer } = require('drizzle-orm/pg-core');

export const oauthInstallations = pgTable('oauth_installations', {
  id: serial('id').primaryKey(),
  ghlUserId: text('ghl_user_id').notNull(),
  ghlUserEmail: text('ghl_user_email'),
  ghlLocationId: text('ghl_location_id'),
  ghlAccessToken: text('ghl_access_token').notNull(),
  ghlRefreshToken: text('ghl_refresh_token'),
  ghlTokenType: text('ghl_token_type').default('Bearer'),
  ghlExpiresIn: integer('ghl_expires_in').default(3600),
  ghlScopes: text('ghl_scopes'),
  isActive: boolean('is_active').default(true),
  installationDate: timestamp('installation_date').defaultNow(),
  lastTokenRefresh: timestamp('last_token_refresh'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});