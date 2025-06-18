import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { MultiImageUpload, type ImageItem, type MetadataImageItem } from '@/components/MultiImageUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Package } from 'lucide-react';

interface WizardConfiguredFormProps {
  directoryName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function WizardConfiguredForm({ directoryName, onSuccess, onCancel }: WizardConfiguredFormProps) {
  const { toast } = useToast();
  
  // Fetch directory configuration from wizard
  const { data: directory, isLoading: configLoading } = useQuery({
    queryKey: ['/api/directories', directoryName],
    enabled: !!directoryName
  });

  // Fetch form fields based on directory ID
  const { data: formFields, isLoading: fieldsLoading } = useQuery({
    queryKey: ['/api/form-fields', directory?.id],
    enabled: !!directory?.id
  });

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [images, setImages] = useState<ImageItem[]>([]);
  const [metadataImages, setMetadataImages] = useState<MetadataImageItem[]>([]);

  // Generate appropriate form fields based on wizard configuration
  const generateFormFields = () => {
    // Use stored form fields if available, otherwise generate based on directory config
    if (formFields && formFields.length > 0) {
      return formFields;
    }

    // Generate default fields based on wizard configuration
    const defaultFields = [
      {
        id: 1,
        name: 'name',
        label: 'Product Name',
        type: 'TEXT',
        required: true,
        placeholder: 'Enter product name',
        displayOrder: 1
      },
      {
        id: 2,
        name: 'description',
        label: 'Description',
        type: 'TEXTAREA',
        required: true,
        placeholder: 'Describe your product',
        displayOrder: 2
      },
      {
        id: 3,
        name: 'productType',
        label: 'Product Type',
        type: 'SINGLE_OPTIONS',
        required: true,
        options: ['DIGITAL', 'PHYSICAL', 'SERVICE', 'PHYSICAL-DIGITAL'],
        defaultValue: 'DIGITAL',
        displayOrder: 3
      }
    ];

    // Add pricing field based on wizard configuration
    if (directory?.config?.features?.showPrice !== false) {
      defaultFields.push({
        id: 4,
        name: 'price',
        label: 'Price ($)',
        type: 'NUMBER',
        required: true,
        placeholder: '0.00',
        displayOrder: 4
      });
    }

    // Add optional fields based on wizard configuration
    if (directory?.config?.features?.showMetadata !== false) {
      defaultFields.push({
        id: 5,
        name: 'category',
        label: 'Category',
        type: 'TEXT',
        required: false,
        placeholder: 'Product category',
        displayOrder: 5
      });
    }

    // Always add image upload field
    defaultFields.push({
      id: 6,
      name: 'images',
      label: 'Product Images',
      type: 'FILE_UPLOAD',
      required: false,
      placeholder: 'Upload product images',
      displayOrder: 6
    });

    return defaultFields;
  };

  const effectiveFormFields = generateFormFields();

  // Debug logging to track form generation
  console.log('WizardConfiguredForm - Directory:', directory);
  console.log('WizardConfiguredForm - Form Fields:', formFields);
  console.log('WizardConfiguredForm - Effective Fields:', effectiveFormFields);

  // Initialize form data when fields are determined
  useEffect(() => {
    if (effectiveFormFields) {
      const initialData: Record<string, any> = {};
      effectiveFormFields.forEach((field: any) => {
        switch (field.type) {
          case 'CHECKBOX':
            initialData[field.name] = false;
            break;
          case 'MULTIPLE_OPTIONS':
            initialData[field.name] = [];
            break;
          default:
            initialData[field.name] = field.defaultValue || '';
        }
      });
      setFormData(initialData);
      console.log('WizardConfiguredForm - Initial form data:', initialData);
    }
  }, [directory, formFields]);

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload images to GoHighLevel first
      let finalImages = images;
      let finalMetadataImages = metadataImages;

      if (images.length > 0) {
        try {
          const imageUploadResponse = await fetch('https://dir.engageautomations.com/api/ghl/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              installation_id: 'install_1750252333303',
              files: images.map(img => ({
                url: img.url,
                name: img.name || 'product-image.jpg'
              }))
            })
          });

          if (imageUploadResponse.ok) {
            const uploadResult = await imageUploadResponse.json();
            if (uploadResult.success) {
              finalImages = uploadResult.uploads.map((upload: any) => ({
                ...upload,
                ghlUrl: upload.ghlUrl || upload.url
              }));
            }
          }
        } catch (error) {
          console.log('Image upload failed, proceeding without images:', error);
          finalImages = images; // Use original images as fallback
        }
      }

      if (metadataImages.length > 0) {
        try {
          const metadataUploadResponse = await fetch('https://dir.engageautomations.com/api/ghl/media/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              installation_id: 'install_1750252333303',
              files: metadataImages.map(img => ({
                url: img.url,
                name: img.name || 'metadata-image.jpg'
              }))
            })
          });

          if (metadataUploadResponse.ok) {
            const uploadResult = await metadataUploadResponse.json();
            if (uploadResult.success) {
              finalMetadataImages = uploadResult.uploads.map((upload: any) => ({
                ...upload,
                ghlUrl: upload.ghlUrl || upload.url,
                type: upload.type
              }));
            }
          }
        } catch (error) {
          console.log('Metadata image upload failed, proceeding without metadata images:', error);
          finalMetadataImages = metadataImages; // Use original images as fallback
        }
      }

      // Create product with GoHighLevel integration
      const productData = {
        ...data,
        images: finalImages.map(img => ({
          ...img,
          url: img.ghlUrl || img.url
        })),
        metadataImages: finalMetadataImages.map(img => ({
          ...img,
          url: img.ghlUrl || img.url
        })),
        directoryName,
        // Core required fields for GoHighLevel
        name: data.name || data.title,
        locationId: 'WAVk87RmW9rBSDJHeOpH',
        productType: data.productType || 'DIGITAL',
        price: data.price || (directory?.config?.features?.showPrice !== false ? undefined : 100), // Default $100 when pricing disabled
        availableInStore: true,
        description: data.description || '',
        // SEO fields
        seoTitle: data.seoTitle || data.name || data.title,
        seoDescription: data.seoDescription || data.description,
        seoKeywords: data.seoKeywords || ''
      };

      const response = await fetch('/api/products/create-with-installation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          installationId: 'install_1750252333303',
          ...productData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Product Created Successfully",
        description: "Your product has been created in GoHighLevel and saved locally."
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate(formData);
  };

  const updateFormData = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderFormField = (field: any) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'TEXT':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className={field.required ? "after:content-['*'] after:text-red-500" : ""}>
              {field.label}
            </Label>
            <Input
              id={field.name}
              value={value}
              onChange={(e) => updateFormData(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
            {field.helpText && (
              <p className="text-sm text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'TEXTAREA':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className={field.required ? "after:content-['*'] after:text-red-500" : ""}>
              {field.label}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => updateFormData(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
            />
            {field.helpText && (
              <p className="text-sm text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'NUMBER':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className={field.required ? "after:content-['*'] after:text-red-500" : ""}>
              {field.label}
            </Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => updateFormData(field.name, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              required={field.required}
              min={field.validation?.min}
              max={field.validation?.max}
            />
            {field.helpText && (
              <p className="text-sm text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'SELECT':
      case 'SINGLE_OPTIONS':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className={field.required ? "after:content-['*'] after:text-red-500" : ""}>
              {field.label}
            </Label>
            <Select
              value={value}
              onValueChange={(val) => updateFormData(field.name, val)}
              required={field.required}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.helpText && (
              <p className="text-sm text-muted-foreground">{field.helpText}</p>
            )}
          </div>
        );

      case 'CHECKBOX':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value}
              onCheckedChange={(checked) => updateFormData(field.name, checked)}
              required={field.required}
            />
            <Label htmlFor={field.name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {field.label}
            </Label>
            {field.helpText && (
              <p className="text-sm text-muted-foreground ml-6">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (configLoading || fieldsLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Loading Form Configuration...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create GoHighLevel Product
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Using wizard configuration for {directoryName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Fields from Wizard Configuration */}
          <div className="grid gap-6">
            {effectiveFormFields?.map((field: any) => renderFormField(field))}
          </div>

          {/* Product Images Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Product Images</Label>
              {images.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {images.length} photo{images.length !== 1 ? 's' : ''} added
                </Badge>
              )}
            </div>
            <MultiImageUpload
              images={images}
              onChange={setImages}
              maxImages={10}
              title="Upload Product Images"
              description="Add up to 10 images for your product"
            />
          </div>

          {/* Metadata Images Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-base font-semibold">Brand Assets</Label>
              {metadataImages.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {metadataImages.length} asset{metadataImages.length !== 1 ? 's' : ''} added
                </Badge>
              )}
            </div>
            <MultiImageUpload
              images={metadataImages}
              onChange={setMetadataImages}
              maxImages={8}
              isMetadata={true}
              title="Upload Brand Assets"
              description="Add logos, banners, and other brand materials"
              metadataTypes={['logo', 'banner', 'gallery', 'thumbnail']}
            />
          </div>

          {/* Pricing Logic Display */}
          {directory?.config?.features?.showPrice === false && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>Price Hidden (Default $100)</strong> - This directory has pricing disabled. 
                Products will be created with a default $100 price to ensure store availability.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={createProductMutation.isPending}
              className="flex-1"
            >
              {createProductMutation.isPending ? 'Creating Product...' : 'Create GoHighLevel Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createProductMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}