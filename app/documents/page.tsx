"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FolderOpen,
  Building2,
  Upload,
  FolderPlus,
  Search,
  Grid3x3,
  List,
  MoreHorizontal,
} from "lucide-react";
import { useEntity } from "@/lib/entity-context";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { FolderSidebar } from "@/components/documents/folder-sidebar";
import { CreateFolderDialog } from "@/components/documents/create-folder-dialog";
import { UploadButton } from "@/components/documents/upload-button";
import { FileUpload } from "@/components/documents/file-upload";
import { DragDropOverlay } from "@/components/documents/drag-drop-overlay";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentActions } from "@/components/documents/document-actions";
import { SearchFilter } from "@/components/documents/search-filter";
import { BreadcrumbNavigation } from "@/components/documents/breadcrumb-navigation";
import DocumentErrorBoundary from "@/components/documents/error-boundary";
import { useDocumentSearch } from "@/lib/hooks/use-document-search";
import { useDocumentPermissions } from "@/lib/hooks/use-document-permissions";

export default function DocumentsPage() {
  const { selectedEntity } = useEntity();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentAction, setDocumentAction] = useState<string | null>(null);

  // Document permissions
  const permissions = useDocumentPermissions();

  // Document search functionality
  const {
    documents: searchedDocuments,
    isLoading: searchLoading,
    isSearching,
    filters,
    applyFilters,
    clearFilters,
    totalResults,
  } = useDocumentSearch(selectedEntity?.id || "", selectedFolder || undefined);

  const handleFilesDropped = (files: FileList) => {
    // Open the upload dialog when files are dropped
    setFileUploadDialogOpen(true);
  };

  const handleDocumentAction = (action: string, document: any) => {
    setSelectedDocument(document);
    setDocumentAction(action);
  };

  const handleDocumentActionClose = () => {
    setSelectedDocument(null);
    setDocumentAction(null);
  };

  if (!selectedEntity) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
              No Entity Selected
            </h2>
            <p className="text-muted-foreground mb-6">
              Please select an entity from the dropdown in the navigation bar to
              view and manage documents.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show access denied if user doesn't have permission to view documents
  if (!permissions.isLoading && !permissions.canView) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to view documents for {selectedEntity.name}.
              Contact your administrator to request access.
            </p>
            {permissions.role && (
              <p className="text-sm text-muted-foreground">
                Current access level: {permissions.role}
              </p>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <DocumentErrorBoundary
        onError={(error, errorInfo) => {
          console.error("Documents page error:", error, errorInfo);
        }}
      >
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Manage documents and files for {selectedEntity.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {permissions.canUpload && (
              <UploadButton selectedFolder={selectedFolder} />
            )}
            {permissions.canCreateFolders && (
              <Button variant="outline" onClick={() => setCreateFolderDialogOpen(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </Button>
            )}
            {!permissions.canView && !permissions.isLoading && (
              <div className="text-sm text-muted-foreground">
                {permissions.role ? `${permissions.role} access` : "No access"}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[600px]">
          {/* Folder Sidebar */}
          <div className="lg:col-span-1">
            <FolderSidebar
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Breadcrumb Navigation */}
            <BreadcrumbNavigation
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
              className="px-1"
            />

            {/* Search and Filters */}
            <SearchFilter
              onSearch={applyFilters}
              onClear={clearFilters}
              selectedFolder={selectedFolder}
            />

            {/* View Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {isSearching ? (
                      <>Showing {totalResults} of {totalResults} results</>
                    ) : (
                      <>Viewing {selectedFolder ? "folder contents" : "all documents"}</>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center border rounded-lg">
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="rounded-r-none"
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode("list")}
                        className="rounded-l-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document List/Grid */}
            <DocumentList
              selectedFolder={selectedFolder}
              viewMode={viewMode}
              onDocumentAction={handleDocumentAction}
              documents={searchedDocuments}
              isLoading={searchLoading}
              isSearching={isSearching}
              searchQuery={filters.query}
            />
          </div>
        </div>
        </div>

        {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        parentId={selectedFolder}
      />

      {/* File Upload Dialog */}
      <FileUpload
        open={fileUploadDialogOpen}
        onOpenChange={setFileUploadDialogOpen}
        selectedFolder={selectedFolder}
      />

      {/* Document Actions */}
      <DocumentActions
        document={selectedDocument}
        action={documentAction}
        onClose={handleDocumentActionClose}
      />

        {/* Drag & Drop Overlay */}
        <DragDropOverlay onFilesDropped={handleFilesDropped} />
      </DocumentErrorBoundary>
    </MainLayout>
  );
}