import { useLocation } from "wouter";
import { ConfigCard } from "@/components/ui/config-card";
import ListingForm from "./ListingForm";

export default function CreateListing() {
  const [, navigate] = useLocation();
  
  // Handle successful form submission
  const handleSuccess = () => {
    navigate("/listings");
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Create New Listing</h1>
        <p className="text-slate-500">Set up a new business listing</p>
      </div>
      
      <ConfigCard 
        title="New Business Listing" 
        description="Fill out the form below to create a new listing"
      >
        <ListingForm onSuccess={handleSuccess} />
      </ConfigCard>
    </div>
  );
}