import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, X, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  saveImageUrl, 
  uploadImageToGoogleDrive, 
  StoredImage,
  getStoredImages,
  exportImagesJson 
} from '@/lib/image-storage';

interface ImageUploaderProps {
  onImageUploaded?: (image: StoredImage) => void;
  type?: 'listing' | 'collection' | 'logo' | 'other';
  metadata?: Record<string, any>;
  googleDriveTokens?: any;
  maxFiles?: number;
  accept?: string;
  showStoredImages?: boolean;
}

export function ImageUploader({
  onImageUploaded,
  type = 'other',
  metadata,
  googleDriveTokens,
  maxFiles = 5,
  accept = 'image/*',
  showStoredImages = true
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<StoredImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: StoredImage[] = [];

    try {
      for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
        const file = files[i];
        
        if (googleDriveTokens) {
          // Upload to Google Drive
          const storedImage = await uploadImageToGoogleDrive(
            file,
            googleDriveTokens,
            type,
            metadata
          );
          newImages.push(storedImage);
          
          toast({
            title: "Image uploaded to Google Drive!",
            description: `${file.name} has been stored in your Google Drive.`,
          });
        } else {
          // Create a local URL for the image (for preview)
          const localUrl = URL.createObjectURL(file);
          const storedImage = saveImageUrl(
            file.name,
            localUrl,
            type,
            {
              ...metadata,
              originalName: file.name,
              size: file.size,
              mimeType: file.type
            }
          );
          newImages.push(storedImage);
          
          toast({
            title: "Image added locally",
            description: `${file.name} has been stored locally. Connect Google Drive for cloud storage.`,
            variant: "default"
          });
        }

        if (onImageUploaded) {
          onImageUploaded(newImages[newImages.length - 1]);
        }
      }

      setUploadedImages(prev => [...prev, ...newImages]);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const allStoredImages = showStoredImages ? getStoredImages().images : [];

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className="border-2 border-dashed border-slate-300 hover:border-slate-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="p-8 text-center">
          <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-700 mb-2">
            {googleDriveTokens ? 'Upload to Google Drive' : 'Upload Images'}
          </h3>
          <p className="text-slate-500 mb-4">
            Drag and drop images here, or click to select files
          </p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="secondary">
              {googleDriveTokens ? 'Google Drive Connected' : 'Local Storage'}
            </Badge>
            <Badge variant="outline">
              Max {maxFiles} files
            </Badge>
          </div>
          {!googleDriveTokens && (
            <p className="text-xs text-amber-600">
              Connect Google Drive for cloud storage and public URLs
            </p>
          )}
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Loading State */}
      {uploading && (
        <div className="text-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">
            {googleDriveTokens ? 'Uploading to Google Drive...' : 'Processing images...'}
          </p>
        </div>
      )}

      {/* Recently Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-slate-700">Recently Uploaded</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {image.filename}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Storage Management */}
      {showStoredImages && allStoredImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-700">
              All Stored Images ({allStoredImages.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={exportImagesJson}
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Listings:</span> {allStoredImages.filter(img => img.type === 'listing').length}
              </div>
              <div>
                <span className="font-medium">Collections:</span> {allStoredImages.filter(img => img.type === 'collection').length}
              </div>
              <div>
                <span className="font-medium">Logos:</span> {allStoredImages.filter(img => img.type === 'logo').length}
              </div>
              <div>
                <span className="font-medium">Other:</span> {allStoredImages.filter(img => img.type === 'other').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}