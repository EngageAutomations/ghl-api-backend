import { useLocation } from 'wouter';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OAuthError() {
  const [, setLocation] = useLocation();
  
  // Get error parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error') || 'unknown_error';
  
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'access_denied':
        return 'You denied access to your GoHighLevel account. Please try again if you want to connect.';
      case 'no_code':
        return 'No authorization code was received from GoHighLevel. Please try the connection process again.';
      case 'token_exchange_failed':
        return 'Failed to exchange authorization code for access token. This may be a temporary issue.';
      case 'user_info_failed':
        return 'Failed to retrieve your user information from GoHighLevel. Please try again.';
      case 'callback_failed':
        return 'The OAuth callback process encountered an error. Please try connecting again.';
      default:
        return 'An unexpected error occurred during the OAuth process.';
    }
  };

  const handleRetry = () => {
    window.location.href = '/api/oauth/auth';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-600">
              {getErrorMessage(error)}
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLocation('/')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-500">
              Error Code: {error}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}