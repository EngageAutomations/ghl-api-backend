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
import { useNavigate } from "wouter";
import { InsertListing } from "@shared/schema";

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
  const navigate = useNavigate();
  
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
  
  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    // Only auto-generate slug if it's empty or matches the previous auto-generated value
    if (!form.getValues("slug") || isEditing === false) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "") // Remove invalid chars
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/-+/g, "-"); // Replace multiple - with single -
      
      form.setValue("slug", slug);
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Determine if this is a create or update operation
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing 
        ? `/api/listings/${initialData?.id}` 
        : "/api/listings";
      
      // Make API request to create/update listing
      const response = await apiRequest({
        url,
        method,
        data: values
      });
      
      toast({
        title: isEditing ? "Listing updated!" : "Listing created!",
        description: isEditing 
          ? "Your listing has been successfully updated." 
          : "Your new listing has been successfully created."
      });
      
      // Navigate or callback
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/listings");
      }
    } catch (error) {
      console.error("Error submitting listing:", error);
      toast({
        title: "Error",
        description: "There was a problem saving your listing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          {/* Business Name */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter business name" 
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleTitleChange(e.target.value);
                    }}
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
                <FormLabel>URL Slug</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="business-name" 
                    {...field}
                  />
                </FormControl>
                <p className="text-sm text-slate-500">
                  This will be used in the URL: directory.com/listings/{field.value || "business-name"}
                </p>
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
                <FormLabel>Category</FormLabel>
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
                    placeholder="City, State (optional)" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the business..." 
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Price Info */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Information</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Starting at $99, Free consultation, etc. (optional)" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Contact & Opt-in Links */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium">Opt-in Links & URLs</h3>
          <p className="text-sm text-slate-500">
            These URLs will be used for your listing's action buttons and opt-in forms
          </p>
          
          {/* Download URL */}
          <FormField
            control={form.control}
            name="downloadUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Download URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/download.pdf (optional)" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <p className="text-xs text-slate-500">
                  Direct link to a downloadable file (PDF, brochure, etc.)
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Popup Form URL */}
          <FormField
            control={form.control}
            name="popupUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Popup Form URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://forms.gohighlevel.com/yourform (optional)" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <p className="text-xs text-slate-500">
                  URL to a Go HighLevel form that will open in a popup when clicked
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Embedded Form URL */}
          <FormField
            control={form.control}
            name="embedFormUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Embedded Form URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://forms.gohighlevel.com/yourform (optional)" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <p className="text-xs text-slate-500">
                  URL to a Go HighLevel form that will be embedded on the listing page
                </p>
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
                    placeholder="https://example.com/image.jpg (optional)" 
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <p className="text-xs text-slate-500">
                  URL to a business logo or image
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Form Actions */}
        <div className="pt-4 flex justify-end">
          <Button 
            variant="outline" 
            type="button" 
            className="mr-2"
            onClick={() => navigate("/listings")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update Listing" : "Create Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
}