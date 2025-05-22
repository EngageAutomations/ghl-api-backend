import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ui/image-uploader';
import { 
  getStoredImages, 
  getImagesByType, 
  exportImagesJson,
  clearAllImages,
  type StoredImage 
} from '@/lib/image-storage';
import { Download, Trash2, RefreshCw } from 'lucide-react';

export default function ImageStorageDemo() {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'listing' | 'collection' | 'logo' | 'other'>('all');

  const refreshImages = () => {
    const storage = getStoredImages();
    const filteredImages = selectedType === 'all' 
      ? storage.images 
      : getImagesByType(selectedType);
    setImages(filteredImages);
  };

  useEffect(() => {
    refreshImages();
  }, [selectedType]);

  const handleImageUploaded = (image: StoredImage) => {
    refreshImages();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all stored images?')) {
      clearAllImages();
      refreshImages();
    }
  };

  const allImages = getStoredImages();
  const stats = {
    total: allImages.images.length,
    listing: allImages.images.filter(img => img.type === 'listing').length,
    collection: allImages.images.filter(img => img.type === 'collection').length,
    logo: allImages.images.filter(img => img.type === 'logo').length,
    other: allImages.images.filter(img => img.type === 'other').length,
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Image Storage Framework</h1>
        <p className="text-slate-600">
          All uploaded image URLs are automatically stored in a JSON structure
        </p>
      </div>

      {/* Upload Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Test Image Upload</CardTitle>
          <p className="text-sm text-slate-600">
            Upload images to see how URLs are stored. Works with or without Google Drive connection.
          </p>
        </CardHeader>
        <CardContent>
          <ImageUploader
            type="listing"
            metadata={{ listingId: 'demo-listing-123' }}
            onImageUploaded={handleImageUploaded}
            showStoredImages={false}
          />
        </CardContent>
      </Card>

      {/* Storage Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Storage Statistics</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={refreshImages}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportImagesJson}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="destructive" size="sm" onClick={handleClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-slate-600">Total Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.listing}</div>
              <div className="text-sm text-slate-600">Listings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.collection}</div>
              <div className="text-sm text-slate-600">Collections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.logo}</div>
              <div className="text-sm text-slate-600">Logos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.other}</div>
              <div className="text-sm text-slate-600">Other</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and View Images */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stored Image URLs</CardTitle>
            <div className="flex gap-2">
              {(['all', 'listing', 'collection', 'logo', 'other'] as const).map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No images stored yet. Upload some images to see them here.
            </div>
          ) : (
            <div className="space-y-4">
              {images.map((image) => (
                <div key={image.id} className="border rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-white rounded border overflow-hidden flex-shrink-0">
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium truncate">{image.filename}</h4>
                        <Badge variant="secondary">{image.type}</Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="font-medium">URL: </span>
                          <span className="font-mono text-xs bg-white px-2 py-1 rounded break-all">
                            {image.url}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Uploaded: </span>
                          <span className="text-slate-600">
                            {new Date(image.uploadedAt).toLocaleString()}
                          </span>
                        </div>
                        {image.metadata && Object.keys(image.metadata).length > 0 && (
                          <div>
                            <span className="font-medium">Metadata: </span>
                            <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                              {JSON.stringify(image.metadata)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* JSON Structure Preview */}
      <Card>
        <CardHeader>
          <CardTitle>JSON Structure Example</CardTitle>
          <p className="text-sm text-slate-600">
            This is how all image URLs are organized in the JSON file
          </p>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "images": [
    {
      "id": "img_1642384756123_abc123def",
      "filename": "product-hero.jpg",
      "url": "https://drive.google.com/uc?id=1ABC123...",
      "uploadedAt": "2024-01-16T10:30:00.000Z",
      "type": "listing",
      "metadata": {
        "listingId": "listing-123",
        "originalName": "product-hero.jpg",
        "size": 245760,
        "mimeType": "image/jpeg"
      }
    }
  ],
  "lastUpdated": "2024-01-16T10:30:00.000Z",
  "version": "1.0.0"
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}