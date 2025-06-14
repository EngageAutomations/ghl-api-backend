import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export default function OpportunitiesManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Opportunities Management</h2>
        <p className="text-muted-foreground">
          Track sales pipeline and deal management
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Pipeline Operations</CardTitle>
          </div>
          <CardDescription>
            Manage opportunities and sales pipeline through GoHighLevel API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground font-mono">
              GET /opportunities - List opportunities
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              POST /opportunities - Create opportunity
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              PUT /opportunities/:id - Update opportunity
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              GET /pipelines - List sales pipelines
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export { OpportunitiesManager };