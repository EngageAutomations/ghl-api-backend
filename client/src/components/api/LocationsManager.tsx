import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, RefreshCw, Edit, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  timeZone?: string;
  isActive: boolean;
}

export default function LocationsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<Location>({
    defaultValues: {
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      website: ''
    }
  });

  // Fetch locations
  const { data: locations, isLoading, refetch } = useQuery({
    queryKey: ['/api/ghl/locations'],
    queryFn: async () => {
      const response = await fetch('/api/ghl/locations');
      if (!response.ok) throw new Error('Failed to fetch locations');
      return response.json();
    }
  });

  // Update location mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Location> }) => {
      const response = await fetch(`/api/ghl/locations/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates)
      });
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/locations'] });
      setIsEditOpen(false);
      toast({
        title: "Location updated",
        description: "Location information has been successfully updated."
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update location",
        variant: "destructive"
      });
    }
  });

  const openEditDialog = (location: Location) => {
    setSelectedLocation(location);
    form.reset(location);
    setIsEditOpen(true);
  };

  const onSubmit = (data: Location) => {
    if (!selectedLocation) return;
    updateMutation.mutate({
      id: selectedLocation.id,
      updates: data
    });
  };

  const filteredLocations = locations?.filter((location: Location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.city?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Location Management</h2>
          <p className="text-muted-foreground">
            Manage business locations and their information
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location: Location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {location.name}
                  </CardTitle>
                  <Badge variant={location.isActive ? "default" : "secondary"}>
                    {location.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>
                  {location.city && location.state 
                    ? `${location.city}, ${location.state}` 
                    : location.address || "No address provided"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {location.address && (
                    <div className="text-sm text-muted-foreground">
                      📍 {location.address}
                      {location.city && `, ${location.city}`}
                      {location.postalCode && ` ${location.postalCode}`}
                    </div>
                  )}
                  {location.website && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Globe className="h-3 w-3 mr-1" />
                      <a href={location.website} target="_blank" rel="noopener noreferrer" 
                         className="hover:text-primary">
                        {location.website}
                      </a>
                    </div>
                  )}
                  {location.timeZone && (
                    <div className="text-sm text-muted-foreground">
                      🕒 {location.timeZone}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openEditDialog(location)}
                    className="w-full"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredLocations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No locations found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm ? 'No locations match your search.' : 'No locations available.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Location Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter location name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter street address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="City" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="State" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ZIP/Postal" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Location"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LocationsManager;