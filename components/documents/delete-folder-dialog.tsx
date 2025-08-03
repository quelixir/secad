"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useDeleteFolder } from "@/lib/hooks/use-documents";
import { useEntity } from "@/lib/entity-context";
import { toast } from "sonner";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: any;
}

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folder,
}: DeleteFolderDialogProps) {
  const { selectedEntity } = useEntity();
  const deleteFolder = useDeleteFolder();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!folder) {
      toast.error("No folder selected");
      return;
    }

    try {
      setIsDeleting(true);

      await deleteFolder.mutateAsync({ id: folder.id });

      toast.success("Folder deleted successfully");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      
      // Handle specific error messages
      if (error.message?.includes("contains")) {
        toast.error("Cannot delete folder that contains files or subfolders");
      } else {
        toast.error("Failed to delete folder");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!folder) return null;

  const hasContent = folder.children?.length > 0 || folder._count?.documents > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Folder
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the folder "{folder.name}"?
            </p>
            
            {hasContent && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">This folder is not empty</p>
                  <p>
                    This folder contains {folder._count?.documents || 0} document(s) and{" "}
                    {folder.children?.length || 0} subfolder(s). You must move or delete
                    all contents before deleting this folder.
                  </p>
                </div>
              </div>
            )}
            
            {!hasContent && (
              <p className="text-destructive">
                This action cannot be undone.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || hasContent}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Folder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}