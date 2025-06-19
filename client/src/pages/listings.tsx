import { useState } from "react";
import { ConfigCard } from "@/components/ui/config-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Listing } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Edit, Trash, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Enhanced listing type with status and analytics
type EnhancedListing = Listing & {
  status: string;
  views: number;
  optIns: number;
};

export default function Listings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch listings data
  const { isLoading, error, data: fetchedListings } = useQuery({
    queryKey: ['/api/listings/user/1'], // Default to user ID 1 for now
  });
  
  // Convert fetched listings to enhanced listings with status and analytics data
  const listings: EnhancedListing[] = Array.isArray(fetchedListings) 
    ? fetchedListings.map((listing: Listing) => {
        // In a real app, these would come from actual analytics data
        return {
          ...listing,
          status: Math.random() > 0.2 ? "Active" : "Inactive", // Just for demo
          views: Math.floor(Math.random() * 2000) + 100, // Random view count
          optIns: Math.floor(Math.random() * 200) + 10, // Random opt-in count
        };
      })
    : [];
    
  // Handle listing deletion
  const handleDeleteListing = async (id: number) => {
    setIsDeleting(true);
    
    try {
      await apiRequest(`/api/listings/id/${id}`, {
        method: 'DELETE'
      });
      
      // Invalidate listings query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/listings/user/1'] });
      
      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast({
        title: "Error",
        description: "Failed to delete listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setListingToDelete(null);
    }
  };
  
  // Filter listings based on search term and active tab
  const filteredListings = listings.filter(listing => {
    const matchesSearch = 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.category?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && listing.status === "Active";
    if (activeTab === "inactive") return matchesSearch && listing.status === "Inactive";
    
    return matchesSearch;
  });
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Business Listings</h1>
          <p className="text-slate-500">Manage your business directory listings</p>
        </div>
        <Button className="flex items-center gap-1" onClick={() => navigate("/create-listing")}>
          <Plus className="h-4 w-4" />
          <span>Add New Listing</span>
        </Button>
      </div>
      
      <ConfigCard 
        title="Listings Management" 
        description="View and manage all your business listings in one place"
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search listings..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="all">All Listings</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Opt-Ins</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-red-500">
                      Error loading listings. Please try again.
                    </TableCell>
                  </TableRow>
                ) : filteredListings.length > 0 ? (
                  filteredListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.title}</TableCell>
                      <TableCell>{listing.category || 'Uncategorized'}</TableCell>
                      <TableCell className="text-right">{listing.views.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{listing.optIns.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          listing.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {listing.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/edit-listing/${listing.id}`)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => {
                                setListingToDelete(listing.id);
                                if (window.confirm(`Are you sure you want to delete "${listing.title}"? This action cannot be undone.`)) {
                                  handleDeleteListing(listing.id);
                                }
                              }}
                              disabled={isDeleting && listingToDelete === listing.id}
                            >
                              {isDeleting && listingToDelete === listing.id ? (
                                <span className="mr-2 h-4 w-4 border-2 border-t-transparent border-red-600 rounded-full animate-spin" />
                              ) : (
                                <Trash className="mr-2 h-4 w-4" />
                              )}
                              {isDeleting && listingToDelete === listing.id ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No listings found. {searchTerm ? 'Try a different search term.' : 'Create your first listing!'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </ConfigCard>
    </div>
  );
}