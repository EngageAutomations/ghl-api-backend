import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function OAuthError() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-red-600 mb-4">OAuth Error</h1>
        <p className="text-gray-600 mb-6">
          There was an error connecting to GoHighLevel. Please try again.
        </p>
        <Button onClick={() => setLocation("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}