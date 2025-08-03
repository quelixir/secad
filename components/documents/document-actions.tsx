"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  File,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useGenerateDownloadUrl } from "@/lib/hooks/use-documents";
import { RenameDocumentDialog } from "./rename-document-dialog";
import { DeleteDocumentDialog } from "./delete-document-dialog";
import { MoveDocumentDialog } from "./move-document-dialog";
import { formatFileSize } from "@/lib/validation/file-validation";
import { handleDownloadError, handleDocumentError } from "@/lib/services/document-error-service";
import { useDocumentErrorHandler } from "./error-boundary";


interface DocumentActionsProps {
  document: any;
  action: string | null;
  onClose: () => void;
}


export function DocumentActions({ document, action, onClose }: DocumentActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const generateDownloadUrl = useGenerateDownloadUrl();
  const { handleError } = useDocumentErrorHandler();

  const handleDownload = async () => {
    if (!document) return;

    try {
      setIsSubmitting(true);
      const result = await generateDownloadUrl.mutateAsync({ id: document.id });
      
      // Open in new tab/window for download
      window.open(result.url, '_blank');
      toast.success("Download started");
      onClose();
    } catch (error) {
      handleDownloadError(
        error instanceof Error ? error : new Error(String(error)),
        `Download document: ${document.fileName}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!document) return null;

  // Document Details View
  if (action === "view") {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Document Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">{document.fileName}</h3>
              {document.description && (
                <p className="text-sm text-muted-foreground">{document.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">File Size:</span>
                <p className="text-muted-foreground">{formatFileSize(document.fileSize)}</p>
              </div>
              <div>
                <span className="font-medium">File Type:</span>
                <p className="text-muted-foreground">{document.mimeType}</p>
              </div>
              <div>
                <span className="font-medium">Uploaded:</span>
                <p className="text-muted-foreground">
                  {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <span className="font-medium">Uploaded By:</span>
                <p className="text-muted-foreground">{typeof document.uploadedBy === 'string' ? 'User' : (document.uploadedBy as any)?.name || 'Unknown'}</p>
              </div>
            </div>

            {document.tags && document.tags.length > 0 && (
              <div>
                <span className="font-medium text-sm">Tags:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {document.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownload} disabled={isSubmitting}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => window.open(document.fileUrl, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Use individual dialog components for operations
  if (action === "rename") {
    return (
      <RenameDocumentDialog
        open={true}
        onOpenChange={onClose}
        document={document}
      />
    );
  }

  if (action === "move") {
    return (
      <MoveDocumentDialog
        open={true}
        onOpenChange={onClose}
        document={document}
      />
    );
  }

  if (action === "delete") {
    return (
      <DeleteDocumentDialog
        open={true}
        onOpenChange={onClose}
        document={document}
      />
    );
  }

  // Handle download action
  if (action === "download") {
    // Trigger download and close
    handleDownload();
    return null;
  }

  return null;
}