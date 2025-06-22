import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Check, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useWizardFormTemplate } from '@/hooks/useWizardFormTemplate';
import { generateFormFields, DirectoryConfig } from '@/lib/dynamic-form-generator';
import { RichTextEditor } from '@/components/RichTextEditor';

interface DirectoryFormRendererProps {
  directoryName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function DirectoryFormRenderer({ 
  directoryName, 
  onSuccess, 
  onCancel 
}: DirectoryFormRendererProps) {
  const { toast } = useToast();
  
  // Initialize all hooks at the top level to avoid conditional hook calls
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBulletPoints, setIsGeneratingBulletPoints] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    description: '',
    price: '',
    seo_title: '',
    seo_description: '',
    expanded_description: '',
    address: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [metadataFieldCount, setMetadataFieldCount] = useState(1);
  
  // Load wizard template to match exact form layout - always call this hook
  const { data: wizardTemplate, isLoading: isLoadingTemplate, error: templateError } = useWizardFormTemplate(directoryName);

  // Generate form fields using wizard's saved configuration and same logic
  useEffect(() => {
    if (wizardTemplate?.wizardConfiguration) {
      // Reuse the exact same generateFormFields function from wizard
      const wizardConfig: DirectoryConfig = {
        customFieldName: wizardTemplate.wizardConfiguration.fieldName || 'listing',
        showDescription: wizardTemplate.wizardConfiguration.showDescription ?? false,
        showMetadata: wizardTemplate.wizardConfiguration.showMetadata ?? false,
        showMaps: wizardTemplate.wizardConfiguration.showMaps ?? false,
        showPrice: wizardTemplate.wizardConfiguration.showPrice ?? false,
        metadataFields: wizardTemplate.wizardConfiguration.metadataFields || [],
        formEmbedUrl: wizardTemplate.wizardConfiguration.embedCode || '',
        buttonType: wizardTemplate.wizardConfiguration.buttonType || 'popup'
      };
      
      // Use the exact same form generation logic as the wizard
      const generatedFields = generateFormFields(wizardConfig);
      setFormFields(generatedFields);
      console.log('Reusing wizard form generation logic - fields:', generatedFields.map(f => f.name));
      console.log('Wizard config applied:', {
        showDescription: wizardConfig.showDescription,
        showMetadata: wizardConfig.showMetadata,
        showMaps: wizardConfig.showMaps,
        showPrice: wizardConfig.showPrice,
        metadataFields: wizardConfig.metadataFields
      });
    } else {
      // Fallback to basic configuration if no wizard template exists
      const defaultConfig: DirectoryConfig = {
        customFieldName: 'listing',
        showDescription: true,
        showMetadata: false,
        showMaps: false,
        showPrice: true,
        metadataFields: [],
        formEmbedUrl: '',
        buttonType: 'popup'
      };
      
      const generatedFields = generateFormFields(defaultConfig);
      setFormFields(generatedFields);
      console.log('Using default form configuration - fields:', generatedFields.map(f => f.name));
    }
  }, [wizardTemplate]);

  // Show loading state while template loads - but don't block rendering
  const showLoadingOverlay = isLoadingTemplate && formFields.length === 0;

  // Debug wizard template loading
  useEffect(() => {
    if (templateError) {
      console.error('Template loading error:', templateError);
    }
    if (wizardTemplate) {
      console.log('DirectoryFormRenderer received template:', {
        directoryName: wizardTemplate.directoryName,
        formFieldsCount: wizardTemplate.formFields?.length,
        formFields: wizardTemplate.formFields?.map(f => f.name)
      });
    }
  }, [templateError, wizardTemplate]);

  // Auto-generate SEO fields when name or description changes
  useEffect(() => {
    if (formData.name && !formData.seo_title) {
      setFormData(prev => ({
        ...prev,
        seo_title: `${prev.name} - ${directoryName} Directory`
      }));
    }
  }, [formData.name, directoryName]);

  useEffect(() => {
    if (formData.description && !formData.seo_description) {
      const shortDesc = formData.description.substring(0, 150);
      setFormData(prev => ({
        ...prev,
        seo_description: shortDesc + (formData.description.length > 150 ? '...' : '')
      }));
    }
  }, [formData.description]);

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploadingImage(true);
    
    // Create local preview URL immediately for better UX
    const previewUrl = URL.createObjectURL(file);
    setUploadedImages(prev => [...prev, previewUrl]);
    
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const response = await fetch('/api/railway/media/upload', {
        method: 'POST',
        body: uploadData,
      });
      
      const result = await response.json();
      
      if (result.success && result.url) {
        // Replace preview URL with actual uploaded URL
        setUploadedImages(prev => 
          prev.map(url => url === previewUrl ? result.url : url)
        );
        toast({
          title: "Image Uploaded",
          description: "Image uploaded to GoHighLevel Media Library successfully!",
        });
      } else {
        // Keep preview URL since upload failed
        toast({
          title: "Preview Added",
          description: "Image preview ready (GoHighLevel upload requires OAuth)",
          variant: "default",
        });
      }
    } catch (error: any) {
      // Keep preview URL since upload failed
      toast({
        title: "Preview Added", 
        description: "Image preview ready (GoHighLevel upload requires OAuth)",
        variant: "default",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    }
  };

  // Generate AI bullet points
  const generateBulletPoints = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in the product name and description first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBulletPoints(true);
    try {
      const response = await apiRequest('/api/ai/generate-bullet-points', {
        method: 'POST',
        data: {
          name: formData.name,
          description: formData.description,
          directoryName
        }
      });

      if (response && Array.isArray(response)) {
        setBulletPoints(response);
        toast({
          title: "Bullet Points Generated",
          description: "AI-powered bullet points created successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate bullet points",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBulletPoints(false);
    }
  };

  // Validate form based on wizard template
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate based on generated form fields
    formFields.forEach(field => {
      if (field.required) {
        if (field.name === 'image') {
          if (uploadedImages.length === 0) {
            newErrors.image = `${field.label} is required`;
          }
        } else if (!formData[field.name] || formData[field.name].toString().trim() === '') {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
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

    setIsLoading(true);
    try {
      const listingData = {
        directoryName, // Associate with source directory
        title: formData.name,
        description: formData.description,
        expandedDescription: formData.expanded_description || '',
        price: formData.price || '',
        address: formData.address || '',
        imageUrl: uploadedImages[0] || '',
        images: uploadedImages,
        seoTitle: formData.seo_title,
        seoDescription: formData.seo_description,
        bulletPoints,
        slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        isActive: true,
        // Store wizard configuration reference for future edits
        wizardConfigurationId: wizardTemplate?.id,
        // Include metadata fields
        ...Object.keys(formData).reduce((acc, key) => {
          if (key.startsWith('metadata_')) {
            acc[key] = formData[key];
          }
          return acc;
        }, {} as Record<string, any>)
      };

      const response = await apiRequest('/api/listings', {
        method: 'POST',
        data: listingData
      });

      if (response) {
        toast({
          title: "Product Created",
          description: "Your product has been created successfully!",
        });
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add more metadata fields dynamically
  const addMetadataField = () => {
    if (metadataFieldCount < 8) {
      setMetadataFieldCount(prev => prev + 1);
    }
  };

  // Render metadata fields in pairs
  const renderMetadataFields = () => {
    const hasMetadata = formFields.some(field => field.name.startsWith('metadata_'));
    if (!hasMetadata) return null;
    
    // Find font field
    const fontField = formFields.find(field => field.name === 'metadata_text_font');
    const fontError = errors['metadata_text_font'];
    
    return (
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700">
          Metadata Bar Fields
          <div className="text-xs text-gray-500 mt-1">Add up to 8 icon + text pairs (Default: 1 field)</div>
        </div>
        
        {/* Font Selection Field - Under title, above metadata rows */}
        {fontField && (
          <div className="space-y-2">
            <Select
              value={formData['metadata_text_font'] || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, 'metadata_text_font': value }))}
            >
              <SelectTrigger className={`w-full ${fontError ? 'border-red-500' : ''}`}>
                <SelectValue 
                  placeholder={fontField.placeholder}
                  style={{ fontFamily: formData['metadata_text_font'] || 'inherit' }}
                />
              </SelectTrigger>
              <SelectContent>
                {fontField.options?.map((option) => (
                  <SelectItem key={option} value={option} style={{ fontFamily: option }}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fontError && <p className="text-xs text-red-600">{fontError}</p>}
          </div>
        )}
        
        {/* Render metadata field pairs based on count */}
        {Array.from({ length: metadataFieldCount }, (_, index) => {
          const iconFieldName = `metadata_icon_${index}`;
          const textFieldName = `metadata_text_${index}`;
          const iconError = errors[iconFieldName];
          const textError = errors[textFieldName];
          
          return (
            <div key={`metadata-pair-${index}`} className="grid grid-cols-[auto_1fr] gap-4 items-start">
              {/* Icon Upload - Clickable Button */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-600">Icon</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const file = e.target.files[0];
                        const url = URL.createObjectURL(file);
                        setFormData(prev => ({ ...prev, [iconFieldName]: url }));
                      }
                    }}
                    className="hidden"
                    id={`icon-upload-${index}`}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById(`icon-upload-${index}`)?.click()}
                    className="w-12 h-12 border-2 border-gray-300 rounded-md flex items-center justify-center bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    {formData[iconFieldName] ? (
                      <img 
                        src={formData[iconFieldName]}
                        alt="Uploaded icon"
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <Upload className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {iconError && <p className="text-xs text-red-600">{iconError}</p>}
              </div>
              
              {/* Display Text */}
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-600">Display Text</Label>
                <Input
                  placeholder="Enter display text"
                  value={formData[textFieldName] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [textFieldName]: e.target.value }))}
                  className={`w-full ${textError ? 'border-red-500' : ''}`}
                />
                {textError && <p className="text-xs text-red-600">{textError}</p>}
              </div>
            </div>
          );
        })}
        
        {/* Add Additional Field Button */}
        {metadataFieldCount < 8 && (
          <button
            type="button"
            onClick={addMetadataField}
            className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            <span className="text-lg mr-2">+</span>
            Add Additional Field (up to 8 total)
          </button>
        )}
      </div>
    );
  };

  // Render form field based on wizard template
  const renderFormField = (field: any) => {
    if (field.type === 'hidden' || field.name.startsWith('metadata_')) return null;
    
    const fieldError = errors[field.name];
    const isRequired = field.required;
    
    // Debug all field types to identify the issue
    console.log(`Field ${field.name}: type=${field.type}, label=${field.label}`);
    
    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
          {field.label} {isRequired && '*'}
        </Label>
        
        {field.name === 'image' ? (
          // Multi-image upload field
          <div className="space-y-3">
            {/* Upload Button */}
            <div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    Array.from(e.target.files).forEach(file => handleImageUpload(file));
                  }
                }}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                className="w-full"
                disabled={isUploadingImage}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Add Images
                  </>
                )}
              </Button>
            </div>

            {/* Image Gallery */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="w-full h-20 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Product image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image load error for:', url);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                </svg>
                              </div>
                            `;
                          }
                        }}
                        onLoad={() => console.log('Image loaded successfully:', url)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        // Clean up object URL to prevent memory leaks
                        if (url.startsWith('blob:')) {
                          URL.revokeObjectURL(url);
                        }
                        setUploadedImages(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Status */}
            {uploadedImages.length > 0 && !isUploadingImage && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>{uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} uploaded</span>
              </div>
            )}
          </div>
        ) : field.type === 'textarea' ? (
          <div className="space-y-2">
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
              rows={4}
              className={`w-full ${fieldError ? 'border-red-500' : ''}`}
            />
            {field.name === 'description' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateBulletPoints}
                disabled={isGeneratingBulletPoints || !formData.name || !formData.description}
                className="text-xs"
              >
                {isGeneratingBulletPoints ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-2" />
                    Generate Bullet Points
                  </>
                )}
              </Button>
            )}
          </div>
        ) : field.type === 'richtext' ? (
          <div className="space-y-2">
            <RichTextEditor
              value={formData[field.name] || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
              placeholder={field.placeholder}
              className={`min-h-[200px] ${fieldError ? 'border-red-500' : ''}`}
            />
          </div>
        ) : field.type === 'icon_upload' ? (
          // This case is handled in the metadata pair grouping above
          null
        ) : field.type === 'select' ? (
          <div className="space-y-2">
            <Select
              value={formData[field.name] || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
            >
              <SelectTrigger className={`w-full ${fieldError ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Input
            id={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className={`w-full ${fieldError ? 'border-red-500' : ''}`}
          />
        )}
        
        {fieldError && (
          <p className="text-sm text-red-600">{fieldError}</p>
        )}
        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}
      </div>
    );
  };

  // Don't block rendering while loading template - show form with defaults instead

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="border-2 shadow-lg">
        <CardContent className="p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Create GoHighLevel Product
              </h2>
              <p className="text-gray-600">
                Add a new product to your {directoryName} directory
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Debug info */}
              {formFields.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Loading form configuration... Expected fields: name, description, image, price, expanded_description, address, seo_title, seo_description
                  </p>
                </div>
              )}
              
              {/* Render form fields based on wizard template */}
              {formFields.map(field => renderFormField(field))}
              
              {/* Render metadata fields in pairs */}
              {renderMetadataFields()}

              {/* AI Bullet Points Display */}
              {bulletPoints.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    AI-Generated Bullet Points
                  </Label>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <ul className="space-y-1">
                      {bulletPoints.map((point, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Product...
                  </>
                ) : (
                  'Create Product'
                )}
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}