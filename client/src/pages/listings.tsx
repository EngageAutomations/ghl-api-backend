import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function Listings() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listings Management</h1>
          <p className="text-gray-600 mt-2">Create and manage your product listings</p>
        </div>
        <Button onClick={() => setLocation("/create-listing")}>
          Create New Listing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample Listing 1</CardTitle>
            <CardDescription>Example product listing with Railway integration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This is a sample listing that demonstrates the GoHighLevel product creation flow.
            </p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">Edit</Button>
              <Button size="sm" variant="outline">View</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Listing 2</CardTitle>
            <CardDescription>Another example with metadata</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Product listing with rich metadata and collection organization.
            </p>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">Edit</Button>
              <Button size="sm" variant="outline">View</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-gray-300">
          <CardContent className="flex items-center justify-center h-full p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">➕</div>
              <Button onClick={() => setLocation("/create-listing")}>
                Add New Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}