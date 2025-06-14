import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, RefreshCw, Download, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Form {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  submissionCount?: number;
  createdAt: string;
}

interface FormSubmission {
  id: string;
  submittedAt: string;
  contactId?: string;
  data: Record<string, any>;
}

export default function FormsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForm, setSelectedForm] = useState<string | null>(null);

  // Fetch forms
  const { data: forms, isLoading: formsLoading, refetch: refetchForms } = useQuery({
    queryKey: ['/api/ghl/forms'],
    queryFn: async () => {
      const response = await fetch('/api/ghl/forms');
      if (!response.ok) throw new Error('Failed to fetch forms');
      return response.json();
    }
  });

  // Fetch submissions for selected form
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['/api/ghl/forms', selectedForm, 'submissions'],
    queryFn: async () => {
      if (!selectedForm) return [];
      const response = await fetch(`/api/ghl/forms/${selectedForm}/submissions`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
    enabled: !!selectedForm
  });

  const filteredForms = forms?.filter((form: Form) =>
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Forms & Surveys</h2>
          <p className="text-muted-foreground">
            Manage forms, surveys, and collect submission data
          </p>
        </div>
        <Button onClick={() => refetchForms()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="forms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {formsLoading ? (
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
              {filteredForms.map((form: Form) => (
                <Card key={form.id} className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedForm(form.id)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {form.name}
                      </CardTitle>
                      <Badge variant={form.isActive ? "default" : "secondary"}>
                        {form.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription>{form.description || "No description"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(form.createdAt).toLocaleDateString()}
                      </div>
                      {form.submissionCount !== undefined && (
                        <div className="text-sm text-muted-foreground">
                          {form.submissionCount} submissions
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!formsLoading && filteredForms.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No forms found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'No forms match your search.' : 'No forms available in this location.'}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          {!selectedForm ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a form</h3>
                <p className="text-muted-foreground text-center">
                  Choose a form from the Forms tab to view its submissions.
                </p>
              </CardContent>
            </Card>
          ) : submissionsLoading ? (
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
                  Submissions for {forms?.find((f: Form) => f.id === selectedForm)?.name}
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Form
                  </Button>
                </div>
              </div>

              {submissions?.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                    <p className="text-muted-foreground text-center">
                      This form hasn't received any submissions yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {submissions?.map((submission: FormSubmission) => (
                    <Card key={submission.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm text-muted-foreground">
                            Submitted: {new Date(submission.submittedAt).toLocaleString()}
                          </div>
                          {submission.contactId && (
                            <Badge variant="outline">
                              Contact: {submission.contactId}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(submission.data).map(([key, value]) => (
                            <div key={key} className="border rounded p-2">
                              <div className="text-xs font-medium text-muted-foreground uppercase">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </div>
                              <div className="text-sm mt-1">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </div>
                            </div>
                          ))}
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

export default FormsManager;