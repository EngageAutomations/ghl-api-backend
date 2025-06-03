import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Copy, Download, Check } from 'lucide-react';
import { generateFormFields, type DirectoryConfig } from '@/lib/dynamic-form-generator';

interface FormData {
  [key: string]: string;
}

interface FormConfig {
  locationId: string;
  directoryName: string;
  logoUrl?: string;
  config: DirectoryConfig;
  actionButtonColor: string;
}

export default function DirectoryForm() {
  const [match, params] = useRoute('/form/:locationId/:directoryName');
  const [formData, setFormData] = useState<FormData>({});
  const [formConfig, setFormConfig] = useState<FormConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [embedCopied, setEmbedCopied] = useState(false);

  // Load form configuration based on URL parameters
  useEffect(() => {
    if (match && params) {
      // In a real implementation, this would fetch from API
      // For now, using default configuration
      const defaultConfig: FormConfig = {
        locationId: params.locationId,
        directoryName: params.directoryName,
        logoUrl: '/logo.png', // Default logo
        config: {
          customFieldName: 'listing',
          showDescription: true,
          showMetadata: true,
          showMaps: true,
          showPrice: true,
          metadataFields: [],
          formEmbedUrl: '',
          buttonType: 'popup'
        },
        actionButtonColor: '#3b82f6'
      };
      
      setFormConfig(defaultConfig);
    }
  }, [match, params]);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate URL slug from product name
    if (name === 'name' && value) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({
        ...prev,
        url_slug: slug
      }));
      
      // Auto-fill SEO title if empty
      if (!formData.seo_title) {
        setFormData(prev => ({
          ...prev,
          seo_title: value
        }));
      }
    }
    
    // Auto-fill SEO description from basic description
    if (name === 'description' && value && !formData.seo_description) {
      setFormData(prev => ({
        ...prev,
        seo_description: value
      }));
    }
  };

  const handleAISummarize = async () => {
    if (!formData.description?.trim()) {
      alert('Please enter a description first');
      return;
    }

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

      if (!response.ok) {
        throw new Error('Failed to generate bullet points');
      }

      const data = await response.json();
      if (data.bulletPoints && data.bulletPoints.length > 0) {
        const bulletText = data.bulletPoints.map((point: string) => '• ' + point).join('\n');
        handleInputChange('description', bulletText);
      }
    } catch (error) {
      console.error('AI Summarization error:', error);
      alert('Failed to generate bullet points. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate GoHighLevel API-compatible data
      const ghlData = {
        product: {
          name: formData.name,
          description: formData.description,
          images: formData.image ? [formData.image] : [],
          price: formData.price ? parseFloat(formData.price.replace(/[^0-9.]/g, '')) * 100 : null, // Convert to cents
          slug: formData.url_slug,
          seo: {
            title: formData.seo_title,
            description: formData.seo_description
          },
          metadata: {
            expanded_description: formData.expanded_description || '',
            location_id: formConfig?.locationId,
            directory_name: formConfig?.directoryName,
            created_via: 'directory_form'
          }
        },
        locationId: formConfig?.locationId,
        submissionTime: new Date().toISOString()
      };

      setGeneratedData(ghlData);
      setShowSuccess(true);
      
      // In a real implementation, you would send this to your backend
      // which would then make the GoHighLevel API call
      console.log('Generated GoHighLevel data:', ghlData);
      
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateEmbedCode = () => {
    if (!formConfig) return '';
    
    const embedUrl = `${window.location.origin}/form/${formConfig.locationId}/${formConfig.directoryName}`;
    return `<iframe src="${embedUrl}" width="100%" height="800" frameborder="0" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"></iframe>`;
  };

  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy embed code:', error);
    }
  };

  const downloadData = () => {
    if (!generatedData) return;
    
    const blob = new Blob([JSON.stringify(generatedData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formConfig?.directoryName}-${formData.url_slug || 'listing'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!match || !formConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-slate-600">Form not found or invalid URL</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formFields = generateFormFields(formConfig.config);

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Listing Submitted Successfully!</h1>
                <p className="text-slate-600 mt-2">Your directory listing has been processed and is ready for GoHighLevel integration.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Generated GoHighLevel Data</Label>
                <div className="mt-2 p-4 bg-slate-900 text-slate-100 rounded-lg text-sm overflow-auto max-h-40">
                  <pre>{JSON.stringify(generatedData, null, 2)}</pre>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={downloadData} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download JSON
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSuccess(false);
                    setFormData({});
                    setGeneratedData(null);
                  }}
                  className="flex-1"
                >
                  Submit Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Company Logo */}
        {formConfig.logoUrl && (
          <div className="text-center mb-8">
            <img 
              src={formConfig.logoUrl} 
              alt="Company Logo" 
              className="h-16 mx-auto"
              onError={(e) => {
                // Hide logo if it fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-center">
              Add Listing to {formConfig.directoryName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
            <p className="text-slate-600 text-center">
              Fill out the form below to add your listing to our directory
            </p>
            
            {/* Embed Code Section */}
            <div className="mt-4 p-3 bg-slate-100 rounded-lg">
              <Label className="text-sm font-medium">Embed this form on your website:</Label>
              <div className="mt-2 flex gap-2">
                <code className="flex-1 text-xs bg-white p-2 rounded border text-slate-600 overflow-auto">
                  {generateEmbedCode()}
                </code>
                <Button size="sm" variant="outline" onClick={copyEmbedCode}>
                  {embedCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {formFields.map((field, index) => {
                if (field.type === 'hidden') {
                  return (
                    <input
                      key={field.name}
                      type="hidden"
                      name={field.name}
                      value={formData[field.name] || ''}
                    />
                  );
                }

                return (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    
                    {field.type === 'textarea' ? (
                      <div>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          placeholder={field.placeholder}
                          required={field.required}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          rows={4}
                        />
                        {field.name === 'description' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAISummarize}
                            className="mt-2"
                          >
                            📝 Generate Bullet Points with AI
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                      />
                    )}
                    
                    {field.description && (
                      <p className="text-sm text-slate-500">{field.description}</p>
                    )}
                  </div>
                );
              })}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                style={{ backgroundColor: formConfig.actionButtonColor }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Listing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}