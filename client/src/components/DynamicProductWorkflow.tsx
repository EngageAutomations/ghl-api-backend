import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, CheckCircle, XCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DirectoryFormExample {
  directoryName: string;
  requiredFields: string[];
  optionalFields: string[];
  fieldMapping: {
    titleField: string;
    descriptionField: string;
    priceField: string;
    seoTitleField?: string;
    seoDescriptionField?: string;
    seoKeywordsField?: string;
  };
  wizardConfig: {
    showDescription: boolean;
    showPrice: boolean;
    showMetadata: boolean;
    showMaps: boolean;
  };
}

interface WorkflowResult {
  success: boolean;
  productId?: string;
  imageUrl?: string;
  directoryName?: string;
  extractedData?: any;
  steps: {
    imageUpload: { success: boolean; url?: string; error?: string };
    productCreation: { success: boolean; id?: string; error?: string };
    imageAttachment: { success: boolean; error?: string };
    priceCreation: { success: boolean; error?: string };
  };
  error?: string;
}

interface DynamicProductWorkflowProps {
  directoryName?: string;
}

export function DynamicProductWorkflow({ directoryName = '' }: DynamicProductWorkflowProps) {
  const [selectedDirectory, setSelectedDirectory] = useState(directoryName);
  const [formData, setFormData] = useState({
    installationId: '',
    name: '',         // Title field
    description: '',  // Description field  
    price: '',        // Price field
    seoTitle: '',     // SEO title (optional)
    seoDescription: '', // SEO description (optional)
    seoKeywords: ''   // SEO keywords (optional)
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [directoryExample, setDirectoryExample] = useState<DirectoryFormExample | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);
  
  const { toast } = useToast();

  // Load directory form example when directory changes
  useEffect(() => {
    if (selectedDirectory) {
      loadDirectoryExample();
    }
  }, [selectedDirectory]);

  const loadDirectoryExample = async () => {
    setLoadingExample(true);
    try {
      const response = await fetch(`/api/workflow/directory/${encodeURIComponent(selectedDirectory)}/example`);
      const example = await response.json();
      
      if (example.error) {
        toast({
          title: "Directory not configured",
          description: example.error,
          variant: "destructive"
        });
        setDirectoryExample(null);
      } else {
        setDirectoryExample(example);
      }
    } catch (error) {
      console.error('Failed to load directory example:', error);
      setDirectoryExample(null);
    } finally {
      setLoadingExample(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (25MB)
      if (file.size > 25 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 25MB",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDirectory) {
      toast({
        title: "Directory required",
        description: "Please select a directory for the workflow",
        variant: "destructive"
      });
      return;
    }

    if (!formData.installationId) {
      toast({
        title: "Installation ID required",
        description: "Please enter your GoHighLevel installation ID",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: "Image required",
        description: "Please select an image file for your product",
        variant: "destructive"
      });
      return;
    }
    
    // Validate required fields based on directory configuration
    if (directoryExample) {
      const missingFields = directoryExample.requiredFields.filter(field => {
        const value = formData[field as keyof typeof formData];
        return !value || value.toString().trim() === '';
      });
      
      if (missingFields.length > 0) {
        toast({
          title: "Missing required fields",
          description: `Please fill in: ${missingFields.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
    }

    setIsLoading(true);
    setWorkflowResult(null);

    try {
      // Prepare form data for dynamic workflow
      const formPayload = new FormData();
      formPayload.append('image', selectedFile);
      
      // Add form data with installation ID
      const workflowData = {
        installationId: formData.installationId,
        ...formData
      };
      
      formPayload.append('data', JSON.stringify(workflowData));

      // Submit to dynamic workflow API
      const response = await fetch(`/api/workflow/directory/${encodeURIComponent(selectedDirectory)}`, {
        method: 'POST',
        body: formPayload
      });

      const result: WorkflowResult = await response.json();
      setWorkflowResult(result);

      if (result.success) {
        toast({
          title: "Product created successfully!",
          description: `Product ID: ${result.productId}`,
        });
      } else {
        toast({
          title: "Workflow failed",
          description: result.error || "An error occurred during product creation",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message || "Failed to submit workflow",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { name: 'Upload Image', key: 'imageUpload' },
    { name: 'Create Product', key: 'productCreation' },
    { name: 'Attach Image', key: 'imageAttachment' },
    { name: 'Add Pricing', key: 'priceCreation' }
  ];

  const getStepIcon = (step: any, index: number) => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (step?.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (step?.error) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dynamic Product Creation Workflow</CardTitle>
          <CardDescription>
            Create GoHighLevel products based on directory wizard configurations. 
            Only essential fields (title, description, price, SEO) are sent to GoHighLevel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Directory Selection */}
          <div className="space-y-2">
            <Label htmlFor="directory">Directory Name</Label>
            <div className="flex gap-2">
              <Input
                id="directory"
                value={selectedDirectory}
                onChange={(e) => setSelectedDirectory(e.target.value)}
                placeholder="Enter directory name (e.g., car-detailing-services)"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={loadDirectoryExample}
                disabled={!selectedDirectory || loadingExample}
              >
                {loadingExample ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" />}
                Load Config
              </Button>
            </div>
          </div>

          {/* Directory Configuration Info */}
          {directoryExample && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <h4 className="font-medium text-blue-900 mb-2">Directory Configuration: {directoryExample.directoryName}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Required Fields:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {directoryExample.requiredFields.map(field => (
                        <Badge key={field} variant="secondary">{field}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Optional Fields:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {directoryExample.optionalFields.map(field => (
                        <Badge key={field} variant="outline">{field}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Installation ID */}
            <div className="space-y-2">
              <Label htmlFor="installationId">Installation ID</Label>
              <Input
                id="installationId"
                value={formData.installationId}
                onChange={(e) => setFormData(prev => ({ ...prev, installationId: e.target.value }))}
                placeholder="install_1234567890"
                required
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Product Image</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {selectedFile && (
                  <Badge variant="secondary">
                    {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
                  </Badge>
                )}
              </div>
            </div>

            {/* Essential GoHighLevel Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Essential Product Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Product Title *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Premium Car Detailing Service"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Product Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Professional car detailing service with premium products and expert care"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="150.00"
                  required
                />
              </div>
            </div>

            {/* Optional SEO Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SEO Information (Optional)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  placeholder="Best Car Detailing Service | Premium Auto Care"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  placeholder="Professional car detailing services with premium products. Book your appointment today for expert auto care."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">SEO Keywords</Label>
                <Input
                  id="seoKeywords"
                  value={formData.seoKeywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                  placeholder="car detailing, auto care, premium service"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading || !selectedDirectory} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Product in GoHighLevel
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Workflow Progress */}
      {(isLoading || workflowResult) && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow Progress</CardTitle>
            <CardDescription>
              4-step GoHighLevel product creation with automatic retry functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {steps.map((step, index) => {
                const stepResult = workflowResult?.steps[step.key as keyof typeof workflowResult.steps];
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {getStepIcon(stepResult, index)}
                    <span className={`flex-1 ${stepResult?.success ? 'text-green-700' : stepResult?.error ? 'text-red-700' : ''}`}>
                      {step.name}
                    </span>
                    {(stepResult as any)?.url && (
                      <Badge variant="outline" className="text-xs">
                        URL: {(stepResult as any).url.slice(-15)}...
                      </Badge>
                    )}
                    {(stepResult as any)?.id && (
                      <Badge variant="outline" className="text-xs">
                        ID: {(stepResult as any).id.slice(-8)}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {workflowResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-2">
                  {workflowResult.success ? (
                    <div className="text-green-700">
                      <strong>✅ Product created successfully in GoHighLevel!</strong>
                      <div>Product ID: {workflowResult.productId}</div>
                      <div>Directory: {workflowResult.directoryName}</div>
                      {workflowResult.imageUrl && <div>Image URL: {workflowResult.imageUrl}</div>}
                    </div>
                  ) : (
                    <div className="text-red-700">
                      <strong>❌ Workflow failed</strong>
                      <div>{workflowResult.error}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}