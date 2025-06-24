import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, DollarSign, Image } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  sku?: string;
}

export default function ProductCreationDemo() {
  const [isCreating, setIsCreating] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'DIGITAL',
    price: '',
    currency: 'USD',
    sku: ''
  });

  const { toast } = useToast();

  const handleListProducts = async () => {
    setIsListing(true);
    try {
      const response = await fetch('/api/products/list');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        toast({
          title: "Products loaded",
          description: `Found ${data.total} products in GoHighLevel`
        });
      } else {
        throw new Error('Failed to load products');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products from GoHighLevel",
        variant: "destructive"
      });
    } finally {
      setIsListing(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in product name and price",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          price: parseFloat(formData.price),
          currency: formData.currency,
          sku: formData.sku || undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Product Created",
          description: `${result.result.product.name} created in GoHighLevel`
        });
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          type: 'DIGITAL',
          price: '',
          currency: 'USD',
          sku: ''
        });
        
        // Refresh product list
        handleListProducts();
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product in GoHighLevel",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Package className="h-6 w-6" />
        <h2 className="text-2xl font-bold">GoHighLevel Product Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Product
            </CardTitle>
            <CardDescription>
              Create a new product directly in your GoHighLevel account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter product name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter product description"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIGITAL">Digital</SelectItem>
                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Product SKU"
              />
            </div>
            
            <Button 
              onClick={handleCreateProduct} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create Product in GoHighLevel'}
            </Button>
          </CardContent>
        </Card>

        {/* Product List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Your Products
            </CardTitle>
            <CardDescription>
              Products from your GoHighLevel account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                onClick={handleListProducts} 
                disabled={isListing}
                variant="outline"
                className="w-full"
              >
                {isListing ? 'Loading...' : 'Refresh Products'}
              </Button>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No products loaded. Click "Refresh Products" to load from GoHighLevel.
                  </p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{product.name}</h4>
                        <span className="text-sm font-medium">
                          ${((product.price || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.description || 'No description'}
                      </p>
                      <div className="flex gap-2 text-xs">
                        <span className="bg-secondary px-2 py-1 rounded">
                          {product.type}
                        </span>
                        {product.sku && (
                          <span className="bg-secondary px-2 py-1 rounded">
                            SKU: {product.sku}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}