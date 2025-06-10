import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Made optional for OAuth users
  displayName: text("display_name"),
  email: text("email"),
  // GoHighLevel OAuth fields
  ghlUserId: text("ghl_user_id").unique(),
  ghlAccessToken: text("ghl_access_token"), // Will be encrypted
  ghlRefreshToken: text("ghl_refresh_token"), // Will be encrypted
  ghlTokenExpiry: timestamp("ghl_token_expiry"),
  ghlScopes: text("ghl_scopes"), // Space-separated scopes
  ghlLocationId: text("ghl_location_id"),
  ghlLocationName: text("ghl_location_name"),
  authType: text("auth_type").notNull().default("local"), // 'local' or 'oauth'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OAuth-specific insert schema
export const insertOAuthUserSchema = createInsertSchema(users).pick({
  username: true,
  displayName: true,
  email: true,
  ghlUserId: true,
  ghlLocationId: true,
  ghlLocationName: true,
  ghlScopes: true,
  authType: true,
});

// Traditional user schema (keeping for backward compatibility)
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
});

// OAuth session table for secure token storage
export const oauthSessions = pgTable("oauth_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  ghlAccessToken: text("ghl_access_token").notNull(), // Encrypted
  ghlRefreshToken: text("ghl_refresh_token").notNull(), // Encrypted
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Listings schema
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  directoryName: text("directory_name"), // New field for directory code reference
  category: text("category"),
  location: text("location"),
  description: text("description"),
  price: text("price"),
  downloadUrl: text("download_url"),
  linkUrl: text("link_url"),
  popupUrl: text("popup_url"),
  embedFormUrl: text("embed_form_url"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertListingSchema = createInsertSchema(listings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listings.$inferSelect;

// Form Configurations schema
export const formConfigurations = pgTable("form_configurations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  locationId: text("location_id").notNull(),
  directoryName: text("directory_name").notNull(),
  config: jsonb("config").notNull(), // DirectoryConfig object
  logoUrl: text("logo_url"),
  actionButtonColor: text("action_button_color").default("#3b82f6"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFormConfigurationSchema = createInsertSchema(formConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFormConfiguration = z.infer<typeof insertFormConfigurationSchema>;
export type FormConfiguration = typeof formConfigurations.$inferSelect;

// Form Submissions schema
export const formSubmissions = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formConfigId: integer("form_config_id").notNull(),
  locationId: text("location_id").notNull(),
  directoryName: text("directory_name").notNull(),
  submissionData: jsonb("submission_data").notNull(), // Raw form data
  ghlData: jsonb("ghl_data").notNull(), // GoHighLevel formatted data
  jsonFileUrl: text("json_file_url"), // Generated JSON file path
  status: text("status").default("pending"), // pending, processed, error
  errorMessage: text("error_message"),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertFormSubmissionSchema = createInsertSchema(formSubmissions).omit({
  id: true,
  submittedAt: true,
});

export type InsertFormSubmission = z.infer<typeof insertFormSubmissionSchema>;
export type FormSubmission = typeof formSubmissions.$inferSelect;

// Designer configuration schema
export const designerConfigs = pgTable("designer_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  
  // Directory Configuration
  directoryName: text("directory_name"),
  
  // Action Button Configuration
  enableActionButton: boolean("enable_action_button").default(false),
  buttonType: text("button_type").default("popup"), // popup, link, download
  buttonLabel: text("button_label").default("Contact Us"),
  buttonUrl: text("button_url"),
  closeButtonType: text("close_button_type").default("x"), // "x" or "text"
  closeButtonText: text("close_button_text").default("Close"),
  closeButtonPosition: text("close_button_position").default("top-right"), // "top-right", "top-left"
  closeButtonBgColor: text("close_button_bg_color").default("#333333"),
  closeButtonTextColor: text("close_button_text_color").default("#FFFFFF"),
  buttonStyle: text("button_style").default("primary"), // primary, secondary, outline, custom
  buttonBorderRadius: integer("button_border_radius").default(4), // border radius in pixels
  buttonColor: text("button_color").default("#4F46E5"), // hexadecimal color code
  buttonTextColor: text("button_text_color").default("#FFFFFF"), // text color for the button
  customCss: text("custom_css"),
  
  // Embedded Form Configuration
  enableEmbeddedForm: boolean("enable_embedded_form").default(false),
  formEmbedUrl: text("form_embed_url"),
  formFallback: text("form_fallback"),
  formPosition: text("form_position").default("Below Product Description"),
  
  // Custom Form Field Configuration for Go HighLevel
  customFormFieldName: text("custom_form_field_name").default("product_slug"),
  customFormFieldLabel: text("custom_form_field_label").default("Source Listing"),
  customFormFieldType: text("custom_form_field_type").default("hidden"), // hidden, text, select, etc.
  createCustomFieldInGHL: boolean("create_custom_field_in_ghl").default(false),
  
  // Tracking Configuration for URL Parameters
  popupParamName: text("popup_param_name").default("listing_id"),
  formParamName: text("form_param_name").default("listing_id"),
  
  // Styling Configuration
  hidePrice: boolean("hide_price").default(false),
  hideCartIcon: boolean("hide_cart_icon").default(false),
  hideAddToCartButton: boolean("hide_add_to_cart_button").default(false),
  enableDownloadButton: boolean("enable_download_button").default(false),
  customCssCode: text("custom_css_code"),
  
  // Portal Domain Configuration
  portalSubdomain: text("portal_subdomain"),
  domainVerified: boolean("domain_verified").default(false),
  
  // Generated Code Storage
  headerCode: text("header_code"),
  footerCode: text("footer_code"),
});

export const insertDesignerConfigSchema = createInsertSchema(designerConfigs).omit({
  id: true,
});

export type InsertDesignerConfig = z.infer<typeof insertDesignerConfigSchema>;
export type DesignerConfig = typeof designerConfigs.$inferSelect;

// Schema for portal domains
export const portalDomains = pgTable("portal_domains", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subdomain: text("subdomain").notNull(),
  domain: text("domain").notNull(),
  verified: boolean("verified").default(false),
  verificationToken: text("verification_token"),
});

export const insertPortalDomainSchema = createInsertSchema(portalDomains).omit({
  id: true,
});

export type InsertPortalDomain = z.infer<typeof insertPortalDomainSchema>;
export type PortalDomain = typeof portalDomains.$inferSelect;

// Schema for listing addons - expanded metadata, maps, etc.
export const listingAddons = pgTable("listing_addons", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  type: text("type").notNull(), // e.g., "expanded_description", "map", "product_specs", etc.
  title: text("title"),
  content: text("content"), // Can contain HTML, JSON, or formatted text
  enabled: boolean("enabled").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertListingAddonSchema = createInsertSchema(listingAddons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertListingAddon = z.infer<typeof insertListingAddonSchema>;
export type ListingAddon = typeof listingAddons.$inferSelect;

// Google Drive Credentials schema
export const googleDriveCredentials = pgTable("google_drive_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  email: text("email").notNull(), // Google account email
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiryDate: timestamp("expiry_date"),
  folderName: text("folder_name").default("Directory Images"),
  folderId: text("folder_id"), // Google Drive folder ID
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGoogleDriveCredentialsSchema = createInsertSchema(googleDriveCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGoogleDriveCredentials = z.infer<typeof insertGoogleDriveCredentialsSchema>;
export type GoogleDriveCredentials = typeof googleDriveCredentials.$inferSelect;

// Collections schema
export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  directoryName: text("directory_name").notNull(),
  name: text("name").notNull(),
  slug: text("slug"),
  description: text("description"),
  imageUrl: text("image_url"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ghlCollectionId: text("ghl_collection_id"), // GoHighLevel collection ID
  syncStatus: text("sync_status").default("pending"), // pending, synced, failed
  syncError: text("sync_error"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;

// Collection Items schema - Many-to-many relationship between collections and listings
export const collectionItems = pgTable("collection_items", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull(),
  listingId: integer("listing_id").notNull(),
  ghlItemId: text("ghl_item_id"), // GoHighLevel item ID in collection
  syncStatus: text("sync_status").default("pending"), // pending, synced, failed
  syncError: text("sync_error"),
  addedAt: timestamp("added_at").defaultNow(),
});

export const insertCollectionItemSchema = createInsertSchema(collectionItems).omit({
  id: true,
  addedAt: true,
});

export type InsertCollectionItem = z.infer<typeof insertCollectionItemSchema>;
export type CollectionItem = typeof collectionItems.$inferSelect;
