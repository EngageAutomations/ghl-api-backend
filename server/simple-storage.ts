/**
 * Simple Working Storage for Directories, Collections, and Listings
 * Ensures data saving works properly for API endpoint mapping
 */

interface SimpleDirectory {
  id: number;
  directoryName: string;
  userId: number;
  logoUrl?: string;
  config: any;
  actionButtonColor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SimpleListing {
  id: number;
  title: string;
  slug: string;
  directoryName?: string;
  userId: number;
  description?: string;
  price?: string;
  category?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SimpleCollection {
  id: number;
  name: string;
  description?: string;
  directoryName?: string;
  userId: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class SimpleDataStore {
  private directories: Map<number, SimpleDirectory> = new Map();
  private listings: Map<number, SimpleListing> = new Map();
  private collections: Map<number, SimpleCollection> = new Map();
  
  private nextDirectoryId = 1;
  private nextListingId = 1;
  private nextCollectionId = 1;

  // Directory operations
  createDirectory(data: any): SimpleDirectory {
    const directory: SimpleDirectory = {
      id: this.nextDirectoryId++,
      directoryName: data.directoryName,
      userId: data.userId || 1,
      logoUrl: data.logoUrl,
      config: data.config || {},
      actionButtonColor: data.actionButtonColor || '#3b82f6',
      isActive: data.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.directories.set(directory.id, directory);
    console.log(`[SIMPLE STORAGE] Created directory: ${directory.directoryName}`);
    return directory;
  }

  getDirectoriesByUser(userId: number): SimpleDirectory[] {
    return Array.from(this.directories.values()).filter(d => d.userId === userId);
  }

  getDirectoryByName(directoryName: string): SimpleDirectory | undefined {
    return Array.from(this.directories.values()).find(d => d.directoryName === directoryName);
  }

  updateDirectory(id: number, data: any): SimpleDirectory | undefined {
    const directory = this.directories.get(id);
    if (!directory) return undefined;
    
    const updated = { ...directory, ...data, updatedAt: new Date() };
    this.directories.set(id, updated);
    return updated;
  }

  deleteDirectory(id: number): boolean {
    return this.directories.delete(id);
  }

  // Listing operations
  createListing(data: any): SimpleListing {
    const listing: SimpleListing = {
      id: this.nextListingId++,
      title: data.title,
      slug: data.slug,
      directoryName: data.directoryName,
      userId: data.userId || 1,
      description: data.description,
      price: data.price,
      category: data.category,
      imageUrl: data.imageUrl,
      isActive: data.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.listings.set(listing.id, listing);
    console.log(`[SIMPLE STORAGE] Created listing: ${listing.title}`);
    return listing;
  }

  getListingsByUser(userId: number): SimpleListing[] {
    return Array.from(this.listings.values()).filter(l => l.userId === userId);
  }

  getListingsByDirectory(directoryName: string): SimpleListing[] {
    return Array.from(this.listings.values()).filter(l => l.directoryName === directoryName);
  }

  getListing(id: number): SimpleListing | undefined {
    return this.listings.get(id);
  }

  getListingBySlug(slug: string): SimpleListing | undefined {
    return Array.from(this.listings.values()).find(l => l.slug === slug);
  }

  updateListing(id: number, data: any): SimpleListing | undefined {
    const listing = this.listings.get(id);
    if (!listing) return undefined;
    
    const updated = { ...listing, ...data, updatedAt: new Date() };
    this.listings.set(id, updated);
    return updated;
  }

  deleteListing(id: number): boolean {
    return this.listings.delete(id);
  }

  // Collection operations
  createCollection(data: any): SimpleCollection {
    const collection: SimpleCollection = {
      id: this.nextCollectionId++,
      name: data.name,
      description: data.description,
      directoryName: data.directoryName,
      userId: data.userId || 1,
      imageUrl: data.imageUrl,
      isActive: data.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.collections.set(collection.id, collection);
    console.log(`[SIMPLE STORAGE] Created collection: ${collection.name}`);
    return collection;
  }

  getCollectionsByUser(userId: number): SimpleCollection[] {
    return Array.from(this.collections.values()).filter(c => c.userId === userId);
  }

  getCollectionsByDirectory(directoryName: string): SimpleCollection[] {
    return Array.from(this.collections.values()).filter(c => c.directoryName === directoryName);
  }

  getCollection(id: number): SimpleCollection | undefined {
    return this.collections.get(id);
  }

  updateCollection(id: number, data: any): SimpleCollection | undefined {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updated = { ...collection, ...data, updatedAt: new Date() };
    this.collections.set(id, updated);
    return updated;
  }

  deleteCollection(id: number): boolean {
    return this.collections.delete(id);
  }
}

export const simpleDataStore = new SimpleDataStore();