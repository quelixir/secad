"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { FileUpload } from "./file-upload";

interface UploadButtonProps {
  selectedFolder?: string | null;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function UploadButton({ 
  selectedFolder, 
  variant = "default", 
  size = "default",
  className,
  children 
}: UploadButtonProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  return (
    <>
      <Button 
        variant={variant} 
        size={size}
        className={className}
        onClick={() => setUploadDialogOpen(true)}
      >
        <Upload className="mr-2 h-4 w-4" />
        {children || "Upload Files"}
      </Button>

      <FileUpload
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        selectedFolder={selectedFolder}
      />
    </>
  );
}