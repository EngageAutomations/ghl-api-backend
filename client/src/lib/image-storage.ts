/**
 * Image Storage Management
 * Handles storing and retrieving image URLs from uploaded files
 */

export interface StoredImage {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
  type: 'listing' | 'collection' | 'logo' | 'other';
  metadata?: {
    listingId?: string;
    collectionId?: string;
    originalName?: string;
    size?: number;
    mimeType?: string;
  };
}

export interface ImageStorage {
  images: StoredImage[];
  lastUpdated: string;
  version: string;
}

const STORAGE_KEY = 'directory_images';

/**
 * Get all stored images
 */
export function getStoredImages(): ImageStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading stored images:', error);
  }
  
  return {
    images: [],
    lastUpdated: new Date().toISOString(),
    version: '1.0.0'
  };
}

/**
 * Save an uploaded image URL
 */
export function saveImageUrl(
  filename: string,
  url: string,
  type: StoredImage['type'] = 'other',
  metadata?: StoredImage['metadata']
): StoredImage {
  const storage = getStoredImages();
  
  const newImage: StoredImage = {
    id: generateImageId(),
    filename,
    url,
    uploadedAt: new Date().toISOString(),
    type,
    metadata
  };
  
  storage.images.push(newImage);
  storage.lastUpdated = new Date().toISOString();
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  
  return newImage;
}

/**
 * Get images by type
 */
export function getImagesByType(type: StoredImage['type']): StoredImage[] {
  const storage = getStoredImages();
  return storage.images.filter(img => img.type === type);
}

/**
 * Get images for a specific listing
 */
export function getListingImages(listingId: string): StoredImage[] {
  const storage = getStoredImages();
  return storage.images.filter(img => 
    img.type === 'listing' && img.metadata?.listingId === listingId
  );
}

/**
 * Get images for a specific collection
 */
export function getCollectionImages(collectionId: string): StoredImage[] {
  const storage = getStoredImages();
  return storage.images.filter(img => 
    img.type === 'collection' && img.metadata?.collectionId === collectionId
  );
}

/**
 * Remove an image by ID
 */
export function removeStoredImage(imageId: string): boolean {
  const storage = getStoredImages();
  const initialLength = storage.images.length;
  
  storage.images = storage.images.filter(img => img.id !== imageId);
  storage.lastUpdated = new Date().toISOString();
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  
  return storage.images.length < initialLength;
}

/**
 * Clear all stored images
 */
export function clearAllImages(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export images as JSON file for backup
 */
export function exportImagesJson(): void {
  const storage = getStoredImages();
  const dataStr = JSON.stringify(storage, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `directory-images-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Import images from JSON file
 */
export async function importImagesJson(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as ImageStorage;
        
        // Validate structure
        if (!imported.images || !Array.isArray(imported.images)) {
          throw new Error('Invalid JSON structure');
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
        resolve();
      } catch (error) {
        reject(new Error('Failed to import images: Invalid JSON format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Generate unique image ID
 */
function generateImageId(): string {
  return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Upload image to Google Drive (when connected)
 */
export async function uploadImageToGoogleDrive(
  file: File,
  tokens: any,
  type: StoredImage['type'] = 'other',
  metadata?: StoredImage['metadata']
): Promise<StoredImage> {
  // Convert file to base64
  const base64Data = await fileToBase64(file);
  
  const response = await fetch('/api/google-drive/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tokens,
      fileName: file.name,
      fileData: base64Data,
      mimeType: file.type
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload to Google Drive');
  }
  
  const result = await response.json();
  
  // Save the public URL to our storage
  return saveImageUrl(
    file.name,
    result.publicUrl,
    type,
    {
      ...metadata,
      originalName: file.name,
      size: file.size,
      mimeType: file.type
    }
  );
}

/**
 * Convert file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}