import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

function APITestingInterface() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Testing Interface</h2>
        <p className="text-muted-foreground">
          Test and debug GoHighLevel API endpoints
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            API Testing Tools
          </CardTitle>
          <CardDescription>
            Interactive API testing and debugging interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            API testing interface will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default APITestingInterface;