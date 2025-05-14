import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ConfigCard } from "@/components/ui/config-card";
import ListingForm from "./ListingForm";
import { Listing } from "@shared/schema";

export default function EditListing() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const listingId = params?.id ? parseInt(params.id) : null;
  
  // Fetch the listing data
  const { isLoading, error, data: listing } = useQuery({
    queryKey: [`/api/listings/id/${listingId}`],
    enabled: !!listingId, // Only run the query if we have a valid ID
  });
  
  // Handle successful form submission
  const handleSuccess = () => {
    navigate("/listings");
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Listing</h1>
          <p className="text-slate-500">Loading listing data...</p>
        </div>
        
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (error || !listing) {
    return (
      <div className="container mx-auto py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Listing</h1>
          <p className="text-red-500">
            Error loading listing data. Please try again or return to the listings page.
          </p>
        </div>
        
        <div className="flex justify-center">
          <button 
            onClick={() => navigate("/listings")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Return to Listings
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Edit Listing</h1>
        <p className="text-slate-500">Update your listing information</p>
      </div>
      
      <ConfigCard 
        title={`Edit: ${(listing as Listing)?.title || 'Listing'}`} 
        description="Update the listing details below"
      >
        <ListingForm 
          initialData={{
            title: (listing as Listing).title,
            slug: (listing as Listing).slug,
            category: (listing as Listing).category || "",
            description: (listing as Listing).description || "",
            location: (listing as Listing).location || undefined,
            price: (listing as Listing).price || undefined,
            downloadUrl: (listing as Listing).downloadUrl || undefined,
            popupUrl: (listing as Listing).popupUrl || undefined,
            embedFormUrl: (listing as Listing).embedFormUrl || undefined,
            imageUrl: (listing as Listing).imageUrl || undefined,
          }} 
          onSuccess={handleSuccess} 
          isEditing={true} 
        />
      </ConfigCard>
    </div>
  );
}