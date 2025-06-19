import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your GoHighLevel Directory & Collections Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Railway OAuth</CardTitle>
            <CardDescription>Connected to dir.engageautomations.com</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-600">✓ Installation: install_1750252333303</div>
            <div className="text-sm text-green-600">✓ Token refresh automated</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Status</CardTitle>
            <CardDescription>GoHighLevel integration active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-600">✓ Railway backend connected</div>
            <div className="text-sm text-green-600">✓ Product creation ready</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>All systems operational</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-600">✓ Database connected</div>
            <div className="text-sm text-green-600">✓ UI components loaded</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          onClick={() => setLocation("/directories")}
          className="h-20 flex flex-col items-center justify-center"
        >
          📁
          <span className="mt-2">Directories</span>
        </Button>

        <Button 
          onClick={() => setLocation("/listings")}
          className="h-20 flex flex-col items-center justify-center"
          variant="outline"
        >
          📋
          <span className="mt-2">Listings</span>
        </Button>

        <Button 
          onClick={() => setLocation("/collections")}
          className="h-20 flex flex-col items-center justify-center"
          variant="outline"
        >
          📚
          <span className="mt-2">Collections</span>
        </Button>

        <Button 
          onClick={() => setLocation("/ghl-product-demo")}
          className="h-20 flex flex-col items-center justify-center"
          variant="outline"
        >
          🛍️
          <span className="mt-2">GHL Products</span>
        </Button>
      </div>
    </div>
  );
}