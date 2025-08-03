export interface CertificateGenerationProgress {
  id: string;
  transactionId: string;
  userId: string;
  status: CertificateGenerationStatus;
  stage: CertificateGenerationStage;
  progress: number; // 0-100
  message: string;
  error?: string;
  startedAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number; // in milliseconds
  stageProgress: StageProgress[];
  metadata?: {
    templateId?: string;
    format?: "PDF" | "DOCX";
    certificateNumber?: string;
    fileSize?: number;
    checksum?: string;
    downloadUrl?: string;
  };
}

export type CertificateGenerationStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout";

export type CertificateGenerationStage =
  | "initializing"
  | "template_loading"
  | "data_validation"
  | "pdf_generation"
  | "file_preparation"
  | "download_ready"
  | "completed";

export interface StageProgress {
  stage: CertificateGenerationStage;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress: number; // 0-100
  message: string;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // in milliseconds
  error?: string;
}

export interface ProgressUpdate {
  id: string;
  status: CertificateGenerationStatus;
  stage: CertificateGenerationStage;
  progress: number;
  message: string;
  error?: string;
  estimatedTimeRemaining?: number;
  stageProgress: StageProgress[];
  metadata?: CertificateGenerationProgress["metadata"];
}

export interface ProgressOptions {
  timeout?: number; // in milliseconds, default 5 minutes
  enableCancellation?: boolean;
  enablePersistence?: boolean;
  updateInterval?: number; // in milliseconds, default 500ms
}

export interface ProgressAnalytics {
  generationId: string;
  transactionId: string;
  userId: string;
  totalDuration: number;
  stageDurations: Record<CertificateGenerationStage, number>;
  averageProgressRate: number;
  success: boolean;
  errorType?: string;
  fileSize?: number;
  templateId?: string;
  format?: "PDF" | "DOCX";
  createdAt: Date;
}

export interface ProgressError {
  type: "timeout" | "cancellation" | "generation_error" | "system_error";
  message: string;
  stage: CertificateGenerationStage;
  recoverable: boolean;
  retryCount?: number;
  maxRetries?: number;
}
