import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

interface ProductCreationResult {
  success: boolean;
  product?: any;
  errors?: string[];
  message?: string;
}

export function GHLProductTestForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<ProductCreationResult | null>(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "Premium Directory Listing",
    description: "Featured listing with enhanced visibility and lead generation tools.",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
    price: "299.99",
    locationId: "",
    accessToken: ""
  });

  const createProduct = async () => {
    if (!formData.locationId || !formData.accessToken) {
      toast({
        title: "Missing OAuth Data",
        description: "Please provide your GoHighLevel location ID and access token",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    setResult(null);

    try {
      const response = await fetch("/api/ghl/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId: formData.locationId,
          accessToken: formData.accessToken,
          product: {
            name: formData.name,
            description: formData.description,
            imageUrl: formData.imageUrl,
            price: formData.price
          }
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: "Product Created!",
          description: `Successfully created "${formData.name}" in GoHighLevel`,
        });
      } else {
        toast({
          title: "Creation Failed",
          description: data.message || "Failed to create product",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorResult = {
        success: false,
        errors: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        message: "Failed to connect to API"
      };
      setResult(errorResult);
      
      toast({
        title: "Connection Error",
        description: "Failed to connect to the API",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Test GHL Product
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[500px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            GoHighLevel Product Creator
            <Badge variant="outline">OAuth Test</Badge>
          </SheetTitle>
          <SheetDescription>
            Create a product in your GoHighLevel account using OAuth authentication
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* OAuth Credentials */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
            <Label className="text-sm font-medium text-blue-900">OAuth Configuration</Label>
            <div>
              <Label htmlFor="locationId" className="text-xs">Location ID</Label>
              <Input
                id="locationId"
                value={formData.locationId}
                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                placeholder="Your GHL location ID"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="accessToken" className="text-xs">Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                placeholder="Your OAuth access token"
                className="text-sm"
              />
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="name" className="text-sm">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price" className="text-sm">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="imageUrl" className="text-sm">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={createProduct} 
            disabled={isCreating || !formData.locationId || !formData.accessToken}
            className="w-full"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Product...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create in GoHighLevel
              </>
            )}
          </Button>

          {/* Results */}
          {result && (
            <div className={`p-4 rounded-lg border-2 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className={`flex items-center gap-2 font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.success ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Success!
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    Failed
                  </>
                )}
              </div>
              
              <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>

              {result.success && result.product && (
                <div className="mt-3 p-3 bg-white rounded border text-xs">
                  <p><strong>Product ID:</strong> {result.product.id}</p>
                  <p><strong>Name:</strong> {result.product.name}</p>
                  <p><strong>Status:</strong> {result.product.status}</p>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <ul className="text-xs text-red-600 space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* OAuth Instructions */}
          <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded">
            <p><strong>OAuth Setup:</strong></p>
            <p>1. Get your location ID from GHL account settings</p>
            <p>2. Use OAuth flow to obtain access token with <code>products.write</code> scope</p>
            <p>3. Ensure token has not expired before testing</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}