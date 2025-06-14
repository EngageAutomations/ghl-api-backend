import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Search, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Calendar {
  id: string;
  name: string;
  description?: string;
  timeZone: string;
  isActive: boolean;
  eventCount?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees?: number;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

export default function CalendarsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCalendar, setSelectedCalendar] = useState<string | null>(null);

  // Fetch calendars
  const { data: calendars, isLoading: calendarsLoading, refetch: refetchCalendars } = useQuery({
    queryKey: ['/api/ghl/calendars'],
    queryFn: async () => {
      const response = await fetch('/api/ghl/calendars');
      if (!response.ok) throw new Error('Failed to fetch calendars');
      return response.json();
    }
  });

  // Fetch events for selected calendar
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/ghl/calendars', selectedCalendar, 'events'],
    queryFn: async () => {
      if (!selectedCalendar) return [];
      const response = await fetch(`/api/ghl/calendars/${selectedCalendar}/events`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    },
    enabled: !!selectedCalendar
  });

  const filteredCalendars = calendars?.filter((calendar: Calendar) =>
    calendar.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Calendar Management</h2>
          <p className="text-muted-foreground">
            Manage appointments, schedules, and calendar events
          </p>
        </div>
        <Button onClick={() => refetchCalendars()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="calendars" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendars">Calendars</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="calendars" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search calendars..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {calendarsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCalendars.map((calendar: Calendar) => (
                <Card key={calendar.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedCalendar(calendar.id)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {calendar.name}
                      </CardTitle>
                      <Badge variant={calendar.isActive ? "default" : "secondary"}>
                        {calendar.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>{calendar.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {calendar.timeZone}
                      </div>
                      {calendar.eventCount !== undefined && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          {calendar.eventCount} events
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!calendarsLoading && filteredCalendars.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No calendars found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'No calendars match your search.' : 'No calendars available in this location.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {!selectedCalendar ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a calendar</h3>
                <p className="text-muted-foreground text-center">
                  Choose a calendar from the Calendars tab to view its events.
                </p>
              </CardContent>
            </Card>
          ) : eventsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Events for {calendars?.find((c: Calendar) => c.id === selectedCalendar)?.name}
                </h3>
                <Button variant="outline" size="sm">
                  Add Event
                </Button>
              </div>

              {events?.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
                    <p className="text-muted-foreground text-center">
                      This calendar doesn't have any upcoming events.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {events?.map((event: CalendarEvent) => (
                    <Card key={event.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                            </div>
                            {event.attendees && (
                              <div className="flex items-center text-sm text-muted-foreground mt-1">
                                <Users className="h-3 w-3 mr-1" />
                                {event.attendees} attendees
                              </div>
                            )}
                          </div>
                          <Badge variant={
                            event.status === 'confirmed' ? 'default' :
                            event.status === 'tentative' ? 'secondary' : 'destructive'
                          }>
                            {event.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CalendarsManager;