import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface WorkflowStep {
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  message?: string;
}

interface WorkflowResult {
  success: boolean;
  steps: {
    imageUpload?: string;
    productCreation?: string;
    pricing?: string;
  };
  data?: {
    media?: any;
    product?: any;
    pricing?: any;
  };
  error?: string;
}

export default function WorkflowTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [installationId, setInstallationId] = useState('');
  const [productName, setProductName] = useState('Test Product');
  const [productDescription, setProductDescription] = useState('Product created via complete workflow test');
  const [priceAmount, setPriceAmount] = useState('2999');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { name: 'Image Upload', status: 'pending' },
    { name: 'Product Creation', status: 'pending' },
    { name: 'Pricing Setup', status: 'pending' }
  ]);

  const updateStep = (index: number, status: WorkflowStep['status'], message?: string) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status, message } : step
    ));
  };

  const resetSteps = () => {
    setSteps([
      { name: 'Image Upload', status: 'pending' },
      { name: 'Product Creation', status: 'pending' },
      { name: 'Pricing Setup', status: 'pending' }
    ]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('File size must be less than 25MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const testWorkflow = async () => {
    if (!installationId) {
      alert('Please enter an installation ID');
      return;
    }

    setIsLoading(true);
    setResult(null);
    resetSteps();

    try {
      updateStep(0, 'loading', 'Uploading image...');
      updateStep(1, 'loading', 'Creating product...');
      updateStep(2, 'loading', 'Setting up pricing...');

      const formData = new FormData();
      formData.append('installation_id', installationId);
      formData.append('product_name', productName);
      formData.append('product_description', productDescription);
      formData.append('price_amount', priceAmount);
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const endpoint = selectedFile ? '/api/workflow/complete-workflow' : '/api/workflow/test-workflow';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const workflowResult = await response.json() as WorkflowResult;
      setResult(workflowResult);

      if (workflowResult.success) {
        updateStep(0, 'success', workflowResult.steps.imageUpload || 'Completed');
        updateStep(1, 'success', workflowResult.steps.productCreation || 'Completed');
        updateStep(2, 'success', workflowResult.steps.pricing || 'Completed');
      } else {
        // Update steps based on what failed
        const errorStep = workflowResult.error?.includes('Image upload') ? 0 :
                         workflowResult.error?.includes('Product creation') ? 1 : 2;
        
        updateStep(errorStep, 'error', workflowResult.error);
        
        // Mark subsequent steps as pending
        for (let i = errorStep + 1; i < steps.length; i++) {
          updateStep(i, 'pending');
        }
      }

    } catch (error) {
      console.error('Workflow test error:', error);
      updateStep(0, 'error', error instanceof Error ? error.message : 'Unknown error');
      updateStep(1, 'pending');
      updateStep(2, 'pending');
      setResult({
        success: false,
        steps: {},
        error: error instanceof Error ? error.message : 'Network error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Complete Workflow Tester</h1>
        <p className="text-gray-600">Test the complete GoHighLevel workflow: Image Upload → Product Creation → Pricing</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Configuration</CardTitle>
            <CardDescription>Configure the test parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="installation">Installation ID</Label>
              <Input
                id="installation"
                value={installationId}
                onChange={(e) => setInstallationId(e.target.value)}
                placeholder="Enter OAuth installation ID"
              />
            </div>

            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>

            <div>
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="price">Price (in cents)</Label>
              <Input
                id="price"
                type="number"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
                placeholder="2999 = $29.99"
              />
            </div>

            <div>
              <Label htmlFor="image">Product Image (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {selectedFile && (
                  <span className="text-sm text-green-600">
                    {selectedFile.name}
                  </span>
                )}
              </div>
              {!selectedFile && (
                <p className="text-sm text-gray-500 mt-1">
                  If no image is selected, a test image will be generated
                </p>
              )}
            </div>

            <Button 
              onClick={testWorkflow} 
              disabled={isLoading || !installationId}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Workflow...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Test Complete Workflow
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Workflow Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Progress</CardTitle>
            <CardDescription>Real-time workflow execution status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="font-medium">{step.name}</div>
                    {step.message && (
                      <div className={`text-sm ${
                        step.status === 'error' ? 'text-red-600' : 
                        step.status === 'success' ? 'text-green-600' : 
                        'text-gray-600'
                      }`}>
                        {step.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {result && (
              <div className="mt-6">
                {result.success ? (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>Workflow Completed Successfully!</strong>
                      {result.data?.product && (
                        <div className="mt-2 space-y-1">
                          <div>Product ID: {result.data.product.id}</div>
                          <div>Price: ${((result.data.product.prices?.[0]?.amount || 0) / 100).toFixed(2)}</div>
                          {result.data.media && (
                            <div>Media ID: {result.data.media.id}</div>
                          )}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Workflow Failed:</strong><br />
                      {result.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}