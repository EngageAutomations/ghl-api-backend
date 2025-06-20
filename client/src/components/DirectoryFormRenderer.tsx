import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateFormFields, type DirectoryConfig, type FormField } from '@/lib/dynamic-form-generator';
import { apiRequest } from '@/lib/queryClient';

interface DirectoryFormRendererProps {
  directoryName: string;
  directoryConfig?: DirectoryConfig;
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

  const renderFormField = (field: FormField) => {
    if (field.type === 'hidden') return null;

    const hasError = validationErrors[field.name];
    const value = formData[field.name] || '';

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        {field.type === 'textarea' ? (
          <div className="space-y-2">
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? 'border-red-500' : ''}
              rows={field.name === 'expanded_description' ? 6 : 4}
            />
            
            {/* AI Bullet Point Generator for description field */}
            {field.name === 'description' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateBulletPoints}
                disabled={isGeneratingBullets || !value.trim()}
                className="flex items-center gap-2"
              >
                {isGeneratingBullets ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isGeneratingBullets ? 'Generating...' : 'Generate Bullet Points with AI'}
              </Button>
            )}
          </div>
        ) : (
          <Input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={hasError ? 'border-red-500' : ''}
          />
        )}
        
        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}
        
        {hasError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <X className="h-3 w-3" />
            {hasError}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Create New Product</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Add a new product to the <Badge variant="secondary">{directoryName}</Badge> directory
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Check className="h-3 w-3 text-green-500" />
            Wizard Form System
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Required Information
            </h3>
            {formFields
              .filter(field => field.required && field.type !== 'hidden')
              .map(renderFormField)}
          </div>

          {/* Optional Fields Section */}
          {formFields.some(field => !field.required && field.type !== 'hidden') && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Optional Information
              </h3>
              {formFields
                .filter(field => !field.required && field.type !== 'hidden')
                .map(renderFormField)}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating Product...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}