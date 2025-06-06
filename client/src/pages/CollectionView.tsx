import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, Plus, Grid3X3, List, Search, Filter, SortAsc } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ViewMode = 'grid' | 'list';
type FilterOption = 'all' | 'active' | 'draft';
type SortOption = 'newest' | 'oldest' | 'title' | 'price';

export default function CollectionView() {
  const { collectionId } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Fetch collection details
  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ['/api/collections', collectionId],
    enabled: !!collectionId
  });

  // Fetch collection items (products in this collection)
  const { data: collectionItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['/api/collections', collectionId, 'items'],
    enabled: !!collectionId
  });

  if (!collectionId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Collection not found</p>
        <Link href="/collections">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Button>
        </Link>
      </div>
    );
  }

  if (collectionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
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

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Collection not found</p>
        <Link href="/collections">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Collections
          </Button>
        </Link>
      </div>
    );
  }

  // Filter and sort items
  const filteredItems = collectionItems.filter((item: any) => {
    const matchesSearch = !searchQuery || 
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'active' && item.isActive) ||
      (filterBy === 'draft' && !item.isActive);
    
    return matchesSearch && matchesFilter;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'price':
        const aPrice = parseFloat(a.price?.replace(/[^0-9.-]+/g, '') || '0');
        const bPrice = parseFloat(b.price?.replace(/[^0-9.-]+/g, '') || '0');
        return bPrice - aPrice;
      default: // newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/directories/${collection?.directoryName}?tab=collections`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Directory
            </Button>
          </Link>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{collection.name}</h1>
            {collection.description && (
              <p className="text-gray-600 mt-2">{collection.description}</p>
            )}
          </div>

          <Badge variant={collection.isActive ? 'default' : 'secondary'}>
            {collection.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Collection metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">Directory</div>
            <div className="font-medium">{collection.directoryName}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Items</div>
            <div className="font-medium">{collectionItems.length} products</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Sync Status</div>
            <Badge variant={collection.syncStatus === 'synced' ? 'default' : 'secondary'}>
              {collection.syncStatus || 'pending'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter */}
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

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="price">Price</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Results */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Showing {sortedItems.length} of {collectionItems.length} products
        </p>
      </div>

      {/* Content */}
      {itemsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Package className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterBy !== 'all' ? 'No products found' : 'No products in this collection'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterBy !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Add products to this collection to get started'
            }
          </p>
          <Link href={`/directories/${collection.directoryName}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Products to Collection
            </Button>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-0">
                {item.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
                {item.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  {item.price && (
                    <span className="font-medium text-lg text-green-600">{item.price}</span>
                  )}
                  <Badge variant={item.isActive ? 'default' : 'secondary'}>
                    {item.isActive ? 'Active' : 'Draft'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item: any) => (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {item.imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1 truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {item.category && <span>{item.category}</span>}
                      {item.location && <span>{item.location}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {item.price && (
                      <span className="font-medium text-lg text-green-600">{item.price}</span>
                    )}
                    <Badge variant={item.isActive ? 'default' : 'secondary'}>
                      {item.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}