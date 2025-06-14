import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Search, FileImage, Trash2, Download, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  path: string;
  type: 'file' | 'folder';
  altType: 'agency' | 'location';
  altId: string;
  parentId?: string;
  size?: number;
  createdAt: string;
}

export default function MediaManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [altType, setAltType] = useState<'agency' | 'location'>('location');
  const [altId, setAltId] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch media files from GoHighLevel API
  const { data: mediaFiles, isLoading, error } = useQuery({
    queryKey: ['/api/ghl/media/files', { sortBy, sortOrder, altType, altId, query: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        altType,
        altId: altId || 'default',
        ...(searchTerm && { query: searchTerm })
      });
      
      const response = await fetch(`/api/ghl/media/files?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch media files');
      }
      return response.json();
    },
    enabled: !!altId
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/ghl/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/media/files'] });
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadName('');
      toast({
        title: "File Uploaded",
        description: "Your file has been successfully uploaded to GoHighLevel.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload Error",
        description: `Failed to upload file: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async ({ fileId, altType, altId }: { fileId: string; altType: string; altId: string }) => {
      const response = await fetch(`/api/ghl/media/${fileId}?altType=${altType}&altId=${altId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ghl/media/files'] });
      toast({
        title: "File Deleted",
        description: "File has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Error",
        description: `Failed to delete file: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('hosted', 'false');
    formData.append('name', uploadName || selectedFile.name);

    uploadFileMutation.mutate(formData);
  };

  const handleDeleteFile = (file: MediaFile) => {
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      deleteFileMutation.mutate({
        fileId: file.id,
        altType: file.altType,
        altId: file.altId
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredFiles = mediaFiles?.data?.files?.filter((file: MediaFile) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading media files: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Media Library</h2>
          <p className="text-muted-foreground">
            Manage files and folders in your GoHighLevel media library
          </p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>
                Upload a new file to your GoHighLevel media library
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="upload-name">Custom Name (optional)</Label>
                <Input
                  id="upload-name"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="Leave empty to use original filename"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleFileUpload}
                disabled={uploadFileMutation.isPending || !selectedFile}
              >
                {uploadFileMutation.isPending ? 'Uploading...' : 'Upload File'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={altType} onValueChange={(value: 'agency' | 'location') => setAltType(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Alt ID"
          value={altId}
          onChange={(e) => setAltId(e.target.value)}
          className="w-32"
        />

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="createdAt">Date</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file: MediaFile) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {file.type === 'folder' ? (
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                      <FileImage className="h-4 w-4 text-primary" />
                    )}
                    <CardTitle className="text-sm truncate">{file.name}</CardTitle>
                  </div>
                  <Badge variant={file.type === 'folder' ? 'secondary' : 'default'}>
                    {file.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {file.size && formatFileSize(file.size)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {file.altType}: {file.altId}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-1">
                      {file.type === 'file' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFile(file)}
                        disabled={deleteFileMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!altId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileImage className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Configure Context</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please specify the Alt Type and Alt ID to view media files.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredFiles.length === 0 && !isLoading && altId && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileImage className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No files found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by uploading your first file.
              </p>
              <div className="mt-6">
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { MediaManager };