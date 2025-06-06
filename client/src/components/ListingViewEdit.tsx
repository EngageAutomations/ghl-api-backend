import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Edit, Eye, Calendar, MapPin, DollarSign, Tag, FileText, Settings } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiRequest } from '@/lib/queryClient';
import { CreateListingForm } from './CreateListingForm';

interface ListingViewEditProps {
  listingId: number;
  directoryName: string;
  directoryConfig: any;
  onSuccess: () => void;
  onClose: () => void;
}

export function ListingViewEdit({ listingId, directoryName, directoryConfig, onSuccess, onClose }: ListingViewEditProps) {
  const [isEditing, setIsEditing] = useState(false);

  // Fetch listing details
  const { data: listing, isLoading: listingLoading } = useQuery({
    queryKey: ['/api/listings/by-id', listingId],
    queryFn: async () => {
      const response = await apiRequest(`/api/listings/by-id/${listingId}`);
      return response.json();
    },
    enabled: !!listingId,
  });

  // Fetch listing addons
  const { data: addons = [], isLoading: addonsLoading } = useQuery({
    queryKey: ['/api/listing-addons', listingId],
    queryFn: async () => {
      const response = await apiRequest(`/api/listing-addons/listing/${listingId}`);
      return response.json();
    },
    enabled: !!listingId,
  });

  const handleEditSuccess = () => {
    setIsEditing(false);
    onSuccess();
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  // Extract addon data with null safety (needed for edit mode)
  const addonsArray = Array.isArray(addons) ? addons : [];

  if (listingLoading || addonsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Listing not found</p>
          <p className="text-sm text-gray-500">The requested listing could not be loaded.</p>
        </div>
      </div>
    );
  }

  // If in edit mode, show the form
  if (isEditing) {
    return (
      <div className="max-h-[75vh] overflow-y-auto">
        <CreateListingForm
          directoryName={directoryName}
          directoryConfig={directoryConfig}
          onSuccess={handleEditSuccess}
          onCancel={handleEditCancel}
          editingListing={listing}
          editingAddons={addonsArray}
        />
      </div>
    );
  }

  // Extract addon data for view mode
  const expandedDescriptionAddon = addonsArray.find((addon: any) => addon.type === 'expanded_description');
  const metadataAddon = addonsArray.find((addon: any) => addon.type === 'metadata_bar');
  const metadataFields = metadataAddon ? JSON.parse(metadataAddon.content || '[]') : [];

  return (
    <ScrollArea className="max-h-[75vh] pr-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-gray-500" />
              <h2 className="text-2xl font-bold text-gray-900">{listing.title}</h2>
              <Badge variant={listing.isActive ? "default" : "secondary"}>
                {listing.isActive ? "Active" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">ID: {listing.id} • Slug: {listing.slug}</p>
          </div>
          <Button onClick={() => setIsEditing(true)} className="ml-4">
            <Edit className="w-4 h-4 mr-2" />
            Edit Listing
          </Button>
        </div>

        <Separator />

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <p className="text-sm text-gray-900 mt-1">{listing.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="text-sm text-gray-900 mt-1">{listing.category || 'Not specified'}</p>
              </div>
              {listing.price && (
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Price
                  </label>
                  <p className="text-lg font-semibold text-green-600 mt-1">{listing.price}</p>
                </div>
              )}
              {listing.location && (
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Location
                  </label>
                  <p className="text-sm text-gray-900 mt-1">{listing.location}</p>
                </div>
              )}
            </div>
            
            {listing.description && (
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {listing.imageUrl && (
              <div>
                <label className="text-sm font-medium text-gray-700">Image</label>
                <div className="mt-2">
                  <img 
                    src={listing.imageUrl} 
                    alt={listing.title}
                    className="max-w-md h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1 break-all">{listing.imageUrl}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expanded Description */}
        {expandedDescriptionAddon && expandedDescriptionAddon.content && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Expanded Description (Rich Text)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ __html: expandedDescriptionAddon.content }}
                  className="text-sm text-gray-900"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata Bar */}
        {metadataFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Metadata Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metadataFields.map((field: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {field.icon && (
                      <div className="w-6 h-6 flex items-center justify-center">
                        {field.icon.startsWith('data:') ? (
                          <img src={field.icon} alt="Icon" className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-lg" role="img" aria-label="icon">
                            {field.icon}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="text-sm text-gray-900">{field.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-700">Directory</label>
                <p className="text-gray-900 mt-1">{listing.directoryName}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">User ID</label>
                <p className="text-gray-900 mt-1">{listing.userId}</p>
              </div>
              {listing.createdAt && (
                <div>
                  <label className="font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Created
                  </label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(listing.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
              {listing.updatedAt && (
                <div>
                  <label className="font-medium text-gray-700 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Last Updated
                  </label>
                  <p className="text-gray-900 mt-1">
                    {format(new Date(listing.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Addon Information */}
        {addons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Addons ({addons.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {addons.map((addon: any) => (
                  <div key={addon.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="text-sm font-medium">{addon.title}</span>
                      <span className="text-xs text-gray-500 ml-2">({addon.type})</span>
                    </div>
                    <Badge variant={addon.enabled ? "default" : "secondary"} className="text-xs">
                      {addon.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}