import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  description: string;
  image?: string;
  price?: number;
  category?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface CreateProductData {
  name: string;
  description: string;
  image?: string;
  price?: number;
  category?: string;
}

export default function ProductsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<CreateProductData>({
    name: '',
    description: '',
    image: '',
    price: 0,
    category: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products from GoHighLevel API
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['/api/ghl/products'],
    queryFn: async () => {
      const response = await fetch('/api/ghl/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return response.json();
    }
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      const response = await fetch('/api/ghl/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        throw new Error('Failed to create product');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/products'] });
      setIsCreateOpen(false);
      setNewProduct({ name: '', description: '', image: '', price: 0, category: '' });
      toast({
        title: "Product Created",
        description: "Your product has been successfully created in GoHighLevel.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create product: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleCreateProduct = () => {
    createProductMutation.mutate(newProduct);
  };

  const filteredProducts = products?.data?.products?.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading products: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products Management</h2>
          <p className="text-muted-foreground">
            Manage your GoHighLevel product catalog
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your GoHighLevel catalog
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter product description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Product category"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateProduct}
                disabled={createProductMutation.isPending || !newProduct.name}
              >
                {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product: Product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {product.price ? `$${product.price}` : 'No price set'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {product.category && (
                  <Badge variant="outline" className="mt-2">
                    {product.category}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first product.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { ProductsManager };