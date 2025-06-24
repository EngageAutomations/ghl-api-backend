import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, DollarSign, Edit, Trash2, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Price {
  id: string;
  productId: string;
  productName?: string;
  name: string;
  currency: string;
  amount: number;
  type: 'one_time' | 'recurring';
  interval?: 'day' | 'week' | 'month' | 'year';
  intervalCount?: number;
  trialPeriodDays?: number;
  compareAtPrice?: number;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

interface PriceCreateData {
  productId: string;
  name: string;
  currency: string;
  amount: number;
  type: 'one_time' | 'recurring';
  interval?: 'day' | 'week' | 'month' | 'year';
  intervalCount?: number;
  trialPeriodDays?: number;
  compareAtPrice?: number;
}

export default function PriceManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<Price | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<PriceCreateData>({
    productId: '',
    name: '',
    currency: 'USD',
    amount: 0,
    type: 'one_time',
    interval: 'month',
    intervalCount: 1,
    trialPeriodDays: 0,
    compareAtPrice: 0
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState<string>('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products for dropdown
  const { data: products } = useQuery({
    queryKey: ['/api/ghl/products'],
    queryFn: async () => {
      const response = await fetch('/api/ghl/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  // Fetch prices from GoHighLevel API
  const { data: prices, isLoading, error } = useQuery({
    queryKey: ['/api/ghl/prices', { search: searchTerm, type: filterType, productId: filterProduct }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterProduct !== 'all' && { productId: filterProduct })
      });
      
      const response = await fetch(`/api/ghl/prices?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      return response.json();
    },
  });

  // Create price mutation
  const createPriceMutation = useMutation({
    mutationFn: async (priceData: PriceCreateData) => {
      const response = await fetch(`/api/ghl/products/${priceData.productId}/prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(priceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create price');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/prices'] });
      setIsCreateOpen(false);
      resetForm();
      toast({
        title: "Price Created",
        description: "Your price has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: async ({ productId, priceId, ...priceData }: PriceCreateData & { priceId: string }) => {
      const response = await fetch(`/api/ghl/products/${productId}/prices/${priceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(priceData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update price');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/prices'] });
      setIsEditOpen(false);
      setSelectedPrice(null);
      toast({
        title: "Price Updated",
        description: "Your price has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete price mutation
  const deletePriceMutation = useMutation({
    mutationFn: async ({ productId, priceId }: { productId: string; priceId: string }) => {
      const response = await fetch(`/api/ghl/products/${productId}/prices/${priceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete price');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/prices'] });
      toast({
        title: "Price Deleted",
        description: "Your price has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreatePrice = () => {
    createPriceMutation.mutate(formData);
  };

  const handleUpdatePrice = () => {
    if (selectedPrice) {
      updatePriceMutation.mutate({ 
        priceId: selectedPrice.id, 
        productId: selectedPrice.productId,
        ...formData 
      });
    }
  };

  const handleEditPrice = (price: Price) => {
    setSelectedPrice(price);
    setFormData({
      productId: price.productId,
      name: price.name,
      currency: price.currency,
      amount: price.amount,
      type: price.type,
      interval: price.interval || 'month',
      intervalCount: price.intervalCount || 1,
      trialPeriodDays: price.trialPeriodDays || 0,
      compareAtPrice: price.compareAtPrice || 0
    });
    setIsEditOpen(true);
  };

  const handleDeletePrice = (price: Price) => {
    deletePriceMutation.mutate({ 
      productId: price.productId, 
      priceId: price.id 
    });
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      name: '',
      currency: 'USD',
      amount: 0,
      type: 'one_time',
      interval: 'month',
      intervalCount: 1,
      trialPeriodDays: 0,
      compareAtPrice: 0
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatInterval = (type: string, interval?: string, intervalCount?: number) => {
    if (type === 'one_time') return 'One-time';
    if (!interval) return 'Recurring';
    
    const count = intervalCount || 1;
    const unit = count === 1 ? interval : `${interval}s`;
    return count === 1 ? `Per ${unit}` : `Every ${count} ${unit}`;
  };

  const filteredPrices = prices?.prices || [];

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Failed to load prices</h3>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Price Management</h2>
          <p className="text-muted-foreground">
            Manage pricing for your GoHighLevel products
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Price
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Price</DialogTitle>
              <DialogDescription>
                Add a new price to your product
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="productId">Product</Label>
                <Select value={formData.productId} onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.products?.map((product: any) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="name">Price Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Standard Plan, Premium Plan"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
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
              </div>
              
              <div>
                <Label htmlFor="type">Billing Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.type === 'recurring' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="interval">Interval</Label>
                    <Select value={formData.interval} onValueChange={(value: any) => setFormData(prev => ({ ...prev, interval: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="year">Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="intervalCount">Count</Label>
                    <Input
                      id="intervalCount"
                      type="number"
                      min="1"
                      value={formData.intervalCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, intervalCount: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="compareAtPrice">Compare At Price (Optional)</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, compareAtPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              
              {formData.type === 'recurring' && (
                <div>
                  <Label htmlFor="trialPeriodDays">Trial Period (Days)</Label>
                  <Input
                    id="trialPeriodDays"
                    type="number"
                    min="0"
                    value={formData.trialPeriodDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, trialPeriodDays: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreatePrice}
                disabled={createPriceMutation.isPending || !formData.productId || !formData.name || !formData.amount}
              >
                {createPriceMutation.isPending ? 'Creating...' : 'Create Price'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search prices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="one_time">One-time</SelectItem>
            <SelectItem value="recurring">Recurring</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products?.products?.map((product: any) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prices Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredPrices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-semibold mb-2">No prices found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' || filterProduct !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first price to get started'
              }
            </p>
            {!searchTerm && filterType === 'all' && filterProduct === 'all' && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Price
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrices.map((price: Price) => (
            <Card key={price.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{price.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {price.productName || 'Unknown Product'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEditPrice(price)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Price</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{price.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePrice(price)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {formatPrice(price.amount, price.currency)}
                    </span>
                    <Badge variant={price.type === 'recurring' ? 'default' : 'secondary'}>
                      {formatInterval(price.type, price.interval, price.intervalCount)}
                    </Badge>
                  </div>
                  
                  {price.compareAtPrice && price.compareAtPrice > price.amount && (
                    <div className="text-sm text-muted-foreground">
                      Compare at: <span className="line-through">{formatPrice(price.compareAtPrice, price.currency)}</span>
                    </div>
                  )}
                  
                  {price.trialPeriodDays && price.trialPeriodDays > 0 && (
                    <div className="text-sm text-green-600">
                      {price.trialPeriodDays} day{price.trialPeriodDays !== 1 ? 's' : ''} free trial
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Price Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Price</DialogTitle>
            <DialogDescription>
              Update your price information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Price Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Standard Plan, Premium Plan"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
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
            </div>
            
            <div>
              <Label htmlFor="edit-type">Billing Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.type === 'recurring' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-interval">Interval</Label>
                  <Select value={formData.interval} onValueChange={(value: any) => setFormData(prev => ({ ...prev, interval: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-intervalCount">Count</Label>
                  <Input
                    id="edit-intervalCount"
                    type="number"
                    min="1"
                    value={formData.intervalCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, intervalCount: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="edit-compareAtPrice">Compare At Price (Optional)</Label>
              <Input
                id="edit-compareAtPrice"
                type="number"
                step="0.01"
                value={formData.compareAtPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, compareAtPrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            
            {formData.type === 'recurring' && (
              <div>
                <Label htmlFor="edit-trialPeriodDays">Trial Period (Days)</Label>
                <Input
                  id="edit-trialPeriodDays"
                  type="number"
                  min="0"
                  value={formData.trialPeriodDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, trialPeriodDays: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdatePrice}
              disabled={updatePriceMutation.isPending || !formData.name || !formData.amount}
            >
              {updatePriceMutation.isPending ? 'Updating...' : 'Update Price'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}