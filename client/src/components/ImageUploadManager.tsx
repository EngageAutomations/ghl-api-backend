import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedImage {
  url: string;
  mediaId: string;
  filename: string;
  size: number;
}

interface ImageUploadManagerProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  allowMultiple?: boolean;
  className?: string;
  label?: string;
}

export function ImageUploadManager({
  images,
  onImagesChange,
  maxImages = 5,
  allowMultiple = true,
  className,
  label = "Upload Images"
}: ImageUploadManagerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('installation_id', 'install_1750252333303');

      const response = await fetch('https://dir.engageautomations.com/api/ghl/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Failed to upload image');
      }

      return response.json();
    },
    onSuccess: (response: any, file: File) => {
      const newImage: UploadedImage = {
        url: response.url,
        mediaId: response.mediaId,
        filename: file.name,
        size: file.size
      };

      onImagesChange([...images, newImage]);
      
      setUploadingFiles(prev => {
        const updated = new Set(prev);
        updated.delete(file.name);
        return updated;
      });

      toast({
        title: "Image Uploaded",
        description: `${file.name} uploaded successfully to GoHighLevel`,
      });
    },
    onError: (error: Error, file: File) => {
      setUploadingFiles(prev => {
        const updated = new Set(prev);
        updated.delete(file.name);
        return updated;
      });

      toast({
        title: "Upload Failed",
        description: `Failed to upload ${file.name}: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a valid image file`,
          variant: "destructive",
        });
        return false;
      }

      // Validate file size (25MB limit per Railway backend)
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds 25MB limit`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    });

    // Check if adding these files would exceed max images
    if (images.length + validFiles.length > maxImages) {
      toast({
        title: "Too Many Images",
        description: `Maximum ${maxImages} images allowed`,
        variant: "destructive",
      });
      return;
    }

    // Upload files
    for (const file of validFiles) {
      setUploadingFiles(prev => new Set(prev).add(file.name));
      uploadMutation.mutate(file);
    }
  }, [images.length, maxImages, toast, uploadMutation, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  const removeImage = useCallback((index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
    
    toast({
      title: "Image Removed",
      description: "Image removed from listing",
    });
  }, [images, onImagesChange, toast]);

  const canUploadMore = images.length < maxImages;

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{label}</h3>
          <span className="text-xs text-muted-foreground">
            {images.length}/{maxImages} images
          </span>
        </div>
      )}

      {/* Upload Area */}
      {canUploadMore && (
        <Card 
          className={cn(
            "border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50",
            isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-8 px-4">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-center">
              <p className="text-sm font-medium">
                Drop images here or click to upload
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, GIF up to 25MB • Max {maxImages} images
              </p>
            </div>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple={allowMultiple}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={`${image.mediaId}-${index}`} className="group relative overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{image.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {(image.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Uploading Files */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Uploading...</h4>
          {Array.from(uploadingFiles).map((filename) => (
            <div key={filename} className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{filename}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!canUploadMore && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700">
            Maximum {maxImages} images reached. Remove some images to upload more.
          </span>
        </div>
      )}
    </div>
  );
}