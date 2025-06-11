import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OAuthSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Auto-redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      setLocation('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              OAuth Success!
            </h1>
            <p className="text-gray-600">
              Your GoHighLevel account has been successfully connected.
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard in 3 seconds...
            </p>
            
            <Button 
              onClick={() => setLocation('/dashboard')}
              className="w-full"
            >
              Go to Dashboard Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}