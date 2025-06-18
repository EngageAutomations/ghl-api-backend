import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageItem {
  id: string;
  url: string;
  tempPath?: string;
  ghlUrl?: string;
  title?: string;
  alt?: string;
  order: number;
}

export interface MetadataImageItem extends ImageItem {
  type: 'logo' | 'banner' | 'gallery' | 'thumbnail';
}

interface MultiImageUploadProps {
  images: ImageItem[] | MetadataImageItem[];
  onChange: (images: ImageItem[] | MetadataImageItem[]) => void;
  maxImages?: number;
  allowedTypes?: string[];
  label?: string;
  description?: string;
  isMetadata?: boolean;
  metadataTypes?: ('logo' | 'banner' | 'gallery' | 'thumbnail')[];
}

export function MultiImageUpload({
  images,
  onChange,
  maxImages = 10,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  label = "Images",
  description = "Upload multiple images for your listing",
  isMetadata = false,
  metadataTypes = ['logo', 'banner', 'gallery', 'thumbnail']
}: MultiImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    const newImages: (ImageItem | MetadataImageItem)[] = [];
    
    // Process files immediately for visual feedback
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (allowedTypes.includes(file.type)) {
        const fileId = `img_${Date.now()}_${i}`;
        const blobUrl = URL.createObjectURL(file);
        
        const baseImage: ImageItem = {
          id: fileId,
          url: blobUrl,
          tempPath: blobUrl,
          title: file.name,
          alt: file.name,
          order: images.length + i
        };

        if (isMetadata) {
          const metadataImage: MetadataImageItem = {
            ...baseImage,
            type: metadataTypes[0]
          };
          newImages.push(metadataImage);
        } else {
          newImages.push(baseImage);
        }
      }
    }

    // Immediately update UI with blob URLs for instant feedback
    const updatedImages = [...images, ...newImages].slice(0, maxImages);
    onChange(updatedImages);

    // Upload to server in background and update with server URLs
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (allowedTypes.includes(file.type)) {
          formData.append('images', file);
        }
      }

      const uploadResponse = await fetch('/api/images/upload-temp', {
        method: 'POST',
        body: formData
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        
        if (uploadResult.success) {
          // Update images with server URLs
          const updatedImagesWithServerUrls = updatedImages.map((img, index) => {
            const serverFile = uploadResult.files[index];
            if (serverFile) {
              return {
                ...img,
                url: serverFile.url,
                tempPath: serverFile.tempPath,
                serverUploaded: true
              };
            }
            return img;
          });
          onChange(updatedImagesWithServerUrls);
        }
      } else {
        console.error('Failed to upload images:', await uploadResponse.text());
      }
    } catch (error) {
      console.error('Image upload error:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    onChange(updatedImages);
  };

  const updateImageTitle = (id: string, title: string) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, title } : img
    );
    onChange(updatedImages);
  };

  const updateImageAlt = (id: string, alt: string) => {
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, alt } : img
    );
    onChange(updatedImages);
  };

  const updateMetadataType = (id: string, type: 'logo' | 'banner' | 'gallery' | 'thumbnail') => {
    if (!isMetadata) return;
    
    const updatedImages = images.map(img => 
      img.id === id ? { ...img, type } : img
    ) as MetadataImageItem[];
    onChange(updatedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    
    // Update order property
    updatedImages.forEach((img, index) => {
      img.order = index;
    });
    
    onChange(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          images.length >= maxImages ? "opacity-50 pointer-events-none" : "cursor-pointer"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-2">
          {images.length > 0 ? 'Add more images' : 'Drop images here or click to browse'}
        </p>
        {images.length > 0 && (
          <div className="mb-2">
            <Badge variant="secondary" className="flex items-center gap-1 w-fit mx-auto">
              <ImageIcon className="h-3 w-3" />
              {images.length} photo{images.length !== 1 ? 's' : ''} added
            </Badge>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {images.length}/{maxImages} images • JPG, PNG, WebP up to 10MB each
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedTypes.join(',')}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        disabled={images.length >= maxImages}
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="p-4">
              <div className="flex gap-4">
                {/* Drag Handle */}
                <div className="flex-shrink-0 cursor-move">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={image.ghlUrl || image.url}
                      alt={image.alt || 'Upload preview'}
                      className="w-full h-full object-cover"
                    />
                    {image.ghlUrl && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <span className="text-xs bg-green-500 text-white px-1 rounded">GHL</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Details */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`title-${image.id}`} className="text-xs">Title</Label>
                      <Input
                        id={`title-${image.id}`}
                        value={image.title || ''}
                        onChange={(e) => updateImageTitle(image.id, e.target.value)}
                        placeholder="Image title"
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`alt-${image.id}`} className="text-xs">Alt Text</Label>
                      <Input
                        id={`alt-${image.id}`}
                        value={image.alt || ''}
                        onChange={(e) => updateImageAlt(image.id, e.target.value)}
                        placeholder="Alt text for accessibility"
                        className="h-8"
                      />
                    </div>
                  </div>

                  {/* Metadata Type Selector */}
                  {isMetadata && (
                    <div>
                      <Label className="text-xs">Image Type</Label>
                      <select
                        value={(image as MetadataImageItem).type}
                        onChange={(e) => updateMetadataType(image.id, e.target.value as any)}
                        className="w-full h-8 px-2 border border-input rounded-md bg-background text-sm"
                      >
                        {metadataTypes.map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {image.ghlUrl ? 'Uploaded to GoHighLevel' : 'Pending upload'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}