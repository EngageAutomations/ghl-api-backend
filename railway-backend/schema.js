// Database schema for Railway OAuth backend
import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

// OAuth installations table - stores complete OAuth installation data
export const oauthInstallations = pgTable('oauth_installations', {
  id: serial('id').primaryKey(),
  
  // GoHighLevel User Information
  ghlUserId: text('ghl_user_id').notNull(),
  ghlUserEmail: text('ghl_user_email'),
  ghlUserName: text('ghl_user_name'),
  ghlUserPhone: text('ghl_user_phone'),
  ghlUserCompany: text('ghl_user_company'),
  
  // GoHighLevel Location Information
  ghlLocationId: text('ghl_location_id'),
  ghlLocationName: text('ghl_location_name'),
  ghlLocationBusinessType: text('ghl_location_business_type'),
  ghlLocationAddress: text('ghl_location_address'),
  
  // OAuth Token Information
  ghlAccessToken: text('ghl_access_token').notNull(),
  ghlRefreshToken: text('ghl_refresh_token'),
  ghlTokenType: text('ghl_token_type').default('Bearer'),
  ghlExpiresIn: integer('ghl_expires_in').default(3600),
  ghlScopes: text('ghl_scopes'),
  
  // Installation Status
  isActive: boolean('is_active').default(true),
  
  // Timestamps
  installationDate: timestamp('installation_date').defaultNow(),
  lastTokenRefresh: timestamp('last_token_refresh'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});