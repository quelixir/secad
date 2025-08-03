"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Upload, 
  Download, 
  FolderOpen, 
  File,
  Search,
  RefreshCw
} from "lucide-react";

// Document list loading skeleton
export function DocumentListSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view skeleton
  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <div className="space-y-0">
            {/* Header */}
            <div className="border-b bg-muted/50 p-4">
              <div className="grid grid-cols-12 gap-4">
                <Skeleton className="h-4 w-8 col-span-1" />
                <Skeleton className="h-4 w-20 col-span-4" />
                <Skeleton className="h-4 w-12 col-span-2" />
                <Skeleton className="h-4 w-16 col-span-3" />
                <Skeleton className="h-4 w-14 col-span-2" />
              </div>
            </div>
            {/* Rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b last:border-b-0 p-4 animate-pulse">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <Skeleton className="h-8 w-8 col-span-1" />
                  <div className="col-span-4 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-4 w-16 col-span-2" />
                  <Skeleton className="h-4 w-20 col-span-3" />
                  <Skeleton className="h-4 w-12 col-span-1" />
                  <Skeleton className="h-6 w-6 col-span-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Folder sidebar loading skeleton
export function FolderSidebarSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-6 w-6" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {/* Root folder */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          {/* Folder tree */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2" style={{ paddingLeft: `${(i % 3) * 12}px` }}>
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-6" />
              </div>
            </div>
          ))}
          
          {/* Create folder button */}
          <div className="px-4 py-4 text-center">
            <Skeleton className="h-8 w-28 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Upload progress indicator
export function UploadProgress({ 
  progress, 
  fileName, 
  status 
}: { 
  progress: number; 
  fileName: string; 
  status: 'uploading' | 'processing' | 'completed' | 'error';
}) {
  return (
    <div className="space-y-2 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Upload className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium truncate">{fileName}</span>
        </div>
        <div className="text-xs text-muted-foreground ml-2">
          {status === 'uploading' && `${Math.round(progress)}%`}
          {status === 'processing' && 'Processing...'}
          {status === 'completed' && 'Complete'}
          {status === 'error' && 'Failed'}
        </div>
      </div>
      
      <Progress 
        value={progress} 
        className="w-full h-2"
      />
      
      {status === 'processing' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Creating document record...</span>
        </div>
      )}
    </div>
  );
}

// Download progress indicator
export function DownloadProgress({ 
  fileName, 
  progress, 
  status 
}: { 
  fileName: string; 
  progress?: number; 
  status: 'preparing' | 'downloading' | 'completed' | 'error';
}) {
  return (
    <div className="space-y-2 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Download className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-medium truncate">{fileName}</span>
        </div>
        <div className="text-xs text-muted-foreground ml-2">
          {status === 'preparing' && 'Preparing...'}
          {status === 'downloading' && progress !== undefined ? `${Math.round(progress)}%` : 'Downloading...'}
          {status === 'completed' && 'Downloaded'}
          {status === 'error' && 'Failed'}
        </div>
      </div>
      
      {progress !== undefined && (
        <Progress 
          value={progress} 
          className="w-full h-2"
        />
      )}
      
      {status === 'preparing' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Generating download link...</span>
        </div>
      )}
    </div>
  );
}

// Search loading indicator
export function SearchLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Search className="h-4 w-4 animate-pulse" />
        <span className="text-sm">Searching documents...</span>
      </div>
    </div>
  );
}

// Operation loading overlay
export function OperationLoading({ 
  operation, 
  message 
}: { 
  operation: 'rename' | 'move' | 'delete' | 'create' | 'update';
  message?: string;
}) {
  const icons = {
    rename: File,
    move: RefreshCw,
    delete: File,
    create: FolderOpen,
    update: File,
  };
  
  const Icon = icons[operation];
  
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Icon className="h-8 w-8 text-muted-foreground" />
          <Loader2 className="h-4 w-4 animate-spin absolute -top-1 -right-1 text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            {message || `${operation.charAt(0).toUpperCase() + operation.slice(1)}ing...`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Please wait while we process your request
          </p>
        </div>
      </div>
    </div>
  );
}

// Inline loading spinner
export function InlineLoading({ 
  size = "sm",
  className = "" 
}: { 
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    xs: "h-3 w-3",
    sm: "h-4 w-4", 
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };
  
  return (
    <Loader2 className={`animate-spin ${sizes[size]} ${className}`} />
  );
}

// Empty state with loading option
export function EmptyState({ 
  icon: Icon = File,
  title,
  description,
  action,
  isLoading = false 
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
      {action}
    </div>
  );
}

// Breadcrumb loading skeleton
export function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center space-x-1 px-1">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-3 w-3 mx-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-3 mx-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}