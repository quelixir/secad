"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragDropOverlayProps {
  onFilesDropped: (files: FileList) => void;
}

export function DragDropOverlay({ onFilesDropped }: DragDropOverlayProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(prev => prev + 1);
      
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragOver(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      setDragCounter(prev => {
        const newCounter = prev - 1;
        if (newCounter === 0) {
          setIsDragOver(false);
        }
        return newCounter;
      });
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      setDragCounter(0);
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        onFilesDropped(e.dataTransfer.files);
      }
    };

    // Add event listeners to document
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [onFilesDropped]);

  if (!isDragOver) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <Card className={cn(
        "border-2 border-dashed border-primary bg-primary/5 p-12 text-center transition-all",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}>
        <Upload className="mx-auto h-16 w-16 text-primary mb-4" />
        <h3 className="text-2xl font-bold text-primary mb-2">
          Drop files to upload
        </h3>
        <p className="text-muted-foreground">
          Release to start uploading your documents
        </p>
      </Card>
    </div>
  );
}