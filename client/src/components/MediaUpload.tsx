import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image, File, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadProps {
  onUploadSuccess: (url: string, mediaId: string) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSizeBytes?: number;
  installationId?: string;
  disabled?: boolean;
}

interface UploadedFile {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  mediaId?: string;
  error?: string;
}

export function MediaUpload({
  onUploadSuccess,
  onUploadError,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'application/pdf', 'video/*'],
  maxSizeBytes = 25 * 1024 * 1024, // 25MB default
  installationId = 'install_1750191250983',
  disabled = false
}: MediaUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || disabled) return;

    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check file size
      if (file.size > maxSizeBytes) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit`,
          variant: "destructive"
        });
        continue;
      }

      // Check if we're at max files
      if (files.length + newFiles.length >= maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive"
        });
        break;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      
      newFiles.push({
        file,
        preview,
        status: 'pending'
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const uploadFile = async (fileIndex: number) => {
    const fileData = files[fileIndex];
    if (!fileData) return;

    // Update status to uploading
    setFiles(prev => prev.map((f, i) => 
      i === fileIndex ? { ...f, status: 'uploading' as const } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('installation_id', installationId);

      const response = await fetch('/api/railway/media/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      // Update file with success
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          status: 'success' as const, 
          url: result.url,
          mediaId: result.mediaId 
        } : f
      ));

      // Notify parent component
      onUploadSuccess(result.url, result.mediaId);

      toast({
        title: "Upload successful",
        description: `${fileData.file.name} uploaded to GoHighLevel Media Library`
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update file with error
      setFiles(prev => prev.map((f, i) => 
        i === fileIndex ? { 
          ...f, 
          status: 'error' as const, 
          error: errorMessage 
        } : f
      ));

      onUploadError?.(errorMessage);

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <File className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ready</Badge>;
      case 'uploading':
        return <Badge variant="outline"><Loader2 className="h-3 w-3 animate-spin mr-1" />Uploading</Badge>;
      case 'success':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
        <div className="space-y-2">
          <p className={`text-lg font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {isDragging ? 'Drop files here' : 'Upload media files'}
          </p>
          <p className={`text-sm ${disabled ? 'text-gray-300' : 'text-gray-500'}`}>
            Drag & drop or click to select files (Max {maxFiles} files, {Math.round(maxSizeBytes / 1024 / 1024)}MB each)
          </p>
          <div className="space-y-1">
            <p className="text-xs text-gray-400">
              Supported: Images, PDFs, Videos
            </p>
            <p className="text-xs text-gray-400">
              Files uploaded to GoHighLevel Media Library
            </p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= maxFiles}
          className="mt-4"
        >
          Select Files
        </Button>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Files</Label>
          {files.map((fileData, index) => (
            <Card key={index} className="p-3">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {fileData.file.type.startsWith('image/') ? (
                      <img
                        src={fileData.preview}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        {getFileIcon(fileData.file)}
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(fileData.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {fileData.error && (
                        <p className="text-xs text-red-600 mt-1">{fileData.error}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {getStatusBadge(fileData.status)}
                    
                    {fileData.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => uploadFile(index)}
                        disabled={disabled}
                      >
                        Upload
                      </Button>
                    )}
                    
                    {fileData.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => uploadFile(index)}
                        disabled={disabled}
                      >
                        Retry
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(index)}
                      disabled={disabled || fileData.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {files.some(f => f.status === 'pending') && (
            <Button
              onClick={() => {
                files.forEach((_, index) => {
                  if (files[index].status === 'pending') {
                    uploadFile(index);
                  }
                });
              }}
              disabled={disabled}
              className="w-full"
            >
              Upload All Files
            </Button>
          )}
        </div>
      )}
    </div>
  );
}