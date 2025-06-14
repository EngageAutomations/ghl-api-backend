import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { CheckCircle, ExternalLink, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OAuthSuccess() {
  const [, setLocation] = useLocation();
  const [installationData, setInstallationData] = useState<any>(null);
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const success = urlParams.get('success');
  const timestamp = urlParams.get('timestamp');
  const locationId = urlParams.get('locationId');
  const installationId = urlParams.get('installationId');

  useEffect(() => {
    // Fetch installation data from Railway backend
    const fetchInstallationData = async () => {
      try {
        const response = await fetch('https://dir.engageautomations.com/api/installations/latest');
        if (response.ok) {
          const data = await response.json();
          setInstallationData(data.installation);
        }
      } catch (error) {
        console.log('Could not fetch installation data:', error);
      }
    };

    fetchInstallationData();

    // Auto-redirect to API management after 5 seconds
    const timer = setTimeout(() => {
      setLocation('/api-management');
    }, 5000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Installation Complete!
            </h1>
            <p className="text-gray-600 text-lg">
              Your GoHighLevel marketplace app has been successfully installed.
            </p>
          </div>
          
          {installationData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Installation Details:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Location ID:</span> {installationData.ghlLocationId}</p>
                <p><span className="font-medium">Installation ID:</span> {installationData.id}</p>
                <p><span className="font-medium">Date:</span> {new Date(installationData.installationDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to API management in 5 seconds...
            </p>
            
            <Button 
              onClick={() => setLocation('/api-management')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Access API Management
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setLocation('/dashboard')}
              className="w-full flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Go to Dashboard
            </Button>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-500">
              You can now access all GoHighLevel APIs through this marketplace app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}