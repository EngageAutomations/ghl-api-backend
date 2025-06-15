import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, FolderOpen, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import CreateCollectionForm from '@/components/CreateCollectionForm';

interface Collection {
  id: number;
  name: string;
  description: string | null;
  directoryName: string;
  userId: number;
  ghlCollectionId: string | null;
  syncStatus: string;
  syncError: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function Collections() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch collections
  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/collections'],
    select: (data: Collection[]) => data || []
  });

  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/collections', {
      method: 'POST',
      data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setShowCreateDialog(false);
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

  // Update collection mutation
  const updateCollectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/collections/${id}`, {
        method: 'PATCH',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
      setEditingCollection(null);
      toast({
        title: "Success",
        description: "Collection updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update collection",
        variant: "destructive"
      });
    }
  });

  // Delete collection mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/collections/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collections'] });
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

  // Filter collections based on search
  const filteredCollections = collections.filter((collection: Collection) =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    collection.directoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCollection = (data: any) => {
    createCollectionMutation.mutate(data);
  };

  const handleUpdateCollection = (data: any) => {
    if (editingCollection) {
      updateCollectionMutation.mutate({
        id: editingCollection.id,
        data
      });
    }
  };

  const handleDeleteCollection = (id: number) => {
    if (confirm('Are you sure you want to delete this collection? This will also remove all listings from the collection.')) {
      deleteCollectionMutation.mutate(id);
    }
  };

  const getSyncStatusBadge = (status: string, error: string | null) => {
    if (status === 'synced') {
      return <Badge variant="default" className="bg-green-500">Synced</Badge>;
    } else if (status === 'failed') {
      return <Badge variant="destructive">Failed</Badge>;
    } else {
      return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Collections</h1>
            <p className="text-gray-600">
              {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Collection
          </Button>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FolderOpen className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No collections found' : 'No collections yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Create your first collection to organize listings'
            }
          </p>
          {!searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Collection
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections.map((collection: Collection) => (
            <Card key={collection.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{collection.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{collection.directoryName}</Badge>
                      {getSyncStatusBadge(collection.syncStatus, collection.syncError)}
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
                        onClick={() => handleDeleteCollection(collection.id)}
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
                {collection.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {collection.description}
                  </p>
                )}

                {collection.syncError && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                    <p className="text-red-600 text-xs">
                      Sync Error: {collection.syncError}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>
                    {collection.ghlCollectionId && (
                      <span className="text-green-600">GoHighLevel ID: {collection.ghlCollectionId}</span>
                    )}
                  </div>
                  <div>
                    {format(new Date(collection.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Collection Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <CreateCollectionForm
              onSubmit={handleCreateCollection}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={!!editingCollection} onOpenChange={() => setEditingCollection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Collection</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {editingCollection && (
              <CreateCollectionForm
                collection={editingCollection}
                onSubmit={handleUpdateCollection}
                onCancel={() => setEditingCollection(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}