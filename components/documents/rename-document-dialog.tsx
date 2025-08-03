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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useUpdateDocument } from "@/lib/hooks/use-documents";
import { validateFilename, getFileExtension } from "@/lib/validation/file-validation";

interface RenameDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
}

export function RenameDocumentDialog({
  open,
  onOpenChange,
  document,
}: RenameDocumentDialogProps) {
  const [fileName, setFileName] = useState(document?.fileName || "");
  const [description, setDescription] = useState(document?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const updateDocument = useUpdateDocument();

  // Reset form when dialog opens/closes or document changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && document) {
      setFileName(document.fileName || "");
      setDescription(document.description || "");
      setValidationError(null);
    } else if (!newOpen) {
      setFileName("");
      setDescription("");
      setValidationError(null);
    }
    onOpenChange(newOpen);
  };

  // Validate filename as user types
  const handleFileNameChange = (value: string) => {
    setFileName(value);
    
    if (value.trim() === "") {
      setValidationError("File name cannot be empty");
      return;
    }

    // Validate filename
    const validation = validateFilename(value);
    if (!validation.isValid) {
      setValidationError(validation.errors[0]);
      return;
    }

    // Check if extension changed
    const originalExtension = getFileExtension(document?.fileName || "");
    const newExtension = getFileExtension(value);
    
    if (originalExtension !== newExtension) {
      setValidationError("File extension cannot be changed");
      return;
    }

    setValidationError(null);
  };

  const handleSubmit = async () => {
    if (!document || !fileName.trim()) return;

    // Final validation
    if (validationError) {
      toast.error(`Cannot rename document: ${validationError}`);
      return;
    }

    // Check if anything changed
    if (fileName === document.fileName && description === (document.description || "")) {
      onOpenChange(false);
      return;
    }

    try {
      setIsSubmitting(true);

      await updateDocument.mutateAsync({
        id: document.id,
        fileName: fileName.trim(),
        description: description.trim() || undefined,
      });

      toast.success("Document renamed successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error renaming document:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to rename document. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!document) return null;

  const hasChanges = fileName !== document.fileName || description !== (document.description || "");
  const canSubmit = !validationError && fileName.trim() !== "" && hasChanges && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Rename Document
          </DialogTitle>
          <DialogDescription>
            Update the document name and description. The file extension cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => handleFileNameChange(e.target.value)}
              placeholder="Enter document name"
              className={validationError ? "border-destructive" : ""}
            />
            {validationError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{validationError}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Original: {document.fileName}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this document"
              rows={3}
            />
          </div>

          {/* Document Info */}
          <div className="rounded-lg bg-muted p-3 space-y-1">
            <div className="text-xs text-muted-foreground">Document Information</div>
            <div className="text-sm">
              <span className="font-medium">Type:</span> {document.mimeType}
            </div>
            <div className="text-sm">
              <span className="font-medium">Size:</span> {(document.fileSize / 1024 / 1024).toFixed(2)} MB
            </div>
            <div className="text-sm">
              <span className="font-medium">Created:</span> {new Date(document.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? "Renaming..." : "Rename Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}