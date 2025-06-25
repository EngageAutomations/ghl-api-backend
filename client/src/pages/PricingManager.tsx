import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { AlertCircle, DollarSign, Package, Plus } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  description: string;
  productType: string;
  medias?: Array<{ url: string; type: string }>;
}

interface Price {
  _id: string;
  name: string;
  amount: number;
  currency: string;
  type: string;
}

interface OAuthStatus {
  authenticated: number;
  total: number;
  installations: any[];
}

export default function PricingManager() {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [priceForm, setPriceForm] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    type: 'one_time'
  });
  const [oauthStatus, setOAuthStatus] = useState<OAuthStatus | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check OAuth status
  useEffect(() => {
    const checkOAuth = async () => {
      try {
        const response = await fetch('https://dir.engageautomations.com/installations');
        const data = await response.json();
        setOAuthStatus(data);
      } catch (error) {
        console.log('OAuth check failed');
      }
    };
    checkOAuth();
  }, []);

  // Get products - only when OAuth is connected
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['/api/railway/products'],
    queryFn: async () => {
      if (!oauthStatus?.authenticated) return { products: [] };
      
      const response = await fetch('https://dir.engageautomations.com/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: !!oauthStatus?.authenticated
  });

  // Get prices for selected product
  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['/api/railway/products', selectedProduct, 'prices'],
    queryFn: async () => {
      if (!selectedProduct || !oauthStatus?.authenticated) return { prices: [] };
      
      const response = await fetch(`https://dir.engageautomations.com/api/products/${selectedProduct}/prices`);
      if (!response.ok) throw new Error('Failed to fetch prices');
      return response.json();
    },
    enabled: !!selectedProduct && !!oauthStatus?.authenticated
  });

  // Add pricing mutation
  const addPricingMutation = useMutation({
    mutationFn: async (data: { productId: string; pricing: any }) => {
      const response = await fetch(`https://dir.engageautomations.com/api/products/${data.productId}/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          installation_id: oauthStatus?.installations[0]?.id,
          ...data.pricing
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add pricing');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Pricing added successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/railway/products', selectedProduct, 'prices'] });
      setPriceForm({ name: '', amount: '', currency: 'USD', type: 'one_time' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to add pricing', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  });

  const handleAddPricing = () => {
    if (!selectedProduct || !priceForm.name || !priceForm.amount) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const pricingData = {
      name: priceForm.name,
      amount: Math.round(parseFloat(priceForm.amount) * 100), // Convert to cents
      currency: priceForm.currency,
      type: priceForm.type
    };

    addPricingMutation.mutate({ productId: selectedProduct, pricing: pricingData });
  };

  // OAuth required state
  if (!oauthStatus?.authenticated) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-2 mb-6">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Pricing Manager</h1>
        </div>

        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">OAuth Connection Required</p>
              <p className="text-sm">
                Connect to GoHighLevel marketplace to load products and manage pricing.
                The Railway backend (v5.4.1-with-cron-refresh) is ready with all pricing endpoints.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Features Ready</CardTitle>
            <CardDescription>Available once OAuth is connected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓ Add pricing to existing products</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓ Multiple pricing tiers (Basic, Premium, Deluxe)</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓ One-time and recurring billing</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓ Multi-currency support</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">✓ Background token refresh system</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (productsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center p-8">
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <DollarSign className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Pricing Manager</h1>
        <Badge variant="secondary">OAuth Connected</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Add Pricing to Products</span>
          </CardTitle>
          <CardDescription>
            Manage pricing for GoHighLevel products with multiple tiers and billing options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product-select">Select Product</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a product to add pricing" />
              </SelectTrigger>
              <SelectContent>
                {products?.products?.map((product: Product) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name} ({product.productType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Product Details */}
          {selectedProduct && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Selected Product</h4>
                  {products?.products?.find((p: Product) => p._id === selectedProduct) && (
                    <div className="space-y-1 text-sm">
                      <p><strong>Name:</strong> {products.products.find((p: Product) => p._id === selectedProduct).name}</p>
                      <p><strong>Type:</strong> {products.products.find((p: Product) => p._id === selectedProduct).productType}</p>
                      {products.products.find((p: Product) => p._id === selectedProduct).medias?.length > 0 && (
                        <p><strong>Images:</strong> {products.products.find((p: Product) => p._id === selectedProduct).medias.length} attached</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Prices */}
          {selectedProduct && (
            <div className="space-y-2">
              <Label>Current Pricing Tiers</Label>
              {pricesLoading ? (
                <div className="text-sm text-gray-500">Loading prices...</div>
              ) : prices?.prices?.length > 0 ? (
                <div className="space-y-2">
                  {prices.prices.map((price: Price) => (
                    <div key={price._id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{price.name}</span>
                        <Badge variant="outline">{price.type}</Badge>
                      </div>
                      <span className="font-mono text-green-600">
                        ${(price.amount / 100).toFixed(2)} {price.currency}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500 p-3 border rounded bg-gray-50">
                  No pricing configured - add your first pricing tier below
                </div>
              )}
            </div>
          )}

          {/* Add New Pricing Form */}
          {selectedProduct && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <h4 className="font-medium">Add New Pricing Tier</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-name">Price Name *</Label>
                  <Input
                    id="price-name"
                    placeholder="e.g., Premium Package"
                    value={priceForm.name}
                    onChange={(e) => setPriceForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price-amount">Amount (USD) *</Label>
                  <Input
                    id="price-amount"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={priceForm.amount}
                    onChange={(e) => setPriceForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-type">Billing Type</Label>
                  <Select 
                    value={priceForm.type} 
                    onValueChange={(value) => setPriceForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_time">One-time Payment</SelectItem>
                      <SelectItem value="recurring">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price-currency">Currency</Label>
                  <Select 
                    value={priceForm.currency} 
                    onValueChange={(value) => setPriceForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleAddPricing}
                disabled={addPricingMutation.isPending || !priceForm.name || !priceForm.amount}
                className="w-full"
              >
                {addPricingMutation.isPending ? 'Adding Pricing...' : 'Add Pricing Tier'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {products?.products?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p><strong>Total Products:</strong> {products.products.length}</p>
              <p><strong>OAuth Status:</strong> Connected</p>
              <p><strong>Backend:</strong> Railway v5.4.1-with-cron-refresh</p>
              <p><strong>Token Refresh:</strong> Automatic background maintenance</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}