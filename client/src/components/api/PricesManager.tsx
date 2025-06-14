import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export default function PricesManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Price Management</h2>
        <p className="text-muted-foreground">
          Configure product pricing and payment models
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <CardTitle>Pricing Operations</CardTitle>
          </div>
          <CardDescription>
            Manage product prices through GoHighLevel API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground font-mono">
              GET /products/:productId/prices - List product prices
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              POST /products/:productId/prices - Create new price
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              PUT /products/:productId/prices/:priceId - Update price
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              DELETE /products/:productId/prices/:priceId - Delete price
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}