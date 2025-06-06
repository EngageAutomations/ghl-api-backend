import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, MapPin, DollarSign, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreateListingForm } from '@/components/CreateListingForm';

export default function ListingView() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch listing data
  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['/api/listings/by-slug', slug],
    queryFn: () => apiRequest(`/api/listings/by-slug/${slug}`),
    enabled: !!slug,
  });

  // Fetch listing addons
  const { data: addons } = useQuery({
    queryKey: ['/api/listing-addons/listing', listing?.id],
    queryFn: () => apiRequest(`/api/listing-addons/listing/${listing.id}`),
    enabled: !!listing?.id,
  });

  // Fetch directory config
  const { data: directory } = useQuery({
    queryKey: ['/api/directories', listing?.directoryName],
    queryFn: () => apiRequest(`/api/directories/${listing.directoryName}`),
    enabled: !!listing?.directoryName,
  });

  // Delete listing mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/listings/id/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Listing deleted successfully!",
      });
      navigate('/listings');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete listing.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = () => {
    if (listing && confirm(`Are you sure you want to delete "${listing.title}"? This action cannot be undone.`)) {
      deleteMutation.mutate(listing.id);
    }
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    queryClient.invalidateQueries({ queryKey: ['/api/listings/by-slug', slug] });
    queryClient.invalidateQueries({ queryKey: ['/api/listing-addons/listing', listing?.id] });
  };

  // Process addons data
  const expandedDescription = addons?.find((addon: any) => addon.type === 'expanded_description')?.content || '';
  const metadataBar = addons?.find((addon: any) => addon.type === 'metadata_bar');
  const metadataFields = metadataBar ? JSON.parse(metadataBar.content || '[]') : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/listings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/listings')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Listings
          </Button>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowEditForm(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {listing.title}
                    </CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {listing.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {listing.location}
                        </div>
                      )}
                      {listing.createdAt && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(listing.createdAt), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {listing.price && (
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {listing.price}
                      </div>
                    )}
                    <Badge variant={listing.isActive ? "default" : "secondary"}>
                      {listing.isActive ? "Active" : "Draft"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {listing.imageUrl && (
                <div className="px-6 pb-6">
                  <img 
                    src={listing.imageUrl} 
                    alt={listing.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}
            </Card>

            {/* Description */}
            {listing.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Expanded Description (Rich Text) */}
            {expandedDescription && (
              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: expandedDescription }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Metadata Bar */}
            {metadataFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metadataFields.map((field: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl">{field.icon}</div>
                        <div className="text-gray-700">{field.text}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Directory Info */}
            {directory && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Directory</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{directory.directoryName}</p>
                    <Badge variant="outline">
                      {directory.locationId}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Listing Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={listing.isActive ? "default" : "secondary"}>
                      {listing.isActive ? "Active" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slug:</span>
                    <span className="font-mono">{listing.slug}</span>
                  </div>
                  {listing.category && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span>{listing.category}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{format(new Date(listing.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  {listing.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated:</span>
                      <span>{format(new Date(listing.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Listing</DialogTitle>
            </DialogHeader>
            <div className="max-h-[75vh] overflow-y-auto pr-2">
              <CreateListingForm
                directoryName={listing.directoryName}
                directoryConfig={directory?.config}
                onSuccess={handleEditSuccess}
                onCancel={() => setShowEditForm(false)}
                editingListing={listing}
                editingAddons={addons}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}