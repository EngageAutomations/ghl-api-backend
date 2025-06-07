import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FolderOpen, Plus, Settings, Trash2, Eye, FileText, Calendar, Activity } from 'lucide-react';
import { FormConfiguration } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AIAssistant from '@/components/AIAssistant';

interface DirectoryWithStats extends FormConfiguration {
  listingCount: number;
  lastActivity: string | null;
}

export default function DirectoriesDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch directories with stats
  const { data: directories = [], isLoading } = useQuery<DirectoryWithStats[]>({
    queryKey: ['/api/directories'],
  });

  // Delete directory mutation
  const deleteMutation = useMutation({
    mutationFn: async (directoryId: number) => {
      return apiRequest(`/api/directories/${directoryId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/directories'] });
      toast({
        title: "Directory deleted",
        description: "The directory and all its listings have been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete directory. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateDirectory = () => {
    setLocation('/wizard');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Directories</h1>
            <p className="text-gray-600 mt-2">Manage your marketplace directories and listings</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Directories</h1>
          <p className="text-gray-600 mt-2">Manage your marketplace directories and listings</p>
        </div>
        <Button onClick={handleCreateDirectory} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Directory
        </Button>
      </div>

      {/* Main Content Grid - Directories and AI Assistant */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Directories Section */}
        <div className="xl:col-span-2">
          {/* Directories Grid */}
          {directories.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No directories yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first marketplace directory</p>
          <Button onClick={handleCreateDirectory} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Directory
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {directories.map((directory) => (
            <Card key={directory.id} className="hover:shadow-lg transition-shadow border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {directory.directoryName}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        Location: {directory.locationId}
                      </p>
                    </div>
                  </div>
                  <Badge variant={directory.isActive ? "default" : "secondary"}>
                    {directory.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {directory.listingCount} listings
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {directory.createdAt ? new Date(directory.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Last Activity */}
                {directory.lastActivity && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Last activity: {new Date(directory.lastActivity).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                  <Link href={`/directories/${directory.directoryName}`}>
                    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Settings className="w-4 h-4 mr-1" />
                      Manage
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
          )}
        </div>

        {/* AI Assistant Section - Admin Only */}
        <div className="xl:col-span-1">
          <AIAssistant />
        </div>
      </div>
    </div>
  );
}