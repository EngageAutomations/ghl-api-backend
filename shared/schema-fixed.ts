import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),
  displayName: text("display_name"),
  email: text("email"),
  ghlUserId: text("ghl_user_id").unique(),
  ghlAccessToken: text("ghl_access_token"),
  ghlRefreshToken: text("ghl_refresh_token"),
  ghlTokenExpiry: timestamp("ghl_token_expiry"),
  ghlScopes: text("ghl_scopes"),
  ghlLocationId: text("ghl_location_id"),
  ghlLocationName: text("ghl_location_name"),
  authType: text("auth_type").notNull().default("local"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1).optional(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  ghlUserId: z.string().optional(),
  ghlAccessToken: z.string().optional(),
  ghlRefreshToken: z.string().optional(),
  ghlTokenExpiry: z.date().optional(),
  ghlScopes: z.string().optional(),
  ghlLocationId: z.string().optional(),
  ghlLocationName: z.string().optional(),
  authType: z.string().default("local"),
});

export const insertOAuthUserSchema = z.object({
  username: z.string().min(1),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  ghlUserId: z.string().optional(),
  ghlLocationId: z.string().optional(),
  ghlLocationName: z.string().optional(),
  ghlScopes: z.string().optional(),
  authType: z.string().default("oauth"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOAuthUser = z.infer<typeof insertOAuthUserSchema>;

// OAuth sessions table
export const oauthSessions = pgTable("oauth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  ghlAccessToken: text("ghl_access_token").notNull(),
  ghlRefreshToken: text("ghl_refresh_token"),
  expiryDate: timestamp("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type OAuthSession = typeof oauthSessions.$inferSelect;
export type NewOAuthSession = typeof oauthSessions.$inferInsert;

// Directory configs table
export const directoryConfigs = pgTable("directory_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  directoryName: text("directory_name").notNull(),
  enableActionButton: boolean("enable_action_button").default(false),
  buttonType: text("button_type").default("redirect"),
  buttonLabel: text("button_label").default("Learn More"),
  buttonUrl: text("button_url"),
  closeButtonType: text("close_button_type").default("X"),
  closeButtonText: text("close_button_text").default("Close"),
  backgroundOpacity: integer("background_opacity").default(80),
  backgroundColor: text("background_color").default("#000000"),
  borderRadius: integer("border_radius").default(12),
  cardWidth: integer("card_width").default(600),
  cardHeight: integer("card_height").default(400),
  cardBackground: text("card_background").default("#ffffff"),
  titleColor: text("title_color").default("#000000"),
  descriptionColor: text("description_color").default("#666666"),
  priceColor: text("price_color").default("#e74c3c"),
  buttonColor: text("button_color").default("#3498db"),
  buttonTextColor: text("button_text_color").default("#ffffff"),
  animationType: text("animation_type").default("fadeIn"),
  autoClose: boolean("auto_close").default(false),
  autoCloseDelay: integer("auto_close_delay").default(5000),
  showOnMobile: boolean("show_on_mobile").default(true),
  showOnDesktop: boolean("show_on_desktop").default(true),
  targetPages: text("target_pages"),
  excludePages: text("exclude_pages"),
  triggerDelay: integer("trigger_delay").default(0),
  maxDisplays: integer("max_displays").default(1),
  displayCooldown: integer("display_cooldown").default(24),
  headerCode: text("header_code"),
  footerCode: text("footer_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type DirectoryConfig = typeof directoryConfigs.$inferSelect;
export type NewDirectoryConfig = typeof directoryConfigs.$inferInsert;

// Custom domains table
export const customDomains = pgTable("custom_domains", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  domain: text("domain"),
  verified: boolean("verified").default(false),
  verificationToken: text("verification_token").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CustomDomain = typeof customDomains.$inferSelect;
export type NewCustomDomain = typeof customDomains.$inferInsert;

// Listings table
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  directoryName: text("directory_name").notNull(),
  category: text("category"),
  location: text("location"),
  description: text("description"),
  price: text("price"),
  contactInfo: text("contact_info"),
  tags: text("tags"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;

// Listing sections table
export const listingSections = pgTable("listing_sections", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  displayOrder: integer("display_order").default(0),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ListingSection = typeof listingSections.$inferSelect;
export type NewListingSection = typeof listingSections.$inferInsert;