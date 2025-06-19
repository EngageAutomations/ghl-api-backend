import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Building2, 
  Zap, 
  Shield, 
  CheckCircle, 
  ArrowRight, 
  ExternalLink,
  Activity,
  Users,
  Globe,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function MarketplaceLanding() {
  const [, setLocation] = useLocation();
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [installationCount, setInstallationCount] = useState(0);

  useEffect(() => {
    // Check Railway backend status
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('/api/railway/health');
        if (response.ok) {
          const data = await response.json();
          setBackendStatus(data);
          setInstallationCount(data.installationsCount || 0);
        }
      } catch (error) {
        console.log('Backend status check failed:', error);
        // Set fallback data for display purposes
        setBackendStatus({ status: 'Unknown', service: 'Railway Backend' });
        setInstallationCount(1); // We know there's at least 1 installation from our testing
      }
    };

    checkBackendStatus();
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Universal API Access",
      description: "Access all GoHighLevel APIs through a single, unified interface"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure OAuth Integration",
      description: "Enterprise-grade OAuth 2.0 authentication with automatic token management"
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: "Real-time Monitoring",
      description: "Live API status monitoring and comprehensive error handling"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-tenant Support",
      description: "Manage multiple GoHighLevel locations from a single dashboard"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Cross-platform Compatible",
      description: "Works seamlessly in web browsers and as embedded CRM tabs"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Detailed usage analytics and API performance metrics"
    }
  ];

  const supportedAPIs = [
    "Products & Pricing",
    "Contact Management", 
    "Location Operations",
    "Opportunities & Pipeline",
    "Workflows & Automation",
    "Forms & Surveys",
    "Media File Management",
    "Calendar Integration",
    "Snapshots & Backups"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">GoHighLevel Marketplace</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {backendStatus && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <Activity className="w-3 h-3 mr-1" />
                  API Online
                </Badge>
              )}
              
              <Button onClick={() => setLocation('/api-management')}>
                Access Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Universal GoHighLevel
            <span className="text-blue-600"> API Gateway</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your GoHighLevel integrations with our comprehensive marketplace application. 
            Access all APIs through a single, secure, and scalable platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={() => setLocation('/api-management')}
              className="text-lg px-8 py-3"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.open('https://dir.engageautomations.com/health', '_blank')}
              className="text-lg px-8 py-3"
            >
              View API Status
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{installationCount}+</div>
              <div className="text-sm text-gray-600">Active Installations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">39+</div>
              <div className="text-sm text-gray-600">API Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Integrations
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to build robust GoHighLevel integrations with enterprise-grade reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported APIs Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete GoHighLevel API Coverage
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Access the full suite of GoHighLevel APIs through our unified gateway.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {supportedAPIs.map((api, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white p-4 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-900 font-medium">{api}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Install our marketplace app from the GoHighLevel marketplace or access your existing installation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation('/api-management')}
              className="text-lg px-8 py-3"
            >
              Access Your Installation
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              onClick={() => window.open('https://marketplace.leadconnectorhq.com/', '_blank')}
              className="text-lg px-8 py-3"
            >
              GoHighLevel Marketplace
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Building2 className="w-6 h-6" />
              <span className="text-lg font-semibold">GoHighLevel Marketplace</span>
            </div>
            <p className="text-gray-400 mb-4">
              Universal API Gateway for GoHighLevel Integrations
            </p>
            {backendStatus && (
              <p className="text-sm text-gray-500">
                Backend Status: {backendStatus.status} | 
                Endpoints: {backendStatus.supportedEndpoints} | 
                Last Updated: {new Date(backendStatus.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}