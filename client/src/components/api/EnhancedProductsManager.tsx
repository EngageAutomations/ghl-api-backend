import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Package, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { mockApi } from '@/lib/mockApi';

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

function EnhancedProductsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<CreateProductData>({
    name: '',
    description: '',
    category: '',
    price: 0
  });
  const { toast } = useToast();

  // Load products on component mount
  useState(() => {
    loadProducts();
  });

  const loadProducts = async () => {
    console.log("🔍 LoadProducts: Starting fetch");
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockApi.products.list();
      console.log("✅ LoadProducts: Success", result);
      setProducts(result.data.products);
      
      toast({
        title: "Products Loaded",
        description: `Loaded ${result.data.products.length} products successfully`,
      });
    } catch (err) {
      console.error("❌ LoadProducts: Error", err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      
      toast({
        title: "Load Failed",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    console.log("🆕 CreateProduct: Button clicked");
    console.log("🆕 CreateProduct: Data", newProduct);
    
    if (!newProduct.name.trim()) {
      console.log("❌ CreateProduct: Validation failed - name required");
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("📤 CreateProduct: Making API call");
      const result = await mockApi.products.create(newProduct);
      console.log("✅ CreateProduct: API response", result);
      
      if (result.success) {
        setProducts(prev => [...prev, result.data]);
        setNewProduct({ name: '', description: '', category: '', price: 0 });
        setIsCreateOpen(false);
        
        toast({
          title: "Product Created",
          description: `${result.data.name} created successfully`,
        });
        
        console.log("✅ CreateProduct: UI updated");
      }
    } catch (err) {
      console.error("❌ CreateProduct: Error", err);
      setError(err instanceof Error ? err.message : 'Failed to create product');
      
      toast({
        title: "Creation Failed",
        description: "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (id: string, updates: Partial<Product>) => {
    console.log("📝 UpdateProduct: Button clicked", { id, updates });
    
    setLoading(true);
    setError(null);

    try {
      console.log("📤 UpdateProduct: Making API call");
      const result = await mockApi.products.update(id, updates);
      console.log("✅ UpdateProduct: API response", result);
      
      if (result.success) {
        setProducts(prev => prev.map(p => p.id === id ? result.data : p));
        setEditingProduct(null);
        
        toast({
          title: "Product Updated",
          description: `${result.data.name} updated successfully`,
        });
        
        console.log("✅ UpdateProduct: UI updated");
      }
    } catch (err) {
      console.error("❌ UpdateProduct: Error", err);
      setError(err instanceof Error ? err.message : 'Failed to update product');
      
      toast({
        title: "Update Failed",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    console.log("🗑️ DeleteProduct: Button clicked", id);
    
    setLoading(true);
    setError(null);

    try {
      console.log("📤 DeleteProduct: Making API call");
      const result = await mockApi.products.delete(id);
      console.log("✅ DeleteProduct: API response", result);
      
      if (result.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        
        toast({
          title: "Product Deleted",
          description: "Product deleted successfully",
        });
        
        console.log("✅ DeleteProduct: UI updated");
      }
    } catch (err) {
      console.error("❌ DeleteProduct: Error", err);
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      
      toast({
        title: "Deletion Failed",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Debug Status Bar */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            Debug Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Mock API Connected
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Products Count: {products.length}
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="h-3 w-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
              API Call in Progress
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-3 w-3" />
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products Management</h2>
          <p className="text-muted-foreground">
            Manage your GoHighLevel products and catalog
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => console.log("🎯 Create Dialog: Opened")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
              <DialogDescription>
                Add a new product to your GoHighLevel catalog
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => {
                    console.log("📝 Form Input: Name changed", e.target.value);
                    setNewProduct(prev => ({ ...prev, name: e.target.value }));
                  }}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => {
                    console.log("📝 Form Input: Description changed");
                    setNewProduct(prev => ({ ...prev, description: e.target.value }));
                  }}
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newProduct.category}
                  onChange={(e) => {
                    console.log("📝 Form Input: Category changed", e.target.value);
                    setNewProduct(prev => ({ ...prev, category: e.target.value }));
                  }}
                  placeholder="Enter category"
                />
              </div>
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => {
                    console.log("📝 Form Input: Price changed", e.target.value);
                    setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }));
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProduct} disabled={loading}>
                {loading ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => {
            console.log("🔍 Search: Term changed", e.target.value);
            setSearchTerm(e.target.value);
          }}
          className="max-w-sm"
        />
        <Button variant="outline" onClick={loadProducts} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {product.name}
                </span>
                <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                  {product.status}
                </Badge>
              </CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {product.category && <span>Category: {product.category}</span>}
                </div>
                {product.price && (
                  <span className="text-lg font-semibold">${product.price}</span>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log("✏️ Edit: Button clicked", product.id);
                    setEditingProduct(product);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No products match your search criteria.' : 'Get started by creating your first product.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Product
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EnhancedProductsManager;