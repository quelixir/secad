"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Move, FolderOpen, Home, File } from "lucide-react";
import { toast } from "sonner";
import { useFolders, useMoveDocument } from "@/lib/hooks/use-documents";
import { useEntity } from "@/lib/entity-context";
import { formatFileSize } from "@/lib/validation/file-validation";

interface MoveDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any;
}

interface FolderOption {
  id: string | null;
  name: string;
  path: string;
  level: number;
  disabled?: boolean;
}

export function MoveDocumentDialog({
  open,
  onOpenChange,
  document,
}: MoveDocumentDialogProps) {
  const { selectedEntity } = useEntity();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const { data: folders } = useFolders(selectedEntity?.id || "");
  const moveDocument = useMoveDocument();

  // Build folder options with hierarchy
  const folderOptions = useMemo((): FolderOption[] => {
    if (!folders) return [];

    const options: FolderOption[] = [
      {
        id: null,
        name: "All Documents (Root)",
        path: "Root",
        level: 0,
      }
    ];

    // Build folder tree with paths
    const folderMap = new Map(folders.map(f => [f.id, f]));
    
    const buildPath = (folder: any): string => {
      const path: string[] = [];
      let current = folder;
      
      while (current) {
        path.unshift(current.name);
        current = current.parentId ? folderMap.get(current.parentId) : undefined;
      }
      
      return path.join(" > ");
    };

    const addFolderOption = (folder: any, level: number = 0) => {
      options.push({
        id: folder.id,
        name: folder.name,
        path: buildPath(folder),
        level,
        disabled: folder.id === document?.folderId, // Can't move to current folder
      });

      // Add children
      const children = folders.filter(f => f.parentId === folder.id);
      children.forEach(child => addFolderOption(child, level + 1));
    };

    // Add root folders first
    const rootFolders = folders.filter(f => !f.parentId);
    rootFolders.forEach(folder => addFolderOption(folder, 1));

    return options;
  }, [folders, document?.folderId]);

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && document) {
      setSelectedFolderId(document.folderId);
    } else if (!newOpen) {
      setSelectedFolderId(null);
    }
    onOpenChange(newOpen);
  };

  const handleMove = async () => {
    if (!document) return;

    // Check if folder actually changed
    if (selectedFolderId === document.folderId) {
      onOpenChange(false);
      return;
    }

    try {
      setIsMoving(true);

      await moveDocument.mutateAsync({
        id: document.id,
        targetFolderId: selectedFolderId || undefined,
      });

      const targetFolder = folderOptions.find(f => f.id === selectedFolderId);
      const targetName = targetFolder?.name || "Root";
      
      toast.success(`Document moved to ${targetName}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error moving document:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to move document. Please try again."
      );
    } finally {
      setIsMoving(false);
    }
  };

  if (!document) return null;

  const currentFolder = folderOptions.find(f => f.id === document.folderId);
  const targetFolder = folderOptions.find(f => f.id === selectedFolderId);
  const hasChanged = selectedFolderId !== document.folderId;
  const canMove = hasChanged && !isMoving;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-5 w-5" />
            Move Document
          </DialogTitle>
          <DialogDescription>
            Choose a new folder for this document. The document will be moved from its current location.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
                  <div>Current location: {currentFolder?.path || "Root"}</div>
                  {document.description && (
                    <div>Description: {document.description}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Folder Selection */}
          <div className="space-y-2">
            <Label htmlFor="folder-select">Move to Folder</Label>
            <Select
              value={selectedFolderId || "root"}
              onValueChange={(value) => setSelectedFolderId(value === "root" ? null : value)}
            >
              <SelectTrigger id="folder-select">
                <SelectValue placeholder="Select destination folder" />
              </SelectTrigger>
              <SelectContent>
                {folderOptions.map((option) => (
                  <SelectItem
                    key={option.id || "root"}
                    value={option.id || "root"}
                    disabled={option.disabled}
                    className={option.disabled ? "opacity-50" : ""}
                  >
                    <div className="flex items-center gap-2">
                      {option.id === null ? (
                        <Home className="h-4 w-4" />
                      ) : (
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                      )}
                      <span style={{ paddingLeft: `${option.level * 12}px` }}>
                        {option.name}
                      </span>
                      {option.disabled && (
                        <span className="text-xs text-muted-foreground">(current)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetFolder && (
              <p className="text-xs text-muted-foreground">
                Full path: {targetFolder.path}
              </p>
            )}
          </div>

          {/* Move Summary */}
          {hasChanged && (
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Move Summary</div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">From:</span>
                  <span>{currentFolder?.path || "Root"}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">{targetFolder?.path || "Root"}</span>
                </div>
              </div>
            </div>
          )}

          {/* No Change Notice */}
          {!hasChanged && (
            <div className="rounded-lg bg-muted p-3">
              <div className="text-xs text-muted-foreground">
                Select a different folder to move this document.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!canMove}
          >
            {isMoving ? "Moving..." : "Move Document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}