import { 
  users, User, InsertUser, 
  designerConfigs, DesignerConfig, InsertDesignerConfig,
  portalDomains, PortalDomain, InsertPortalDomain,
  listings, Listing, InsertListing,
  listingAddons, ListingAddon, InsertListingAddon,
  formConfigurations, FormConfiguration, InsertFormConfiguration,
  formSubmissions, FormSubmission, InsertFormSubmission,
  googleDriveCredentials, GoogleDriveCredentials, InsertGoogleDriveCredentials,
  collections, Collection, InsertCollection,
  collectionItems, CollectionItem, InsertCollectionItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Storage interface with all CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGhlId(ghlUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(user: any): Promise<User>;
  updateUserOAuthTokens(userId: number, tokens: { accessToken: string; refreshToken: string; expiresIn: number }): Promise<void>;
  
  // Designer Config methods
  getDesignerConfig(userId: number): Promise<DesignerConfig | undefined>;
  createDesignerConfig(config: InsertDesignerConfig): Promise<DesignerConfig>;
  updateDesignerConfig(userId: number, config: Partial<InsertDesignerConfig>): Promise<DesignerConfig | undefined>;
  
  // Portal Domain methods
  getPortalDomain(userId: number): Promise<PortalDomain | undefined>;
  getPortalDomainBySubdomain(subdomain: string, domain: string): Promise<PortalDomain | undefined>;
  createPortalDomain(domain: InsertPortalDomain): Promise<PortalDomain>;
  updatePortalDomain(id: number, domain: Partial<InsertPortalDomain>): Promise<PortalDomain | undefined>;
  verifyPortalDomain(userId: number, subdomain: string, domain: string): Promise<boolean>;
  
  // Listing methods
  getListing(id: number): Promise<Listing | undefined>;
  getListingBySlug(slug: string): Promise<Listing | undefined>;
  getListingsByUser(userId: number): Promise<Listing[]>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
  
  // Listing Addon methods
  getListingAddon(id: number): Promise<ListingAddon | undefined>;
  getListingAddonsByListing(listingId: number): Promise<ListingAddon[]>;
  getListingAddonsByType(listingId: number, type: string): Promise<ListingAddon[]>;
  createListingAddon(addon: InsertListingAddon): Promise<ListingAddon>;
  updateListingAddon(id: number, addon: Partial<InsertListingAddon>): Promise<ListingAddon | undefined>;
  deleteListingAddon(id: number): Promise<boolean>;
  
  // Form Configuration (Directory) methods
  getFormConfiguration(id: number): Promise<FormConfiguration | undefined>;
  getFormConfigurationsByUser(userId: number): Promise<FormConfiguration[]>;
  getFormConfigurationByDirectoryName(directoryName: string): Promise<FormConfiguration | undefined>;
  createFormConfiguration(config: InsertFormConfiguration): Promise<FormConfiguration>;
  updateFormConfiguration(id: number, config: Partial<InsertFormConfiguration>): Promise<FormConfiguration | undefined>;
  deleteFormConfiguration(id: number): Promise<boolean>;
  
  // Listings by directory methods
  getListingsByDirectory(directoryName: string): Promise<Listing[]>;
  
  // Google Drive Credentials methods
  getGoogleDriveCredentials(userId: number): Promise<GoogleDriveCredentials | undefined>;
  createGoogleDriveCredentials(credentials: InsertGoogleDriveCredentials): Promise<GoogleDriveCredentials>;
  updateGoogleDriveCredentials(userId: number, credentials: Partial<InsertGoogleDriveCredentials>): Promise<GoogleDriveCredentials | undefined>;
  deactivateGoogleDriveCredentials(userId: number): Promise<boolean>;
  
  // Collection methods
  getCollection(id: number): Promise<Collection | undefined>;
  getCollectionsByUser(userId: number): Promise<Collection[]>;
  getCollectionsByDirectory(directoryName: string): Promise<Collection[]>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<boolean>;
  
  // Collection Item methods
  getCollectionItem(id: number): Promise<CollectionItem | undefined>;
  getCollectionItemsByCollection(collectionId: number): Promise<CollectionItem[]>;
  getCollectionItemsWithListings(collectionId: number): Promise<(CollectionItem & { listing?: Listing })[]>;
  getCollectionItemsByListing(listingId: number): Promise<CollectionItem[]>;
  addListingToCollection(collectionId: number, listingId: number): Promise<CollectionItem>;
  removeListingFromCollection(collectionId: number, listingId: number): Promise<boolean>;
  updateCollectionItem(id: number, item: Partial<InsertCollectionItem>): Promise<CollectionItem | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private designerConfigs: Map<number, DesignerConfig>;
  private portalDomains: Map<number, PortalDomain>;
  private listings: Map<number, Listing>;
  private listingAddons: Map<number, ListingAddon>;
  private formConfigurations: Map<number, FormConfiguration>;
  private googleDriveCredentials: Map<number, GoogleDriveCredentials>;
  private collections: Map<number, Collection>;
  private collectionItems: Map<number, CollectionItem>;
  
  currentUserId: number;
  currentConfigId: number;
  currentDomainId: number;
  currentListingId: number;
  currentListingAddonId: number;
  currentFormConfigId: number;
  currentGoogleDriveCredentialsId: number;
  currentCollectionId: number;
  currentCollectionItemId: number;

  constructor() {
    this.users = new Map();
    this.designerConfigs = new Map();
    this.portalDomains = new Map();
    this.listings = new Map();
    this.listingAddons = new Map();
    this.formConfigurations = new Map();
    this.googleDriveCredentials = new Map();
    this.collections = new Map();
    this.collectionItems = new Map();
    
    this.currentUserId = 1;
    this.currentConfigId = 1;
    this.currentDomainId = 1;
    this.currentListingId = 1;
    this.currentListingAddonId = 1;
    this.currentFormConfigId = 1;
    this.currentGoogleDriveCredentialsId = 1;
    this.currentCollectionId = 1;
    this.currentCollectionItemId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Designer Config methods
  async getDesignerConfig(userId: number): Promise<DesignerConfig | undefined> {
    return Array.from(this.designerConfigs.values()).find(
      (config) => config.userId === userId,
    );
  }
  
  async createDesignerConfig(config: InsertDesignerConfig): Promise<DesignerConfig> {
    const id = this.currentConfigId++;
    const designerConfig: DesignerConfig = { ...config, id };
    this.designerConfigs.set(id, designerConfig);
    return designerConfig;
  }
  
  async updateDesignerConfig(userId: number, config: Partial<InsertDesignerConfig>): Promise<DesignerConfig | undefined> {
    const existingConfig = await this.getDesignerConfig(userId);
    
    if (!existingConfig) {
      return undefined;
    }
    
    const updatedConfig: DesignerConfig = { ...existingConfig, ...config };
    this.designerConfigs.set(existingConfig.id, updatedConfig);
    return updatedConfig;
  }
  
  // Portal Domain methods
  async getPortalDomain(userId: number): Promise<PortalDomain | undefined> {
    return Array.from(this.portalDomains.values()).find(
      (domain) => domain.userId === userId,
    );
  }
  
  async getPortalDomainBySubdomain(subdomain: string, domain: string): Promise<PortalDomain | undefined> {
    return Array.from(this.portalDomains.values()).find(
      (portalDomain) => portalDomain.subdomain === subdomain && portalDomain.domain === domain,
    );
  }
  
  async createPortalDomain(domain: InsertPortalDomain): Promise<PortalDomain> {
    const id = this.currentDomainId++;
    const portalDomain: PortalDomain = { ...domain, id };
    this.portalDomains.set(id, portalDomain);
    return portalDomain;
  }
  
  async updatePortalDomain(id: number, domain: Partial<InsertPortalDomain>): Promise<PortalDomain | undefined> {
    const existingDomain = this.portalDomains.get(id);
    
    if (!existingDomain) {
      return undefined;
    }
    
    const updatedDomain: PortalDomain = { ...existingDomain, ...domain };
    this.portalDomains.set(id, updatedDomain);
    return updatedDomain;
  }
  
  async verifyPortalDomain(userId: number, subdomain: string, domain: string): Promise<boolean> {
    const portalDomain = await this.getPortalDomainBySubdomain(subdomain, domain);
    
    if (!portalDomain || portalDomain.userId !== userId) {
      return false;
    }
    
    // Simulate domain verification (in real implementation, this would check DNS records)
    const updatedDomain = { ...portalDomain, verified: true };
    this.portalDomains.set(portalDomain.id, updatedDomain);
    return true;
  }
  
  // Listing methods
  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }
  
  async getListingBySlug(slug: string): Promise<Listing | undefined> {
    return Array.from(this.listings.values()).find(
      (listing) => listing.slug === slug
    );
  }
  
  async getListingsByUser(userId: number): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(
      (listing) => listing.userId === userId
    );
  }
  
  async createListing(insertListing: InsertListing): Promise<Listing> {
    const id = this.currentListingId++;
    const now = new Date();
    const listing: Listing = { 
      ...insertListing, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.listings.set(id, listing);
    return listing;
  }
  
  async updateListing(id: number, partialListing: Partial<InsertListing>): Promise<Listing | undefined> {
    const existingListing = this.listings.get(id);
    
    if (!existingListing) {
      return undefined;
    }
    
    const updatedListing: Listing = { 
      ...existingListing, 
      ...partialListing,
      updatedAt: new Date()
    };
    
    this.listings.set(id, updatedListing);
    return updatedListing;
  }
  
  async deleteListing(id: number): Promise<boolean> {
    const exists = this.listings.has(id);
    if (exists) {
      this.listings.delete(id);
      return true;
    }
    return false;
  }

  // Listing Addon methods
  async getListingAddon(id: number): Promise<ListingAddon | undefined> {
    return this.listingAddons.get(id);
  }

  async getListingAddonsByListing(listingId: number): Promise<ListingAddon[]> {
    return Array.from(this.listingAddons.values())
      .filter(addon => addon.listingId === listingId)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getListingAddonsByType(listingId: number, type: string): Promise<ListingAddon[]> {
    return Array.from(this.listingAddons.values())
      .filter(addon => addon.listingId === listingId && addon.type === type)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async createListingAddon(insertAddon: InsertListingAddon): Promise<ListingAddon> {
    const id = this.currentListingAddonId++;
    
    // Set timestamps
    const now = new Date();
    
    const addon: ListingAddon = { 
      ...insertAddon, 
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.listingAddons.set(id, addon);
    return addon;
  }

  async updateListingAddon(id: number, partialAddon: Partial<InsertListingAddon>): Promise<ListingAddon | undefined> {
    const existingAddon = this.listingAddons.get(id);
    
    if (!existingAddon) {
      return undefined;
    }
    
    const updatedAddon: ListingAddon = { 
      ...existingAddon, 
      ...partialAddon,
      updatedAt: new Date()
    };
    
    this.listingAddons.set(id, updatedAddon);
    return updatedAddon;
  }

  async deleteListingAddon(id: number): Promise<boolean> {
    const exists = this.listingAddons.has(id);
    if (exists) {
      this.listingAddons.delete(id);
      return true;
    }
    return false;
  }

  // Google Drive Credentials methods
  async getGoogleDriveCredentials(userId: number): Promise<GoogleDriveCredentials | undefined> {
    return Array.from(this.googleDriveCredentials.values())
      .find(cred => cred.userId === userId && cred.isActive);
  }

  async createGoogleDriveCredentials(insertCredentials: InsertGoogleDriveCredentials): Promise<GoogleDriveCredentials> {
    const id = this.currentGoogleDriveCredentialsId++;
    const now = new Date();
    
    // Deactivate any existing credentials for this user
    await this.deactivateGoogleDriveCredentials(insertCredentials.userId);
    
    const credentials: GoogleDriveCredentials = {
      ...insertCredentials,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.googleDriveCredentials.set(id, credentials);
    return credentials;
  }

  async updateGoogleDriveCredentials(userId: number, partialCredentials: Partial<InsertGoogleDriveCredentials>): Promise<GoogleDriveCredentials | undefined> {
    const existingCredentials = Array.from(this.googleDriveCredentials.values())
      .find(cred => cred.userId === userId && cred.isActive);
    
    if (!existingCredentials) {
      return undefined;
    }
    
    const updatedCredentials: GoogleDriveCredentials = {
      ...existingCredentials,
      ...partialCredentials,
      updatedAt: new Date()
    };
    
    this.googleDriveCredentials.set(existingCredentials.id, updatedCredentials);
    return updatedCredentials;
  }

  async deactivateGoogleDriveCredentials(userId: number): Promise<boolean> {
    const existingCredentials = Array.from(this.googleDriveCredentials.values())
      .find(cred => cred.userId === userId && cred.isActive);
    
    if (!existingCredentials) {
      return false;
    }
    
    const deactivatedCredentials: GoogleDriveCredentials = {
      ...existingCredentials,
      isActive: false,
      updatedAt: new Date()
    };
    
    this.googleDriveCredentials.set(existingCredentials.id, deactivatedCredentials);
    return true;
  }

  // Form Configuration (Directory) methods
  async getFormConfiguration(id: number): Promise<FormConfiguration | undefined> {
    return this.formConfigurations.get(id);
  }

  async getFormConfigurationsByUser(userId: number): Promise<FormConfiguration[]> {
    return Array.from(this.formConfigurations.values()).filter(
      (config) => config.userId === userId
    );
  }

  async getFormConfigurationByDirectoryName(directoryName: string): Promise<FormConfiguration | undefined> {
    return Array.from(this.formConfigurations.values()).find(
      (config) => config.directoryName === directoryName
    );
  }

  async createFormConfiguration(insertConfig: InsertFormConfiguration): Promise<FormConfiguration> {
    const id = this.currentFormConfigId++;
    const now = new Date();
    const formConfig: FormConfiguration = {
      ...insertConfig,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.formConfigurations.set(id, formConfig);
    return formConfig;
  }

  async updateFormConfiguration(id: number, partialConfig: Partial<InsertFormConfiguration>): Promise<FormConfiguration | undefined> {
    const existingConfig = this.formConfigurations.get(id);
    
    if (!existingConfig) {
      return undefined;
    }
    
    const updatedConfig: FormConfiguration = {
      ...existingConfig,
      ...partialConfig,
      updatedAt: new Date()
    };
    
    this.formConfigurations.set(id, updatedConfig);
    return updatedConfig;
  }

  async deleteFormConfiguration(id: number): Promise<boolean> {
    const exists = this.formConfigurations.has(id);
    if (exists) {
      this.formConfigurations.delete(id);
      return true;
    }
    return false;
  }

  async getListingsByDirectory(directoryName: string): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(
      (listing) => listing.directoryName === directoryName
    );
  }

  // Collection methods
  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async getCollectionsByUser(userId: number): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(
      (collection) => collection.userId === userId
    );
  }

  async getCollectionsByDirectory(directoryName: string): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(
      (collection) => collection.directoryName === directoryName
    );
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.currentCollectionId++;
    const now = new Date();
    const collection: Collection = {
      ...insertCollection,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.collections.set(id, collection);
    return collection;
  }

  async updateCollection(id: number, partialCollection: Partial<InsertCollection>): Promise<Collection | undefined> {
    const existingCollection = this.collections.get(id);
    
    if (!existingCollection) {
      return undefined;
    }
    
    const updatedCollection: Collection = {
      ...existingCollection,
      ...partialCollection,
      updatedAt: new Date()
    };
    
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }

  async deleteCollection(id: number): Promise<boolean> {
    const exists = this.collections.has(id);
    if (exists) {
      // Also delete all collection items
      const itemsToDelete = Array.from(this.collectionItems.values())
        .filter(item => item.collectionId === id);
      itemsToDelete.forEach(item => this.collectionItems.delete(item.id));
      
      this.collections.delete(id);
      return true;
    }
    return false;
  }

  // Get all methods for AI agent
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllDirectories(): Promise<DirectoryConfig[]> {
    return Array.from(this.directories.values());
  }

  async getAllListings(): Promise<Listing[]> {
    return Array.from(this.listings.values());
  }

  async getAllCollections(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }

  async getDirectoriesByUser(userId: number): Promise<DirectoryConfig[]> {
    return Array.from(this.directories.values()).filter(dir => dir.userId === userId);
  }

  async getListingsByUser(userId: number): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(listing => listing.userId === userId);
  }

  async getCollectionsByUser(userId: number): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(collection => collection.userId === userId);
  }

  // Collection Item methods
  async getCollectionItem(id: number): Promise<CollectionItem | undefined> {
    return this.collectionItems.get(id);
  }

  async getCollectionItemsByCollection(collectionId: number): Promise<CollectionItem[]> {
    return Array.from(this.collectionItems.values()).filter(
      (item) => item.collectionId === collectionId
    );
  }

  async getCollectionItemsWithListings(collectionId: number): Promise<(CollectionItem & { listing?: Listing })[]> {
    const items = Array.from(this.collectionItems.values()).filter(
      (item) => item.collectionId === collectionId
    );
    
    return items.map(item => ({
      ...item,
      listing: this.listings.get(item.listingId)
    }));
  }

  async getCollectionItemsByListing(listingId: number): Promise<CollectionItem[]> {
    return Array.from(this.collectionItems.values()).filter(
      (item) => item.listingId === listingId
    );
  }

  async addListingToCollection(collectionId: number, listingId: number): Promise<CollectionItem> {
    const id = this.currentCollectionItemId++;
    const now = new Date();
    const item: CollectionItem = {
      id,
      collectionId,
      listingId,
      ghlItemId: null,
      syncStatus: 'pending',
      syncError: null,
      addedAt: now
    };
    this.collectionItems.set(id, item);
    return item;
  }

  async removeListingFromCollection(collectionId: number, listingId: number): Promise<boolean> {
    const item = Array.from(this.collectionItems.values()).find(
      (item) => item.collectionId === collectionId && item.listingId === listingId
    );
    
    if (item) {
      this.collectionItems.delete(item.id);
      return true;
    }
    return false;
  }

  async updateCollectionItem(id: number, partialItem: Partial<InsertCollectionItem>): Promise<CollectionItem | undefined> {
    const existingItem = this.collectionItems.get(id);
    
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem: CollectionItem = {
      ...existingItem,
      ...partialItem
    };
    
    this.collectionItems.set(id, updatedItem);
    return updatedItem;
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // OAuth-specific user methods
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByGhlId(ghlUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.ghlUserId, ghlUserId));
    return user || undefined;
  }

  async createOAuthUser(userData: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: userData.email,
        email: userData.email,
        displayName: userData.name,
        ghlUserId: userData.ghlUserId,
        ghlLocationId: userData.ghlLocationId,
        ghlLocationName: userData.ghlLocationName,
        ghlScopes: userData.ghlScopes,
        authType: 'oauth',
        isActive: true,
      })
      .returning();
    return user;
  }

  async updateUserOAuthTokens(userId: number, tokens: { accessToken: string; refreshToken: string; expiresIn: number }): Promise<void> {
    const expiryDate = new Date(Date.now() + tokens.expiresIn * 1000);
    
    await db
      .update(users)
      .set({
        ghlAccessToken: tokens.accessToken,
        ghlRefreshToken: tokens.refreshToken,
        ghlTokenExpiry: expiryDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  // Designer Config methods
  async getDesignerConfig(userId: number): Promise<DesignerConfig | undefined> {
    const [config] = await db.select().from(designerConfigs).where(eq(designerConfigs.userId, userId));
    return config || undefined;
  }

  async createDesignerConfig(insertConfig: InsertDesignerConfig): Promise<DesignerConfig> {
    const [config] = await db
      .insert(designerConfigs)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateDesignerConfig(userId: number, partialConfig: Partial<InsertDesignerConfig>): Promise<DesignerConfig | undefined> {
    const [config] = await db
      .update(designerConfigs)
      .set(partialConfig)
      .where(eq(designerConfigs.userId, userId))
      .returning();
    return config || undefined;
  }

  // Portal Domain methods
  async getPortalDomain(userId: number): Promise<PortalDomain | undefined> {
    const [domain] = await db.select().from(portalDomains).where(eq(portalDomains.userId, userId));
    return domain || undefined;
  }

  async getPortalDomainBySubdomain(subdomain: string, domain: string): Promise<PortalDomain | undefined> {
    const [result] = await db.select().from(portalDomains)
      .where(and(eq(portalDomains.subdomain, subdomain), eq(portalDomains.domain, domain)));
    return result || undefined;
  }

  async createPortalDomain(insertDomain: InsertPortalDomain): Promise<PortalDomain> {
    const [domain] = await db
      .insert(portalDomains)
      .values(insertDomain)
      .returning();
    return domain;
  }

  async updatePortalDomain(id: number, partialDomain: Partial<InsertPortalDomain>): Promise<PortalDomain | undefined> {
    const [domain] = await db
      .update(portalDomains)
      .set(partialDomain)
      .where(eq(portalDomains.id, id))
      .returning();
    return domain || undefined;
  }

  async verifyPortalDomain(userId: number, subdomain: string, domain: string): Promise<boolean> {
    const [result] = await db
      .update(portalDomains)
      .set({ verified: true })
      .where(and(
        eq(portalDomains.userId, userId),
        eq(portalDomains.subdomain, subdomain),
        eq(portalDomains.domain, domain)
      ))
      .returning();
    return !!result;
  }

  // Listing methods
  async getListing(id: number): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.id, id));
    return listing || undefined;
  }

  async getListingBySlug(slug: string): Promise<Listing | undefined> {
    const [listing] = await db.select().from(listings).where(eq(listings.slug, slug));
    return listing || undefined;
  }

  async getListingsByUser(userId: number): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.userId, userId));
  }

  async getListingsByDirectory(directoryName: string): Promise<Listing[]> {
    return await db.select().from(listings).where(eq(listings.directoryName, directoryName));
  }

  async createListing(insertListing: InsertListing): Promise<Listing> {
    const [listing] = await db
      .insert(listings)
      .values(insertListing)
      .returning();
    return listing;
  }

  async updateListing(id: number, partialListing: Partial<InsertListing>): Promise<Listing | undefined> {
    const [listing] = await db
      .update(listings)
      .set(partialListing)
      .where(eq(listings.id, id))
      .returning();
    return listing || undefined;
  }

  async deleteListing(id: number): Promise<boolean> {
    const result = await db.delete(listings).where(eq(listings.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Listing Addon methods
  async getListingAddon(id: number): Promise<ListingAddon | undefined> {
    const [addon] = await db.select().from(listingAddons).where(eq(listingAddons.id, id));
    return addon || undefined;
  }

  async getListingAddonsByListing(listingId: number): Promise<ListingAddon[]> {
    const addons = await db.select().from(listingAddons)
      .where(eq(listingAddons.listingId, listingId));
    return addons.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async getListingAddonsByType(listingId: number, type: string): Promise<ListingAddon[]> {
    const addons = await db.select().from(listingAddons)
      .where(and(eq(listingAddons.listingId, listingId), eq(listingAddons.type, type)));
    return addons.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  async createListingAddon(insertAddon: InsertListingAddon): Promise<ListingAddon> {
    const [addon] = await db
      .insert(listingAddons)
      .values(insertAddon)
      .returning();
    return addon;
  }

  async updateListingAddon(id: number, partialAddon: Partial<InsertListingAddon>): Promise<ListingAddon | undefined> {
    const [addon] = await db
      .update(listingAddons)
      .set(partialAddon)
      .where(eq(listingAddons.id, id))
      .returning();
    return addon || undefined;
  }

  async deleteListingAddon(id: number): Promise<boolean> {
    const result = await db.delete(listingAddons).where(eq(listingAddons.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Form Configuration (Directory) methods
  async getFormConfiguration(id: number): Promise<FormConfiguration | undefined> {
    const [config] = await db.select().from(formConfigurations).where(eq(formConfigurations.id, id));
    return config || undefined;
  }

  async getFormConfigurationsByUser(userId: number): Promise<FormConfiguration[]> {
    return await db.select().from(formConfigurations).where(eq(formConfigurations.userId, userId));
  }

  async getFormConfigurationByName(userId: number, directoryName: string): Promise<FormConfiguration | undefined> {
    const [config] = await db.select().from(formConfigurations)
      .where(and(eq(formConfigurations.userId, userId), eq(formConfigurations.directoryName, directoryName)));
    return config || undefined;
  }

  async getFormConfigurationByDirectoryName(directoryName: string): Promise<FormConfiguration | undefined> {
    const [config] = await db.select().from(formConfigurations)
      .where(eq(formConfigurations.directoryName, directoryName));
    return config || undefined;
  }

  async createFormConfiguration(insertConfig: InsertFormConfiguration): Promise<FormConfiguration> {
    const [config] = await db
      .insert(formConfigurations)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateFormConfiguration(id: number, partialConfig: Partial<InsertFormConfiguration>): Promise<FormConfiguration | undefined> {
    const [config] = await db
      .update(formConfigurations)
      .set(partialConfig)
      .where(eq(formConfigurations.id, id))
      .returning();
    return config || undefined;
  }

  async deleteFormConfiguration(id: number): Promise<boolean> {
    const result = await db.delete(formConfigurations).where(eq(formConfigurations.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Form Submission methods
  async createFormSubmission(insertSubmission: InsertFormSubmission): Promise<FormSubmission> {
    const [submission] = await db
      .insert(formSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getFormSubmissionsByConfig(configId: number): Promise<FormSubmission[]> {
    return await db.select().from(formSubmissions).where(eq(formSubmissions.formConfigurationId, configId));
  }

  // Google Drive Credentials methods
  async getGoogleDriveCredentials(userId: number): Promise<GoogleDriveCredentials | undefined> {
    const [credentials] = await db.select().from(googleDriveCredentials)
      .where(and(eq(googleDriveCredentials.userId, userId), eq(googleDriveCredentials.isActive, true)));
    return credentials || undefined;
  }

  async createGoogleDriveCredentials(insertCredentials: InsertGoogleDriveCredentials): Promise<GoogleDriveCredentials> {
    const [credentials] = await db
      .insert(googleDriveCredentials)
      .values(insertCredentials)
      .returning();
    return credentials;
  }

  async updateGoogleDriveCredentials(id: number, partialCredentials: Partial<InsertGoogleDriveCredentials>): Promise<GoogleDriveCredentials | undefined> {
    const [credentials] = await db
      .update(googleDriveCredentials)
      .set(partialCredentials)
      .where(eq(googleDriveCredentials.id, id))
      .returning();
    return credentials || undefined;
  }

  async deleteGoogleDriveCredentials(id: number): Promise<boolean> {
    const result = await db.delete(googleDriveCredentials).where(eq(googleDriveCredentials.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deactivateGoogleDriveCredentials(userId: number): Promise<boolean> {
    const result = await db
      .update(googleDriveCredentials)
      .set({ isActive: false })
      .where(eq(googleDriveCredentials.userId, userId));
    return (result.rowCount || 0) > 0;
  }

  // Collection methods
  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection || undefined;
  }

  async getCollectionsByUser(userId: number): Promise<Collection[]> {
    return await db.select().from(collections).where(eq(collections.userId, userId));
  }

  async getCollectionsByDirectory(directoryName: string): Promise<Collection[]> {
    return await db.select().from(collections).where(eq(collections.directoryName, directoryName));
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values(insertCollection)
      .returning();
    return collection;
  }

  async updateCollection(id: number, partialCollection: Partial<InsertCollection>): Promise<Collection | undefined> {
    const [collection] = await db
      .update(collections)
      .set(partialCollection)
      .where(eq(collections.id, id))
      .returning();
    return collection || undefined;
  }

  async deleteCollection(id: number): Promise<boolean> {
    // First delete all collection items
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, id));
    
    // Then delete the collection
    const result = await db.delete(collections).where(eq(collections.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Collection Item methods
  async getCollectionItem(id: number): Promise<CollectionItem | undefined> {
    const [item] = await db.select().from(collectionItems).where(eq(collectionItems.id, id));
    return item || undefined;
  }

  async getCollectionItemsByCollection(collectionId: number): Promise<CollectionItem[]> {
    return await db.select().from(collectionItems).where(eq(collectionItems.collectionId, collectionId));
  }

  async getCollectionItemsWithListings(collectionId: number): Promise<(CollectionItem & { listing?: Listing })[]> {
    const items = await db
      .select({
        collectionItem: collectionItems,
        listing: listings
      })
      .from(collectionItems)
      .leftJoin(listings, eq(collectionItems.listingId, listings.id))
      .where(eq(collectionItems.collectionId, collectionId));

    return items.map(row => ({
      ...row.collectionItem,
      listing: row.listing || undefined
    }));
  }

  async getCollectionItemsByListing(listingId: number): Promise<CollectionItem[]> {
    return await db.select().from(collectionItems).where(eq(collectionItems.listingId, listingId));
  }

  async addListingToCollection(collectionId: number, listingId: number): Promise<CollectionItem> {
    const [item] = await db
      .insert(collectionItems)
      .values({
        collectionId,
        listingId,
        syncStatus: 'pending'
      })
      .returning();
    return item;
  }

  async removeListingFromCollection(collectionId: number, listingId: number): Promise<boolean> {
    const result = await db.delete(collectionItems)
      .where(and(
        eq(collectionItems.collectionId, collectionId),
        eq(collectionItems.listingId, listingId)
      ));
    return (result.rowCount || 0) > 0;
  }

  async updateCollectionItem(id: number, partialItem: Partial<InsertCollectionItem>): Promise<CollectionItem | undefined> {
    const [item] = await db
      .update(collectionItems)
      .set(partialItem)
      .where(eq(collectionItems.id, id))
      .returning();
    return item || undefined;
  }
}

export const storage = new DatabaseStorage();
