import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Package, DollarSign, Settings, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

interface ProductFormData {
  product_name: string;
  product_description: string;
  product_image: string;
  pricing_config: string;
  product_variants: string;
  inventory_management: string;
  ghl_location_id: string;
  ghl_access_token: string;
}

interface APIResponse {
  success: boolean;
  product?: any;
  prices?: any[];
  errors?: string[];
  message?: string;
}

export function GHLProductDemo() {
  const [formData, setFormData] = useState<ProductFormData>({
    product_name: '',
    product_description: '',
    product_image: '',
    pricing_config: JSON.stringify({
      type: 'one-time',
      amount: '29.99',
      compareAtPrice: '39.99'
    }, null, 2),
    product_variants: JSON.stringify({
      options: [
        {
          name: 'Color',
          values: ['Red', 'Blue', 'Green']
        },
        {
          name: 'Size',
          values: ['Small', 'Medium', 'Large']
        }
      ],
      trackInventory: true,
      continueSellingWhenOutOfStock: false,
      combinations: []
    }, null, 2),
    inventory_management: JSON.stringify({
      trackInventory: true,
      currentStock: 100,
      lowStockThreshold: 10,
      continueSellingWhenOutOfStock: false,
      allowBackorders: false,
      sku: 'DEMO-001',
      barcode: '1234567890',
      weight: '1.5',
      weightUnit: 'lb',
      requiresShipping: true
    }, null, 2),
    ghl_location_id: '',
    ghl_access_token: ''
  });

  const [response, setResponse] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      // Validate JSON fields
      JSON.parse(formData.pricing_config);
      JSON.parse(formData.product_variants);
      JSON.parse(formData.inventory_management);

      const result = await apiRequest('/api/ghl/create-product', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setResponse(result);
    } catch (error: any) {
      setResponse({
        success: false,
        errors: [error.message || 'Failed to create product'],
        message: 'Error occurred during product creation'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ...formData,
      product_name: '',
      product_description: '',
      product_image: '',
      ghl_location_id: '',
      ghl_access_token: ''
    });
    setResponse(null);
  };

  const loadSampleData = () => {
    setFormData({
      ...formData,
      product_name: 'Premium Widget Pro',
      product_description: 'A high-quality widget designed for professional use with advanced features and durable construction.',
      product_image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=500&fit=crop',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          GoHighLevel Product Creator Demo
        </h1>
        <p className="text-gray-600">
          Test the automated product creation system that converts form submissions into GoHighLevel products with proper pricing and variants.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              
              <div>
                <Label htmlFor="product_description">Description</Label>
                <Textarea
                  id="product_description"
                  value={formData.product_description}
                  onChange={(e) => setFormData({...formData, product_description: e.target.value})}
                  placeholder="Product description"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="product_image">Image URL</Label>
                <Input
                  id="product_image"
                  value={formData.product_image}
                  onChange={(e) => setFormData({...formData, product_image: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <Button onClick={loadSampleData} variant="outline" className="w-full">
                Load Sample Data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="pricing_config">Pricing JSON</Label>
              <Textarea
                id="pricing_config"
                value={formData.pricing_config}
                onChange={(e) => setFormData({...formData, pricing_config: e.target.value})}
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Product Variants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="product_variants">Variants JSON</Label>
              <Textarea
                id="product_variants"
                value={formData.product_variants}
                onChange={(e) => setFormData({...formData, product_variants: e.target.value})}
                rows={8}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="inventory_management">Inventory JSON</Label>
              <Textarea
                id="inventory_management"
                value={formData.inventory_management}
                onChange={(e) => setFormData({...formData, inventory_management: e.target.value})}
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                GoHighLevel Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ghl_location_id">Location ID</Label>
                <Input
                  id="ghl_location_id"
                  value={formData.ghl_location_id}
                  onChange={(e) => setFormData({...formData, ghl_location_id: e.target.value})}
                  placeholder="Your GoHighLevel Location ID"
                />
              </div>
              
              <div>
                <Label htmlFor="ghl_access_token">Access Token</Label>
                <Input
                  id="ghl_access_token"
                  type="password"
                  value={formData.ghl_access_token}
                  onChange={(e) => setFormData({...formData, ghl_access_token: e.target.value})}
                  placeholder="Your GoHighLevel Access Token"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.product_name || !formData.ghl_location_id || !formData.ghl_access_token}
              className="flex-1"
            >
              {loading ? 'Creating Product...' : 'Create Product in GoHighLevel'}
            </Button>
            <Button onClick={resetForm} variant="outline">
              Reset
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Response</CardTitle>
            </CardHeader>
            <CardContent>
              {!response ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Submit the form to see the API response</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {response.success ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Product created successfully in GoHighLevel!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {response.message || 'Failed to create product'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {response.errors && response.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                      <ul className="space-y-1">
                        {response.errors.map((error, index) => (
                          <li key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {response.product && (
                    <div>
                      <h4 className="font-medium mb-2">Created Product:</h4>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">ID:</span> {response.product.id}
                          </div>
                          <div>
                            <span className="font-medium">Name:</span> {response.product.name}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {response.product.productType}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Badge variant="default" className="ml-1">
                              {response.product.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {response.prices && response.prices.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Created Prices:</h4>
                      <div className="space-y-2">
                        {response.prices.map((price, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="font-medium">ID:</span> {price.id}
                              </div>
                              <div>
                                <span className="font-medium">Amount:</span> ${(price.amount / 100).toFixed(2)}
                              </div>
                              <div>
                                <span className="font-medium">Type:</span> {price.type}
                              </div>
                              <div>
                                <span className="font-medium">Currency:</span> {price.currency}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Full Response:</h4>
                    <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <p>Form data is submitted with product details, pricing, and variant information.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <p>System creates the product in GoHighLevel using the exact API structure.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <p>Pricing is created separately using the "Create Price for Product" endpoint.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <p>Variant combinations are handled automatically with proper option IDs.</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">5</div>
                <p>Product appears immediately in your GoHighLevel store with all configurations.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}