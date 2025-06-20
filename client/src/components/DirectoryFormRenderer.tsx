import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Check, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface DirectoryFormRendererProps {
  directoryName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DirectoryFormRenderer({ 
  directoryName, 
  directoryConfig, 
  onSuccess, 
  onCancel 
}: DirectoryFormRendererProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingBullets, setIsGeneratingBullets] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Image upload states - matching wizard implementation
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  // Use directory config or default configuration
  const config: DirectoryConfig = directoryConfig || {
    customFieldName: 'listing',
    showDescription: true,
    showMetadata: true,
    showMaps: true,
    showPrice: true,
    metadataFields: [],
    formEmbedUrl: '',
    buttonType: 'popup'
  };

  // Generate form fields using the same system as the wizard
  const formFields = generateFormFields(config);

  // Initialize form data with empty values
  useEffect(() => {
    const initialData: Record<string, string> = {};
    formFields.forEach(field => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
  }, [formFields]);

  // Auto-generate slug and SEO fields from name (same logic as wizard)
  useEffect(() => {
    const productName = formData.name || '';
    
    if (productName) {
      // Generate URL slug
      const slug = productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData(prev => ({
        ...prev,
        url_slug: slug,
        [config.customFieldName]: slug,
        // Auto-fill SEO title if empty
        seo_title: prev.seo_title || productName
      }));
    }
  }, [formData.name, config.customFieldName]);

  // Auto-copy basic description to SEO description
  useEffect(() => {
    if (formData.description && !formData.seo_description) {
      setFormData(prev => ({
        ...prev,
        seo_description: formData.description
      }));
    }
  }, [formData.description, formData.seo_description]);

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Image upload handlers - matching wizard implementation
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleImageUpload = async (file: File) => {
    setImageFile(file);
    setIsUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/railway/media/upload', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success && result.fileUrl) {
        setUploadedImageUrl(result.fileUrl);
        handleInputChange('image', result.fileUrl);
        
        toast({
          title: "Image Uploaded",
          description: "Your image has been uploaded to GoHighLevel",
        });
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const generateBulletPoints = async () => {
    if (!formData.description?.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBullets(true);
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: formData.description
        })
      });
      
      const data = await response.json();

      if (data.bulletPoints && data.bulletPoints.length > 0) {
        const bulletText = data.bulletPoints.map((point: string) => `• ${point}`).join('\n');
        handleInputChange('description', bulletText);
        
        toast({
          title: "Bullet Points Generated",
          description: "AI has converted your description to bullet points",
        });
      }
    } catch (error) {
      console.error('AI Summarization error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate bullet points. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBullets(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    formFields.forEach(field => {
      if (field.required && !formData[field.name]?.trim()) {
        errors[field.name] = `${field.label} is required`;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create listing using the same API as other forms
      const listingData = {
        title: formData.name,
        description: formData.description,
        expandedDescription: formData.expanded_description,
        price: formData.price,
        location: formData.address,
        imageUrl: formData.image,
        seoTitle: formData.seo_title,
        seoDescription: formData.seo_description,
        slug: formData.url_slug,
        isActive: true,
        directoryName: directoryName,
        category: 'product',
        // Add metadata fields
        metadata: Object.keys(formData)
          .filter(key => key.startsWith('metadata_'))
          .reduce((acc, key) => {
            const index = key.replace('metadata_', '');
            const fieldLabel = config.metadataFields[parseInt(index) - 1];
            if (fieldLabel && formData[key]) {
              acc[fieldLabel] = formData[key];
            }
            return acc;
          }, {} as Record<string, string>)
      };

      await apiRequest(`/api/listings`, {
        method: 'POST',
        data: listingData
      });

      toast({
        title: "Product Created",
        description: "Your product has been successfully added to the directory",
      });

      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="w-full">
      <Card className="bg-white border border-blue-200 shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Product Name Field - Single Column */}
            <div className="space-y-3">
              <Label htmlFor="product-name" className="text-left block text-lg font-medium text-gray-700">
                Product/Service Name
              </Label>
              <Input
                id="product-name"
                placeholder="My Awesome Product"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-lg p-4 h-auto"
              />
              <p className="text-sm text-gray-600 text-left">
                This will be displayed as the main title in the directory
              </p>
            </div>

            {/* Image Upload Field - Drag and Drop */}
            <div className="space-y-3">
              <Label className="text-left block text-lg font-medium text-gray-700">Product Image</Label>
              <div className="space-y-2">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
                    ${isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                    }
                    ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="image-upload"
                    disabled={isUploadingImage}
                  />
                  <label htmlFor="image-upload" className={`cursor-pointer ${isUploadingImage ? 'cursor-not-allowed' : ''}`}>
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                        <p className="text-sm font-medium text-blue-600">
                          Uploading to GoHighLevel...
                        </p>
                      </div>
                    ) : uploadedImageUrl ? (
                      <div className="flex flex-col items-center">
                        <Check className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-sm font-medium text-green-600">
                          Image uploaded successfully
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {imageFile?.name}
                        </p>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-700">
                          {isDragOver ? 'Drop image here' : 'Upload image to GoHighLevel'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Drag and drop or click to browse
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Description Field */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-left block text-lg font-medium text-gray-700">
                Product Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your product or service..."
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="text-lg p-4 min-h-[120px]"
                rows={5}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 text-left">
                  Provide a detailed description of your product or service
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateBulletPoints}
                  disabled={isGeneratingBullets || !formData.description?.trim()}
                  className="flex items-center gap-2"
                >
                  {isGeneratingBullets ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {isGeneratingBullets ? 'Generating...' : 'AI Bullet Points'}
                </Button>
              </div>
            </div>

            {/* Price Field */}
            {config.showPrice && (
              <div className="space-y-3">
                <Label htmlFor="price" className="text-left block text-lg font-medium text-gray-700">
                  Price
                </Label>
                <Input
                  id="price"
                  placeholder="$99.99"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="text-lg p-4 h-auto"
                />
                <p className="text-sm text-gray-600 text-left">
                  Enter the price for your product or service
                </p>
              </div>
            )}

            {/* SEO Title */}
            <div className="space-y-3">
              <Label htmlFor="seo-title" className="text-left block text-lg font-medium text-gray-700">
                SEO Title
              </Label>
              <Input
                id="seo-title"
                placeholder="SEO-optimized title for search engines"
                value={formData.seo_title || ''}
                onChange={(e) => handleInputChange('seo_title', e.target.value)}
                className="text-lg p-4 h-auto"
              />
              <p className="text-sm text-gray-600 text-left">
                Auto-fills from product name, customize for search optimization
              </p>
            </div>

            {/* SEO Description */}
            <div className="space-y-3">
              <Label htmlFor="seo-description" className="text-left block text-lg font-medium text-gray-700">
                SEO Description
              </Label>
              <Textarea
                id="seo-description"
                placeholder="Brief description for search engines (150-160 characters)"
                value={formData.seo_description || ''}
                onChange={(e) => handleInputChange('seo_description', e.target.value)}
                className="text-lg p-4 min-h-[80px]"
                rows={3}
              />
              <p className="text-sm text-gray-600 text-left">
                Auto-fills from basic description, optimize for search results
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.description || !uploadedImageUrl}
                className="flex items-center gap-2 px-8"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating Product...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}