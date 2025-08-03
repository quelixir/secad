"use client";

import { useState, useCallback } from "react";
import { UploadDropzone } from "@uploadthing/react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useEntity } from "@/lib/entity-context";
import { useCreateDocument } from "@/lib/hooks/use-documents";
import { validateFiles, formatFileSize } from "@/lib/validation/file-validation";
import { useFileValidation, BulkValidationResults } from "./validation-helpers";
import { handleUploadError, handleValidationError } from "@/lib/services/document-error-service";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

interface FileUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFolder?: string | null;
}

export function FileUpload({ open, onOpenChange, selectedFolder }: FileUploadProps) {
  const { selectedEntity } = useEntity();
  const createDocument = useCreateDocument();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const { 
    validationResults, 
    globalErrors, 
    validateMultipleFiles, 
    clearValidationResults,
    getValidFiles,
    hasValidationErrors 
  } = useFileValidation();

  const handleUploadComplete = async (res: any) => {
    if (!selectedEntity) {
      toast.error("No entity selected");
      return;
    }

    try {
      setUploading(true);
      
      // Create document records for each uploaded file
      for (const file of res) {
        await createDocument.mutateAsync({
          entityId: selectedEntity.id,
          fileName: file.name,
          originalName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
          fileUrl: file.url,
          uploadKey: file.key,
          folderId: selectedFolder || undefined,
        });
      }

      setUploadedFiles(res);
      toast.success(`${res.length} file(s) uploaded successfully`);
    } catch (error) {
      handleUploadError(
        error instanceof Error ? error : new Error(String(error)),
        "Creating document records"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUploadThingError = (error: Error) => {
    handleUploadError(error, "File upload to UploadThing");
  };

  // Client-side file validation before upload
  const validateFilesBeforeUpload = useCallback((files: File[]) => {
    const { globalErrors } = validateMultipleFiles(files, {
      maxFiles: 10, // Limit to 10 files per upload
    });

    // Return whether all files are valid (no global errors)
    return globalErrors.length === 0;
  }, [validateMultipleFiles]);

  const handleClose = () => {
    setUploadedFiles([]);
    clearValidationResults();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Files
            {selectedFolder && (
              <span className="text-sm text-muted-foreground">
                to selected folder
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Validation Results */}
          {(validationResults.length > 0 || globalErrors.length > 0) && (
            <BulkValidationResults
              results={validationResults}
              globalErrors={globalErrors}
              onDismiss={clearValidationResults}
            />
          )}

          {uploadedFiles.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <UploadDropzone<OurFileRouter, "documentUploader">
                  endpoint="documentUploader"
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadThingError}
                  onBeforeUploadBegin={(files) => {
                    try {
                      // Validate files before upload begins
                      if (!validateFilesBeforeUpload(files)) {
                        // Return empty array to prevent upload
                        return [];
                      }
                      return files;
                    } catch (error) {
                      handleValidationError(
                        error instanceof Error ? error : new Error(String(error)),
                        "Pre-upload validation"
                      );
                      return [];
                    }
                  }}
                  appearance={{
                    container: "border-2 border-dashed border-muted-foreground/25 rounded-lg p-8",
                    uploadIcon: "text-muted-foreground",
                    label: "text-foreground font-medium",
                    allowedContent: "text-muted-foreground text-xs",
                    button: "bg-primary text-primary-foreground hover:bg-primary/90 ut-ready:bg-primary ut-uploading:bg-primary/50",
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Upload Complete!</span>
                </div>
                
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{file.name}</span>
                      <span className="text-muted-foreground">
                        ({formatFileSize(file.size)})
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleClose}>
                    Done
                  </Button>
                  <Button onClick={() => setUploadedFiles([])}>
                    Upload More Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}