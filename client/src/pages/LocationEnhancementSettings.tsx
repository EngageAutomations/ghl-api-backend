import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationEnhancementManager } from "@/components/LocationEnhancementManager";
import { useLocationEnhancementsByUser } from "@/hooks/useLocationEnhancements";
import { Badge } from "@/components/ui/badge";
import { Settings, MapPin, Building2, Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LocationEnhancementSettings() {
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<{
    ghlLocationId: string;
    directoryName: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newLocationId, setNewLocationId] = useState("");
  const [newDirectoryName, setNewDirectoryName] = useState("");

  const { data: userEnhancements = [], isLoading } = useLocationEnhancementsByUser(user?.id || 1);

  const filteredEnhancements = userEnhancements.filter(enhancement =>
    enhancement.ghlLocationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enhancement.directoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    if (newLocationId && newDirectoryName) {
      setSelectedLocation({
        ghlLocationId: newLocationId,
        directoryName: newDirectoryName
      });
      setNewLocationId("");
      setNewDirectoryName("");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Location Enhancement Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure directory enhancements for specific GoHighLevel locations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Locations</CardTitle>
              <CardDescription>
                Select a location to configure enhancements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Create New */}
              <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                <Label className="text-sm font-medium">Add New Location</Label>
                <Input
                  placeholder="Location ID"
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder="Directory Name"
                  value={newDirectoryName}
                  onChange={(e) => setNewDirectoryName(e.target.value)}
                  className="text-sm"
                />
                <Button 
                  onClick={handleCreateNew}
                  size="sm" 
                  className="w-full"
                  disabled={!newLocationId || !newDirectoryName}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Configure Location
                </Button>
              </div>

              {/* Existing Locations */}
              <div className="space-y-2">
                {filteredEnhancements.map((enhancement) => (
                  <Card 
                    key={`${enhancement.ghlLocationId}-${enhancement.directoryName}`}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedLocation?.ghlLocationId === enhancement.ghlLocationId &&
                      selectedLocation?.directoryName === enhancement.directoryName
                        ? 'ring-2 ring-primary'
                        : ''
                    }`}
                    onClick={() => setSelectedLocation({
                      ghlLocationId: enhancement.ghlLocationId,
                      directoryName: enhancement.directoryName
                    })}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm truncate">
                            {enhancement.ghlLocationId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {enhancement.directoryName}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {enhancement.metadataBarEnabled && (
                            <Badge variant="secondary" className="text-xs">Metadata</Badge>
                          )}
                          {enhancement.googleMapsEnabled && (
                            <Badge variant="secondary" className="text-xs">Maps</Badge>
                          )}
                          {enhancement.expandedDescriptionEnabled && (
                            <Badge variant="secondary" className="text-xs">Description</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredEnhancements.length === 0 && searchTerm && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No locations found matching "{searchTerm}"
                  </div>
                )}

                {userEnhancements.length === 0 && !searchTerm && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No location enhancements configured yet.
                    Add a location to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhancement Configuration */}
        <div className="lg:col-span-2">
          {selectedLocation ? (
            <LocationEnhancementManager
              ghlLocationId={selectedLocation.ghlLocationId}
              directoryName={selectedLocation.directoryName}
              userId={user?.id || 1}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">Select a Location</h3>
                  <p className="text-muted-foreground">
                    Choose a location from the list to configure its directory enhancements
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}