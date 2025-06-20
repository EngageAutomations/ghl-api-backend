import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { generateFormFields } from '@/lib/dynamic-form-generator';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { X, Plus } from 'lucide-react';

interface DirectoryFormRendererProps {
  config: any;
  onClose: () => void;
  directoryName: string;
}

export function DirectoryFormRenderer({ config, onClose, directoryName }: DirectoryFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formFields, setFormFields] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Generate form fields based on directory configuration
    if (config) {
      try {
        const formConfig = {
          customFieldName: config.form?.fieldName || 'listing',
          showDescription: config.features?.showDescription || false,
          showMetadata: config.features?.showMetadata || false,
          showMaps: config.features?.showMaps || false,
          showPrice: config.features?.showPrice || false,
          metadataFields: config.metadataFields || [],
          formEmbedUrl: config.form?.embedCode || '',
          buttonType: config.button?.type || 'popup'
        };
        
        console.log('Directory config:', config);
        console.log('Form config:', formConfig);

        const fields = generateFormFields(formConfig);
        console.log('Generated form fields:', fields); // Debug log
        
        // Ensure image field is always present
        const hasImageField = fields.some(field => field.name === 'image');
        if (!hasImageField) {
          fields.splice(2, 0, {
            name: 'image',
            label: 'Product Image',
            type: 'url',
            required: true,
            placeholder: 'https://example.com/image.jpg or Google Drive URL',
            description: 'Upload your image to Google Drive or provide a direct URL'
          });
        }
        
        setFormFields(fields);

        // Initialize form data with empty values
        const initialData: Record<string, string> = {};
        fields.forEach(field => {
          initialData[field.name] = '';
        });
        setFormData(initialData);
      } catch (error) {
        console.error('Error generating form fields:', error);
        toast({
          title: "Error",
          description: "Failed to generate form fields",
          variant: "destructive"
        });
      }
    }
  }, [config, toast]);

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: async (listingData: any) => {
      return apiRequest('/api/listings', {
        method: 'POST',
        data: listingData
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Auto-generate slug from name
    if (fieldName === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData(prev => ({
        ...prev,
        url_slug: slug,
        [config.form?.fieldName || 'listing']: slug
      }));

      // Auto-fill SEO title if empty
      if (!formData.seo_title) {
        setFormData(prev => ({
          ...prev,
          seo_title: value
        }));
      }
    }

    // Auto-copy description to SEO description
    if (fieldName === 'description' && !formData.seo_description) {
      setFormData(prev => ({
        ...prev,
        seo_description: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = formFields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => !formData[field.name]?.trim());

    if (missingFields.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    // Prepare listing data
    const listingData = {
      directoryName,
      title: formData.name,
      description: formData.description,
      price: formData.price || null,
      imageUrl: formData.image || null,
      location: formData.address || null,
      category: 'Product',
      isActive: true,
      slug: formData.url_slug,
      seoTitle: formData.seo_title,
      seoDescription: formData.seo_description,
      metadata: {}
    };

    // Add metadata fields
    formFields.forEach(field => {
      if (field.name.startsWith('metadata_') && formData[field.name]) {
        listingData.metadata[field.label] = formData[field.name];
      }
    });

    createListingMutation.mutate(listingData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Create New Product</h3>
          <p className="text-sm text-gray-600">
            Fill out the form to create a new product for {directoryName}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Interactive Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Debug info */}
        <div className="text-xs text-gray-500 mb-2">
          Total fields: {formFields.length}, Visible fields: {formFields.filter(field => field.type !== 'hidden').length}
          <br/>
          Field names: {formFields.map(f => f.name).join(', ')}
          <br/>
          Visible field names: {formFields.filter(field => field.type !== 'hidden').map(f => f.name).join(', ')}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formFields
            .filter(field => field.type !== 'hidden')
            .map((field) => (
              <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === 'url' ? 'url' : 'text'}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1"
                  />
                )}
                
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
              </div>
            ))}
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createListingMutation.isPending}
            className="flex items-center gap-2"
          >
            {createListingMutation.isPending ? (
              <>Creating...</>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create Product
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}