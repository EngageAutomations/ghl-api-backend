# Database Schema Documentation

## Overview

The database uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema supports a flexible marketplace structure with directories, listings, collections, and user management.

## Core Tables

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  password TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields:**
- `id` - Auto-incrementing primary key
- `username` - Unique username for authentication
- `email` - User email address (optional)
- `password` - Hashed password for authentication
- `display_name` - User's display name for UI
- `created_at` - Account creation timestamp
- `updated_at` - Last profile update timestamp

---

### Directories Table
```sql
CREATE TABLE directories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  directory_name TEXT NOT NULL,
  location_id TEXT NOT NULL,
  enable_action_button BOOLEAN DEFAULT false,
  button_type TEXT,
  button_label TEXT,
  button_url TEXT,
  close_button_type TEXT,
  close_button_label TEXT,
  popup_title TEXT,
  popup_content TEXT,
  seo_title TEXT,
  seo_description TEXT,
  og_image_url TEXT,
  favicon_url TEXT,
  logo_url TEXT,
  background_image_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  accent_color TEXT DEFAULT '#F59E0B',
  action_button_color TEXT DEFAULT '#EF4444',
  font_family TEXT DEFAULT 'Inter',
  custom_css TEXT,
  header_html TEXT,
  footer_html TEXT,
  tracking_code TEXT,
  domain_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Fields:**
- `directory_name` - Human-readable directory name
- `location_id` - GoHighLevel location identifier
- `enable_action_button` - Whether to show action button on listings
- `button_type` - Type of action (download, link, popup, form)
- `button_url` - URL for link-type buttons
- `seo_title` - SEO optimized page title
- `seo_description` - Meta description for search engines
- `logo_url` - Directory branding logo
- `primary_color` - Main brand color
- `custom_css` - Custom styling overrides
- `domain_verified` - Custom domain verification status

---

### Listings (Products) Table
```sql
CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  directory_name TEXT NOT NULL,
  category TEXT,
  location TEXT,
  description TEXT,
  price TEXT,
  download_url TEXT,
  link_url TEXT,
  popup_url TEXT,
  embed_form_url TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Product Fields:**
- `title` - Product/listing title (required)
- `slug` - URL-friendly identifier
- `directory_name` - Parent directory reference
- `category` - Product categorization (optional)
- `location` - Physical or service location
- `description` - Detailed product description
- `price` - Pricing information (flexible text format)
- `download_url` - Direct download link for digital products
- `link_url` - External website or landing page
- `popup_url` - URL for popup modal content
- `embed_form_url` - Embedded form for lead capture
- `image_url` - Primary product image
- `is_active` - Visibility status

**Pricing Field Details:**
The `price` field uses TEXT type for maximum flexibility:
- Supports various formats: "$450,000", "From $299/mo", "Contact for pricing"
- Allows ranges: "$100 - $500"
- Supports multiple currencies: "€2,500", "£1,200"
- Free products: "Free", "No charge"

---

### Collections Table
```sql
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  directory_name TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  ghl_collection_id TEXT,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Collection Fields:**
- `name` - Collection display name
- `slug` - URL-friendly identifier (auto-generated from name)
- `description` - Collection description for users
- `image_url` - Collection banner/thumbnail image
- `seo_title` - SEO optimized title
- `seo_description` - Meta description
- `ghl_collection_id` - GoHighLevel collection ID for sync
- `sync_status` - Sync state: pending, synced, failed
- `sync_error` - Error message from failed sync attempts

---

### Collection Items Table (Many-to-Many)
```sql
CREATE TABLE collection_items (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  ghl_item_id TEXT,
  sync_status TEXT DEFAULT 'pending',
  sync_error TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);
```

**Relationship Fields:**
- `collection_id` - References collections table
- `listing_id` - References listings table
- `ghl_item_id` - GoHighLevel item ID for sync tracking
- `sync_status` - Individual item sync status
- `added_at` - When item was added to collection

**Important:** This many-to-many relationship allows:
- One product in multiple collections
- One collection containing multiple products
- Independent sync status tracking per relationship

---

### Listing Features Table
```sql
CREATE TABLE listing_features (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  type TEXT NOT NULL,
  title TEXT,
  content TEXT,
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Dynamic Features:**
- `type` - Feature type: amenity, specification, highlight, etc.
- `title` - Feature name/label
- `content` - Feature description or value
- `display_order` - Sorting order for display
- Supports unlimited custom features per listing

---

### Custom Domains Table
```sql
CREATE TABLE custom_domains (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  subdomain TEXT NOT NULL,
  domain TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Domain Management:**
- `subdomain` - Custom subdomain (e.g., "properties")
- `domain` - Full domain (e.g., "myrealestate.com")
- `verified` - DNS verification status
- `verification_token` - Token for domain verification

---

### Google Drive Credentials Table
```sql
CREATE TABLE google_drive_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date TIMESTAMP,
  folder_name TEXT DEFAULT 'Directory Images',
  folder_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Integration Fields:**
- `access_token` - Google API access token
- `refresh_token` - Token for refreshing access
- `folder_id` - Google Drive folder ID for image storage
- Supports automatic image uploads to user's Google Drive

---

## Relationships and Constraints

### Primary Relationships
1. **Users → Directories** (One-to-Many)
2. **Directories → Listings** (One-to-Many via directory_name)
3. **Directories → Collections** (One-to-Many via directory_name)
4. **Collections ↔ Listings** (Many-to-Many via collection_items)
5. **Listings → Features** (One-to-Many)

### Data Integrity Rules
- All foreign keys have proper referential integrity
- Cascade deletes for dependent records (collections when directory deleted)
- Unique constraints on critical fields (username, listing slugs)
- Default values for optional fields

### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_listings_directory ON listings(directory_name);
CREATE INDEX idx_collections_directory ON collections(directory_name);
CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_collection_items_listing ON collection_items(listing_id);
CREATE INDEX idx_listings_slug ON listings(slug);
CREATE INDEX idx_listings_active ON listings(is_active);
```

## GoHighLevel Integration Fields

### Sync Status Values
- `pending` - Not yet synced to GoHighLevel
- `synced` - Successfully synchronized
- `failed` - Sync attempt failed (see sync_error)

### External ID Fields
- `ghl_collection_id` - Maps to GoHighLevel collection
- `ghl_item_id` - Maps to GoHighLevel collection item
- `location_id` - GoHighLevel location identifier

### Error Tracking
- `sync_error` - Stores detailed error messages for troubleshooting
- Enables retry mechanisms and user notifications

## Data Migration and Versioning

### Schema Versioning
The schema supports incremental migrations using Drizzle's migration system:
```bash
npm run db:generate  # Generate migration files
npm run db:push      # Apply to database
```

### Backup Strategy
- Regular PostgreSQL dumps for full backup
- Transaction log shipping for point-in-time recovery
- Sync status preservation during migrations

## Performance Considerations

### Query Optimization
- Proper indexing on frequently queried fields
- Pagination support for large datasets
- Efficient joins for collection-listing relationships

### Scalability Features
- UUID support ready for distributed systems
- Soft delete capabilities via is_active flags
- Prepared for read replica configurations

This schema provides a robust foundation for marketplace functionality while maintaining flexibility for future enhancements and integrations.