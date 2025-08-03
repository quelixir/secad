import { AuditLogger } from "./logger";
import { AuditAction, AuditTableName } from "./types";

// Mock Prisma
jest.mock("../db", () => ({
  prisma: {
    eventLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

describe("Certificate Audit Logging", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = require("../db").prisma;
    jest.clearAllMocks();
  });

  describe("logCertificateGenerated", () => {
    it("should log certificate generation event", async () => {
      const mockEventLog = {
        id: "log123",
        entityId: "entity123",
        userId: "user123",
        action: AuditAction.CERTIFICATE_GENERATED,
        tableName: AuditTableName.TRANSACTION,
        recordId: "txn123",
        fieldName: "certificate",
        oldValue: null,
        newValue: JSON.stringify({
          templateId: "template123",
          format: "PDF",
          certificateNumber: "CERT-2024-0001",
          fileSize: 1024,
          checksum: "abc123",
          generatedAt: new Date(),
        }),
        metadata: {
          templateId: "template123",
          format: "PDF",
          certificateNumber: "CERT-2024-0001",
          fileSize: 1024,
          checksum: "abc123",
          templateScope: "GLOBAL",
          templateName: "Standard Certificate",
        },
        timestamp: new Date(),
      };

      mockPrisma.eventLog.create.mockResolvedValue(mockEventLog);

      await AuditLogger.logCertificateGenerated(
        "entity123",
        "user123",
        "txn123",
        "template123",
        "PDF",
        "CERT-2024-0001",
        1024,
        "abc123",
        {
          templateScope: "GLOBAL",
          templateName: "Standard Certificate",
        },
      );

      expect(mockPrisma.eventLog.create).toHaveBeenCalledWith({
        data: {
          entityId: "entity123",
          userId: "user123",
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "txn123",
          fieldName: "certificate",
          oldValue: null,
          newValue: expect.stringContaining("template123"),
          metadata: {
            templateId: "template123",
            format: "PDF",
            certificateNumber: "CERT-2024-0001",
            fileSize: 1024,
            checksum: "abc123",
            templateScope: "GLOBAL",
            templateName: "Standard Certificate",
          },
        },
      });
    });

    it("should handle logging errors gracefully", async () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();

      mockPrisma.eventLog.create.mockRejectedValue(new Error("Database error"));

      // Should not throw
      await expect(
        AuditLogger.logCertificateGenerated(
          "entity123",
          "user123",
          "txn123",
          "template123",
          "PDF",
          "CERT-2024-0001",
          1024,
          "abc123",
        ),
      ).resolves.toBeUndefined();

      // Verify that the error was logged
      expect(console.error).toHaveBeenCalledWith(
        "Failed to log certificate generation:",
        expect.any(Error),
      );

      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe("logCertificateDownloaded", () => {
    it("should log certificate download event", async () => {
      const mockEventLog = {
        id: "log123",
        entityId: "entity123",
        userId: "user123",
        action: AuditAction.CERTIFICATE_DOWNLOADED,
        tableName: AuditTableName.TRANSACTION,
        recordId: "txn123",
        fieldName: "certificate",
        oldValue: null,
        newValue: JSON.stringify({
          certificateNumber: "CERT-2024-0001",
          format: "PDF",
          downloadedAt: new Date(),
        }),
        metadata: {
          certificateNumber: "CERT-2024-0001",
          format: "PDF",
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
        },
        timestamp: new Date(),
      };

      mockPrisma.eventLog.create.mockResolvedValue(mockEventLog);

      await AuditLogger.logCertificateDownloaded(
        "entity123",
        "user123",
        "txn123",
        "CERT-2024-0001",
        "PDF",
        {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0...",
        },
      );

      expect(mockPrisma.eventLog.create).toHaveBeenCalledWith({
        data: {
          entityId: "entity123",
          userId: "user123",
          action: AuditAction.CERTIFICATE_DOWNLOADED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "txn123",
          fieldName: "certificate",
          oldValue: null,
          newValue: expect.stringContaining("CERT-2024-0001"),
          metadata: {
            certificateNumber: "CERT-2024-0001",
            format: "PDF",
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0...",
          },
        },
      });
    });
  });

  describe("logCertificateAccessed", () => {
    it("should log certificate access event", async () => {
      const mockEventLog = {
        id: "log123",
        entityId: "entity123",
        userId: "user123",
        action: AuditAction.CERTIFICATE_ACCESSED,
        tableName: AuditTableName.TRANSACTION,
        recordId: "txn123",
        fieldName: "certificate",
        oldValue: null,
        newValue: JSON.stringify({
          certificateNumber: "CERT-2024-0001",
          format: "PDF",
          accessType: "view",
          accessedAt: new Date(),
        }),
        metadata: {
          certificateNumber: "CERT-2024-0001",
          format: "PDF",
          accessType: "view",
          cacheHit: true,
        },
        timestamp: new Date(),
      };

      mockPrisma.eventLog.create.mockResolvedValue(mockEventLog);

      await AuditLogger.logCertificateAccessed(
        "entity123",
        "user123",
        "txn123",
        "CERT-2024-0001",
        "PDF",
        "view",
        {
          cacheHit: true,
        },
      );

      expect(mockPrisma.eventLog.create).toHaveBeenCalledWith({
        data: {
          entityId: "entity123",
          userId: "user123",
          action: AuditAction.CERTIFICATE_ACCESSED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "txn123",
          fieldName: "certificate",
          oldValue: null,
          newValue: expect.stringContaining("view"),
          metadata: {
            certificateNumber: "CERT-2024-0001",
            format: "PDF",
            accessType: "view",
            cacheHit: true,
          },
        },
      });
    });
  });

  describe("getCertificateAuditLogs", () => {
    it("should get certificate-specific audit logs", async () => {
      const mockLogs = [
        {
          id: "log1",
          entityId: "entity123",
          userId: "user123",
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "txn123",
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify({ certificateNumber: "CERT-2024-0001" }),
          metadata: { templateId: "template123" },
          timestamp: new Date(),
          entity: { name: "Test Entity" },
        },
      ];

      const mockUsers = [
        {
          id: "user123",
          email: "user@example.com",
          name: "Test User",
        },
      ];

      mockPrisma.eventLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.eventLog.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await AuditLogger.getCertificateAuditLogs("entity123");

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.logs[0].action).toBe(AuditAction.CERTIFICATE_GENERATED);
    });
  });

  describe("getCertificateGenerationAnalytics", () => {
    it("should calculate certificate generation analytics", async () => {
      const mockLogs = [
        {
          id: "log1",
          entityId: "entity123",
          userId: "user123",
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "txn123",
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify({ certificateNumber: "CERT-2024-0001" }),
          metadata: {
            templateId: "template123",
            templateName: "Standard Certificate",
            fileSize: 1024,
            format: "PDF",
          },
          timestamp: new Date(),
          entity: { name: "Test Entity" },
        },
        {
          id: "log2",
          entityId: "entity123",
          userId: "user123",
          action: AuditAction.CERTIFICATE_DOWNLOADED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "txn123",
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify({ certificateNumber: "CERT-2024-0001" }),
          metadata: { certificateNumber: "CERT-2024-0001" },
          timestamp: new Date(),
          entity: { name: "Test Entity" },
        },
      ];

      const mockUsers = [
        {
          id: "user123",
          email: "user@example.com",
          name: "Test User",
        },
      ];

      mockPrisma.eventLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.eventLog.count.mockResolvedValue(2);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const analytics =
        await AuditLogger.getCertificateGenerationAnalytics("entity123");

      expect(analytics.totalGenerations).toBe(1);
      expect(analytics.totalDownloads).toBe(1);
      expect(analytics.totalAccesses).toBe(0);
      expect(analytics.averageFileSize).toBe(1024);
      expect(analytics.mostUsedTemplates).toHaveLength(1);
      expect(analytics.mostUsedTemplates[0].templateId).toBe("template123");
      expect(analytics.formatDistribution.PDF).toBe(1);
      expect(analytics.formatDistribution.DOCX).toBe(0);
    });
  });

  describe("getCertificateEventSummary", () => {
    it("should get certificate event summary", async () => {
      const mockLogs = [
        {
          id: "log1",
          entityId: "entity123",
          userId: "user123",
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "txn123",
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify({ certificateNumber: "CERT-2024-0001" }),
          metadata: {
            templateId: "template123",
            templateName: "Standard Certificate",
            certificateNumber: "CERT-2024-0001",
          },
          timestamp: new Date(),
          entity: { name: "Test Entity" },
        },
      ];

      const mockUsers = [
        {
          id: "user123",
          email: "user@example.com",
          name: "Test User",
        },
      ];

      mockPrisma.eventLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.eventLog.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const summary = await AuditLogger.getCertificateEventSummary(
        "entity123",
        30,
      );

      expect(summary.recentGenerations).toBe(1);
      expect(summary.recentDownloads).toBe(0);
      expect(summary.recentAccesses).toBe(0);
      expect(summary.topTemplates).toHaveLength(1);
      expect(summary.topTemplates[0].templateId).toBe("template123");
      expect(summary.recentActivity).toHaveLength(1);
      expect(summary.recentActivity[0].action).toBe(
        AuditAction.CERTIFICATE_GENERATED,
      );
    });
  });

  describe("getTransactionCertificateLogs", () => {
    it("should get certificate logs for a specific transaction", async () => {
      const mockLogs = [
        {
          id: "log1",
          entityId: "entity123",
          userId: "user123",
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "txn123",
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify({ certificateNumber: "CERT-2024-0001" }),
          metadata: { templateId: "template123" },
          timestamp: new Date(),
          entity: { name: "Test Entity" },
        },
      ];

      const mockUsers = [
        {
          id: "user123",
          email: "user@example.com",
          name: "Test User",
        },
      ];

      mockPrisma.eventLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.eventLog.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await AuditLogger.getTransactionCertificateLogs(
        "entity123",
        "txn123",
      );

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.logs[0].recordId).toBe("txn123");
    });
  });
});
