import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function ContactsManager() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Contacts Management</h2>
        <p className="text-muted-foreground">
          Manage customer contacts and relationships
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Contact Operations</CardTitle>
          </div>
          <CardDescription>
            Manage contacts through GoHighLevel API (Current & Deprecated)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground font-mono">
              GET /contacts - List contacts
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              POST /contacts - Create contact
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              PUT /contacts/:contactId - Update contact
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              DELETE /contacts/:contactId - Delete contact
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              GET /contacts/deprecated - Legacy API support
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}