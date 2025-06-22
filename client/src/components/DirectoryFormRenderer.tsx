import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles, Check, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useWizardFormTemplate } from '@/hooks/useWizardFormTemplate';
import { generateFormFields, DirectoryConfig } from '@/lib/dynamic-form-generator';

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
  
  // Load wizard template to match exact form layout - always call this hook
  const { data: wizardTemplate, isLoading: isLoadingTemplate, error: templateError } = useWizardFormTemplate(directoryName);

  // Generate form fields from wizard template or use defaults
  useEffect(() => {
    // Always set form fields, either from template or defaults
    const defaultFields = [
      { name: 'name', label: 'Product/Service Name', type: 'text', required: true, placeholder: 'Enter the name of your product or service' },
      { name: 'description', label: 'Product Description', type: 'textarea', required: true, placeholder: 'Describe your product or service...' },
      { name: 'image', label: 'Product Image', type: 'url', required: true, placeholder: 'Upload image', description: 'Upload to GoHighLevel Media Library' },
      { name: 'price', label: 'Price', type: 'text', required: false, placeholder: '$99.99' },
      { name: 'expanded_description', label: 'Detailed Description', type: 'textarea', required: false, placeholder: 'Provide detailed information...' },
      { name: 'address', label: 'Business Address', type: 'text', required: false, placeholder: '123 Main St, City, State 12345' },
      { name: 'seo_title', label: 'SEO Title', type: 'text', required: true, placeholder: 'SEO-optimized title' },
      { name: 'seo_description', label: 'SEO Description', type: 'textarea', required: true, placeholder: 'Brief description for search engines' }
    ];
    
    const templateFields = wizardTemplate?.formFields || defaultFields;
    console.log('Loading form fields:', templateFields.length, 'fields');
    
    setFormFields(templateFields);
    
    // Initialize form data with proper defaults for all fields
    const initialData: Record<string, any> = {};
    templateFields.forEach(field => {
      initialData[field.name] = formData[field.name] || '';
    });
    setFormData(prev => ({ ...prev, ...initialData }));
    
    console.log('Initialized comprehensive form with fields:', templateFields.map(f => f.name));
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
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const response = await apiRequest('/api/railway/media/upload', {
        method: 'POST',
        data: formData,
      });
      
      if (response.url) {
        setUploadedImages(prev => [...prev, response.url]);
        toast({
          title: "Image Uploaded",
          description: "Image uploaded to GoHighLevel Media Library successfully!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
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
        directoryName,
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

  // Render form field based on wizard template
  const renderFormField = (field: any) => {
    if (field.type === 'hidden') return null;
    
    const fieldError = errors[field.name];
    const isRequired = field.required;
    
    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name} className="text-sm font-medium text-gray-700">
          {field.label} {isRequired && '*'}
        </Label>
        
        {field.name === 'image' ? (
          // Special image upload field
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : fieldError 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {isUploadingImage ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-blue-600">Uploading to GoHighLevel...</span>
              </div>
            ) : uploadedImages.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <Check className="h-5 w-5" />
                  <span>Image uploaded successfully!</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={url} 
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Drop your image here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Upload to GoHighLevel Media Library
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
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