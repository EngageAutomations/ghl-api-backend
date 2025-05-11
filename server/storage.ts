import { 
  users, User, InsertUser, 
  designerConfigs, DesignerConfig, InsertDesignerConfig,
  portalDomains, PortalDomain, InsertPortalDomain,
  listings, Listing, InsertListing
} from "@shared/schema";

// Storage interface with all CRUD methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private designerConfigs: Map<number, DesignerConfig>;
  private portalDomains: Map<number, PortalDomain>;
  private listings: Map<number, Listing>;
  
  currentUserId: number;
  currentConfigId: number;
  currentDomainId: number;
  currentListingId: number;

  constructor() {
    this.users = new Map();
    this.designerConfigs = new Map();
    this.portalDomains = new Map();
    this.listings = new Map();
    
    this.currentUserId = 1;
    this.currentConfigId = 1;
    this.currentDomainId = 1;
    this.currentListingId = 1;
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
}

export const storage = new MemStorage();
