import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  DollarSign,
  Upload,
  Users,
  Target,
  Workflow,
  Calendar,
  FileText,
  MapPin,
  Terminal,
  Plus,
  Search
} from 'lucide-react';

// Direct API Management without authentication dependencies
export default function DirectAPIManagement() {
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');

  const apiCategories = [
    { id: 'products', label: 'Products', icon: Package, color: 'bg-blue-500' },
    { id: 'prices', label: 'Prices', icon: DollarSign, color: 'bg-green-500' },
    { id: 'media', label: 'Media', icon: Upload, color: 'bg-purple-500' },
    { id: 'contacts', label: 'Contacts', icon: Users, color: 'bg-orange-500' },
    { id: 'opportunities', label: 'Opportunities', icon: Target, color: 'bg-red-500' },
    { id: 'workflows', label: 'Workflows', icon: Workflow, color: 'bg-indigo-500' },
    { id: 'calendars', label: 'Calendars', icon: Calendar, color: 'bg-cyan-500' },
    { id: 'forms', label: 'Forms', icon: FileText, color: 'bg-yellow-500' },
    { id: 'locations', label: 'Locations', icon: MapPin, color: 'bg-pink-500' },
    { id: 'testing', label: 'API Testing', icon: Terminal, color: 'bg-gray-500' }
  ];

  const ProductsManager = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products Management</h2>
          <p className="text-muted-foreground">Manage your GoHighLevel products and catalog</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-lg">Sample Product {i}</CardTitle>
              <CardDescription>Product description and details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">Active</Badge>
                <span className="text-sm font-medium">$99.00</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const GenericManager = ({ title, description, icon: Icon }) => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title} Operations
          </CardTitle>
          <CardDescription>GoHighLevel {title.toLowerCase()} management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            {title} management features will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductsManager />;
      case 'prices':
        return <GenericManager title="Price Management" description="Manage product pricing and tiers" icon={DollarSign} />;
      case 'media':
        return <GenericManager title="Media Management" description="Upload and manage media files" icon={Upload} />;
      case 'contacts':
        return <GenericManager title="Contacts Management" description="Manage customer contacts and leads" icon={Users} />;
      case 'opportunities':
        return <GenericManager title="Opportunities Management" description="Track sales opportunities and pipeline" icon={Target} />;
      case 'workflows':
        return <GenericManager title="Workflows Management" description="Automate business processes" icon={Workflow} />;
      case 'calendars':
        return <GenericManager title="Calendars Management" description="Manage bookings and appointments" icon={Calendar} />;
      case 'forms':
        return <GenericManager title="Forms Management" description="Create and manage forms" icon={FileText} />;
      case 'locations':
        return <GenericManager title="Locations Management" description="Manage business locations" icon={MapPin} />;
      case 'testing':
        return <GenericManager title="API Testing Interface" description="Test and debug API endpoints" icon={Terminal} />;
      default:
        return <ProductsManager />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/40">
          <div className="p-6">
            <h1 className="text-xl font-semibold">GoHighLevel API</h1>
            <p className="text-sm text-muted-foreground">Management Dashboard</p>
          </div>
          <nav className="space-y-1 px-3">
            {apiCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveTab(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className={`p-1 rounded ${category.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {category.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="p-8">
            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
}