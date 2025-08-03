import { EventEmitter } from "events";
import {
  CertificateGenerationProgress,
  CertificateGenerationStatus,
  CertificateGenerationStage,
  StageProgress,
  ProgressUpdate,
  ProgressOptions,
  ProgressAnalytics,
  ProgressError,
} from "@/lib/types/interfaces/CertificateProgress";

export class CertificateProgressTracker extends EventEmitter {
  private progressMap = new Map<string, CertificateGenerationProgress>();
  private readonly defaultTimeout = 5 * 60 * 1000; // 5 minutes
  private readonly defaultUpdateInterval = 500; // 500ms
  private readonly logger = console; // Replace with proper logging service

  /**
   * Initialize a new progress tracking session
   */
  initializeProgress(
    transactionId: string,
    userId: string,
    options: ProgressOptions = {},
  ): string {
    const progressId = this.generateProgressId(transactionId, userId);
    const now = new Date();

    const progress: CertificateGenerationProgress = {
      id: progressId,
      transactionId,
      userId,
      status: "pending",
      stage: "initializing",
      progress: 0,
      message: "Initializing certificate generation...",
      startedAt: now,
      updatedAt: now,
      stageProgress: this.initializeStageProgress(),
    };

    this.progressMap.set(progressId, progress);
    this.emit("progress_initialized", progress);

    // Set up timeout if enabled
    if (options.timeout !== undefined) {
      this.setupTimeout(progressId, options.timeout);
    }

    return progressId;
  }

  /**
   * Update progress for a specific stage
   */
  updateProgress(
    progressId: string,
    stage: CertificateGenerationStage,
    progress: number,
    message: string,
    metadata?: Partial<CertificateGenerationProgress["metadata"]>,
  ): void {
    const progressData = this.progressMap.get(progressId);
    if (!progressData) {
      this.logger.warn(`Progress ID not found: ${progressId}`);
      return;
    }

    const now = new Date();
    const stageProgress = progressData.stageProgress.find(
      (s) => s.stage === stage,
    );

    if (stageProgress) {
      stageProgress.progress = Math.min(100, Math.max(0, progress));
      stageProgress.message = message;
      stageProgress.status = progress >= 100 ? "completed" : "in_progress";
      if (progress >= 100 && !stageProgress.completedAt) {
        stageProgress.completedAt = now;
        stageProgress.duration =
          stageProgress.completedAt.getTime() -
          stageProgress.startedAt.getTime();
      }
    }

    // Update overall progress
    progressData.stage = stage;
    progressData.progress = this.calculateOverallProgress(
      progressData.stageProgress,
    );
    progressData.message = message;
    progressData.status = "in_progress";
    progressData.updatedAt = now;
    progressData.estimatedTimeRemaining =
      this.calculateEstimatedTimeRemaining(progressData);

    if (metadata) {
      progressData.metadata = { ...progressData.metadata, ...metadata };
    }

    this.progressMap.set(progressId, progressData);
    this.emit("progress_updated", this.createProgressUpdate(progressData));
  }

  /**
   * Complete a stage
   */
  completeStage(
    progressId: string,
    stage: CertificateGenerationStage,
    message: string,
  ): void {
    this.updateProgress(progressId, stage, 100, message);
  }

  /**
   * Mark generation as completed
   */
  completeGeneration(
    progressId: string,
    metadata?: Partial<CertificateGenerationProgress["metadata"]>,
  ): void {
    const progressData = this.progressMap.get(progressId);
    if (!progressData) {
      this.logger.warn(`Progress ID not found: ${progressId}`);
      return;
    }

    const now = new Date();
    progressData.status = "completed";
    progressData.stage = "completed";
    progressData.progress = 100;
    progressData.message = "Certificate generation completed successfully";
    progressData.completedAt = now;
    progressData.updatedAt = now;
    progressData.estimatedTimeRemaining = 0;

    if (metadata) {
      progressData.metadata = { ...progressData.metadata, ...metadata };
    }

    // Complete all remaining stages
    progressData.stageProgress.forEach((stage) => {
      if (stage.status === "pending") {
        stage.status = "completed";
        stage.progress = 100;
        stage.completedAt = now;
        stage.duration =
          stage.completedAt.getTime() - stage.startedAt.getTime();
      }
    });

    this.progressMap.set(progressId, progressData);
    this.emit("progress_completed", this.createProgressUpdate(progressData));

    // Clean up after a delay
    setTimeout(() => {
      this.cleanupProgress(progressId);
    }, 60000); // Clean up after 1 minute
  }

  /**
   * Mark generation as failed
   */
  failGeneration(
    progressId: string,
    error: string,
    stage: CertificateGenerationStage,
  ): void {
    const progressData = this.progressMap.get(progressId);
    if (!progressData) {
      this.logger.warn(`Progress ID not found: ${progressId}`);
      return;
    }

    const now = new Date();
    progressData.status = "failed";
    progressData.stage = stage;
    progressData.error = error;
    progressData.updatedAt = now;

    // Mark current stage as failed
    const stageProgress = progressData.stageProgress.find(
      (s) => s.stage === stage,
    );
    if (stageProgress) {
      stageProgress.status = "failed";
      stageProgress.error = error;
      stageProgress.completedAt = now;
      stageProgress.duration =
        stageProgress.completedAt.getTime() - stageProgress.startedAt.getTime();
    }

    this.progressMap.set(progressId, progressData);
    this.emit("progress_failed", this.createProgressUpdate(progressData));

    // Clean up after a delay
    setTimeout(() => {
      this.cleanupProgress(progressId);
    }, 60000); // Clean up after 1 minute
  }

  /**
   * Cancel generation
   */
  cancelGeneration(progressId: string): boolean {
    const progressData = this.progressMap.get(progressId);
    if (!progressData) {
      this.logger.warn(`Progress ID not found: ${progressId}`);
      return false;
    }

    const now = new Date();
    progressData.status = "cancelled";
    progressData.message = "Certificate generation cancelled by user";
    progressData.updatedAt = now;

    this.progressMap.set(progressId, progressData);
    this.emit("progress_cancelled", this.createProgressUpdate(progressData));

    // Clean up after a delay instead of immediately
    setTimeout(() => {
      this.cleanupProgress(progressId);
    }, 1000);
    return true;
  }

  /**
   * Get current progress
   */
  getProgress(progressId: string): CertificateGenerationProgress | null {
    return this.progressMap.get(progressId) || null;
  }

  /**
   * Get progress analytics
   */
  getProgressAnalytics(progressId: string): ProgressAnalytics | null {
    const progress = this.progressMap.get(progressId);
    if (!progress || !progress.completedAt) {
      return null;
    }

    const totalDuration =
      progress.completedAt.getTime() - progress.startedAt.getTime();
    const stageDurations: Record<CertificateGenerationStage, number> = {
      initializing: 0,
      template_loading: 0,
      data_validation: 0,
      pdf_generation: 0,
      file_preparation: 0,
      download_ready: 0,
      completed: 0,
    };

    progress.stageProgress.forEach((stage) => {
      if (stage.duration) {
        stageDurations[stage.stage] = stage.duration;
      }
    });

    const averageProgressRate =
      totalDuration > 0 ? 100 / (totalDuration / 1000) : 0;

    return {
      generationId: progressId,
      transactionId: progress.transactionId,
      userId: progress.userId,
      totalDuration,
      stageDurations,
      averageProgressRate,
      success: progress.status === "completed",
      errorType: progress.error ? "generation_error" : undefined,
      fileSize: progress.metadata?.fileSize,
      templateId: progress.metadata?.templateId,
      format: progress.metadata?.format,
      createdAt: progress.startedAt,
    };
  }

  /**
   * Subscribe to progress updates
   */
  subscribeToProgress(
    progressId: string,
    callback: (update: ProgressUpdate) => void,
  ): () => void {
    const handler = (update: ProgressUpdate) => {
      if (update.id === progressId) {
        callback(update);
      }
    };

    this.on("progress_updated", handler);
    this.on("progress_completed", handler);
    this.on("progress_failed", handler);
    this.on("progress_cancelled", handler);

    // Send current progress immediately
    const currentProgress = this.getProgress(progressId);
    if (currentProgress) {
      callback(this.createProgressUpdate(currentProgress));
    }

    // Return unsubscribe function
    return () => {
      this.off("progress_updated", handler);
      this.off("progress_completed", handler);
      this.off("progress_failed", handler);
      this.off("progress_cancelled", handler);
    };
  }

  /**
   * Clean up old progress data
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [progressId, progress] of this.progressMap.entries()) {
      const age = now - progress.updatedAt.getTime();
      if (age > maxAge) {
        this.progressMap.delete(progressId);
        this.logger.log(`Cleaned up old progress: ${progressId}`);
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeGenerations: number;
    completedGenerations: number;
    failedGenerations: number;
    averageDuration: number;
  } {
    const active = Array.from(this.progressMap.values()).filter(
      (p) => p.status === "in_progress",
    ).length;
    const completed = Array.from(this.progressMap.values()).filter(
      (p) => p.status === "completed",
    ).length;
    const failed = Array.from(this.progressMap.values()).filter(
      (p) => p.status === "failed",
    ).length;

    const completedWithDuration = Array.from(this.progressMap.values()).filter(
      (p) => p.status === "completed" && p.completedAt,
    );

    const averageDuration =
      completedWithDuration.length > 0
        ? completedWithDuration.reduce(
            (sum, p) =>
              sum + (p.completedAt!.getTime() - p.startedAt.getTime()),
            0,
          ) / completedWithDuration.length
        : 0;

    return {
      activeGenerations: active,
      completedGenerations: completed,
      failedGenerations: failed,
      averageDuration,
    };
  }

  // Private helper methods

  private generateProgressId(transactionId: string, userId: string): string {
    return `${transactionId}_${userId}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  private initializeStageProgress(): StageProgress[] {
    const stages: CertificateGenerationStage[] = [
      "initializing",
      "template_loading",
      "data_validation",
      "pdf_generation",
      "file_preparation",
      "download_ready",
      "completed",
    ];

    const now = new Date();
    return stages.map((stage) => ({
      stage,
      status: "pending",
      progress: 0,
      message: `Waiting for ${stage.replace(/_/g, " ")}...`,
      startedAt: now,
    }));
  }

  private calculateOverallProgress(stageProgress: StageProgress[]): number {
    const totalStages = stageProgress.length;
    const totalProgress = stageProgress.reduce(
      (sum, stage) => sum + stage.progress,
      0,
    );
    return Math.round(totalProgress / totalStages);
  }

  private calculateEstimatedTimeRemaining(
    progress: CertificateGenerationProgress,
  ): number | undefined {
    if (progress.progress <= 0 || progress.progress >= 100) {
      return 0;
    }

    const elapsed = Date.now() - progress.startedAt.getTime();
    const estimatedTotal = (elapsed / progress.progress) * 100;
    return Math.max(0, estimatedTotal - elapsed);
  }

  private createProgressUpdate(
    progress: CertificateGenerationProgress,
  ): ProgressUpdate {
    return {
      id: progress.id,
      status: progress.status,
      stage: progress.stage,
      progress: progress.progress,
      message: progress.message,
      error: progress.error,
      estimatedTimeRemaining: progress.estimatedTimeRemaining,
      stageProgress: progress.stageProgress,
      metadata: progress.metadata,
    };
  }

  private setupTimeout(progressId: string, timeout: number): void {
    setTimeout(() => {
      const progress = this.progressMap.get(progressId);
      if (progress && progress.status === "in_progress") {
        this.failGeneration(
          progressId,
          "Certificate generation timed out",
          progress.stage,
        );
      }
    }, timeout);
  }

  private cleanupProgress(progressId: string): void {
    this.progressMap.delete(progressId);
    this.logger.log(`Cleaned up progress: ${progressId}`);
  }
}

// Export singleton instance
export const certificateProgressTracker = new CertificateProgressTracker();

// Clean up old progress data every 5 minutes
setInterval(
  () => {
    certificateProgressTracker.cleanup();
  },
  5 * 60 * 1000,
);
