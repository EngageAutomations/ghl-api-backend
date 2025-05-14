import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Listing } from "@shared/schema";

// Categories for business listings
const BUSINESS_CATEGORIES = [
  "Healthcare",
  "Home & Garden",
  "Technology",
  "Health & Fitness",
  "Food & Beverage",
  "Education",
  "Finance",
  "Professional Services",
  "Entertainment",
  "Automotive",
  "Retail",
  "Real Estate",
  "Travel",
  "Manufacturing",
  "Other"
];

// Extended validation schema based on InsertListing
const formSchema = z.object({
  title: z.string().min(3, "Business name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  category: z.string().nonempty("Please select a category"),
  location: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().optional(),
  downloadUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  popupUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  embedFormUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal(""))
});

type FormValues = z.infer<typeof formSchema>;

interface ListingFormProps {
  initialData?: Partial<FormValues>;
  onSuccess?: () => void;
  isEditing?: boolean;
}

export default function ListingForm({ initialData, onSuccess, isEditing = false }: ListingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Initialize form with default values or provided data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      category: initialData?.category || "",
      location: initialData?.location || "",
      description: initialData?.description || "",
      price: initialData?.price || "",
      downloadUrl: initialData?.downloadUrl || "",
      popupUrl: initialData?.popupUrl || "",
      embedFormUrl: initialData?.embedFormUrl || "",
      imageUrl: initialData?.imageUrl || ""
    }
  });
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // If we're editing, send PATCH request with the listing ID
      if (isEditing && initialData && 'id' in initialData) {
        const listingId = (initialData as Listing).id;
        await apiRequest(`/api/listings/id/${listingId}`, {
          method: 'PATCH',
          data
        });
        
        toast({
          title: "Success!",
          description: "Listing updated successfully.",
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/listings/user/1'] });
        queryClient.invalidateQueries({ queryKey: [`/api/listings/id/${listingId}`] });
      } else {
        // Otherwise, create a new listing
        await apiRequest('/api/listings', {
          method: 'POST',
          data: {
            ...data,
            userId: 1 // Using a default user ID for now
          }
        });
        
        toast({
          title: "Success!",
          description: "New listing created successfully.",
        });
        
        // Invalidate queries to refresh listings data
        queryClient.invalidateQueries({ queryKey: ['/api/listings/user/1'] });
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior is to navigate back to listings
        navigate("/listings");
      }
    } catch (error) {
      console.error("Error saving listing:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} listing. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Auto-generate a slug from the title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("title", value);
    
    // Only auto-generate slug if it's a new listing or slug field is empty
    if (!isEditing || !form.getValues("slug")) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      
      form.setValue("slug", slug);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter business name" 
                      {...field} 
                      onChange={handleTitleChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Slug */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="unique-identifier" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="City, State or Country" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. $99, Free, etc." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a detailed description" 
                      className="h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Image URL */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/image.jpg" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Download URL */}
            <FormField
              control={form.control}
              name="downloadUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Download URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/download" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Popup URL */}
            <FormField
              control={form.control}
              name="popupUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Popup Form URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/popup-form" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Embed Form URL */}
            <FormField
              control={form.control}
              name="embedFormUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Embedded Form URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/embed-form" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/listings")}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update Listing" : "Create Listing"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}