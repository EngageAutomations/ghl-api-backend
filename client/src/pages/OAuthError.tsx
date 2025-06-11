import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function OAuthError() {
  const [, navigate] = useLocation();
  
  // Get error from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  
  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'access_denied':
        return 'You denied access to the application. Please try again and approve the authorization request.';
      case 'invalid_state':
        return 'Security validation failed. Please try logging in again.';
      case 'no_code':
        return 'Authorization code was not received. Please try again.';
      case 'callback_failed':
        return 'Authentication callback failed. Please try again or contact support.';
      case 'invalid_user_data':
        return 'Required user information is missing from GoHighLevel. Please ensure your GHL account has a valid email and name.';
      default:
        return 'An unexpected error occurred during authentication. Please try again.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Authentication Failed
          </CardTitle>
          <CardDescription className="text-gray-600">
            {getErrorMessage(error)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => navigate('/auth/ghl/authorize')}
            className="w-full"
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}