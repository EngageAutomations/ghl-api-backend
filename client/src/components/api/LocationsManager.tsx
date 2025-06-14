import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

function LocationsManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Locations Management</h2>
        <p className="text-muted-foreground">
          Manage business locations and settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Operations
          </CardTitle>
          <CardDescription>
            GoHighLevel location and business management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Location management features will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LocationsManager;