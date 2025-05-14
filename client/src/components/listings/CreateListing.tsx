import { ConfigCard } from "@/components/ui/config-card";
import ListingForm from "./ListingForm";

export default function CreateListing() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Add New Listing</h1>
        <p className="text-slate-500">Create a new business listing in your directory</p>
      </div>
      
      <ConfigCard 
        title="Create Listing" 
        description="Fill out the details to add a new business to your directory. All URLs defined here will be used for the listing's action buttons and forms."
      >
        <ListingForm />
      </ConfigCard>
    </div>
  );
}