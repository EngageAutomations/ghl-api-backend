import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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

export function PricingManager() {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [priceForm, setPriceForm] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    type: 'one_time'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get products from Railway backend
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/ghl/products'],
    enabled: true
  });

  // Get prices for selected product
  const { data: prices, isLoading: pricesLoading } = useQuery({
    queryKey: ['/api/ghl/products', selectedProduct, 'prices'],
    enabled: !!selectedProduct
  });

  // Add pricing mutation
  const addPricingMutation = useMutation({
    mutationFn: async (data: { productId: string; pricing: any }) => {
      return apiRequest(`/api/ghl/products/${data.productId}/prices`, {
        method: 'POST',
        body: data.pricing
      });
    },
    onSuccess: () => {
      toast({ title: 'Pricing added successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/products', selectedProduct, 'prices'] });
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

  if (productsLoading) {
    return <div className="flex items-center justify-center p-8">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Pricing Manager</CardTitle>
          <CardDescription>
            Add pricing to existing GoHighLevel products
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
              <Label>Current Pricing</Label>
              {pricesLoading ? (
                <div className="text-sm text-gray-500">Loading prices...</div>
              ) : prices?.prices?.length > 0 ? (
                <div className="space-y-2">
                  {prices.prices.map((price: Price) => (
                    <div key={price._id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="font-medium">{price.name}</span>
                        <Badge variant="outline" className="ml-2">{price.type}</Badge>
                      </div>
                      <span className="font-mono">
                        ${(price.amount / 100).toFixed(2)} {price.currency}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No pricing configured</div>
              )}
            </div>
          )}

          {/* Add New Pricing Form */}
          {selectedProduct && (
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Add New Pricing</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price-name">Price Name</Label>
                  <Input
                    id="price-name"
                    placeholder="e.g., Standard Package"
                    value={priceForm.name}
                    onChange={(e) => setPriceForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price-amount">Amount (USD)</Label>
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
                {addPricingMutation.isPending ? 'Adding Pricing...' : 'Add Pricing'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OAuth Status */}
      {!products?.products?.length && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="text-center space-y-2">
              <h4 className="font-medium text-yellow-800">OAuth Required</h4>
              <p className="text-sm text-yellow-700">
                Connect to GoHighLevel marketplace to load products and add pricing
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}