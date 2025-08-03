"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle, File } from "lucide-react";
import { toast } from "sonner";
import { useDeleteDocument } from "@/lib/hooks/use-documents";
import { formatFileSize } from "@/lib/validation/file-validation";

interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
}

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  document,
}: DeleteDocumentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const deleteDocument = useDeleteDocument();

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmationText("");
    }
    onOpenChange(newOpen);
  };

  const handleDelete = async () => {
    if (!document) return;

    try {
      setIsDeleting(true);

      await deleteDocument.mutateAsync({ id: document.id });

      toast.success("Document deleted successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to delete document. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!document) return null;

  const expectedConfirmation = document.fileName;
  const canDelete = confirmationText === expectedConfirmation && !isDeleting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete Document
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The document will be permanently deleted from storage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently delete the document and remove it from all folders. 
              This action cannot be undone.
            </AlertDescription>
          </Alert>

          {/* Document Preview */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <File className="h-8 w-8 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate">
                  {document.fileName}
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Size: {formatFileSize(document.fileSize)}</div>
                  <div>Type: {document.mimeType}</div>
                  <div>Created: {new Date(document.createdAt).toLocaleDateString()}</div>
                  {document.description && (
                    <div className="mt-2">
                      <span className="font-medium">Description:</span> {document.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label htmlFor="confirmation" className="text-sm font-medium">
              Type the document name to confirm deletion:
            </label>
            <div className="text-xs text-muted-foreground mb-2">
              Expected: <code className="bg-muted px-1 py-0.5 rounded">{expectedConfirmation}</code>
            </div>
            <input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${expectedConfirmation}" to confirm`}
              className="w-full px-3 py-2 border border-input bg-background text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              autoComplete="off"
            />
          </div>

          {/* Additional Warning */}
          <div className="rounded-lg bg-muted p-3">
            <div className="text-xs text-muted-foreground mb-1">What happens when you delete this document:</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• The file will be permanently removed from storage</li>
              <li>• All references to this document will be deleted</li>
              <li>• The document will be removed from its current folder</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete}
          >
            {isDeleting ? "Deleting..." : "Delete Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}