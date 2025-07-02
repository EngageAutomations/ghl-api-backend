import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStep {
  success: boolean;
  url?: string;
  id?: string;
  error?: string;
}

interface WorkflowResult {
  success: boolean;
  productId?: string;
  imageUrl?: string;
  steps: {
    imageUpload: WorkflowStep;
    productCreation: WorkflowStep;
    imageAttachment: WorkflowStep;
    priceCreation: WorkflowStep;
  };
  error?: string;
  tokenRefreshed?: boolean;
}

export function ProductWorkflow() {
  const [formData, setFormData] = useState({
    installationId: '',
    productName: '',
    productDescription: '',
    productType: 'one_time',
    priceAmount: '',
    priceCurrency: 'USD',
    priceType: 'one_time',
    priceInterval: 'month'
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  const { toast } = useToast();

  const steps = [
    { name: 'Upload Image', key: 'imageUpload' },
    { name: 'Create Product', key: 'productCreation' },
    { name: 'Attach Image', key: 'imageAttachment' },
    { name: 'Add Pricing', key: 'priceCreation' }
  ];

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
    
    // Validation
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
    
    if (!formData.productName || !formData.productDescription || !formData.priceAmount) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all product and pricing information",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setCurrentStep(0);
    setWorkflowResult(null);

    try {
      // Prepare form data
      const formPayload = new FormData();
      formPayload.append('image', selectedFile);
      
      const workflowData = {
        installationId: formData.installationId,
        product: {
          name: formData.productName,
          description: formData.productDescription,
          type: formData.productType
        },
        price: {
          amount: parseInt(formData.priceAmount) * 100, // Convert to cents
          currency: formData.priceCurrency,
          type: formData.priceType,
          ...(formData.priceType === 'recurring' && { interval: formData.priceInterval })
        }
      };
      
      formPayload.append('data', JSON.stringify(workflowData));

      // Submit to workflow API
      const response = await fetch('/api/workflow/product-creation', {
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

  const getStepIcon = (step: WorkflowStep, index: number) => {
    if (isLoading && currentStep === index) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (step.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (step.error) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Creation Workflow</CardTitle>
          <CardDescription>
            Create a complete GoHighLevel product with image upload, pricing, and automatic retry functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Premium Car Detailing Service"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productType">Product Type</Label>
                <Select value={formData.productType} onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productDescription">Product Description</Label>
              <Textarea
                id="productDescription"
                value={formData.productDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                placeholder="Professional car detailing service with premium products and expert care"
                rows={3}
                required
              />
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priceAmount">Price (in dollars)</Label>
                <Input
                  id="priceAmount"
                  type="number"
                  step="0.01"
                  value={formData.priceAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceAmount: e.target.value }))}
                  placeholder="150.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceCurrency">Currency</Label>
                <Select value={formData.priceCurrency} onValueChange={(value) => setFormData(prev => ({ ...prev, priceCurrency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priceType">Billing Type</Label>
                <Select value={formData.priceType} onValueChange={(value) => setFormData(prev => ({ ...prev, priceType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.priceType === 'recurring' && (
              <div className="space-y-2">
                <Label htmlFor="priceInterval">Billing Interval</Label>
                <Select value={formData.priceInterval} onValueChange={(value) => setFormData(prev => ({ ...prev, priceInterval: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Daily</SelectItem>
                    <SelectItem value="week">Weekly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Product
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
              4-step product creation process with automatic retry functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {steps.map((step, index) => {
                const stepResult = workflowResult?.steps[step.key as keyof typeof workflowResult.steps];
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    {getStepIcon(stepResult || { success: false }, index)}
                    <span className={`flex-1 ${stepResult?.success ? 'text-green-700' : stepResult?.error ? 'text-red-700' : ''}`}>
                      {step.name}
                    </span>
                    {stepResult?.url && (
                      <Badge variant="outline" className="text-xs">
                        URL Available
                      </Badge>
                    )}
                    {stepResult?.id && (
                      <Badge variant="outline" className="text-xs">
                        ID: {stepResult.id.slice(-8)}
                      </Badge>
                    )}
                    {stepResult?.error && (
                      <Badge variant="destructive" className="text-xs">
                        Error
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
                      <strong>✅ Product created successfully!</strong>
                      <div>Product ID: {workflowResult.productId}</div>
                      {workflowResult.imageUrl && <div>Image URL: {workflowResult.imageUrl}</div>}
                    </div>
                  ) : (
                    <div className="text-red-700">
                      <strong>❌ Workflow failed</strong>
                      <div>{workflowResult.error}</div>
                    </div>
                  )}
                  
                  {workflowResult.tokenRefreshed && (
                    <div className="text-blue-700">
                      🔄 OAuth token was automatically refreshed
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