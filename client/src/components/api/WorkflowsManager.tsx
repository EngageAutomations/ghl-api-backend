import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Workflow } from 'lucide-react';

function WorkflowsManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Workflows Management</h2>
        <p className="text-muted-foreground">
          Automate business processes and triggers
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Workflow className="h-5 w-5 text-primary" />
            <CardTitle>Automation Operations</CardTitle>
          </div>
          <CardDescription>
            Manage workflows and automation through GoHighLevel API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground font-mono">
              GET /workflows - List workflows
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              POST /workflows/:id/trigger - Trigger workflow
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              GET /forms - List forms
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              GET /surveys - List surveys
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              GET /calendars - List calendars
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WorkflowsManager;