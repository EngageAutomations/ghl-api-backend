import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Loader2, Package, ExternalLink, Image, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MediaUpload } from "@/components/MediaUpload";

interface GHLProductCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  directoryName: string;
  onSuccess?: (product: any) => void;
}

interface ProductFormData {
  name: string;
  description: string;
  productType: 'DIGITAL' | 'PHYSICAL' | 'SERVICE';
  price?: string;
  category?: string;
  location?: string;
  createLocalListing: boolean;
  imageUrls: string[];
  ghlMediaIds: string[];
}

export function GHLProductCreator({ isOpen, onClose, directoryName, onSuccess }: GHLProductCreatorProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    productType: 'DIGITAL',
    price: '',
    category: '',
    location: '',
    createLocalListing: true,
    imageUrls: [],
    ghlMediaIds: []
  });
  
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createGHLProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const response = await fetch("/api/ghl/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId: "WAvk87RmW9rBSDJHeOpH",
          name: productData.name,
          description: productData.description,
          productType: productData.productType
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Product creation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "GoHighLevel Product Created",
        description: `Product "${formData.name}" created successfully in GoHighLevel`,
      });
      
      // Create local listing if requested
      if (formData.createLocalListing) {
        createLocalListing(data);
      } else {
        onSuccess?.(data);
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      }
    },
    onError: (error) => {
      setResult({
        success: false,
        error: error.message,
        railwayBackend: false
      });
      toast({
        title: "Product Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const createLocalListingMutation = useMutation({
    mutationFn: async (listingData: any) => {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create local listing');
      }
      
      return response.json();
    },
    onSuccess: (localListing) => {
      toast({
        title: "Local Listing Created",
        description: `Listing "${formData.name}" created locally and synced with GoHighLevel`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
      onSuccess?.({ ghlProduct: result, localListing });
      
      setTimeout(() => {
        onClose();
        resetForm();
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Local Listing Creation Failed",
        description: "GoHighLevel product created but local listing failed",
        variant: "destructive",
      });
    }
  });

  const createLocalListing = (ghlProductData: any) => {
    const listingData = {
      title: formData.name,
      description: formData.description,
      directoryName,
      category: formData.category || '',
      location: formData.location || '',
      price: formData.price || '',
      slug: formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      userId: 1, // Using current user
      isActive: true,
      imageUrl: '',
      downloadUrl: '',
      // Link to GoHighLevel product
      ghlProductId: ghlProductData.productId,
      ghlLocationId: ghlProductData.locationId,
      // Railway v1.2.1 media integration
      imageUrls: formData.imageUrls,
      ghlMediaIds: formData.ghlMediaIds
    };

    createLocalListingMutation.mutate(listingData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    createGHLProductMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      productType: 'DIGITAL',
      price: '',
      category: '',
      location: '',
      createLocalListing: true,
      imageUrls: [],
      ghlMediaIds: []
    });
    setResult(null);
  };

  const handleMediaUpload = (url: string, mediaId: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: [...prev.imageUrls, url],
      ghlMediaIds: [...prev.ghlMediaIds, mediaId]
    }));
  };

  const isLoading = createGHLProductMutation.isPending || createLocalListingMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create GoHighLevel Product
            <Badge variant="outline">Live Integration</Badge>
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your product"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Select
                  value={formData.productType}
                  onValueChange={(value: 'DIGITAL' | 'PHYSICAL' | 'SERVICE') => 
                    setFormData(prev => ({ ...prev, productType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIGITAL">Digital Product</SelectItem>
                    <SelectItem value="PHYSICAL">Physical Product</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price (Optional)</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="$29.99"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Business category"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State"
                />
              </div>
            </div>

            {/* Media Upload Section - Railway v1.2.1 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Upload className="h-4 w-4 mr-2" />
                Product Images
              </Label>
              <p className="text-xs text-gray-500 mb-3">
                Upload images to GoHighLevel Media Library for your product
              </p>
              <MediaUpload
                onUploadSuccess={handleMediaUpload}
                maxFiles={5}
                installationId="install_1750191250983"
                disabled={createGHLProductMutation.isPending}
              />
              
              {formData.imageUrls.length > 0 && (
                <div className="mt-3">
                  <Label className="text-xs text-gray-600">
                    Uploaded Images ({formData.imageUrls.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 text-xs px-1 py-0 h-4"
                        >
                          {index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createLocalListing"
                checked={formData.createLocalListing}
                onChange={(e) => setFormData(prev => ({ ...prev, createLocalListing: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="createLocalListing">
                Also create local listing in "{directoryName}" directory
              </Label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Integration Details</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Product will be created in your GoHighLevel account</li>
                <li>• Uses authentic OAuth credentials from Railway backend</li>
                <li>• Location ID: WAvk87RmW9rBSDJHeOpH</li>
                {formData.createLocalListing && (
                  <li>• Local listing will be created and linked to GHL product</li>
                )}
              </ul>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {createGHLProductMutation.isPending ? 'Creating Product...' : 'Creating Listing...'}
                  </>
                ) : (
                  'Create Product'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {result.success ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Product Created Successfully!</h3>
                  <p className="text-green-600">Your product has been created in GoHighLevel</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-left">
                  <h4 className="font-semibold text-green-800 mb-2">Product Details</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Product ID:</strong> {result.productId}</p>
                    <p><strong>Location ID:</strong> {result.locationId}</p>
                    <p><strong>Installation:</strong> {result.installationId}</p>
                    {result.product && (
                      <p><strong>Name:</strong> {result.product.name}</p>
                    )}
                  </div>
                </div>

                {formData.createLocalListing && createLocalListingMutation.isPending && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating local listing...
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Product Creation Failed</h3>
                  <p className="text-red-600">{result.error}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg text-left">
                  <h4 className="font-semibold text-red-800 mb-2">Error Details</h4>
                  <p className="text-sm text-red-700">{result.details}</p>
                </div>

                <Button onClick={resetForm} variant="outline">
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}