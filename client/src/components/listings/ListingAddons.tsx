import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ListingAddon } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown } from "lucide-react";

// Available addon types
const ADDON_TYPES = [
  { id: "expanded_description", name: "Expanded Description", description: "Additional detailed description content" },
  { id: "map", name: "Location Map", description: "Map showing the business location" },
  { id: "product_specs", name: "Product Specifications", description: "Technical details and specifications" },
  { id: "testimonials", name: "Testimonials", description: "Customer reviews and testimonials" },
  { id: "contact_info", name: "Contact Information", description: "Additional contact details" },
  { id: "hours", name: "Business Hours", description: "Operating hours and availability" },
  { id: "gallery", name: "Image Gallery", description: "Multiple images in gallery format" }
];

interface ListingAddonsProps {
  listingId: number;
}

export default function ListingAddons({ listingId }: ListingAddonsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentAddon, setCurrentAddon] = useState<ListingAddon | null>(null);
  const [newAddonType, setNewAddonType] = useState("");
  const [newAddonTitle, setNewAddonTitle] = useState("");
  const [newAddonContent, setNewAddonContent] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const { toast } = useToast();
  
  // Fetch listing addons
  const { data: addons, isLoading, error } = useQuery<ListingAddon[]>({
    queryKey: ['/api/listing-addons/listing', listingId],
    queryFn: () => apiRequest(`/api/listing-addons/listing/${listingId}`),
    enabled: !!listingId,
  });
  
  // Create listing addon mutation
  const createAddonMutation = useMutation({
    mutationFn: (newAddon: any) => 
      apiRequest('/api/listing-addons', {
        method: 'POST',
        data: newAddon
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-addons/listing', listingId] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success!",
        description: "Addon created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating addon:", error);
      toast({
        title: "Error!",
        description: "Failed to create addon. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Update listing addon mutation
  const updateAddonMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/listing-addons/${id}`, {
        method: 'PATCH',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-addons/listing', listingId] });
      setIsEditDialogOpen(false);
      setCurrentAddon(null);
      toast({
        title: "Success!",
        description: "Addon updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error updating addon:", error);
      toast({
        title: "Error!",
        description: "Failed to update addon. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Delete listing addon mutation
  const deleteAddonMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/listing-addons/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-addons/listing', listingId] });
      toast({
        title: "Success!",
        description: "Addon deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Error deleting addon:", error);
      toast({
        title: "Error!",
        description: "Failed to delete addon. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Update display order mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/listing-addons/${id}`, {
        method: 'PATCH',
        data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/listing-addons/listing', listingId] });
    }
  });
  
  const handleCreateAddon = () => {
    if (!newAddonType) {
      toast({
        title: "Error!",
        description: "Please select an addon type.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new addon
    createAddonMutation.mutate({
      listingId,
      type: newAddonType,
      title: newAddonTitle,
      content: newAddonContent,
      enabled: true,
      displayOrder: (addons?.length || 0) + 1
    });
  };
  
  const handleEditAddon = () => {
    if (!currentAddon) return;
    
    updateAddonMutation.mutate({
      id: currentAddon.id,
      data: {
        title: currentAddon.title,
        content: currentAddon.content,
        enabled: currentAddon.enabled
      }
    });
  };
  
  const handleDeleteAddon = (id: number) => {
    if (window.confirm("Are you sure you want to delete this addon?")) {
      deleteAddonMutation.mutate(id);
    }
  };
  
  const handleMoveUp = (addon: ListingAddon, index: number) => {
    if (index === 0) return;
    
    const prevAddon = addons?.[index - 1];
    if (!prevAddon) return;
    
    updateOrderMutation.mutate({
      id: addon.id,
      data: { displayOrder: addon.displayOrder! - 1 }
    });
    
    updateOrderMutation.mutate({
      id: prevAddon.id,
      data: { displayOrder: prevAddon.displayOrder! + 1 }
    });
  };
  
  const handleMoveDown = (addon: ListingAddon, index: number) => {
    if (!addons || index >= addons.length - 1) return;
    
    const nextAddon = addons[index + 1];
    if (!nextAddon) return;
    
    updateOrderMutation.mutate({
      id: addon.id,
      data: { displayOrder: addon.displayOrder! + 1 }
    });
    
    updateOrderMutation.mutate({
      id: nextAddon.id,
      data: { displayOrder: nextAddon.displayOrder! - 1 }
    });
  };
  
  const handleToggleStatus = (addon: ListingAddon) => {
    updateAddonMutation.mutate({
      id: addon.id,
      data: { enabled: !addon.enabled }
    });
  };
  
  const resetForm = () => {
    setNewAddonType("");
    setNewAddonTitle("");
    setNewAddonContent("");
  };
  
  const getFilteredAddons = () => {
    if (!addons) return [];
    
    if (activeTab === "all") {
      return addons;
    }
    
    return addons.filter(addon => addon.type === activeTab);
  };
  
  const getAddonTypeName = (type: string) => {
    const addonType = ADDON_TYPES.find(t => t.id === type);
    return addonType ? addonType.name : type;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Listing Addons</h3>
          <p className="text-sm text-slate-500">Manage additional content for this listing</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Add Addon</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Addon</DialogTitle>
              <DialogDescription>
                Create a new content addon for this listing.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="addon-type">Addon Type</Label>
                <Select value={newAddonType} onValueChange={setNewAddonType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select addon type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDON_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  {ADDON_TYPES.find(t => t.id === newAddonType)?.description || "Select an addon type to see description"}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="addon-title">Title</Label>
                <Input
                  id="addon-title"
                  value={newAddonTitle}
                  onChange={(e) => setNewAddonTitle(e.target.value)}
                  placeholder="Enter a title for this addon"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="addon-content">Content</Label>
                <Textarea
                  id="addon-content"
                  value={newAddonContent}
                  onChange={(e) => setNewAddonContent(e.target.value)}
                  placeholder="Enter the content for this addon"
                  rows={5}
                />
                <p className="text-xs text-slate-500">
                  Supports plain text or HTML content depending on the addon type
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateAddon}
                disabled={createAddonMutation.isPending}
              >
                {createAddonMutation.isPending ? "Creating..." : "Create Addon"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Addons</TabsTrigger>
          {ADDON_TYPES.map(type => (
            <TabsTrigger key={type.id} value={type.id}>
              {type.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading addons...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading addons. Please try again.</p>
            </div>
          ) : getFilteredAddons().length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-slate-50">
              <p className="text-slate-500">No addons found. Click "Add Addon" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredAddons().map((addon, index) => (
                <Card key={addon.id} className={!addon.enabled ? "opacity-70" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{addon.title || getAddonTypeName(addon.type)}</CardTitle>
                        <CardDescription>
                          Type: {getAddonTypeName(addon.type)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`addon-status-${addon.id}`} className="text-xs">
                            {addon.enabled ? "Enabled" : "Disabled"}
                          </Label>
                          <Switch 
                            id={`addon-status-${addon.id}`}
                            checked={addon.enabled}
                            onCheckedChange={() => handleToggleStatus(addon)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="text-sm">
                      {addon.content ? (
                        <div className="max-h-24 overflow-y-auto text-slate-700 border p-2 rounded-md bg-slate-50">
                          {addon.content}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">No content added</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleMoveUp(addon, index)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleMoveDown(addon, index)}
                        disabled={!addons || index >= addons.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={isEditDialogOpen && currentAddon?.id === addon.id} onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setCurrentAddon(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1"
                            onClick={() => setCurrentAddon(addon)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Addon</DialogTitle>
                            <DialogDescription>
                              Update the information for this addon.
                            </DialogDescription>
                          </DialogHeader>
                          
                          {currentAddon && (
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-addon-type">Addon Type</Label>
                                <Input
                                  id="edit-addon-type"
                                  value={getAddonTypeName(currentAddon.type)}
                                  disabled
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-addon-title">Title</Label>
                                <Input
                                  id="edit-addon-title"
                                  value={currentAddon.title || ""}
                                  onChange={(e) => setCurrentAddon({
                                    ...currentAddon,
                                    title: e.target.value
                                  })}
                                  placeholder="Enter a title for this addon"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="edit-addon-content">Content</Label>
                                <Textarea
                                  id="edit-addon-content"
                                  value={currentAddon.content || ""}
                                  onChange={(e) => setCurrentAddon({
                                    ...currentAddon,
                                    content: e.target.value
                                  })}
                                  placeholder="Enter the content for this addon"
                                  rows={5}
                                />
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id="edit-addon-enabled"
                                  checked={currentAddon.enabled}
                                  onCheckedChange={(checked) => setCurrentAddon({
                                    ...currentAddon,
                                    enabled: checked
                                  })}
                                />
                                <Label htmlFor="edit-addon-enabled">Enabled</Label>
                              </div>
                            </div>
                          )}
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleEditAddon}
                              disabled={updateAddonMutation.isPending}
                              className="gap-2"
                            >
                              {updateAddonMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500"
                        onClick={() => handleDeleteAddon(addon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}