import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, Grid3X3, List, MoreHorizontal, Edit, Trash2, Eye, ChevronLeft, Archive, Package } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreateListingForm } from '@/components/CreateListingForm';
import { ListingViewEdit } from '@/components/ListingViewEdit';
import CreateCollectionForm from '@/components/CreateCollectionForm';
import { ProductCreateModal } from '@/components/ProductCreateModal';

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'active' | 'draft';
type SortOption = 'newest' | 'oldest' | 'title' | 'price';
type ContentView = 'collections' | 'products';

export default function DirectoryDetails() {
  const [match, params] = useRoute('/directories/:directoryName');
  const directoryName = params?.directoryName;
  const [location, setLocation] = useLocation();
  const [contentView, setContentView] = useState<ContentView>('collections');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showListingForm, setShowListingForm] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [selectedListings, setSelectedListings] = useState<number[]>([]);
  const [viewingListingId, setViewingListingId] = useState<number | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check URL parameters to set initial tab
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'collections') {
      setContentView('collections');
    }
  }, [location]);

  // Fetch directory info
  const { data: directory, isLoading: directoryLoading } = useQuery({
    queryKey: ['/api/directories', directoryName],
    queryFn: async () => {
      const response = await apiRequest(`/api/directories/${directoryName}`);
      return response.json();
    },
    enabled: !!directoryName,
  });

  // Fetch listings for this directory
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['/api/listings', directoryName],
    queryFn: async () => {
      const response = await apiRequest(`/api/listings/${directoryName}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!directoryName,
  });

  // Fetch collections for this directory
  const { data: collections = [], isLoading: collectionsLoading } = useQuery({
    queryKey: ['/api/collections/directory', directoryName],
    queryFn: async () => {
      const response = await apiRequest(`/api/collections/directory/${directoryName}`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!directoryName,
  });

  // Delete listing mutation
  const deleteMutation = useMutation({
    mutationFn: async (listingId: number) => {
      return apiRequest(`/api/listings/${listingId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({
        title: "Listing deleted",
        description: "The listing has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete listing. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (listingIds: number[]) => {
      await Promise.all(
        listingIds.map(id => apiRequest(`/api/listings/${id}`, { method: 'DELETE' }))
      );
    },
    onSuccess: () => {
      toast({
        title: "Listings deleted",
        description: `${selectedListings.length} listings have been deleted.`,
      });
      setSelectedListings([]);
      queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete some listings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Collection mutations
  const createCollectionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/collections', {
      method: 'POST',
      data: { ...data, directoryName }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections/directory', directoryName] });
      setShowCollectionForm(false);
      toast({
        title: "Success",
        description: "Collection created successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive"
      });
    }
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/collections/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections/directory', directoryName] });
      toast({
        title: "Success",
        description: "Collection deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete collection",
        variant: "destructive"
      });
    }
  });

  // Filter and sort listings
  const processedListings = Array.isArray(listings) ? listings
    .filter((listing: any) => {
      // Search filter
      const matchesSearch = !searchQuery || 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (listing.description && listing.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (listing.category && listing.category.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'active' && listing.isActive) ||
        (filterBy === 'draft' && !listing.isActive);

      return matchesSearch && matchesFilter;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime();
        case 'oldest':
          return new Date(a.createdAt || new Date()).getTime() - new Date(b.createdAt || new Date()).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'price':
          const priceA = parseFloat(a.price?.replace(/[^0-9.-]+/g, '') || '0');
          const priceB = parseFloat(b.price?.replace(/[^0-9.-]+/g, '') || '0');
          return priceB - priceA;
        default:
          return 0;
      }
    }) : [];

  const handleEditListing = (listing: any) => {
    setEditingListing(listing);
    setShowListingForm(true);
  };

  const handleDeleteListing = (listingId: number) => {
    if (confirm('Are you sure you want to delete this listing?')) {
      deleteMutation.mutate(listingId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedListings.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedListings.length} listing(s)?`)) {
      bulkDeleteMutation.mutate(selectedListings);
    }
  };

  const toggleListingSelection = (listingId: number) => {
    setSelectedListings(prev => 
      prev.includes(listingId) 
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const selectAllListings = () => {
    setSelectedListings(
      selectedListings.length === processedListings.length 
        ? [] 
        : processedListings.map((listing: any) => listing.id)
    );
  };

  const handleFormSuccess = () => {
    setShowListingForm(false);
    setEditingListing(null);
    queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
  };

  const handleFormClose = () => {
    setShowListingForm(false);
    setEditingListing(null);
  };

  const handleViewListing = (listingId: number) => {
    setViewingListingId(listingId);
    setShowViewDialog(true);
  };

  const handleViewSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
    queryClient.invalidateQueries({ queryKey: ['/api/listings/by-id', viewingListingId] });
    queryClient.invalidateQueries({ queryKey: ['/api/listing-addons', viewingListingId] });
  };

  const handleViewClose = () => {
    setShowViewDialog(false);
    setViewingListingId(null);
  };

  if (directoryLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!directory) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Directory not found</h1>
          <p className="text-gray-600 mb-6">The directory you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation('/directories')}>
            Back to Directories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{directory.directoryName}</h1>
            <p className="text-gray-600">
              {contentView === 'collections' 
                ? `${collections.length} collection${collections.length !== 1 ? 's' : ''}`
                : `${processedListings.length} listing${processedListings.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => contentView === 'collections' ? setShowCollectionForm(true) : setShowGHLProductCreator(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {contentView === 'collections' ? 'New Collection' : 'Create GHL Product'}
            </Button>
          </div>
        </div>

        {/* Content Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <Button
              variant={contentView === 'collections' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setContentView('collections')}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Collections
            </Button>
            <Button
              variant={contentView === 'products' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setContentView('products')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Products
            </Button>
          </div>
        </div>

        {/* Search and filters - only show for products */}
        {contentView === 'products' && (
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
            {/* Bulk actions */}
            {selectedListings.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedListings.length} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Filters */}
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
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

            {/* View mode toggle */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Content - Collections or Products */}
      {contentView === 'collections' ? (
        // Collections View
        collectionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Archive className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
            <p className="text-gray-600 mb-6">Create your first collection to organize your products</p>
            <Button onClick={() => setShowCollectionForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection: any) => (
              <div key={collection.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{collection.name}</h3>
                    {collection.description && (
                      <p className="text-gray-600 text-sm mb-3">{collection.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {collection.itemCount || 0} items
                      </span>
                      {collection.syncStatus && (
                        <Badge variant={collection.syncStatus === 'synced' ? 'default' : 'secondary'}>
                          {collection.syncStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingCollection(collection)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this collection?')) {
                            deleteCollectionMutation.mutate(collection.id);
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="mt-4">
                  <Button 
                    onClick={() => setLocation(`/collections/${collection.id}`)}
                    className="w-full flex items-center gap-2"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4" />
                    View Collection
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Products View
        listingsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : processedListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Grid3X3 className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterBy !== 'all' ? 'No listings found' : 'No listings yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first listing to get started'
              }
            </p>
            {!searchQuery && filterBy === 'all' && (
              <Button onClick={() => setShowGHLProductCreator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Product
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Select all checkbox */}
            {processedListings.length > 0 && (
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedListings.length === processedListings.length}
                  onChange={selectAllListings}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">
                  Select all ({processedListings.length})
                </span>
              </label>
            </div>
          )}

          <div className={
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {processedListings.map((listing: any) => (
              <Card key={listing.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedListings.includes(listing.id)}
                        onChange={() => toggleListingSelection(listing.id)}
                        className="mt-1 rounded"
                      />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{listing.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={listing.isActive ? "default" : "secondary"}>
                            {listing.isActive ? 'Active' : 'Draft'}
                          </Badge>
                          {listing.category && (
                            <Badge variant="outline">{listing.category}</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewListing(listing.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditListing(listing)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteListing(listing.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent>
                  {listing.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {listing.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div>
                      {listing.location && (
                        <span className="mr-4">{listing.location}</span>
                      )}
                      {listing.price && (
                        <span className="font-medium text-gray-900">{listing.price}</span>
                      )}
                    </div>
                    <div>
                      {listing.createdAt && format(new Date(listing.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
        )
      )}

      {/* Create Listing Dialog */}
      <Dialog open={showListingForm} onOpenChange={setShowListingForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create New Listing
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] overflow-y-auto pr-2">
            <CreateListingForm
              directoryName={directoryName!}
              directoryConfig={directory?.config}
              onSuccess={handleFormSuccess}
              onCancel={handleFormClose}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Listing Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Listing Details
            </DialogTitle>
          </DialogHeader>
          {viewingListingId && (
            <ListingViewEdit
              listingId={viewingListingId}
              directoryName={directoryName!}
              directoryConfig={directory?.config}
              onSuccess={handleViewSuccess}
              onClose={handleViewClose}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Collection Dialog */}
      <Dialog open={showCollectionForm} onOpenChange={setShowCollectionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editingCollection ? 'Edit Collection' : 'Create New Collection'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <CreateCollectionForm
              collection={editingCollection}
              defaultDirectoryName={directoryName!}
              onSubmit={(data: any) => {
                if (editingCollection) {
                  // Handle edit
                  console.log('Edit collection:', data);
                } else {
                  createCollectionMutation.mutate(data);
                }
              }}
              onCancel={() => {
                setShowCollectionForm(false);
                setEditingCollection(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Directory Form Renderer Dialog - Full Size for Wizard Form */}
      <Dialog open={showGHLProductCreator} onOpenChange={setShowGHLProductCreator}>
        <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              Create New Product
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            <DirectoryFormRenderer
              directoryName={directoryName!}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/listings', directoryName] });
                setShowGHLProductCreator(false);
              }}
              onCancel={() => setShowGHLProductCreator(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Prominent Back to Directories Button - Fixed Position */}
      <div className="fixed bottom-6 z-50" style={{ left: 'max(1.5rem, calc(50% - 768px / 2 + 1.5rem - 50px))' }}>
        <Button
          onClick={() => setLocation('/directories')}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6 py-3 text-base font-medium rounded-lg flex items-center gap-2 ml-[-60px] mr-[-60px]"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Directories
        </Button>
      </div>
    </div>
  );
}