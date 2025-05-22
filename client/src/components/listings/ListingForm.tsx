import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
  directoryName: z.string().min(1, "Directory name is required").optional().or(z.literal("")),
  category: z.string().nonempty("Please select a category"),
  location: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().optional(),
  // Action button URLs (configurable based on type)
  downloadUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  popupUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  embedFormUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  
  // Extended description (rich text content)
  extendedDescription: z.string().optional(),
  
  // Google Maps integration
  address: z.string().optional(),
  
  // Metadata fields (up to 5)
  metadataField1: z.string().optional(),
  metadataField2: z.string().optional(),
  metadataField3: z.string().optional(),
  metadataField4: z.string().optional(),
  metadataField5: z.string().optional(),
  
  // Additional configuration options from wizard
  actionButtonType: z.string().optional(), // popup, link, download
  showMap: z.boolean().optional(),
  showExpandedDescription: z.boolean().optional(),
  enableMetadata: z.boolean().optional(),
  metadataCount: z.number().min(0).max(5).optional()
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
  
  // Get default configuration for dynamic form fields
  const [config, setConfig] = useState({
    actionButtonType: initialData?.actionButtonType || "popup",
    showMap: initialData?.showMap || false,
    showExpandedDescription: initialData?.showExpandedDescription || false,
    enableMetadata: initialData?.enableMetadata || false,
    metadataCount: initialData?.metadataCount || 0,
    metadataLabels: [
      "Feature 1",
      "Feature 2", 
      "Feature 3",
      "Feature 4",
      "Feature 5"
    ]
  });
  
  // Custom hook to fetch config from the database
  useEffect(() => {
    // This would typically fetch from the API, but for now we'll use mock data
    // In a real implementation, you would fetch the config based on the user's settings
    const fetchConfig = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // For demo purposes, we'll set some default values
        // In reality, this would come from the database
        setConfig({
          actionButtonType: "popup", // popup, link, download
          showMap: true,
          showExpandedDescription: true,
          enableMetadata: true,
          metadataCount: 3,
          metadataLabels: [
            "Business Hours", 
            "Contact Email",
            "Phone Number",
            "Website URL",
            "Social Media"
          ]
        });
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };
    
    fetchConfig();
  }, []);
  
  // Initialize form with default values or provided data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      directoryName: initialData?.directoryName || "",
      category: initialData?.category || "",
      location: initialData?.location || "",
      description: initialData?.description || "",
      price: initialData?.price || "",
      downloadUrl: initialData?.downloadUrl || "",
      popupUrl: initialData?.popupUrl || "",
      embedFormUrl: initialData?.embedFormUrl || "",
      imageUrl: initialData?.imageUrl || "",
      
      // New fields from dynamic config
      extendedDescription: initialData?.extendedDescription || "",
      address: initialData?.address || "",
      metadataField1: initialData?.metadataField1 || "",
      metadataField2: initialData?.metadataField2 || "",
      metadataField3: initialData?.metadataField3 || "",
      metadataField4: initialData?.metadataField4 || "",
      metadataField5: initialData?.metadataField5 || "",
      
      // Configuration options
      actionButtonType: initialData?.actionButtonType || config.actionButtonType,
      showMap: initialData?.showMap || config.showMap,
      showExpandedDescription: initialData?.showExpandedDescription || config.showExpandedDescription,
      enableMetadata: initialData?.enableMetadata || config.enableMetadata,
      metadataCount: initialData?.metadataCount || config.metadataCount
    }
  });
  
  // Toggle action button type
  const handleActionButtonTypeChange = (type: string) => {
    setConfig({
      ...config,
      actionButtonType: type
    });
    
    form.setValue("actionButtonType", type);
  };
  
  // Save metadata as addons to the listing
  const saveMetadataAddons = async (listingId: number, data: FormValues) => {
    if (!config.enableMetadata || config.metadataCount <= 0) return;
    
    try {
      // Create array of metadata values to save
      const metadataValues = [];
      
      if (config.metadataCount >= 1 && data.metadataField1) {
        metadataValues.push({
          listingId,
          type: "metadata",
          title: config.metadataLabels[0],
          content: data.metadataField1,
          displayOrder: 0
        });
      }
      
      if (config.metadataCount >= 2 && data.metadataField2) {
        metadataValues.push({
          listingId,
          type: "metadata",
          title: config.metadataLabels[1],
          content: data.metadataField2,
          displayOrder: 1
        });
      }
      
      if (config.metadataCount >= 3 && data.metadataField3) {
        metadataValues.push({
          listingId,
          type: "metadata",
          title: config.metadataLabels[2],
          content: data.metadataField3,
          displayOrder: 2
        });
      }
      
      if (config.metadataCount >= 4 && data.metadataField4) {
        metadataValues.push({
          listingId,
          type: "metadata",
          title: config.metadataLabels[3],
          content: data.metadataField4,
          displayOrder: 3
        });
      }
      
      if (config.metadataCount >= 5 && data.metadataField5) {
        metadataValues.push({
          listingId,
          type: "metadata",
          title: config.metadataLabels[4],
          content: data.metadataField5,
          displayOrder: 4
        });
      }
      
      // Save expanded description as an addon if provided
      if (config.showExpandedDescription && data.extendedDescription) {
        metadataValues.push({
          listingId,
          type: "expanded_description",
          title: "Extended Description",
          content: data.extendedDescription,
          displayOrder: 10 // Lower priority than metadata
        });
      }
      
      // Save address as map addon if provided
      if (config.showMap && data.address) {
        metadataValues.push({
          listingId,
          type: "map",
          title: "Location",
          content: data.address,
          displayOrder: 20 // Lower priority than extended description
        });
      }
      
      // No need to continue if no metadata to save
      if (metadataValues.length === 0) return;
      
      // Save all metadata items in a batch
      await apiRequest('/api/listing-addons/batch', {
        method: 'POST',
        data: {
          addons: metadataValues
        }
      });
      
      console.log('Metadata saved successfully');
    } catch (error) {
      console.error('Error saving metadata:', error);
      // Don't throw the error; we still want to complete the form submission
      toast({
        title: "Warning",
        description: "Listing saved but there was an issue saving metadata.",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Prepare listing data (excluding metadata fields that aren't part of the listing schema)
      const listingData = {
        title: data.title,
        slug: data.slug,
        directoryName: data.directoryName,
        category: data.category,
        location: data.location,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        
        // Only include the URL that matches the selected action button type
        downloadUrl: config.actionButtonType === 'download' ? data.downloadUrl : '',
        popupUrl: config.actionButtonType === 'popup' ? data.popupUrl : '',
        embedFormUrl: data.embedFormUrl
      };
      
      let listingId: number;
      
      // If we're editing, send PATCH request with the listing ID
      if (isEditing && initialData && 'id' in initialData) {
        listingId = (initialData as Listing).id;
        await apiRequest(`/api/listings/id/${listingId}`, {
          method: 'PATCH',
          data: listingData
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
        const response = await apiRequest('/api/listings', {
          method: 'POST',
          data: {
            ...listingData,
            userId: 1 // Using a default user ID for now
          }
        });
        
        // Get the created listing data from the response
        const responseData = await response.json();
        
        // Ensure we have a valid listing ID
        if (!responseData || !responseData.id) {
          throw new Error("Failed to get listing ID from API response");
        }
        
        listingId = responseData.id;
        
        toast({
          title: "Success!",
          description: "New listing created successfully.",
        });
        
        // Invalidate queries to refresh listings data
        queryClient.invalidateQueries({ queryKey: ['/api/listings/user/1'] });
      }
      
      // Save metadata and other addons
      await saveMetadataAddons(listingId, data);
      
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
            
            {/* Directory Name */}
            <FormField
              control={form.control}
              name="directoryName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Directory Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter directory name for code storage" 
                      {...field} 
                    />
                  </FormControl>
                  <div className="text-xs text-slate-500 mt-1">
                    This field is used to identify the directory where this listing's code will be stored
                  </div>
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
            {/* Action Button Type Selector */}
            <div className="p-4 border rounded-md bg-slate-50">
              <h3 className="font-medium mb-3">Action Button Type</h3>
              <div className="flex space-x-3">
                <Button 
                  type="button"
                  variant={config.actionButtonType === "popup" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleActionButtonTypeChange("popup")}
                >
                  Popup Form
                </Button>
                <Button 
                  type="button"
                  variant={config.actionButtonType === "link" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleActionButtonTypeChange("link")}
                >
                  External Link
                </Button>
                <Button 
                  type="button"
                  variant={config.actionButtonType === "download" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handleActionButtonTypeChange("download")}
                >
                  Download
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Select which type of action this listing will use
              </p>
            </div>
            
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
            
            {/* Dynamic field: Extended Description (Rich Text) */}
            {config.showExpandedDescription && (
              <FormField
                control={form.control}
                name="extendedDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extended Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter an expanded description with additional details" 
                        className="h-36"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This rich text field supports basic HTML formatting for enhanced product descriptions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Dynamic field: Google Maps Address */}
            {config.showMap && (
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address (for Map)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main St, City, State, Zip" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a full address to display on Google Maps
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Dynamic Action Button URLs - based on config.actionButtonType */}
            {config.actionButtonType === "download" && (
              <FormField
                control={form.control}
                name="downloadUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Download File URL <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/download" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Direct link to downloadable file (PDF, ZIP, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {config.actionButtonType === "popup" && (
              <FormField
                control={form.control}
                name="popupUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Popup Form URL <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://forms.gohighlevel.com/your-form" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      GoHighLevel form URL that will open in a popup window
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {config.actionButtonType === "link" && (
              <FormField
                control={form.control}
                name="popupUrl" // Reusing popupUrl field for external links
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External Link URL <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/your-landing-page" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      External website URL that will open in a new browser tab
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Embed Form URL - always shown as an option */}
            <FormField
              control={form.control}
              name="embedFormUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Embedded Form URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://forms.gohighlevel.com/embed-form" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    URL for a GoHighLevel form that can be embedded directly in the listing page
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Dynamic fields: Metadata Fields (based on config.enableMetadata and config.metadataCount) */}
            {config.enableMetadata && config.metadataCount > 0 && (
              <div className="space-y-4 border rounded-md p-4 bg-slate-50">
                <h3 className="font-medium text-sm">Listing Metadata</h3>
                
                {/* Metadata Field 1 */}
                {config.metadataCount >= 1 && (
                  <FormField
                    control={form.control}
                    name="metadataField1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{config.metadataLabels[0]}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={`Enter ${config.metadataLabels[0]}`} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Metadata Field 2 */}
                {config.metadataCount >= 2 && (
                  <FormField
                    control={form.control}
                    name="metadataField2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{config.metadataLabels[1]}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={`Enter ${config.metadataLabels[1]}`} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Metadata Field 3 */}
                {config.metadataCount >= 3 && (
                  <FormField
                    control={form.control}
                    name="metadataField3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{config.metadataLabels[2]}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={`Enter ${config.metadataLabels[2]}`} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Metadata Field 4 */}
                {config.metadataCount >= 4 && (
                  <FormField
                    control={form.control}
                    name="metadataField4"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{config.metadataLabels[3]}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={`Enter ${config.metadataLabels[3]}`} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Metadata Field 5 */}
                {config.metadataCount >= 5 && (
                  <FormField
                    control={form.control}
                    name="metadataField5"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{config.metadataLabels[4]}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={`Enter ${config.metadataLabels[4]}`} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Configuration Summary */}
        <div className="border rounded-md p-4 mb-6 bg-slate-50">
          <h3 className="font-medium mb-2">Directory Configuration Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center">
              <span className={`inline-block w-4 h-4 rounded-full mr-2 ${config.actionButtonType ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Action Button: <strong>{config.actionButtonType === 'popup' ? 'Popup Form' : config.actionButtonType === 'link' ? 'External Link' : config.actionButtonType === 'download' ? 'Download File' : 'None'}</strong></span>
            </div>
            <div className="flex items-center">
              <span className={`inline-block w-4 h-4 rounded-full mr-2 ${config.showExpandedDescription ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Extended Description: <strong>{config.showExpandedDescription ? 'Enabled' : 'Disabled'}</strong></span>
            </div>
            <div className="flex items-center">
              <span className={`inline-block w-4 h-4 rounded-full mr-2 ${config.showMap ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Google Maps Integration: <strong>{config.showMap ? 'Enabled' : 'Disabled'}</strong></span>
            </div>
            <div className="flex items-center">
              <span className={`inline-block w-4 h-4 rounded-full mr-2 ${config.enableMetadata ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              <span>Metadata Fields: <strong>{config.enableMetadata ? `${config.metadataCount} fields enabled` : 'Disabled'}</strong></span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            These options are configured in your directory settings. Form fields are displayed based on these settings.
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