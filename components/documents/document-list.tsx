"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  File,
  FileText,
  Image,
  FileSpreadsheet,
  Archive,
  MoreHorizontal,
  Download,
  Edit,
  Trash2,
  Move,
  Eye,
  Calendar,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocuments } from "@/lib/hooks/use-documents";
import { useEntity } from "@/lib/entity-context";
import { useDocumentActionPermissions } from "@/lib/hooks/use-document-permissions";
import { DocumentActionMenu } from "./document-action-menu";
import { FolderPathDisplay } from "./folder-path-display";
import { DownloadButton } from "./download-button";
import { BulkDownloadDialog } from "./bulk-download-dialog";
import { DocumentListSkeleton, SearchLoading, EmptyState } from "./loading-states";
import { formatDistanceToNow } from "date-fns";

interface DocumentListProps {
  selectedFolder: string | null;
  viewMode: "grid" | "list";
  onDocumentAction: (action: string, document: any) => void;
  documents?: any[];
  isLoading?: boolean;
  isSearching?: boolean;
  searchQuery?: string;
}

// Helper function to get file icon based on file type
function getFileIcon(mimeType: string, fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (mimeType.startsWith('image/')) {
    return <Image className="h-8 w-8 text-blue-500" />;
  }
  
  if (mimeType.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  
  if (mimeType.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(extension || '')) {
    return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
  }
  
  if (['zip', 'rar'].includes(extension || '')) {
    return <Archive className="h-8 w-8 text-purple-500" />;
  }
  
  return <File className="h-8 w-8 text-gray-500" />;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function DocumentList({ 
  selectedFolder, 
  viewMode, 
  onDocumentAction, 
  documents: propDocuments,
  isLoading: propIsLoading,
  isSearching = false,
  searchQuery = ""
}: DocumentListProps) {
  const { selectedEntity } = useEntity();
  const [bulkDownloadOpen, setBulkDownloadOpen] = useState(false);
  const { data: defaultDocuments, isLoading: defaultIsLoading } = useDocuments(
    selectedEntity?.id || "",
    selectedFolder || undefined
  );

  // Use provided documents or fall back to default
  const documents = propDocuments || defaultDocuments;
  const isLoading = propIsLoading !== undefined ? propIsLoading : defaultIsLoading;

  if (isLoading) {
    return <DocumentListSkeleton viewMode={viewMode} />;
  }

  if (!documents || documents.length === 0) {
    return (
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="text-lg">
            {isSearching ? "Search Results" : selectedFolder ? "Folder Contents" : "All Documents"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={File}
            title={isSearching ? "No documents found" : "No documents found"}
            description={
              isSearching 
                ? `No documents match your search criteria${searchQuery ? ` for "${searchQuery}"` : ""}. Try adjusting your filters or search terms.`
                : selectedFolder 
                  ? "This folder is empty. Upload documents or move existing ones here."
                  : "No documents uploaded yet. Start by uploading your first document."
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {isSearching ? "Search Results" : selectedFolder ? "Folder Contents" : "All Documents"}
            </CardTitle>
            {isSearching && searchQuery ? (
              <p className="text-sm text-muted-foreground">
                Results for "{searchQuery}"
              </p>
            ) : selectedFolder ? (
              <FolderPathDisplay selectedFolder={selectedFolder} showRoot={true} />
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
              {isSearching && " found"}
            </div>
            {documents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkDownloadOpen(true)}
                className="text-xs"
              >
                <Download className="mr-1 h-3 w-3" />
                Download All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((document) => (
              <Card key={document.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(document.mimeType, document.fileName)}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate" title={document.fileName}>
                          {document.fileName}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(document.fileSize)}
                        </p>
                      </div>
                    </div>
                    
                    <DocumentActionMenu
                      document={document}
                      onAction={onDocumentAction}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </div>
                  
                  {document.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {document.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{typeof document.uploadedBy === 'string' ? 'User' : (document.uploadedBy as any)?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px]">Size</TableHead>
                  <TableHead className="w-[150px]">Modified</TableHead>
                  <TableHead className="w-[120px]">Uploaded By</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id} className="group">
                    <TableCell>
                      {getFileIcon(document.mimeType, document.fileName)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{document.fileName}</div>
                        {document.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {document.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatFileSize(document.fileSize)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {typeof document.uploadedBy === 'string' ? 'User' : (document.uploadedBy as any)?.name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <DocumentActionMenu
                        document={document}
                        onAction={onDocumentAction}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Bulk Download Dialog */}
    <BulkDownloadDialog
      open={bulkDownloadOpen}
      onOpenChange={setBulkDownloadOpen}
      documents={documents || []}
      folderName={selectedFolder ? "Selected Folder" : "All Documents"}
    />
    </>
  );
}