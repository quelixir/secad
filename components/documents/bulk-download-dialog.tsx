"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download, 
  CheckCircle, 
  AlertCircle, 
  X,
  Archive
} from "lucide-react";
import { toast } from "sonner";
import { useGenerateDownloadUrl } from "@/lib/hooks/use-documents";
import { formatFileSize } from "@/lib/validation/file-validation";
import { InlineLoading } from "./loading-states";

interface BulkDownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: any[];
  folderName?: string;
}

interface DownloadProgress {
  documentId: string;
  fileName: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  url?: string;
  error?: string;
}

export function BulkDownloadDialog({
  open,
  onOpenChange,
  documents,
  folderName,
}: BulkDownloadDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSize, setTotalSize] = useState(0);

  const generateDownloadUrl = useGenerateDownloadUrl();

  // Initialize progress when dialog opens
  useEffect(() => {
    if (open && documents.length > 0) {
      const initialProgress = documents.map(doc => ({
        documentId: doc.id,
        fileName: doc.fileName,
        status: 'pending' as const,
      }));
      setProgress(initialProgress);
      setCurrentStep(0);
      
      // Calculate total size
      const size = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0);
      setTotalSize(size);
    }
  }, [open, documents]);

  const downloadDocument = async (document: any): Promise<string | null> => {
    try {
      const result = await generateDownloadUrl.mutateAsync({ id: document.id });
      return result.url;
    } catch (error) {
      console.error(`Error downloading ${document.fileName}:`, error);
      return null;
    }
  };

  const downloadAllDocuments = async () => {
    if (isDownloading || documents.length === 0) return;

    setIsDownloading(true);
    const updatedProgress = [...progress];

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      setCurrentStep(i + 1);

      // Update status to downloading
      updatedProgress[i] = {
        ...updatedProgress[i],
        status: 'downloading',
      };
      setProgress([...updatedProgress]);

      try {
        const url = await downloadDocument(document);
        
        if (url) {
          // Trigger download
          const link = document.createElement('a');
          link.href = url;
          link.download = document.fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Small delay between downloads to avoid overwhelming the browser
          if (i < documents.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          updatedProgress[i] = {
            ...updatedProgress[i],
            status: 'completed',
            url,
          };
        } else {
          updatedProgress[i] = {
            ...updatedProgress[i],
            status: 'failed',
            error: 'Failed to generate download URL',
          };
        }
      } catch (error) {
        updatedProgress[i] = {
          ...updatedProgress[i],
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      setProgress([...updatedProgress]);
    }

    setIsDownloading(false);
    
    const successCount = updatedProgress.filter(p => p.status === 'completed').length;
    const failureCount = updatedProgress.filter(p => p.status === 'failed').length;

    if (failureCount === 0) {
      toast.success(`Successfully downloaded ${successCount} document${successCount !== 1 ? 's' : ''}`);
    } else if (successCount > 0) {
      toast.warning(`Downloaded ${successCount} documents, ${failureCount} failed`);
    } else {
      toast.error("All downloads failed");
    }
  };

  const handleClose = () => {
    if (!isDownloading) {
      onOpenChange(false);
      setProgress([]);
      setCurrentStep(0);
    }
  };

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const failedCount = progress.filter(p => p.status === 'failed').length;
  const progressPercentage = documents.length > 0 ? (currentStep / documents.length) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Bulk Download
            {folderName && (
              <span className="text-sm text-muted-foreground">- {folderName}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            Download multiple documents. Each file will be downloaded individually to your default download folder.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <div className="text-sm font-medium">Download Summary</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>{documents.length} document{documents.length !== 1 ? 's' : ''} selected</div>
              <div>Total size: {formatFileSize(totalSize)}</div>
              {progress.length > 0 && (
                <div>
                  Status: {completedCount} completed, {failedCount} failed, {documents.length - completedCount - failedCount} remaining
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          {isDownloading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{currentStep} of {documents.length}</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
          )}

          {/* Download Status */}
          {progress.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {progress.map((item, index) => (
                <div
                  key={item.documentId}
                  className="flex items-center justify-between text-xs p-2 rounded border"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item.status === 'completed' && (
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                    )}
                    {item.status === 'failed' && (
                      <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                    )}
                    {item.status === 'downloading' && (
                      <InlineLoading size="xs" />
                    )}
                    {item.status === 'pending' && (
                      <div className="h-3 w-3 bg-muted-foreground/30 rounded-full flex-shrink-0" />
                    )}
                    <span className="truncate">{item.fileName}</span>
                  </div>
                  <div className="text-muted-foreground ml-2">
                    {item.status === 'completed' && 'Downloaded'}
                    {item.status === 'failed' && 'Failed'}
                    {item.status === 'downloading' && 'Downloading...'}
                    {item.status === 'pending' && 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {documents.length > 10 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Downloading {documents.length} files may take some time and could trigger multiple download prompts in your browser.
              </AlertDescription>
            </Alert>
          )}

          {failedCount > 0 && !isDownloading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {failedCount} download{failedCount !== 1 ? 's' : ''} failed. You can retry failed downloads or contact support if the issue persists.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDownloading}
          >
            {isDownloading ? "Close when done" : "Close"}
          </Button>
          <Button
            onClick={downloadAllDocuments}
            disabled={isDownloading || documents.length === 0}
          >
            {isDownloading ? (
              <>
                <InlineLoading size="sm" className="mr-2" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download All ({documents.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}