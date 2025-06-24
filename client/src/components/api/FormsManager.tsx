import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Eye, Edit, BarChart3, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface FormSubmission {
  id: string;
  submittedAt: string;
  contactId?: string;
  data: Record<string, any>;
}

interface FormData {
  id: string;
  name: string;
  description?: string;
  status: 'published' | 'draft' | 'archived';
  fields: FormField[];
  submissions: FormSubmission[];
  views: number;
  conversionRate: number;
  locationId: string;
  createdAt: string;
  updatedAt: string;
}

export default function FormsManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch forms from GoHighLevel API
  const { data: forms, isLoading, error } = useQuery({
    queryKey: ['/api/ghl/forms', { search: searchTerm, status: filterStatus, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      });
      
      const response = await fetch(`/api/ghl/forms?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch forms');
      }
      return response.json();
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredForms = forms?.forms || [];

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Failed to load forms</h3>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary stats
  const publishedForms = filteredForms.filter((form: FormData) => form.status === 'published');
  const totalSubmissions = filteredForms.reduce((sum: number, form: FormData) => sum + form.submissions.length, 0);
  const totalViews = filteredForms.reduce((sum: number, form: FormData) => sum + form.views, 0);
  const avgConversionRate = filteredForms.length > 0
    ? filteredForms.reduce((sum: number, form: FormData) => sum + form.conversionRate, 0) / filteredForms.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Forms Management</h2>
          <p className="text-muted-foreground">
            Manage your GoHighLevel forms and submissions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredForms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Forms</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedForms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search forms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
          const [field, order] = value.split('-');
          setSortBy(field);
          setSortOrder(order);
        }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest</SelectItem>
            <SelectItem value="createdAt-asc">Oldest</SelectItem>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="submissions-desc">Most Submissions</SelectItem>
            <SelectItem value="views-desc">Most Views</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Forms List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredForms.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-semibold mb-2">No forms found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No forms created yet'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredForms.map((form: FormData) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getStatusColor(form.status)}>
                        {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">
                        {form.fields.length} field{form.fields.length !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="outline">
                        {form.submissions.length} submission{form.submissions.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    {form.description && (
                      <p className="text-sm text-muted-foreground mt-2">{form.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Form Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{form.views}</div>
                      <div className="text-muted-foreground">Views</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{form.submissions.length}</div>
                      <div className="text-muted-foreground">Submissions</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{form.conversionRate.toFixed(1)}%</div>
                      <div className="text-muted-foreground">Conversion</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="font-semibold text-lg">{form.fields.length}</div>
                      <div className="text-muted-foreground">Fields</div>
                    </div>
                  </div>

                  {/* Form Fields Preview */}
                  {form.fields.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Form Fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {form.fields.slice(0, 6).map((field) => (
                          <Badge key={field.id} variant="secondary" className="text-xs">
                            {field.name} ({field.type})
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Badge>
                        ))}
                        {form.fields.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{form.fields.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent Submissions */}
                  {form.submissions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recent Submissions:</p>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {form.submissions.slice(0, 3).map((submission) => (
                          <div key={submission.id} className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(submission.submittedAt)}</span>
                            {submission.contactId && (
                              <Badge variant="outline" className="text-xs">
                                Contact: {submission.contactId.slice(0, 8)}...
                              </Badge>
                            )}
                          </div>
                        ))}
                        {form.submissions.length > 3 && (
                          <p className="text-xs">+{form.submissions.length - 3} more submissions</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {formatDate(form.createdAt)}
                    </span>
                    
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Updated {formatDate(form.updatedAt)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}