import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { PlusCircle, X, Edit, Trash2 } from "lucide-react";

// Collection type definition
export interface Collection {
  id: string;
  name: string;
  slug: string;
  image: string;
  seo: {
    title: string;
    description: string;
  };
}

interface CollectionManagerProps {
  collections: Collection[];
  onChange: (collections: Collection[]) => void;
}

export function CollectionManager({ collections, onChange }: CollectionManagerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCollection, setCurrentCollection] = useState<Collection>({
    id: "",
    name: "",
    slug: "",
    image: "",
    seo: {
      title: "",
      description: "",
    }
  });

  // Reset form on close
  const resetForm = () => {
    setCurrentCollection({
      id: "",
      name: "",
      slug: "",
      image: "",
      seo: {
        title: "",
        description: "",
      }
    });
    setIsEditing(false);
  };

  // Open dialog for new collection
  const handleAddClick = () => {
    resetForm();
    setIsOpen(true);
  };

  // Open dialog for editing
  const handleEditClick = (collection: Collection) => {
    setCurrentCollection({ ...collection });
    setIsEditing(true);
    setIsOpen(true);
  };

  // Handle delete confirmation dialog
  const handleDeleteClick = (id: string) => {
    setCollectionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (collectionToDelete) {
      const newCollections = collections.filter(c => c.id !== collectionToDelete);
      onChange(newCollections);
      toast({
        title: "Collection Deleted",
        description: "The collection has been removed"
      });
    }
    setIsDeleteDialogOpen(false);
    setCollectionToDelete(null);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!currentCollection.name) {
      toast({
        title: "Required Field Missing",
        description: "Please provide a collection name",
        variant: "destructive",
      });
      return;
    }
    
    // Clone collections array
    let newCollections = [...collections];
    
    if (isEditing) {
      // Find and update existing collection
      const index = newCollections.findIndex(c => c.id === currentCollection.id);
      if (index !== -1) {
        newCollections[index] = currentCollection;
      }
    } else {
      // Add new collection
      newCollections.push({
        ...currentCollection,
        id: uuidv4(), // Generate new ID
      });
    }
    
    // Update parent component
    onChange(newCollections);
    
    // Close dialog
    setIsOpen(false);
    resetForm();
    
    // Show success toast
    toast({
      title: isEditing ? "Collection Updated" : "Collection Added",
      description: isEditing
        ? "Your collection has been updated"
        : "Your new collection has been added"
    });
  };

  // Generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    
    setCurrentCollection({
      ...currentCollection,
      name,
      slug,
      seo: {
        ...currentCollection.seo,
        title: currentCollection.seo.title || name, // Default SEO title to name if empty
      }
    });
  };

  // Handle dummy image upload
  const handleImageUpload = () => {
    // In a real implementation, this would handle the file upload
    // For now, just set a placeholder image
    setCurrentCollection({
      ...currentCollection,
      image: "https://via.placeholder.com/150",
    });
    
    toast({
      title: "Image Uploaded",
      description: "Your image has been uploaded successfully"
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Collections</h3>
      <p className="text-sm text-slate-500">
        Create collections to organize your directory listings
      </p>
      
      {/* Collection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="border rounded-md overflow-hidden bg-white shadow-sm"
          >
            <div className="relative h-32">
              <img
                src={collection.image || "https://via.placeholder.com/150"}
                alt={collection.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-white/80 rounded-full hover:bg-white"
                  onClick={() => handleEditClick(collection)}
                >
                  <Edit size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-white/80 rounded-full hover:bg-white text-red-500 hover:text-red-600"
                  onClick={() => handleDeleteClick(collection.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <div className="p-3">
              <h4 className="font-medium truncate">{collection.name}</h4>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {collection.seo.description || "No description"}
              </p>
            </div>
          </div>
        ))}
        
        {/* Add New Collection Card */}
        <div
          className="border border-dashed rounded-md overflow-hidden flex items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer h-[168px]"
          onClick={handleAddClick}
        >
          <div className="text-center p-6">
            <PlusCircle className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">Add Collection</p>
          </div>
        </div>
      </div>
      
      {/* Add/Edit Collection Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Collection" : "Add New Collection"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your collection details below"
                : "Fill in the details to create a new collection"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Collection Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Collection Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  placeholder="e.g. Featured Products, New Arrivals"
                  value={currentCollection.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              
              {/* Collection Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="auto-generated-slug"
                  value={currentCollection.slug}
                  onChange={(e) =>
                    setCurrentCollection({
                      ...currentCollection,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, ""),
                    })
                  }
                />
                <p className="text-xs text-slate-500">
                  Used in URL paths, auto-generated from name
                </p>
              </div>
              
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Collection Image</Label>
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 relative rounded overflow-hidden border">
                    {currentCollection.image ? (
                      <img
                        src={currentCollection.image}
                        alt="Collection thumbnail"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-slate-100 flex items-center justify-center">
                        <span className="text-xs text-slate-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleImageUpload}
                  >
                    Upload Image
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Recommended: 600x400px, JPG or PNG
                </p>
              </div>
              
              {/* SEO Title */}
              <div className="space-y-2">
                <Label htmlFor="seo-title">SEO Title</Label>
                <Input
                  id="seo-title"
                  placeholder="Auto-filled from name"
                  value={currentCollection.seo.title}
                  onChange={(e) =>
                    setCurrentCollection({
                      ...currentCollection,
                      seo: {
                        ...currentCollection.seo,
                        title: e.target.value,
                      },
                    })
                  }
                />
              </div>
              
              {/* SEO Description */}
              <div className="space-y-2">
                <Label htmlFor="seo-description">SEO Description</Label>
                <Textarea
                  id="seo-description"
                  placeholder="Enter a description for search engines"
                  className="h-20"
                  value={currentCollection.seo.description}
                  onChange={(e) =>
                    setCurrentCollection({
                      ...currentCollection,
                      seo: {
                        ...currentCollection.seo,
                        description: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save Collection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this collection. Any associated
              listings will no longer be grouped together.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}