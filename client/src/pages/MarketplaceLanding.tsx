import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function MarketplaceLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            GoHighLevel Directory & Collections
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive directory and collections management with automated GoHighLevel integration via Railway backend
          </p>
          <Button
            onClick={() => setLocation("/dashboard")}
            size="lg"
            className="text-lg px-8 py-4"
          >
            Get Started
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-4">📁</div>
              <CardTitle>Directory Management</CardTitle>
              <CardDescription>
                Create and organize directories with custom configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setLocation("/directories")}
              >
                Manage Directories
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-4">📋</div>
              <CardTitle>Listings</CardTitle>
              <CardDescription>
                Add and manage product listings with rich metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setLocation("/listings")}
              >
                View Listings
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="text-4xl mb-4">📚</div>
              <CardTitle>Collections</CardTitle>
              <CardDescription>
                Organize listings into curated collections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => setLocation("/collections")}
              >
                Browse Collections
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-8">Railway OAuth Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Automated Token Management</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Connected to dir.engageautomations.com</li>
                <li>• Installation: install_1750252333303</li>
                <li>• Automatic token refresh 5 minutes before expiry</li>
                <li>• Zero local OAuth credential handling required</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">GoHighLevel Integration</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Direct product creation in GoHighLevel</li>
                <li>• Real-time API synchronization</li>
                <li>• Complete separation of concerns architecture</li>
                <li>• Reliable continuous API access</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-8">
            <Button
              onClick={() => setLocation("/ghl-product-demo")}
              className="mr-4"
            >
              Test Product Creation
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/railway-test")}
            >
              Test Railway Connection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}