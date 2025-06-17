import { 
  users, User, InsertUser, 
  oauthInstallations, OAuthInstallation, InsertOAuthInstallation,
  designerConfigs, DesignerConfig, InsertDesignerConfig,
  portalDomains, PortalDomain, InsertPortalDomain,
  listings, Listing, InsertListing,
  listingAddons, ListingAddon, InsertListingAddon,
  formConfigurations, FormConfiguration, InsertFormConfiguration,
  formSubmissions, FormSubmission, InsertFormSubmission,
  formFields, FormField, InsertFormField,
  googleDriveCredentials, GoogleDriveCredentials, InsertGoogleDriveCredentials,
  collections, Collection, InsertCollection,
  collectionItems, CollectionItem, InsertCollectionItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Storage interface with all CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGhlId(ghlUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createOAuthUser(user: InsertUser): Promise<User>;
  updateUserOAuthTokens(userId: number, tokens: any): Promise<User>;
  getUsers(): Promise<User[]>;
  getOAuthUsers(): Promise<User[]>;
  
  // OAuth Installation methods
  createOAuthInstallation(installation: InsertOAuthInstallation): Promise<OAuthInstallation>;
  getOAuthInstallation(ghlUserId: string): Promise<OAuthInstallation | undefined>;
  getLatestOAuthInstallation(): Promise<OAuthInstallation | undefined>;
  getAllOAuthInstallations(): Promise<OAuthInstallation[]>;
  clearAllOAuthInstallations(): Promise<void>;
  
  // Designer Config methods
  getDesignerConfig(userId: number): Promise<DesignerConfig | undefined>;
  getDesignerConfigByDirectory(directoryName: string, userId?: number): Promise<DesignerConfig | undefined>;
  getFormConfigurationByDirectoryName(directoryName: string): Promise<FormConfiguration | undefined>;
  createDesignerConfig(config: InsertDesignerConfig): Promise<DesignerConfig>;
  updateDesignerConfig(id: number, config: Partial<InsertDesignerConfig>): Promise<DesignerConfig | undefined>;
  
  // Portal Domain methods
  getPortalDomain(userId: number): Promise<PortalDomain | undefined>;
  getPortalDomainBySubdomain(subdomain: string, domain: string): Promise<PortalDomain | undefined>;
  createPortalDomain(domain: InsertPortalDomain): Promise<PortalDomain>;
  updatePortalDomain(id: number, domain: Partial<InsertPortalDomain>): Promise<PortalDomain | undefined>;
  verifyPortalDomain(userId: number, subdomain: string, domain: string): Promise<boolean>;
  
  // Listing methods
  getListings(): Promise<Listing[]>;
  getListingsByUser(userId: number): Promise<Listing[]>;
  getListing(id: number): Promise<Listing | undefined>;
  getListingBySlug(slug: string): Promise<Listing | undefined>;
  createListing(listing: InsertListing): Promise<Listing>;
  updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined>;
  deleteListing(id: number): Promise<boolean>;
  
  // Listing Addon methods
  getListingAddons(): Promise<ListingAddon[]>;
  getListingAddonsByListing(listingId: number): Promise<ListingAddon[]>;
  getListingAddonsByType(type: string): Promise<ListingAddon[]>;
  getListingAddon(id: number): Promise<ListingAddon | undefined>;
  createListingAddon(addon: InsertListingAddon): Promise<ListingAddon>;
  updateListingAddon(id: number, addon: Partial<InsertListingAddon>): Promise<ListingAddon | undefined>;
  deleteListingAddon(id: number): Promise<boolean>;
  
  // Form Configuration methods
  getFormConfigurations(): Promise<FormConfiguration[]>;
  getFormConfigurationsByUser(userId: number): Promise<FormConfiguration[]>;
  getFormConfiguration(id: number): Promise<FormConfiguration | undefined>;
  getFormConfigurationByDirectory(directoryName: string, userId?: number): Promise<FormConfiguration | undefined>;
  createFormConfiguration(config: InsertFormConfiguration): Promise<FormConfiguration>;
  updateFormConfiguration(id: number, config: Partial<InsertFormConfiguration>): Promise<FormConfiguration | undefined>;
  deleteFormConfiguration(id: number): Promise<boolean>;
  
  // Form Submission methods
  getFormSubmissions(): Promise<FormSubmission[]>;
  getFormSubmissionsByConfig(formConfigId: number): Promise<FormSubmission[]>;
  getFormSubmission(id: number): Promise<FormSubmission | undefined>;
  createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission>;
  updateFormSubmission(id: number, submission: Partial<InsertFormSubmission>): Promise<FormSubmission | undefined>;
  deleteFormSubmission(id: number): Promise<boolean>;
  
  // Form Field methods
  getFormFields(): Promise<FormField[]>;
  getFormFieldsByConfig(formConfigId: number): Promise<FormField[]>;
  getFormFieldById(id: number): Promise<FormField | undefined>;
  createFormField(field: InsertFormField): Promise<FormField>;
  updateFormField(id: number, field: Partial<InsertFormField>): Promise<FormField | undefined>;
  deleteFormField(id: number): Promise<boolean>;
  reorderFormFields(formConfigId: number, fieldIds: number[]): Promise<void>;
  duplicateFormField(id: number): Promise<FormField | undefined>;
  
  // Google Drive Credentials methods
  getGoogleDriveCredentials(): Promise<GoogleDriveCredentials[]>;
  getGoogleDriveCredentialsByUser(userId: number): Promise<GoogleDriveCredentials[]>;
  getGoogleDriveCredential(id: number): Promise<GoogleDriveCredentials | undefined>;
  createGoogleDriveCredentials(credentials: InsertGoogleDriveCredentials): Promise<GoogleDriveCredentials>;
  updateGoogleDriveCredentials(id: number, credentials: Partial<InsertGoogleDriveCredentials>): Promise<GoogleDriveCredentials | undefined>;
  deleteGoogleDriveCredentials(id: number): Promise<boolean>;
  
  // Collection methods
  getCollections(): Promise<Collection[]>;
  getCollectionsByUser(userId: number): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  getCollectionBySlug(slug: string): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, collection: Partial<InsertCollection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<boolean>;
  
  // Collection Item methods
  getCollectionItems(): Promise<CollectionItem[]>;
  getCollectionItemsByCollection(collectionId: number): Promise<CollectionItem[]>;
  getCollectionItem(id: number): Promise<CollectionItem | undefined>;
  createCollectionItem(item: InsertCollectionItem): Promise<CollectionItem>;
  updateCollectionItem(id: number, item: Partial<InsertCollectionItem>): Promise<CollectionItem | undefined>;
  deleteCollectionItem(id: number): Promise<boolean>;
}

// Simple in-memory storage implementation
export class MemStorage implements IStorage {
  private users: User[] = [];
  private oauthInstallations: OAuthInstallation[] = [];
  private designerConfigs: DesignerConfig[] = [];
  private portalDomains: PortalDomain[] = [];
  private listings: Listing[] = [];
  private listingAddons: ListingAddon[] = [];
  private formConfigurations: FormConfiguration[] = [];
  private formSubmissions: FormSubmission[] = [];
  private formFields: FormField[] = [];
  private googleDriveCredentials: GoogleDriveCredentials[] = [];
  private collections: Collection[] = [];
  private collectionItems: CollectionItem[] = [];
  private nextId = 1;

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async getUserByGhlId(ghlUserId: string): Promise<User | undefined> {
    return this.users.find(u => u.ghlUserId === ghlUserId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextId++,
      username: user.username,
      password: user.password || null,
      displayName: user.displayName || null,
      email: user.email || null,
      ghlUserId: user.ghlUserId || null,
      ghlAccessToken: user.ghlAccessToken || null,
      ghlRefreshToken: user.ghlRefreshToken || null,
      ghlTokenExpiry: user.ghlTokenExpiry || null,
      ghlScopes: user.ghlScopes || null,
      ghlLocationId: user.ghlLocationId || null,
      ghlLocationName: user.ghlLocationName || null,
      authType: user.authType || "local",
      isActive: user.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async createOAuthUser(user: InsertUser): Promise<User> {
    return this.createUser({ ...user, authType: "oauth" });
  }

  async updateUserOAuthTokens(userId: number, tokens: any): Promise<User> {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    
    user.ghlAccessToken = tokens.ghlAccessToken;
    user.ghlRefreshToken = tokens.ghlRefreshToken;
    user.ghlTokenExpiry = tokens.ghlTokenExpiry;
    user.updatedAt = new Date();
    
    return user;
  }

  async getUsers(): Promise<User[]> {
    return this.users;
  }

  async getOAuthUsers(): Promise<User[]> {
    return this.users.filter(u => u.authType === "oauth");
  }

  // OAuth Installation methods
  async createOAuthInstallation(installation: InsertOAuthInstallation): Promise<OAuthInstallation> {
    const newInstallation: OAuthInstallation = {
      id: this.nextId++,
      ...installation,
      installationDate: new Date(),
      lastTokenRefresh: null,
      isActive: installation.isActive ?? true,
    };
    this.oauthInstallations.push(newInstallation);
    return newInstallation;
  }

  async getOAuthInstallation(ghlUserId: string): Promise<OAuthInstallation | undefined> {
    return this.oauthInstallations.find(i => i.ghlUserId === ghlUserId);
  }

  async getLatestOAuthInstallation(): Promise<OAuthInstallation | undefined> {
    return this.oauthInstallations.sort((a, b) => 
      b.installationDate.getTime() - a.installationDate.getTime()
    )[0];
  }

  async getAllOAuthInstallations(): Promise<OAuthInstallation[]> {
    return this.oauthInstallations;
  }

  async clearAllOAuthInstallations(): Promise<void> {
    this.oauthInstallations = [];
  }

  // Designer Config methods (simplified)
  async getDesignerConfig(userId: number): Promise<DesignerConfig | undefined> {
    return this.designerConfigs.find(c => c.userId === userId);
  }

  async getDesignerConfigByDirectory(directoryName: string, userId?: number): Promise<DesignerConfig | undefined> {
    return this.designerConfigs.find(c => c.directoryName === directoryName);
  }

  async getFormConfigurationByDirectoryName(directoryName: string): Promise<FormConfiguration | undefined> {
    return this.formConfigurations.find(c => c.directoryName === directoryName);
  }

  async createDesignerConfig(config: InsertDesignerConfig): Promise<DesignerConfig> {
    const newConfig: DesignerConfig = {
      id: this.nextId++,
      ...config,
    };
    this.designerConfigs.push(newConfig);
    return newConfig;
  }

  async updateDesignerConfig(id: number, config: Partial<InsertDesignerConfig>): Promise<DesignerConfig | undefined> {
    const existing = this.designerConfigs.find(c => c.id === id);
    if (!existing) return undefined;
    Object.assign(existing, config);
    return existing;
  }

  // Portal Domain methods (simplified)
  async getPortalDomain(userId: number): Promise<PortalDomain | undefined> {
    return this.portalDomains.find(d => d.userId === userId);
  }

  async getPortalDomainBySubdomain(subdomain: string, domain: string): Promise<PortalDomain | undefined> {
    return this.portalDomains.find(d => d.subdomain === subdomain && d.domain === domain);
  }

  async createPortalDomain(domain: InsertPortalDomain): Promise<PortalDomain> {
    const newDomain: PortalDomain = {
      id: this.nextId++,
      ...domain,
    };
    this.portalDomains.push(newDomain);
    return newDomain;
  }

  async updatePortalDomain(id: number, domain: Partial<InsertPortalDomain>): Promise<PortalDomain | undefined> {
    const existing = this.portalDomains.find(d => d.id === id);
    if (!existing) return undefined;
    Object.assign(existing, domain);
    return existing;
  }

  async verifyPortalDomain(userId: number, subdomain: string, domain: string): Promise<boolean> {
    const existing = this.portalDomains.find(d => 
      d.userId === userId && d.subdomain === subdomain && d.domain === domain
    );
    if (existing) {
      existing.verified = true;
      return true;
    }
    return false;
  }

  // Simplified implementations for other methods
  async getListings(): Promise<Listing[]> { return this.listings; }
  async getListingsByUser(userId: number): Promise<Listing[]> { return this.listings.filter(l => l.userId === userId); }
  async getListing(id: number): Promise<Listing | undefined> { return this.listings.find(l => l.id === id); }
  async getListingBySlug(slug: string): Promise<Listing | undefined> { return this.listings.find(l => l.slug === slug); }
  async createListing(listing: InsertListing): Promise<Listing> {
    const newListing: Listing = { id: this.nextId++, ...listing, createdAt: new Date(), updatedAt: new Date() };
    this.listings.push(newListing);
    return newListing;
  }
  async updateListing(id: number, listing: Partial<InsertListing>): Promise<Listing | undefined> {
    const existing = this.listings.find(l => l.id === id);
    if (!existing) return undefined;
    Object.assign(existing, listing, { updatedAt: new Date() });
    return existing;
  }
  async deleteListing(id: number): Promise<boolean> {
    const index = this.listings.findIndex(l => l.id === id);
    if (index === -1) return false;
    this.listings.splice(index, 1);
    return true;
  }

  // Listing Addon methods
  async getListingAddons(): Promise<ListingAddon[]> { return this.listingAddons; }
  async getListingAddonsByListing(listingId: number): Promise<ListingAddon[]> { return this.listingAddons.filter(a => a.listingId === listingId); }
  async getListingAddonsByType(type: string): Promise<ListingAddon[]> { return this.listingAddons.filter(a => a.type === type); }
  async getListingAddon(id: number): Promise<ListingAddon | undefined> { return this.listingAddons.find(a => a.id === id); }
  async createListingAddon(addon: InsertListingAddon): Promise<ListingAddon> {
    const newAddon: ListingAddon = { id: this.nextId++, ...addon, createdAt: new Date(), updatedAt: new Date() };
    this.listingAddons.push(newAddon);
    return newAddon;
  }
  async updateListingAddon(id: number, addon: Partial<InsertListingAddon>): Promise<ListingAddon | undefined> {
    const existing = this.listingAddons.find(a => a.id === id);
    if (!existing) return undefined;
    Object.assign(existing, addon, { updatedAt: new Date() });
    return existing;
  }
  async deleteListingAddon(id: number): Promise<boolean> {
    const index = this.listingAddons.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.listingAddons.splice(index, 1);
    return true;
  }

  // Form Configuration methods
  async getFormConfigurations(): Promise<FormConfiguration[]> { return this.formConfigurations; }
  async getFormConfigurationsByUser(userId: number): Promise<FormConfiguration[]> { return this.formConfigurations.filter(c => c.userId === userId); }
  async getFormConfiguration(id: number): Promise<FormConfiguration | undefined> { return this.formConfigurations.find(c => c.id === id); }
  async getFormConfigurationByDirectory(directoryName: string, userId?: number): Promise<FormConfiguration | undefined> {
    return this.formConfigurations.find(c => c.directoryName === directoryName && (!userId || c.userId === userId));
  }
  async createFormConfiguration(config: InsertFormConfiguration): Promise<FormConfiguration> {
    const newConfig: FormConfiguration = { id: this.nextId++, ...config, createdAt: new Date(), updatedAt: new Date() };
    this.formConfigurations.push(newConfig);
    return newConfig;
  }
  async updateFormConfiguration(id: number, config: Partial<InsertFormConfiguration>): Promise<FormConfiguration | undefined> {
    const existing = this.formConfigurations.find(c => c.id === id);
    if (!existing) return undefined;
    Object.assign(existing, config, { updatedAt: new Date() });
    return existing;
  }
  async deleteFormConfiguration(id: number): Promise<boolean> {
    const index = this.formConfigurations.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.formConfigurations.splice(index, 1);
    return true;
  }

  // Form Submission methods
  async getFormSubmissions(): Promise<FormSubmission[]> { return this.formSubmissions; }
  async getFormSubmissionsByConfig(formConfigId: number): Promise<FormSubmission[]> { return this.formSubmissions.filter(s => s.formConfigId === formConfigId); }
  async getFormSubmission(id: number): Promise<FormSubmission | undefined> { return this.formSubmissions.find(s => s.id === id); }
  async createFormSubmission(submission: InsertFormSubmission): Promise<FormSubmission> {
    const newSubmission: FormSubmission = { id: this.nextId++, ...submission, submittedAt: new Date() };
    this.formSubmissions.push(newSubmission);
    return newSubmission;
  }
  async updateFormSubmission(id: number, submission: Partial<InsertFormSubmission>): Promise<FormSubmission | undefined> {
    const existing = this.formSubmissions.find(s => s.id === id);
    if (!existing) return undefined;
    Object.assign(existing, submission);
    return existing;
  }
  async deleteFormSubmission(id: number): Promise<boolean> {
    const index = this.formSubmissions.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.formSubmissions.splice(index, 1);
    return true;
  }

  // Form Field methods
  async getFormFields(): Promise<FormField[]> { return this.formFields; }
  async getFormFieldsByConfig(formConfigId: number): Promise<FormField[]> { return this.formFields.filter(f => f.formConfigId === formConfigId); }
  async getFormFieldById(id: number): Promise<FormField | undefined> { return this.formFields.find(f => f.id === id); }
  async createFormField(field: InsertFormField): Promise<FormField> {
    const newField: FormField = { id: this.nextId++, ...field, createdAt: new Date(), updatedAt: new Date() };
    this.formFields.push(newField);
    return newField;
  }
  async updateFormField(id: number, field: Partial<InsertFormField>): Promise<FormField | undefined> {
    const existing = this.formFields.find(f => f.id === id);
    if (!existing) return undefined;
    Object.assign(existing, field, { updatedAt: new Date() });
    return existing;
  }
  async deleteFormField(id: number): Promise<boolean> {
    const index = this.formFields.findIndex(f => f.id === id);
    if (index === -1) return false;
    this.formFields.splice(index, 1);
    return true;
  }
  async reorderFormFields(formConfigId: number, fieldIds: number[]): Promise<void> {
    const fields = this.formFields.filter(f => f.formConfigId === formConfigId);
    fieldIds.forEach((id, index) => {
      const field = fields.find(f => f.id === id);
      if (field) field.displayOrder = index;
    });
  }
  async duplicateFormField(id: number): Promise<FormField | undefined> {
    const original = this.formFields.find(f => f.id === id);
    if (!original) return undefined;
    const duplicate: FormField = {
      ...original,
      id: this.nextId++,
      fieldName: `${original.fieldName}_copy`,
      fieldLabel: `${original.fieldLabel} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.formFields.push(duplicate);
    return duplicate;
  }

  // Google Drive Credentials methods
  async getGoogleDriveCredentials(): Promise<GoogleDriveCredentials[]> { return this.googleDriveCredentials; }
  async getGoogleDriveCredentialsByUser(userId: number): Promise<GoogleDriveCredentials[]> { return this.googleDriveCredentials.filter(c => c.userId === userId); }
  async getGoogleDriveCredential(id: number): Promise<GoogleDriveCredentials | undefined> { return this.googleDriveCredentials.find(c => c.id === id); }
  async createGoogleDriveCredentials(credentials: InsertGoogleDriveCredentials): Promise<GoogleDriveCredentials> {
    const newCredentials: GoogleDriveCredentials = { id: this.nextId++, ...credentials, createdAt: new Date(), updatedAt: new Date() };
    this.googleDriveCredentials.push(newCredentials);
    return newCredentials;
  }
  async updateGoogleDriveCredentials(id: number, credentials: Partial<InsertGoogleDriveCredentials>): Promise<GoogleDriveCredentials | undefined> {
    const existing = this.googleDriveCredentials.find(c => c.id === id);
    if (!existing) return undefined;
    Object.assign(existing, credentials, { updatedAt: new Date() });
    return existing;
  }
  async deleteGoogleDriveCredentials(id: number): Promise<boolean> {
    const index = this.googleDriveCredentials.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.googleDriveCredentials.splice(index, 1);
    return true;
  }

  // Collection methods
  async getCollections(): Promise<Collection[]> { return this.collections; }
  async getCollectionsByUser(userId: number): Promise<Collection[]> { return this.collections.filter(c => c.userId === userId); }
  async getCollection(id: number): Promise<Collection | undefined> { return this.collections.find(c => c.id === id); }
  async getCollectionBySlug(slug: string): Promise<Collection | undefined> { return this.collections.find(c => c.slug === slug); }
  async createCollection(collection: InsertCollection): Promise<Collection> {
    const newCollection: Collection = { id: this.nextId++, ...collection, createdAt: new Date(), updatedAt: new Date() };
    this.collections.push(newCollection);
    return newCollection;
  }
  async updateCollection(id: number, collection: Partial<InsertCollection>): Promise<Collection | undefined> {
    const existing = this.collections.find(c => c.id === id);
    if (!existing) return undefined;
    Object.assign(existing, collection, { updatedAt: new Date() });
    return existing;
  }
  async deleteCollection(id: number): Promise<boolean> {
    const index = this.collections.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.collections.splice(index, 1);
    return true;
  }

  // Collection Item methods
  async getCollectionItems(): Promise<CollectionItem[]> { return this.collectionItems; }
  async getCollectionItemsByCollection(collectionId: number): Promise<CollectionItem[]> { return this.collectionItems.filter(i => i.collectionId === collectionId); }
  async getCollectionItem(id: number): Promise<CollectionItem | undefined> { return this.collectionItems.find(i => i.id === id); }
  async createCollectionItem(item: InsertCollectionItem): Promise<CollectionItem> {
    const newItem: CollectionItem = { id: this.nextId++, ...item, addedAt: new Date() };
    this.collectionItems.push(newItem);
    return newItem;
  }
  async updateCollectionItem(id: number, item: Partial<InsertCollectionItem>): Promise<CollectionItem | undefined> {
    const existing = this.collectionItems.find(i => i.id === id);
    if (!existing) return undefined;
    Object.assign(existing, item);
    return existing;
  }
  async deleteCollectionItem(id: number): Promise<boolean> {
    const index = this.collectionItems.findIndex(i => i.id === id);
    if (index === -1) return false;
    this.collectionItems.splice(index, 1);
    return true;
  }
}

export const storage = new MemStorage();