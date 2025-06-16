import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function GhlApiTest() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionResult, setConnectionResult] = useState<any>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productResult, setProductResult] = useState<any>(null);
  const [installationId, setInstallationId] = useState(
    new URLSearchParams(window.location.search).get('installation_id') || 
    localStorage.getItem('ghl_installation_id') || ''
  );
  
  const [productData, setProductData] = useState({
    name: 'Test Product',
    description: 'This is a test product created from the API test interface',
    price: '29.99'
  });

  const { toast } = useToast();

  const testConnection = async () => {
    if (!installationId) {
      toast({
        title: "Missing Installation ID",
        description: "Please provide a valid GoHighLevel installation ID",
        variant: "destructive"
      });
      return;
    }

    setConnectionStatus('testing');
    setConnectionResult(null);

    try {
      const response = await apiRequest(`/api/ghl/test-connection?installationId=${installationId}`);
      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus('success');
        setConnectionResult(result);
        toast({
          title: "Connection Successful",
          description: "Successfully connected to GoHighLevel API"
        });
      } else {
        setConnectionStatus('error');
        setConnectionResult(result);
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect to GoHighLevel",
          variant: "destructive"
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionResult({ error: error instanceof Error ? error.message : 'Unknown error' });
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the connection",
        variant: "destructive"
      });
    }
  };

  const createTestProduct = async () => {
    if (!installationId) {
      toast({
        title: "Missing Installation ID",
        description: "Please provide a valid GoHighLevel installation ID",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingProduct(true);
    setProductResult(null);

    try {
      const response = await apiRequest('/api/ghl/products/create', {
        method: 'POST',
        data: {
          name: productData.name,
          description: productData.description,
          price: parseFloat(productData.price) || 0,
          installationId
        }
      });

      const result = await response.json();
      setProductResult(result);

      if (result.success) {
        toast({
          title: "Product Created",
          description: "Test product created successfully in GoHighLevel"
        });
      } else {
        toast({
          title: "Product Creation Failed",
          description: result.message || "Failed to create product",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorResult = { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      };
      setProductResult(errorResult);
      toast({
        title: "Product Creation Error",
        description: "An error occurred while creating the product",
        variant: "destructive"
      });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">GoHighLevel API Test</h1>
        <p className="text-gray-600">Test your GoHighLevel API integration and create sample products</p>
      </div>

      {/* Installation ID Input */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Installation Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GoHighLevel Installation ID
              </label>
              <Input
                value={installationId}
                onChange={(e) => setInstallationId(e.target.value)}
                placeholder="Enter your installation ID..."
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                This is the installation ID from your OAuth flow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(connectionStatus)}
            API Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={testConnection} 
              disabled={connectionStatus === 'testing' || !installationId}
              className="w-full"
            >
              {connectionStatus === 'testing' ? 'Testing Connection...' : 'Test GoHighLevel Connection'}
            </Button>

            {connectionResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={connectionResult.success ? 'default' : 'destructive'}>
                    {connectionResult.success ? 'Connected' : 'Failed'}
                  </Badge>
                </div>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(connectionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product Creation Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Product Creation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name
              </label>
              <Input
                value={productData.name}
                onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Description
              </label>
              <Textarea
                value={productData.description}
                onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={productData.price}
                onChange={(e) => setProductData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="Enter price..."
              />
            </div>

            <Button 
              onClick={createTestProduct} 
              disabled={isCreatingProduct || !installationId}
              className="w-full"
            >
              {isCreatingProduct ? 'Creating Product...' : 'Create Test Product in GoHighLevel'}
            </Button>

            {productResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={productResult.success ? 'default' : 'destructive'}>
                    {productResult.success ? 'Created' : 'Failed'}
                  </Badge>
                </div>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(productResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. Make sure you have completed the OAuth flow and have a valid installation ID</p>
            <p>2. Enter your installation ID in the field above</p>
            <p>3. Click "Test GoHighLevel Connection" to verify your API access</p>
            <p>4. If the connection is successful, you can test product creation</p>
            <p>5. Fill in the product details and click "Create Test Product"</p>
            <p>6. Check your GoHighLevel account to see the created product</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}