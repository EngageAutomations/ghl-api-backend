import { IStorage } from "./storage";
import { 
  User, InsertUser, 
  OAuthInstallation, InsertOAuthInstallation,
  DesignerConfig, InsertDesignerConfig,
  PortalDomain, InsertPortalDomain,
  Listing, InsertListing,
  ListingAddon, InsertListingAddon,
  FormConfiguration, InsertFormConfiguration,
  FormSubmission, InsertFormSubmission,
  FormField, InsertFormField,
  GoogleDriveCredentials, InsertGoogleDriveCredentials,
  Collection, InsertCollection,
  CollectionItem, InsertCollectionItem,
  WizardFormTemplate, InsertWizardFormTemplate,
  LocationEnhancement, InsertLocationEnhancement
} from "@shared/schema";

/**
 * Development Mock Storage Implementation
 * Provides working directory, collection, and listing functionality for testing API endpoints
 */
export class MockStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private formConfigurations: Map<number, FormConfiguration> = new Map();
  private listings: Map<number, Listing> = new Map();
  private collections: Map<number, Collection> = new Map();
  private collectionItems: Map<number, CollectionItem> = new Map();
  private designerConfigs: Map<number, DesignerConfig> = new Map();
  private portalDomains: Map<number, PortalDomain> = new Map();
  private listingAddons: Map<number, ListingAddon> = new Map();
  private formSubmissions: Map<number, FormSubmission> = new Map();
  private formFields: Map<number, FormField> = new Map();
  private googleDriveCredentials: Map<number, GoogleDriveCredentials> = new Map();
  private oauthInstallations: Map<string, OAuthInstallation> = new Map();
  private wizardFormTemplates: Map<number, WizardFormTemplate> = new Map();
  private locationEnhancements: Map<number, LocationEnhancement> = new Map();
  
  private nextUserId = 2;
  private nextFormConfigId = 1;
  private nextListingId = 1;
  private nextCollectionId = 1;
  private nextCollectionItemId = 1;
  private nextDesignerConfigId = 1;
  private nextPortalDomainId = 1;
  private nextListingAddonId = 1;
  private nextFormSubmissionId = 1;
  private nextFormFieldId = 1;
  private nextGoogleDriveCredentialsId = 1;
  private nextOAuthInstallationId = 1;
  private nextWizardTemplateId = 1;
  private nextLocationEnhancementId = 1;

  constructor() {
    // Initialize with default user
    const defaultUser: User = {
      id: 1,
      username: 'developer@test.com',
      password: 'test123',
      displayName: 'Developer',
      email: 'developer@test.com',
      ghlUserId: null,
      ghlAccessToken: null,
      ghlRefreshToken: null,
      ghlTokenExpiry: null,
      ghlScopes: null,
      ghlLocationId: null,
      ghlLocationName: null,
      authType: 'local',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(1, defaultUser);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserByGhlId(ghlUserId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.ghlUserId === ghlUserId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextUserId++,
      username: user.username,
      password: user.password || '',
      displayName: user.displayName || user.username,
      email: user.email || user.username,
      ghlUserId: user.ghlUserId || null,
      ghlAccessToken: user.ghlAccessToken || null,
      ghlRefreshToken: user.ghlRefreshToken || null,
      ghlTokenExpiry: user.ghlTokenExpiry || null,
      ghlScopes: user.ghlScopes || null,
      ghlLocationId: user.ghlLocationId || null,
      ghlLocationName: user.ghlLocationName || null,
      authType: user.authType || 'local',
      isActive: user.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async createOAuthUser(user: any): Promise<User> {
    return this.createUser(user);
  }

  async updateUserOAuthTokens(userId: number, tokens: any): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...tokens, updatedAt: new Date() };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Form Configuration methods (used for directories)
  async getFormConfigurationsByUser(userId: number): Promise<FormConfiguration[]> {
    return Array.from(this.formConfigurations.values()).filter(config => config.userId === userId);
  }

  async getFormConfiguration(id: number): Promise<FormConfiguration | undefined> {
    return this.formConfigurations.get(id);
  }

  async getFormConfigurationByDirectory(directoryName: string, userId?: number): Promise<FormConfiguration | undefined> {
    return Array.from(this.formConfigurations.values()).find(config => 
      config.directoryName === directoryName && (!userId || config.userId === userId)
    );
  }

  async createFormConfiguration(config: InsertFormConfiguration): Promise<FormConfiguration> {
    const newConfig: FormConfiguration = {
      id: this.nextFormConfigId++,
      userId: config.userId,
      directoryName: config.directoryName,
      logoUrl: config.logoUrl || null,
      actionButtonColor: config.actionButtonColor || '#3b82f6',
      config: config.config || {},
      isActive: config.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.formConfigurations.set(newConfig.id, newConfig);
    console.log(`[MOCK STORAGE] Created directory: ${newConfig.directoryName} with ID: ${newConfig.id}`);
    return newConfig;
  }

  async updateFormConfiguration(id: number, config: Partial<InsertFormConfiguration>): Promise<FormConfiguration | undefined> {
    const existing = this.formConfigurations.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...config, updatedAt: new Date() };
    this.formConfigurations.set(id, updated);
    return updated;
  }

  async deleteFormConfiguration(id: number): Promise<boolean> {
    return this.formConfigurations.delete(id);
  }

  // Listing methods
  async getListingsByUser(userId: number): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(listing => listing.userId === userId);
  }

  async getListingsByDirectory(directoryName: string): Promise<Listing[]> {
    return Array.from(this.listings.values()).filter(listing => listing.directoryName === directoryName);
  }

  async getListing(id: number): Promise<Listing | undefined> {
    return this.listings.get(id);
  }

  async getListingBySlug(slug: string): Promise<Listing | undefined> {
    return Array.from(this.listings.values()).find(listing => listing.slug === slug);
  }

  async createListing(listing: InsertListing): Promise<Listing> {
    const newListing: Listing = {
      id: this.nextListingId++,
      userId: listing.userId,
      title: listing.title,
      slug: listing.slug,
      directoryName: listing.directoryName || null,
      category: listing.category || null,
      location: listing.location || null,
      description: listing.description || null,
      price: listing.price || null,
      downloadUrl: listing.downloadUrl || null,
      linkUrl: listing.linkUrl || null,
      popupUrl: listing.popupUrl || null,
      embedFormUrl: listing.embedFormUrl || null,
      imageUrl: listing.imageUrl || null,
      isActive: listing.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.listings.set(newListing.id, newListing);
    console.log(`[MOCK STORAGE] Created listing: ${newListing.title} with ID: ${newListing.id}`);
    return newListing;
  }

  async updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined> {
    const existing = this.listings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...listing, updatedAt: new Date() };
    this.listings.set(id, updated);
    return updated;
  }

  async deleteListing(id: number): Promise<boolean> {
    return this.listings.delete(id);
  }

  // Collection methods
  async getCollectionsByUser(userId: number): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(collection => collection.userId === userId);
  }

  async getCollectionsByDirectory(directoryName: string): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(collection => collection.directoryName === directoryName);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(collection: InsertCollection): Promise<Collection> {
    const newCollection: Collection = {
      id: this.nextCollectionId++,
      userId: collection.userId,
      name: collection.name,
      description: collection.description || null,
      directoryName: collection.directoryName || null,
      imageUrl: collection.imageUrl || null,
      isActive: collection.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.collections.set(newCollection.id, newCollection);
    console.log(`[MOCK STORAGE] Created collection: ${newCollection.name} with ID: ${newCollection.id}`);
    return newCollection;
  }

  async updateCollection(id: number, collection: Partial<InsertCollection>): Promise<Collection | undefined> {
    const existing = this.collections.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...collection, updatedAt: new Date() };
    this.collections.set(id, updated);
    return updated;
  }

  async deleteCollection(id: number): Promise<boolean> {
    return this.collections.delete(id);
  }

  // Collection Item methods
  async getCollectionItemsByCollection(collectionId: number): Promise<CollectionItem[]> {
    return Array.from(this.collectionItems.values()).filter(item => item.collectionId === collectionId);
  }

  async getCollectionItemsWithListings(collectionId: number): Promise<(CollectionItem & { listing?: Listing })[]> {
    const items = await this.getCollectionItemsByCollection(collectionId);
    return items.map(item => ({
      ...item,
      listing: this.listings.get(item.listingId)
    }));
  }

  async getCollectionItemsByListing(listingId: number): Promise<CollectionItem[]> {
    return Array.from(this.collectionItems.values()).filter(item => item.listingId === listingId);
  }

  async addListingToCollection(collectionId: number, listingId: number): Promise<CollectionItem> {
    const newItem: CollectionItem = {
      id: this.nextCollectionItemId++,
      collectionId,
      listingId,
      position: this.nextCollectionItemId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.collectionItems.set(newItem.id, newItem);
    return newItem;
  }

  async removeListingFromCollection(collectionId: number, listingId: number): Promise<boolean> {
    const item = Array.from(this.collectionItems.values()).find(
      item => item.collectionId === collectionId && item.listingId === listingId
    );
    
    if (item) {
      return this.collectionItems.delete(item.id);
    }
    
    return false;
  }

  // Stub implementations for other required methods
  async getCollectionItem(id: number): Promise<CollectionItem | undefined> {
    return this.collectionItems.get(id);
  }

  async updateCollectionItem(id: number, item: Partial<InsertCollectionItem>): Promise<CollectionItem | undefined> {
    const existing = this.collectionItems.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...item, updatedAt: new Date() };
    this.collectionItems.set(id, updated);
    return updated;
  }

  // Stub implementations for other interfaces
  async createOAuthInstallation(installation: InsertOAuthInstallation): Promise<OAuthInstallation> {
    throw new Error("OAuth operations handled by Railway backend");
  }

  async getOAuthInstallation(ghlUserId: string): Promise<OAuthInstallation | undefined> {
    return this.oauthInstallations.get(ghlUserId);
  }

  async getLatestOAuthInstallation(): Promise<OAuthInstallation | undefined> {
    const installations = Array.from(this.oauthInstallations.values());
    return installations[installations.length - 1];
  }

  async getAllOAuthInstallations(): Promise<OAuthInstallation[]> {
    return Array.from(this.oauthInstallations.values());
  }

  // Designer Config stub methods
  async getDesignerConfig(userId: number): Promise<DesignerConfig | undefined> {
    return this.designerConfigs.get(userId);
  }

  async getDesignerConfigByDirectory(directoryName: string, userId?: number): Promise<DesignerConfig | undefined> {
    return Array.from(this.designerConfigs.values()).find(config => 
      config.directoryName === directoryName && (!userId || config.userId === userId)
    );
  }

  async createDesignerConfig(config: InsertDesignerConfig): Promise<DesignerConfig> {
    const newConfig: DesignerConfig = {
      id: this.nextDesignerConfigId++,
      userId: config.userId,
      directoryName: config.directoryName || 'default',
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as DesignerConfig;
    
    this.designerConfigs.set(newConfig.id, newConfig);
    return newConfig;
  }

  async updateDesignerConfig(id: number, config: Partial<InsertDesignerConfig>): Promise<DesignerConfig | undefined> {
    const existing = this.designerConfigs.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...config, updatedAt: new Date() };
    this.designerConfigs.set(id, updated);
    return updated;
  }

  // Portal Domain stub methods
  async getPortalDomain(userId: number): Promise<PortalDomain | undefined> {
    return Array.from(this.portalDomains.values()).find(domain => domain.userId === userId);
  }

  async getPortalDomainBySubdomain(subdomain: string, domain: string): Promise<PortalDomain | undefined> {
    return Array.from(this.portalDomains.values()).find(pd => 
      pd.subdomain === subdomain && pd.domain === domain
    );
  }

  async createPortalDomain(domain: InsertPortalDomain): Promise<PortalDomain> {
    const newDomain: PortalDomain = {
      id: this.nextPortalDomainId++,
      ...domain,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as PortalDomain;
    
    this.portalDomains.set(newDomain.id, newDomain);
    return newDomain;
  }

  async updatePortalDomain(id: number, domain: Partial<InsertPortalDomain>): Promise<PortalDomain | undefined> {
    const existing = this.portalDomains.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...domain, updatedAt: new Date() };
    this.portalDomains.set(id, updated);
    return updated;
  }

  async verifyPortalDomain(userId: number, subdomain: string, domain: string): Promise<boolean> {
    return true; // Mock verification
  }

  // Stub implementations for other required methods
  async getListingAddons(listingId: number): Promise<ListingAddon[]> { return []; }
  async createListingAddon(addon: InsertListingAddon): Promise<ListingAddon> { throw new Error("Not implemented"); }
  async updateListingAddon(id: number, addon: Partial<InsertListingAddon>): Promise<ListingAddon | undefined> { return undefined; }
  async deleteListingAddon(id: number): Promise<boolean> { return false; }
  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> { throw new Error("Not implemented"); }
  async getFormSubmissions(locationId: string, directoryName: string): Promise<FormSubmission[]> { return []; }
  async getFormSubmissionsByDate(locationId: string, directoryName: string, startDate: Date, endDate: Date): Promise<FormSubmission[]> { return []; }
  async getFormFields(submissionId: number): Promise<FormField[]> { return []; }
  async createFormField(field: InsertFormField): Promise<FormField> { throw new Error("Not implemented"); }
  async getGoogleDriveCredentials(userId: number): Promise<GoogleDriveCredentials | undefined> { return undefined; }
  async createGoogleDriveCredentials(credentials: InsertGoogleDriveCredentials): Promise<GoogleDriveCredentials> { throw new Error("Not implemented"); }
  async updateGoogleDriveCredentials(userId: number, credentials: Partial<InsertGoogleDriveCredentials>): Promise<GoogleDriveCredentials | undefined> { return undefined; }
  async deactivateGoogleDriveCredentials(userId: number): Promise<boolean> { return false; }

  // OAuth Installation methods
  async createOAuthInstallation(installation: InsertOAuthInstallation): Promise<OAuthInstallation> {
    const newInstallation: OAuthInstallation = {
      id: this.nextOAuthInstallationId++,
      ghlUserId: installation.ghlUserId,
      ghlCompanyId: installation.ghlCompanyId,
      ghlLocationId: installation.ghlLocationId,
      ghlLocationName: installation.ghlLocationName,
      accessToken: installation.accessToken,
      refreshToken: installation.refreshToken,
      tokenExpiry: installation.tokenExpiry,
      scopes: installation.scopes,
      isActive: installation.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.oauthInstallations.set(newInstallation.ghlUserId, newInstallation);
    return newInstallation;
  }

  async getOAuthInstallation(ghlUserId: string): Promise<OAuthInstallation | undefined> {
    return this.oauthInstallations.get(ghlUserId);
  }

  async getLatestOAuthInstallation(): Promise<OAuthInstallation | undefined> {
    const installations = Array.from(this.oauthInstallations.values());
    return installations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async getAllOAuthInstallations(): Promise<OAuthInstallation[]> {
    return Array.from(this.oauthInstallations.values());
  }

  // Wizard Form Template methods
  async createWizardFormTemplate(template: InsertWizardFormTemplate): Promise<WizardFormTemplate> {
    const newTemplate: WizardFormTemplate = {
      id: this.nextWizardTemplateId++,
      directoryName: template.directoryName,
      wizardConfiguration: template.wizardConfiguration,
      formFields: template.formFields,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.wizardFormTemplates.set(newTemplate.id, newTemplate);
    console.log(`[MOCK STORAGE] Created wizard template for directory: ${newTemplate.directoryName}`);
    return newTemplate;
  }

  async getWizardFormTemplateByDirectory(directoryName: string): Promise<WizardFormTemplate | undefined> {
    return Array.from(this.wizardFormTemplates.values())
      .find(template => template.directoryName === directoryName);
  }

  async updateWizardFormTemplate(id: number, updates: Partial<InsertWizardFormTemplate>): Promise<WizardFormTemplate | undefined> {
    const existing = this.wizardFormTemplates.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.wizardFormTemplates.set(id, updated);
    return updated;
  }

  // Location Enhancement methods
  async createLocationEnhancement(enhancement: InsertLocationEnhancement): Promise<LocationEnhancement> {
    const newEnhancement: LocationEnhancement = {
      id: this.nextLocationEnhancementId++,
      userId: enhancement.userId,
      ghlLocationId: enhancement.ghlLocationId,
      directoryName: enhancement.directoryName,
      enhancementData: enhancement.enhancementData,
      isActive: enhancement.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.locationEnhancements.set(newEnhancement.id, newEnhancement);
    return newEnhancement;
  }

  async getLocationEnhancement(ghlLocationId: string, directoryName: string): Promise<LocationEnhancement | undefined> {
    return Array.from(this.locationEnhancements.values())
      .find(enhancement => 
        enhancement.ghlLocationId === ghlLocationId && 
        enhancement.directoryName === directoryName &&
        enhancement.isActive
      );
  }

  async updateLocationEnhancement(id: number, updates: Partial<InsertLocationEnhancement>): Promise<LocationEnhancement | undefined> {
    const existing = this.locationEnhancements.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.locationEnhancements.set(id, updated);
    return updated;
  }

  async getLocationEnhancementsByUser(userId: number): Promise<LocationEnhancement[]> {
    return Array.from(this.locationEnhancements.values())
      .filter(enhancement => enhancement.userId === userId && enhancement.isActive);
  }

  async deleteLocationEnhancement(id: number): Promise<boolean> {
    return this.locationEnhancements.delete(id);
  }
}