import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ghlApi, type Product, type CreateProduct, CreateProductSchema } from '@/lib/ghl-api-client';
import { useGHLAuth } from '@/hooks/useGHLAuth';
import { Plus, Search, RefreshCw, Edit, Trash2, Eye, Package, AlertCircle } from 'lucide-react';

export default function TypedProductsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, hasScope } = useGHLAuth();
  const queryClient = useQueryClient();

  // Form for creating/editing products
  const form = useForm<CreateProduct>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
    },
  });

  // Fetch products with type safety
  const { data: productsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/ghl/products', { search: searchTerm }],
    queryFn: () => ghlApi.getProducts({ 
      limit: 50, 
      search: searchTerm || undefined 
    }),
    enabled: isAuthenticated && hasScope('products.read'),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: CreateProduct) => ghlApi.createProduct(data),
    onSuccess: (response) => {
      toast({
        title: 'Product Created',
        description: `${response.data.name} has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/products'] });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProduct> }) => 
      ghlApi.updateProduct(id, data),
    onSuccess: (response) => {
      toast({
        title: 'Product Updated',
        description: `${response.data.name} has been updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/products'] });
      setSelectedProduct(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => ghlApi.deleteProduct(id),
    onSuccess: () => {
      toast({
        title: 'Product Deleted',
        description: 'Product has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/products'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Deletion Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateProduct = (data: CreateProduct) => {
    createProductMutation.mutate(data);
  };

  const handleDeleteProduct = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const products = productsResponse?.data?.items || [];

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>Please authenticate to access products</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Scope check
  if (!hasScope('products.read')) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span>Insufficient permissions to access products</span>
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
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Products Management
          </h2>
          <p className="text-muted-foreground">
            Manage your GoHighLevel products catalog
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button disabled={!hasScope('products.write')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateProduct)}>
                <DialogHeader>
                  <DialogTitle>Create New Product</DialogTitle>
                  <DialogDescription>
                    Add a new product to your GoHighLevel catalog.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Product description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Services">Services</SelectItem>
                            <SelectItem value="Products">Products</SelectItem>
                            <SelectItem value="Digital">Digital</SelectItem>
                            <SelectItem value="Consultation">Consultation</SelectItem>
                            <SelectItem value="Training">Training</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createProductMutation.isPending}
                  >
                    {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Actions */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-4/5"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load products: {error.message}</span>
            </div>
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first product.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    {product.category && (
                      <Badge variant="secondary">{product.category}</Badge>
                    )}
                  </div>
                  <Badge 
                    variant={product.status === 'active' ? 'default' : 'secondary'}
                  >
                    {product.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={!hasScope('products.write')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteProduct(product)}
                        disabled={!hasScope('products.write') || deleteProductMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Debug Info */}
      {user && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-1">
            <div>User: {user.name} ({user.email})</div>
            <div>Location: {user.locationId}</div>
            <div>Products Count: {products.length}</div>
            <div>Scopes: {user.scopes.join(', ')}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}