import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Search, Filter, Grid, List, Edit, Trash2, ExternalLink, Download, Eye, Calendar, MapPin, DollarSign } from 'lucide-react';
import { Listing, FormConfiguration } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ListingForm from '@/components/ListingForm';

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'active' | 'draft';
type SortOption = 'newest' | 'oldest' | 'title' | 'price';

export default function DirectoryDetails() {
  const [match, params] = useRoute('/directories/:directoryName');
  const directoryName = params?.directoryName;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);

  // Fetch directory info
  const { data: directory } = useQuery<FormConfiguration>({
    queryKey: ['/api/directories', directoryName],
    enabled: !!directoryName,
  });

  // Fetch listings for this directory
  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ['/api/listings', directoryName],
    enabled: !!directoryName,
  });

  // Delete listing mutation
  const deleteMutation = useMutation({
    mutationFn: async (listingId: number) => {
      return apiRequest(`/api/listings/${listingId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
      toast({
        title: "Listing deleted",
        description: "The listing has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort listings
  const filteredListings = listings
    .filter(listing => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return listing.title.toLowerCase().includes(query) ||
               listing.description?.toLowerCase().includes(query) ||
               listing.category?.toLowerCase().includes(query);
      }
      return true;
    })
    .filter(listing => {
      // Status filter (placeholder for future status field)
      if (filterBy === 'all') return true;
      return true; // TODO: Add status field to schema
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price':
          return (parseFloat(a.price || '0') - parseFloat(b.price || '0'));
        default:
          return 0;
      }
    });

  const handleCreateListing = () => {
    setEditingListing(null);
    setShowListingForm(true);
  };

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setShowListingForm(true);
  };

  const handleListingFormClose = () => {
    setShowListingForm(false);
    setEditingListing(null);
  };

  if (!match) {
    return <div>Directory not found</div>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/directories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Directories
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{directoryName}</h1>
            <p className="text-gray-600 mt-1">{listings.length} listings</p>
          </div>
        </div>
        <Button onClick={handleCreateListing} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Listing
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
            <SelectTrigger className="w-32">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Listings Display */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-600 mb-6">Create your first listing to get started</p>
          <Button onClick={handleCreateListing} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create First Listing
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                {listing.imageUrl && (
                  <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                {listing.category && (
                  <Badge variant="secondary" className="w-fit">
                    {listing.category}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                {listing.description && (
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {listing.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-4">
                  {listing.price && (
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {listing.price}
                    </div>
                  )}
                  {listing.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      {listing.location}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(listing.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={() => handleEditListing(listing)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    {listing.linkUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={listing.linkUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {listing.downloadUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={listing.downloadUrl} download>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{listing.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(listing.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {listing.imageUrl && (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={listing.imageUrl}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{listing.title}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        {listing.category && (
                          <Badge variant="secondary" className="text-xs">
                            {listing.category}
                          </Badge>
                        )}
                        {listing.price && (
                          <span className="text-sm text-gray-600">{listing.price}</span>
                        )}
                        {listing.location && (
                          <span className="text-sm text-gray-600">{listing.location}</span>
                        )}
                      </div>
                      {listing.description && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                          {listing.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditListing(listing)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{listing.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(listing.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Listing Form Dialog */}
      <Dialog open={showListingForm} onOpenChange={setShowListingForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingListing ? `Edit "${editingListing.title}"` : 'Create New Listing'}
            </DialogTitle>
          </DialogHeader>
          <ListingForm
            directoryName={directoryName!}
            listing={editingListing}
            onClose={handleListingFormClose}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
              handleListingFormClose();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}