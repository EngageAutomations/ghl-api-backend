import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function OAuthSuccess() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Connection Successful</h1>
        <p className="text-gray-600 mb-6">
          Your GoHighLevel account has been successfully connected via Railway backend.
        </p>
        <Button onClick={() => setLocation("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}