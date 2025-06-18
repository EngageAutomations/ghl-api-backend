import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ProductCreationResult {
  success: boolean;
  product?: any;
  prices?: any[];
  errors?: string[];
  message?: string;
}

export function GHLProductDemo() {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<ProductCreationResult | null>(null);
  const [formData, setFormData] = useState({
    product_name: "Premium Business Directory Listing",
    product_description: "Get featured in our premium business directory with enhanced visibility and lead generation tools.",
    pricing_config: JSON.stringify({
      type: "recurring",
      amount: "$29.99",
      compareAtPrice: "$49.99",
      billingPeriod: "monthly",
      trialPeriod: 7,
      setupFee: "$9.99"
    }),
    product_variants: JSON.stringify({
      options: [
        {
          name: "Plan Type",
          values: ["Basic", "Professional", "Enterprise"]
        },
        {
          name: "Duration",
          values: ["Monthly", "Quarterly", "Yearly"]
        }
      ],
      trackInventory: false,
      continueSellingWhenOutOfStock: true,
      combinations: [
        {
          id: "basic-monthly",
          combination: { "Plan Type": "Basic", "Duration": "Monthly" },
          price: "$29.99",
          compareAtPrice: "$49.99",
          quantity: 0,
          enabled: true
        },
        {
          id: "professional-monthly",
          combination: { "Plan Type": "Professional", "Duration": "Monthly" },
          price: "$59.99",
          compareAtPrice: "$99.99",
          quantity: 0,
          enabled: true
        },
        {
          id: "enterprise-yearly",
          combination: { "Plan Type": "Enterprise", "Duration": "Yearly" },
          price: "$599.99",
          compareAtPrice: "$999.99",
          quantity: 0,
          enabled: true
        }
      ]
    }),
    inventory_management: JSON.stringify({
      trackInventory: true,
      currentStock: 100,
      lowStockThreshold: 10,
      continueSellingWhenOutOfStock: true,
      allowBackorders: false,
      sku: "DIR-PREM-001",
      barcode: "123456789012",
      weight: "0",
      weightUnit: "lb",
      requiresShipping: false
    }),
    locationId: "WAvk87RmW9rBSDJHeOpH", // Railway backend location ID
    accessToken: "railway_backend_token" // Handled automatically by Railway backend
  });

  const createProduct = async () => {
    setIsCreating(true);
    setResult(null);

    try {
      const response = await fetch("/api/ghl/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formSubmission: {
            product_name: formData.product_name,
            product_description: formData.product_description,
            pricing_config: formData.pricing_config,
            product_variants: formData.product_variants,
            inventory_management: formData.inventory_management,
          },
          locationId: formData.locationId,
          accessToken: formData.accessToken,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        errors: [`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        message: "Failed to connect to API"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            GoHighLevel Product Creation Demo
            <Badge variant="outline">Live API Integration</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="locationId">GHL Location ID</Label>
              <Input
                id="locationId"
                value={formData.locationId}
                onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                placeholder="Enter your GoHighLevel location ID"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="product_description">Product Description</Label>
            <Textarea
              id="product_description"
              value={formData.product_description}
              onChange={(e) => setFormData(prev => ({ ...prev, product_description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="accessToken">GHL Access Token</Label>
            <Input
              id="accessToken"
              type="password"
              value={formData.accessToken}
              onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
              placeholder="Enter your GoHighLevel access token"
            />
          </div>

          {/* E-commerce Fields Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Pricing Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(JSON.parse(formData.pricing_config), null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Product Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(JSON.parse(formData.product_variants), null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Inventory Management</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-32">
                  {JSON.stringify(JSON.parse(formData.inventory_management), null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <Button 
              onClick={createProduct} 
              disabled={isCreating || !formData.locationId || !formData.accessToken}
              size="lg"
              className="min-w-48"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : (
                "Create Product in GoHighLevel"
              )}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <Card className={`border-2 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Product Created Successfully!
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5" />
                      Product Creation Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.success ? (
                  <div className="space-y-4">
                    <p className="text-green-700">{result.message}</p>
                    
                    {result.product && (
                      <div>
                        <h4 className="font-medium text-green-800 mb-2">Product Details:</h4>
                        <div className="bg-white rounded-lg p-3 border">
                          <p><strong>ID:</strong> {result.product.id}</p>
                          <p><strong>Name:</strong> {result.product.name}</p>
                          <p><strong>Status:</strong> {result.product.status}</p>
                          <p><strong>Type:</strong> {result.product.productType}</p>
                          <p><strong>Available in Store:</strong> {result.product.availableInStore ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    )}

                    {result.prices && result.prices.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-800 mb-2">Pricing Created ({result.prices.length} prices):</h4>
                        <div className="space-y-2">
                          {result.prices.map((price, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border">
                              <p><strong>Name:</strong> {price.name}</p>
                              <p><strong>Amount:</strong> ${(price.amount / 100).toFixed(2)}</p>
                              <p><strong>Type:</strong> {price.type}</p>
                              {price.recurring && (
                                <p><strong>Billing:</strong> Every {price.recurring.intervalCount} {price.recurring.interval.toLowerCase()}(s)</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-red-700">{result.message}</p>
                    {result.errors && result.errors.length > 0 && (
                      <div>
                        <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {result.errors.map((error, index) => (
                            <li key={index} className="text-red-600 text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Usage Instructions */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Setup Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>1.</strong> Get your GoHighLevel Location ID from your GHL account settings</p>
              <p><strong>2.</strong> Generate an access token using OAuth or API keys in GoHighLevel</p>
              <p><strong>3.</strong> Ensure your GHL account has product management permissions</p>
              <p><strong>4.</strong> Click "Create Product" to automatically generate a product with complex pricing and variants</p>
              <p className="text-amber-600"><strong>Note:</strong> This will create a real product in your GoHighLevel account!</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}