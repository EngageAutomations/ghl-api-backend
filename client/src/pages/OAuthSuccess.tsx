/**
 * OAuth Success Page - Handles OAuth callback and session establishment
 * Part of the dual-domain architecture implementation
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OAuthCallbackData {
  userId?: string;
  locationId?: string;
  error?: string;
}

export default function OAuthSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [callbackData, setCallbackData] = useState<OAuthCallbackData>({});
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Extract parameters from URL
      const params = new URLSearchParams(window.location.search);
      const userId = params.get('userId');
      const locationId = params.get('locationId');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(error);
        return;
      }

      if (!userId) {
        setStatus('error');
        setErrorMessage('Missing user ID from OAuth callback');
        return;
      }

      setCallbackData({ userId, locationId: locationId || undefined });

      // Attempt session recovery to establish authentication
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          ghlUserId: userId,
          locationId: locationId || undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Session established:', result);
        setStatus('success');
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          setLocation('/directories');
        }, 3000);
      } else {
        const errorData = await response.json();
        setStatus('error');
        setErrorMessage(errorData.error || 'Failed to establish session');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setErrorMessage('Failed to process OAuth callback');
    }
  };

  const goToDashboard = () => {
    setLocation('/directories');
  };

  const retryConnection = () => {
    setStatus('loading');
    handleOAuthCallback();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            GoHighLevel Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Setting up your account...</h3>
                <p className="text-gray-600 text-sm">
                  Please wait while we establish your connection to GoHighLevel.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Connection Successful!
                </h3>
                <p className="text-gray-600 text-sm">
                  Your GoHighLevel account is now connected. You'll be redirected to your dashboard shortly.
                </p>
              </div>
              
              {callbackData.userId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-xs text-green-700 space-y-1">
                    <div><strong>User ID:</strong> {callbackData.userId}</div>
                    {callbackData.locationId && (
                      <div><strong>Location ID:</strong> {callbackData.locationId}</div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={goToDashboard}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  Connection Failed
                </h3>
                <p className="text-gray-600 text-sm">
                  {errorMessage || 'There was an error connecting your GoHighLevel account.'}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={retryConnection}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={() => setLocation('/oauth-app')}
                  className="w-full"
                >
                  Start Over
                </Button>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Secure OAuth integration powered by GoHighLevel
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}