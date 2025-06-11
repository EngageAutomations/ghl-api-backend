import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, ShoppingCart, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ProductCreationResult {
  success: boolean;
  product?: any;
  errors?: string[];
  message?: string;
}

interface OAuthUser {
  id: number;
  username: string;
  displayName: string | null;
  ghlLocationId: string | null;
  ghlLocationName: string | null;
}

export function GHLProductTestForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [result, setResult] = useState<ProductCreationResult | null>(null);
  const [oauthUsers, setOauthUsers] = useState<OAuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "Premium Directory Listing",
    description: "Featured listing with enhanced visibility and lead generation tools.",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
    price: "299.99"
  });

  // Load OAuth users when panel opens
  useEffect(() => {
    if (isOpen) {
      loadOAuthUsers();
    }
  }, [isOpen]);

  const loadOAuthUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch("/api/ghl/oauth-users");
      if (response.ok) {
        const users = await response.json();
        setOauthUsers(users);
        if (users.length === 1) {
          setSelectedUserId(users[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Failed to load OAuth users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const createProduct = async () => {
    if (!selectedUserId) {
      toast({
        title: "No OAuth User Selected",
        description: "Please select an OAuth user or add OAuth credentials",
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
          userId: parseInt(selectedUserId),
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
          {/* OAuth User Selection */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-700" />
              <Label className="text-sm font-medium text-blue-900">OAuth Account</Label>
            </div>
            
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-blue-700">Loading OAuth users...</span>
              </div>
            ) : oauthUsers.length > 0 ? (
              <div>
                <Label htmlFor="oauthUser" className="text-xs">Select OAuth Account</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Choose an OAuth account" />
                  </SelectTrigger>
                  <SelectContent>
                    {oauthUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.displayName || user.username}</span>
                          <span className="text-xs text-gray-500">{user.ghlLocationName || user.ghlLocationId}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                <p><strong>No OAuth accounts found</strong></p>
                <p>Complete the OAuth flow first to link your GoHighLevel account.</p>
              </div>
            )}
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
            disabled={isCreating || !selectedUserId}
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
            <p><strong>OAuth Integration:</strong></p>
            <p>• Your authenticated GoHighLevel accounts are automatically loaded</p>
            <p>• Location ID and access tokens are retrieved from secure storage</p>
            <p>• Simply select an account and create products directly</p>
            {oauthUsers.length === 0 && (
              <p className="text-amber-600 mt-2">
                <strong>Note:</strong> Complete OAuth authentication first to see your accounts here
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}