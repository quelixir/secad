import { CertificateProgressTracker } from "./certificate-progress-tracker";
import { CertificateGenerationStage } from "@/lib/types/interfaces/CertificateProgress";

describe("CertificateProgressTracker", () => {
  let tracker: CertificateProgressTracker;

  beforeEach(() => {
    tracker = new CertificateProgressTracker();
  });

  afterEach(() => {
    tracker.cleanup();
  });

  describe("initializeProgress", () => {
    it("should initialize progress with correct default values", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      expect(progressId).toBeDefined();
      expect(progressId).toContain("txn123");
      expect(progressId).toContain("user456");

      const progress = tracker.getProgress(progressId);
      expect(progress).toBeDefined();
      expect(progress?.transactionId).toBe("txn123");
      expect(progress?.userId).toBe("user456");
      expect(progress?.status).toBe("pending");
      expect(progress?.stage).toBe("initializing");
      expect(progress?.progress).toBe(0);
      expect(progress?.stageProgress).toHaveLength(7);
    });

    it("should initialize with custom options", () => {
      const progressId = tracker.initializeProgress("txn123", "user456", {
        timeout: 60000,
        enableCancellation: true,
        enablePersistence: false,
      });

      const progress = tracker.getProgress(progressId);
      expect(progress).toBeDefined();
    });
  });

  describe("updateProgress", () => {
    it("should update progress for a specific stage", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      tracker.updateProgress(
        progressId,
        "template_loading",
        50,
        "Loading template...",
      );

      const progress = tracker.getProgress(progressId);
      expect(progress?.stage).toBe("template_loading");
      expect(progress?.progress).toBeGreaterThan(0);
      expect(progress?.message).toBe("Loading template...");

      const stageProgress = progress?.stageProgress.find(
        (s) => s.stage === "template_loading",
      );
      expect(stageProgress?.progress).toBe(50);
      expect(stageProgress?.status).toBe("in_progress");
    });

    it("should complete a stage when progress reaches 100", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      tracker.updateProgress(
        progressId,
        "template_loading",
        100,
        "Template loaded",
      );

      const progress = tracker.getProgress(progressId);
      const stageProgress = progress?.stageProgress.find(
        (s) => s.stage === "template_loading",
      );
      expect(stageProgress?.status).toBe("completed");
      expect(stageProgress?.completedAt).toBeDefined();
    });

    it("should handle metadata updates", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      tracker.updateProgress(
        progressId,
        "pdf_generation",
        75,
        "Generating PDF...",
        { templateId: "template123", format: "PDF" },
      );

      const progress = tracker.getProgress(progressId);
      expect(progress?.metadata?.templateId).toBe("template123");
      expect(progress?.metadata?.format).toBe("PDF");
    });
  });

  describe("completeStage", () => {
    it("should complete a stage with 100% progress", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      tracker.completeStage(
        progressId,
        "template_loading",
        "Template loaded successfully",
      );

      const progress = tracker.getProgress(progressId);
      const stageProgress = progress?.stageProgress.find(
        (s) => s.stage === "template_loading",
      );
      expect(stageProgress?.progress).toBe(100);
      expect(stageProgress?.status).toBe("completed");
      expect(stageProgress?.message).toBe("Template loaded successfully");
    });
  });

  describe("completeGeneration", () => {
    it("should mark generation as completed", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      tracker.completeGeneration(progressId, {
        certificateNumber: "CERT2024001",
        fileSize: 1024,
        checksum: "abc123",
      });

      const progress = tracker.getProgress(progressId);
      expect(progress?.status).toBe("completed");
      expect(progress?.progress).toBe(100);
      expect(progress?.completedAt).toBeDefined();
      expect(progress?.metadata?.certificateNumber).toBe("CERT2024001");
      expect(progress?.metadata?.fileSize).toBe(1024);
    });
  });

  describe("failGeneration", () => {
    it("should mark generation as failed", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      tracker.failGeneration(
        progressId,
        "Template not found",
        "template_loading",
      );

      const progress = tracker.getProgress(progressId);
      expect(progress?.status).toBe("failed");
      expect(progress?.error).toBe("Template not found");
      expect(progress?.stage).toBe("template_loading");

      const stageProgress = progress?.stageProgress.find(
        (s) => s.stage === "template_loading",
      );
      expect(stageProgress?.status).toBe("failed");
      expect(stageProgress?.error).toBe("Template not found");
    });
  });

  describe("cancelGeneration", () => {
    it("should cancel generation", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      const result = tracker.cancelGeneration(progressId);

      expect(result).toBe(true);
      const progress = tracker.getProgress(progressId);
      expect(progress?.status).toBe("cancelled");
    });

    it("should return false for non-existent progress", () => {
      const result = tracker.cancelGeneration("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("subscribeToProgress", () => {
    it("should call callback with progress updates", (done) => {
      const progressId = tracker.initializeProgress("txn123", "user456");
      const updates: any[] = [];

      const unsubscribe = tracker.subscribeToProgress(progressId, (update) => {
        updates.push(update);
        if (updates.length === 2) {
          expect(updates[0].status).toBe("pending");
          expect(updates[1].status).toBe("in_progress");
          unsubscribe();
          done();
        }
      });

      tracker.updateProgress(progressId, "template_loading", 50, "Loading...");
    });
  });

  describe("getProgressAnalytics", () => {
    it("should return analytics for completed generation", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      // Simulate a completed generation
      tracker.updateProgress(progressId, "template_loading", 100, "Loaded");
      tracker.updateProgress(progressId, "data_validation", 100, "Validated");
      tracker.completeGeneration(progressId, { fileSize: 1024 });

      const analytics = tracker.getProgressAnalytics(progressId);
      expect(analytics).toBeDefined();
      expect(analytics?.success).toBe(true);
      expect(analytics?.totalDuration).toBeGreaterThanOrEqual(0);
      expect(analytics?.fileSize).toBe(1024);
    });

    it("should return null for incomplete generation", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      const analytics = tracker.getProgressAnalytics(progressId);
      expect(analytics).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", () => {
      const progressId1 = tracker.initializeProgress("txn1", "user1");
      const progressId2 = tracker.initializeProgress("txn2", "user2");

      tracker.updateProgress(progressId1, "template_loading", 50, "Loading...");
      tracker.completeGeneration(progressId2);

      const stats = tracker.getStats();
      expect(stats.activeGenerations).toBe(1);
      expect(stats.completedGenerations).toBe(1);
      expect(stats.failedGenerations).toBe(0);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("cleanup", () => {
    it("should clean up old progress data", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      // Simulate old progress by setting updatedAt to 31 minutes ago
      const progress = tracker.getProgress(progressId);
      if (progress) {
        progress.updatedAt = new Date(Date.now() - 31 * 60 * 1000);
      }

      tracker.cleanup();

      const cleanedProgress = tracker.getProgress(progressId);
      expect(cleanedProgress).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should handle non-existent progress ID gracefully", () => {
      expect(() => {
        tracker.updateProgress(
          "non-existent",
          "template_loading",
          50,
          "Loading...",
        );
      }).not.toThrow();

      expect(() => {
        tracker.completeGeneration("non-existent");
      }).not.toThrow();

      expect(() => {
        tracker.failGeneration("non-existent", "Error", "template_loading");
      }).not.toThrow();
    });

    it("should handle invalid progress values", () => {
      const progressId = tracker.initializeProgress("txn123", "user456");

      tracker.updateProgress(progressId, "template_loading", 150, "Over 100%");
      tracker.updateProgress(progressId, "data_validation", -10, "Negative");

      const progress = tracker.getProgress(progressId);
      const stageProgress = progress?.stageProgress;

      const templateStage = stageProgress?.find(
        (s) => s.stage === "template_loading",
      );
      const validationStage = stageProgress?.find(
        (s) => s.stage === "data_validation",
      );

      expect(templateStage?.progress).toBe(100); // Clamped to 100
      expect(validationStage?.progress).toBe(0); // Clamped to 0
    });
  });
});
