import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  DollarSign, 
  FileImage, 
  Users, 
  Target, 
  Workflow,
  Calendar,
  FileText,
  BarChart3,
  MapPin,
  Settings
} from 'lucide-react';
import ProductsManager from '@/components/api/ProductsManager';
import PricesManager from '@/components/api/PricesManager';
import MediaManager from '@/components/api/MediaManager';
import ContactsManager from '@/components/api/ContactsManager';
import OpportunitiesManager from '@/components/api/OpportunitiesManager';
import WorkflowsManager from '@/components/api/WorkflowsManager';

interface APIStats {
  endpoints: number;
  operations: number;
  categories: number;
  status: 'connected' | 'disconnected' | 'error';
}

export default function APIManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock stats - in production, fetch from backend
  const stats: APIStats = {
    endpoints: 50,
    operations: 6,
    categories: 8,
    status: 'connected'
  };

  const apiCategories = [
    {
      id: 'products',
      name: 'Products',
      description: 'Manage product catalog and inventory',
      icon: Package,
      operations: 5,
      endpoints: [
        'GET /products - List all products',
        'POST /products - Create new product',
        'GET /products/:id - Get product details',
        'PUT /products/:id - Update product',
        'DELETE /products/:id - Delete product'
      ]
    },
    {
      id: 'prices',
      name: 'Pricing',
      description: 'Configure product pricing and payment models',
      icon: DollarSign,
      operations: 5,
      endpoints: [
        'GET /products/:id/prices - List product prices',
        'POST /products/:id/prices - Create price',
        'GET /products/:id/prices/:priceId - Get price details',
        'PUT /products/:id/prices/:priceId - Update price',
        'DELETE /products/:id/prices/:priceId - Delete price'
      ]
    },
    {
      id: 'media',
      name: 'Media Library',
      description: 'Upload and manage files, images, and documents',
      icon: FileImage,
      operations: 5,
      endpoints: [
        'GET /media/files - List files with filtering',
        'POST /media/upload - Upload files',
        'GET /media/:id - Get media details',
        'DELETE /media/:id - Delete file/folder',
        'GET /media - Location media list'
      ]
    },
    {
      id: 'contacts',
      name: 'Contacts',
      description: 'Manage customer contacts and relationships',
      icon: Users,
      operations: 6,
      endpoints: [
        'GET /contacts - List contacts',
        'POST /contacts - Create contact',
        'GET /contacts/:id - Get contact details',
        'PUT /contacts/:id - Update contact',
        'DELETE /contacts/:id - Delete contact',
        'GET /contacts/deprecated - Legacy API'
      ]
    },
    {
      id: 'opportunities',
      name: 'Opportunities',
      description: 'Track sales pipeline and deal management',
      icon: Target,
      operations: 5,
      endpoints: [
        'GET /opportunities - List opportunities',
        'POST /opportunities - Create opportunity',
        'GET /opportunities/:id - Get opportunity details',
        'PUT /opportunities/:id - Update opportunity',
        'GET /pipelines - List sales pipelines'
      ]
    },
    {
      id: 'workflows',
      name: 'Workflows',
      description: 'Automate business processes and triggers',
      icon: Workflow,
      operations: 2,
      endpoints: [
        'GET /workflows - List workflows',
        'POST /workflows/:id/trigger - Trigger workflow'
      ]
    },
    {
      id: 'calendars',
      name: 'Calendar',
      description: 'Schedule appointments and events',
      icon: Calendar,
      operations: 2,
      endpoints: [
        'GET /calendars - List calendars',
        'GET /calendars/:id/events - List events'
      ]
    },
    {
      id: 'forms',
      name: 'Forms & Surveys',
      description: 'Collect data through forms and surveys',
      icon: FileText,
      operations: 4,
      endpoints: [
        'GET /forms - List forms',
        'GET /forms/:id/submissions - Form submissions',
        'GET /surveys - List surveys',
        'GET /surveys/:id/submissions - Survey responses'
      ]
    }
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { variant: any; text: string }> = {
      connected: { variant: 'default', text: 'Connected' },
      disconnected: { variant: 'secondary', text: 'Disconnected' },
      error: { variant: 'destructive', text: 'Error' }
    };
    
    const config = variants[status] || variants.disconnected;
    
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">GoHighLevel API Management</h1>
        <p className="text-muted-foreground">
          Comprehensive interface for all GoHighLevel operations through the universal API system
        </p>
      </div>

      {/* API Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Endpoints</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.endpoints}+</div>
            <p className="text-xs text-muted-foreground">
              Active API operations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Categories</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.categories}</div>
            <p className="text-xs text-muted-foreground">
              Business operation types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <StatusBadge status={stats.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              GoHighLevel OAuth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Universal System</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              Configuration-driven
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="prices">Pricing</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {apiCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setActiveTab(category.id)}>
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {category.operations} operations
                      </span>
                      <Button variant="outline" size="sm">
                        Manage →
                      </Button>
                    </div>
                    <div className="mt-3 space-y-1">
                      {category.endpoints.slice(0, 2).map((endpoint, index) => (
                        <div key={index} className="text-xs text-muted-foreground font-mono">
                          {endpoint}
                        </div>
                      ))}
                      {category.endpoints.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{category.endpoints.length - 2} more endpoints
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="products">
          <ProductsManager />
        </TabsContent>

        <TabsContent value="prices">
          <PricesManager />
        </TabsContent>

        <TabsContent value="media">
          <MediaManager />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsManager />
        </TabsContent>

        <TabsContent value="opportunities">
          <OpportunitiesManager />
        </TabsContent>

        <TabsContent value="workflows">
          <WorkflowsManager />
        </TabsContent>

        <TabsContent value="testing">
          <Card>
            <CardHeader>
              <CardTitle>API Testing Interface</CardTitle>
              <CardDescription>
                Test any GoHighLevel API endpoint with real data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  API testing interface coming soon. Use the specific category tabs above to manage operations.
                </p>
                <Button variant="outline">
                  View API Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}