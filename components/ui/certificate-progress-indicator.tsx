"use client";

import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import {
  CertificateGenerationProgress,
  CertificateGenerationStatus,
  CertificateGenerationStage,
  ProgressUpdate,
} from "@/lib/types/interfaces/CertificateProgress";

interface CertificateProgressIndicatorProps {
  progressId: string;
  onComplete?: (result: { success: boolean; downloadUrl?: string }) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

const stageLabels: Record<CertificateGenerationStage, string> = {
  initializing: "Initializing",
  template_loading: "Loading Template",
  data_validation: "Validating Data",
  pdf_generation: "Generating PDF",
  file_preparation: "Preparing File",
  download_ready: "Ready for Download",
  completed: "Completed",
};

const stageDescriptions: Record<CertificateGenerationStage, string> = {
  initializing: "Setting up certificate generation...",
  template_loading: "Loading certificate template from database...",
  data_validation: "Validating transaction and entity data...",
  pdf_generation: "Converting template to PDF format...",
  file_preparation: "Finalizing certificate file...",
  download_ready: "Certificate is ready for download",
  completed: "Certificate generation completed successfully",
};

const statusColors: Record<CertificateGenerationStatus, string> = {
  pending: "bg-gray-500",
  in_progress: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  cancelled: "bg-yellow-500",
  timeout: "bg-orange-500",
};

const statusIcons: Record<CertificateGenerationStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  in_progress: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4" />,
  failed: <XCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
  timeout: <XCircle className="h-4 w-4" />,
};

export function CertificateProgressIndicator({
  progressId,
  onComplete,
  onCancel,
  onError,
}: CertificateProgressIndicatorProps) {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectToProgress = () => {
      try {
        eventSource = new EventSource(
          `/api/certificates/progress/${progressId}`,
        );

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (event) => {
          try {
            const update: ProgressUpdate = JSON.parse(event.data);
            setProgress(update);

            // Handle completion
            if (update.status === "completed") {
              onComplete?.({
                success: true,
                downloadUrl: update.metadata?.downloadUrl,
              });
            } else if (
              update.status === "failed" ||
              update.status === "cancelled"
            ) {
              onError?.(update.error || "Generation failed");
            }
          } catch (parseError) {
            console.error("Failed to parse progress update:", parseError);
          }
        };

        eventSource.onerror = (error) => {
          console.error("EventSource error:", error);
          setIsConnected(false);
          setError("Connection lost. Attempting to reconnect...");

          // Attempt to reconnect after 2 seconds
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          reconnectTimeout = setTimeout(() => {
            if (eventSource) {
              eventSource.close();
              connectToProgress();
            }
          }, 2000);
        };
      } catch (error) {
        console.error("Failed to connect to progress stream:", error);
        setError("Failed to connect to progress stream");
      }
    };

    connectToProgress();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [progressId, onComplete, onError]);

  const handleCancel = async () => {
    try {
      const response = await fetch(`/api/certificates/progress/${progressId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onCancel?.();
      } else {
        setError("Failed to cancel generation");
      }
    } catch (error) {
      console.error("Error cancelling generation:", error);
      setError("Failed to cancel generation");
    }
  };

  const formatTimeRemaining = (milliseconds?: number): string => {
    if (!milliseconds || milliseconds <= 0) return "";

    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
  };

  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Connecting to Progress Stream...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={0} className="w-full" />
          <p className="text-sm text-muted-foreground mt-2">
            Establishing connection to track certificate generation progress...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {statusIcons[progress.status]}
            Certificate Generation Progress
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                progress.status === "completed" ? "default" : "secondary"
              }
              className={statusColors[progress.status]}
            >
              {progress.status.replace("_", " ").toUpperCase()}
            </Badge>
            {!isConnected && <Badge variant="destructive">Disconnected</Badge>}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {progress.message}
            {progress.estimatedTimeRemaining && (
              <span className="ml-2">
                (Est. {formatTimeRemaining(progress.estimatedTimeRemaining)}{" "}
                remaining)
              </span>
            )}
          </p>
        </div>

        {/* Stage Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Generation Stages</h4>
          {progress.stageProgress.map((stage) => (
            <div key={stage.stage} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-4 h-4">
                {stage.status === "completed" && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {stage.status === "in_progress" && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {stage.status === "failed" && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {stage.status === "pending" && (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {stageLabels[stage.stage]}
                  </span>
                  <span className="text-muted-foreground">
                    {stage.progress}%
                  </span>
                </div>
                <Progress value={stage.progress} className="w-full h-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stage.message}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {progress.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{progress.error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Error */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-muted-foreground">
            {progress.metadata?.fileSize && (
              <span>
                File size: {(progress.metadata.fileSize / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {(progress.status === "in_progress" ||
              progress.status === "pending") && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={!isConnected}
              >
                Cancel Generation
              </Button>
            )}
            {progress.status === "completed" &&
              progress.metadata?.downloadUrl && (
                <Button asChild>
                  <a href={progress.metadata.downloadUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download Certificate
                  </a>
                </Button>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
