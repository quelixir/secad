"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  ExternalLink, 
  ChevronDown,
  Loader2,
  Copy,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { useGenerateDownloadUrl } from "@/lib/hooks/use-documents";
import { formatFileSize } from "@/lib/validation/file-validation";
import { InlineLoading } from "./loading-states";

interface DownloadButtonProps {
  document: any;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg";
  showDropdown?: boolean;
  className?: string;
}

export function DownloadButton({ 
  document, 
  variant = "default",
  size = "default",
  showDropdown = false,
  className 
}: DownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const generateDownloadUrl = useGenerateDownloadUrl();

  const handleDownload = async (openInNewTab = false) => {
    if (!document) return;

    try {
      setIsLoading(true);
      const result = await generateDownloadUrl.mutateAsync({ id: document.id });
      
      if (openInNewTab) {
        // Open in new tab/window
        window.open(result.url, '_blank');
        toast.success("File opened in new tab");
      } else {
        // Direct download
        const link = document.createElement('a');
        link.href = result.url;
        link.download = document.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to download document"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      setIsLoading(true);
      const result = await generateDownloadUrl.mutateAsync({ id: document.id });
      await navigator.clipboard.writeText(result.url);
      toast.success("Download link copied to clipboard");
    } catch (error) {
      console.error("Error copying link:", error);
      toast.error("Failed to copy download link");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      // Fallback to copy link if Web Share API is not available
      handleCopyLink();
      return;
    }

    try {
      setIsLoading(true);
      const result = await generateDownloadUrl.mutateAsync({ id: document.id });
      
      await navigator.share({
        title: document.fileName,
        text: `Download ${document.fileName} (${formatFileSize(document.fileSize)})`,
        url: result.url,
      });
      
      toast.success("Share successful");
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Error sharing document:", error);
        // Fallback to copy link
        handleCopyLink();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!document) return null;

  // Simple download button without dropdown
  if (!showDropdown) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleDownload()}
        disabled={isLoading}
        className={className}
      >
        {isLoading ? (
          <InlineLoading size="sm" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {variant !== "secondary" && (
          <span className="ml-2">
            {isLoading ? "Downloading..." : "Download"}
          </span>
        )}
      </Button>
    );
  }

  // Download button with dropdown options
  return (
    <div className="flex">
      <Button
        variant={variant}
        size={size}
        onClick={() => handleDownload()}
        disabled={isLoading}
        className={`${className} rounded-r-none border-r-0`}
      >
        {isLoading ? (
          <InlineLoading size="sm" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {variant !== "secondary" && (
          <span className="ml-2">
            {isLoading ? "Downloading..." : "Download"}
          </span>
        )}
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isLoading}
            className="rounded-l-none px-2"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleDownload()}>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload(true)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Download Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}