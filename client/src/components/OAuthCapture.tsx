/**
 * OAuth Capture Component
 * Handles installation_id capture and testing after OAuth redirect
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OAuthStatus {
  authenticated: boolean;
  tokenStatus?: string;
  locationId?: string;
}

export function OAuthCapture() {
  const [installationId, setInstallationId] = useState<string | null>(null);
  const [oauthStatus, setOAuthStatus] = useState<OAuthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check stored installation_id and location_id
    const storedInstallationId = sessionStorage.getItem('installation_id');
    const storedLocationId = sessionStorage.getItem('location_id');
    
    if (storedInstallationId) {
      setInstallationId(storedInstallationId);
      
      if (storedLocationId) {
        // Both IDs stored, set as authenticated
        setOAuthStatus({
          authenticated: true,
          tokenStatus: 'valid',
          locationId: storedLocationId
        });
      } else {
        // Only installation_id stored, check status
        checkOAuthStatus(storedInstallationId);
      }
    }
  }, []);

  const checkOAuthStatus = async (id: string) => {
    setIsChecking(true);
    
    try {
      const { checkOAuthStatus } = await import('@/lib/railwayAPI');
      const status = await checkOAuthStatus(id);
      setOAuthStatus(status);
      
      if (status.authenticated && status.locationId) {
        sessionStorage.setItem('location_id', status.locationId);
        toast({
          title: "OAuth Connected",
          description: `Successfully connected to location ${status.locationId}`,
        });
      }
    } catch (error) {
      console.log('OAuth status check failed:', error);
      setOAuthStatus({ authenticated: false });
    } finally {
      setIsChecking(false);
    }
  };

  const testProductCreation = async () => {
    if (!oauthStatus?.authenticated || !oauthStatus.locationId) {
      toast({
        title: "Not Ready",
        description: "OAuth authentication required first",
        variant: "destructive"
      });
      return;
    }

    try {
      const { createProductWithImages } = await import('@/lib/railwayAPI');
      
      const productData = {
        name: 'AI Robot Assistant Pro - Test',
        description: 'Testing product creation with captured installation_id',
        price: 797.00,
        productType: 'DIGITAL' as const,
        availabilityType: 'AVAILABLE_NOW' as const
      };

      const result = await createProductWithImages(productData, []);
      
      if (result.success) {
        toast({
          title: "Product Created!",
          description: "AI Robot Assistant Pro created successfully",
        });
      } else if (result.needsReconnect) {
        toast({
          title: "Reconnect Required",
          description: "Please reconnect the app in GoHighLevel",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Creation Failed",
          description: result.error || "Unknown error",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Product creation failed",
        variant: "destructive"
      });
    }
  };

  if (!installationId) {
    return null; // Don't show if no OAuth activity
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isChecking && <Loader2 className="h-4 w-4 animate-spin" />}
          {oauthStatus?.authenticated && <CheckCircle className="h-4 w-4 text-green-500" />}
          {oauthStatus && !oauthStatus.authenticated && <AlertCircle className="h-4 w-4 text-orange-500" />}
          OAuth Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div>
            <strong>Installation ID:</strong> <code className="bg-gray-100 px-1 rounded">{installationId}</code>
          </div>
          
          {oauthStatus && (
            <>
              <div>
                <strong>Authenticated:</strong> 
                <span className={oauthStatus.authenticated ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                  {oauthStatus.authenticated ? 'Yes' : 'No'}
                </span>
              </div>
              
              {oauthStatus.tokenStatus && (
                <div>
                  <strong>Token Status:</strong> <span className="text-blue-600">{oauthStatus.tokenStatus}</span>
                </div>
              )}
              
              {oauthStatus.locationId && (
                <div>
                  <strong>Location ID:</strong> <code className="bg-gray-100 px-1 rounded">{oauthStatus.locationId}</code>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => installationId && checkOAuthStatus(installationId)}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Refresh Status'}
          </Button>
          
          {oauthStatus?.authenticated && (
            <Button 
              size="sm" 
              onClick={testProductCreation}
            >
              Test Product Creation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}