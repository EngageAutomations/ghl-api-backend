import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

function CalendarsManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calendars Management</h2>
        <p className="text-muted-foreground">
          Manage calendar bookings, appointments, and availability
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Operations
          </CardTitle>
          <CardDescription>
            GoHighLevel calendar and booking management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Calendar management features will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CalendarsManager;