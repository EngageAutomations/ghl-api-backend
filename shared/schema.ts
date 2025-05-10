import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Designer configuration schema
export const designerConfigs = pgTable("designer_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  
  // Action Button Configuration
  enableActionButton: boolean("enable_action_button").default(false),
  buttonType: text("button_type").default("popup"), // popup, link, download
  buttonLabel: text("button_label").default("Contact Us"),
  buttonUrl: text("button_url"),
  popupWidth: integer("popup_width").default(600),
  popupHeight: integer("popup_height").default(500),
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
  
  // Styling Configuration
  hidePrice: boolean("hide_price").default(false),
  hideCartIcon: boolean("hide_cart_icon").default(false),
  hideAddToCartButton: boolean("hide_add_to_cart_button").default(false),
  enableDownloadButton: boolean("enable_download_button").default(false),
  customCssCode: text("custom_css_code"),
  
  // Portal Domain Configuration
  portalSubdomain: text("portal_subdomain"),
  domainVerified: boolean("domain_verified").default(false),
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
