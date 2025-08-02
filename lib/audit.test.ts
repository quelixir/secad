import { AuditLogger } from "./audit";
import { AuditAction, AuditTableName } from "./audit";
import { prisma } from "./db";

// Mock Prisma
jest.mock("./db", () => ({
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe("AuditLogger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console.error for tests that intentionally test error handling
  });

  describe("getChangedFields", () => {
    it("should return empty object when no fields have changed", () => {
      const oldValues = { name: "Test", description: "Same" };
      const newValues = { name: "Test", description: "Same" };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({});
    });

    it("should return only changed fields when some fields have changed", () => {
      const oldValues = {
        name: "Old Name",
        description: "Same",
        symbol: "OLD",
      };
      const newValues = {
        name: "New Name",
        description: "Same",
        symbol: "OLD",
      };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        name: { oldValue: "Old Name", newValue: "New Name" },
      });
    });

    it("should return multiple changed fields", () => {
      const oldValues = { name: "Old", description: "Old Desc", symbol: "OLD" };
      const newValues = { name: "New", description: "New Desc", symbol: "OLD" };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        name: { oldValue: "Old", newValue: "New" },
        description: { oldValue: "Old Desc", newValue: "New Desc" },
      });
    });

    it("should handle null to value changes", () => {
      const oldValues = { name: "Test", description: null };
      const newValues = { name: "Test", description: "New Desc" };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        description: { oldValue: null, newValue: "New Desc" },
      });
    });

    it("should handle value to null changes", () => {
      const oldValues = { name: "Test", description: "Old Desc" };
      const newValues = { name: "Test", description: null };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        description: { oldValue: "Old Desc", newValue: null },
      });
    });

    it("should handle undefined to value changes", () => {
      const oldValues = { name: "Test", description: undefined };
      const newValues = { name: "Test", description: "New Desc" };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        description: { oldValue: undefined, newValue: "New Desc" },
      });
    });

    it("should handle Date object changes", () => {
      const oldDate = new Date("2023-01-01");
      const newDate = new Date("2023-01-02");
      const oldValues = { name: "Test", createdAt: oldDate };
      const newValues = { name: "Test", createdAt: newDate };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        createdAt: { oldValue: oldDate, newValue: newDate },
      });
    });

    it("should handle Decimal object changes", () => {
      const oldDecimal = { toNumber: () => 100.5 };
      const newDecimal = { toNumber: () => 150.75 };
      const oldValues = { name: "Test", amount: oldDecimal };
      const newValues = { name: "Test", amount: newDecimal };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        amount: { oldValue: oldDecimal, newValue: newDecimal },
      });
    });

    it("should handle array changes", () => {
      const oldValues = { name: "Test", tags: ["tag1", "tag2"] };
      const newValues = { name: "Test", tags: ["tag1", "tag3"] };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        tags: { oldValue: ["tag1", "tag2"], newValue: ["tag1", "tag3"] },
      });
    });

    it("should handle object changes", () => {
      const oldValues = { name: "Test", metadata: { key1: "value1" } };
      const newValues = { name: "Test", metadata: { key1: "value2" } };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(result).toEqual({
        metadata: {
          oldValue: { key1: "value1" },
          newValue: { key1: "value2" },
        },
      });
    });

    it("should handle mixed data type changes", () => {
      const oldValues = {
        name: "Test",
        amount: { toNumber: () => 100 },
        createdAt: new Date("2023-01-01"),
        tags: ["tag1"],
        metadata: { key: "value" },
      };
      const newValues = {
        name: "Test",
        amount: { toNumber: () => 200 },
        createdAt: new Date("2023-01-02"),
        tags: ["tag2"],
        metadata: { key: "new-value" },
      };

      const result = AuditLogger.getChangedFields(oldValues, newValues);

      expect(Object.keys(result)).toHaveLength(4);
      expect(result.amount).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.tags).toBeDefined();
      expect(result.metadata).toBeDefined();
    });
  });

  describe("logFieldChange", () => {
    it("should create audit log entry with correct data", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: "log-123" });

      const auditData = {
        entityId: "entity-123",
        userId: "user-456",
        action: AuditAction.UPDATE,
        tableName: AuditTableName.MEMBER,
        recordId: "member-789",
        fieldName: "name",
        oldValue: "Old Name",
        newValue: "New Name",
        metadata: { ip: "127.0.0.1" },
      };

      await AuditLogger.logFieldChange(auditData);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.UPDATE,
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          fieldName: "name",
          oldValue: '"Old Name"',
          newValue: '"New Name"',
          metadata: { ip: "127.0.0.1" },
        },
      });
    });

    it("should create audit log entry for certificate generation", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: "log-123" });

      const auditData = {
        entityId: "entity-123",
        userId: "user-456",
        action: AuditAction.CERTIFICATE_GENERATED,
        tableName: AuditTableName.TRANSACTION,
        recordId: "transaction-789",
        fieldName: "certificate",
        oldValue: null,
        newValue: {
          templateId: "template-123",
          templateScope: "GLOBAL",
          fileFormat: "PDF",
          certificateNumber: "2024-0001",
          generatedFor: "member-456",
          securityClassId: "security-789",
          notes: "Certificate generated successfully",
        },
        metadata: { ip: "127.0.0.1", userAgent: "Mozilla/5.0" },
      };

      await AuditLogger.logFieldChange(auditData);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: "transaction-789",
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify(auditData.newValue),
          metadata: { ip: "127.0.0.1", userAgent: "Mozilla/5.0" },
        },
      });
    });

    it("should handle null values correctly", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: "log-123" });

      const auditData = {
        entityId: "entity-123",
        userId: "user-456",
        action: AuditAction.UPDATE,
        tableName: AuditTableName.MEMBER,
        recordId: "member-789",
        fieldName: "description",
        oldValue: "Old Description",
        newValue: null,
        metadata: {},
      };

      await AuditLogger.logFieldChange(auditData);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.UPDATE,
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          fieldName: "description",
          oldValue: '"Old Description"',
          newValue: null,
          metadata: {},
        },
      });
    });

    it("should not throw error when database operation fails", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockRejectedValue(new Error("Database error"));

      const auditData = {
        entityId: "entity-123",
        userId: "user-456",
        action: AuditAction.UPDATE,
        tableName: AuditTableName.MEMBER,
        recordId: "member-789",
        fieldName: "name",
        oldValue: "Old Name",
        newValue: "New Name",
      };

      // Should not throw
      await expect(
        AuditLogger.logFieldChange(auditData),
      ).resolves.toBeUndefined();
    });
  });

  describe("logRecordChanges", () => {
    it("should log multiple field changes", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: "log-123" });

      const changes = {
        name: { oldValue: "Old Name", newValue: "New Name" },
        email: { oldValue: "old@example.com", newValue: "new@example.com" },
      };

      await AuditLogger.logRecordChanges(
        "entity-123",
        "user-456",
        AuditAction.UPDATE,
        AuditTableName.MEMBER,
        "member-789",
        changes,
      );

      expect(mockCreate).toHaveBeenCalledTimes(2);

      // Check first call
      expect(mockCreate).toHaveBeenNthCalledWith(1, {
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.UPDATE,
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          fieldName: "name",
          oldValue: '"Old Name"',
          newValue: '"New Name"',
          metadata: {},
        },
      });

      // Check second call
      expect(mockCreate).toHaveBeenNthCalledWith(2, {
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.UPDATE,
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          fieldName: "email",
          oldValue: '"old@example.com"',
          newValue: '"new@example.com"',
          metadata: {},
        },
      });
    });
  });

  describe("logCreate", () => {
    it("should log record creation", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: "log-123" });

      const recordData = {
        id: "member-789",
        name: "John Doe",
        email: "john@example.com",
      };

      await AuditLogger.logCreate(
        "entity-123",
        "user-456",
        AuditTableName.MEMBER,
        "member-789",
        recordData,
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.CREATE,
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          newValue: JSON.stringify(recordData),
          metadata: {},
        },
      });
    });
  });

  describe("logDelete", () => {
    it("should log record deletion", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: "log-123" });

      const recordData = {
        id: "member-789",
        name: "John Doe",
        email: "john@example.com",
      };

      await AuditLogger.logDelete(
        "entity-123",
        "user-456",
        AuditTableName.MEMBER,
        "member-789",
        recordData,
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.DELETE,
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          oldValue: JSON.stringify(recordData),
          metadata: {},
        },
      });
    });
  });

  describe("logArchive", () => {
    it("should log archive action", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: "log-123" });

      await AuditLogger.logArchive(
        "entity-123",
        "user-456",
        AuditTableName.SECURITY_CLASS,
        "security-789",
        true,
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.ARCHIVE,
          tableName: AuditTableName.SECURITY_CLASS,
          recordId: "security-789",
          newValue: JSON.stringify({ isArchived: true }),
          metadata: {},
        },
      });
    });

    it("should log unarchive action", async () => {
      const mockCreate = mockPrisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: "log-123" });

      await AuditLogger.logArchive(
        "entity-123",
        "user-456",
        AuditTableName.SECURITY_CLASS,
        "security-789",
        false,
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.UNARCHIVE,
          tableName: AuditTableName.SECURITY_CLASS,
          recordId: "security-789",
          newValue: JSON.stringify({ isArchived: false }),
          metadata: {},
        },
      });
    });
  });

  describe("getAuditLogs", () => {
    it("should fetch audit logs with basic filtering", async () => {
      const mockFindMany = mockPrisma.eventLog.findMany as jest.Mock;
      const mockCount = mockPrisma.eventLog.count as jest.Mock;
      const mockUserFindMany = mockPrisma.user.findMany as jest.Mock;

      const mockLogs = [
        {
          id: "log-1",
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.UPDATE,
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          fieldName: "name",
          oldValue: '"Old Name"',
          newValue: '"New Name"',
          metadata: {},
          timestamp: new Date("2023-01-01"),
          entity: { name: "Test Entity" },
        },
      ];

      const mockUsers = [
        {
          id: "user-456",
          email: "test@example.com",
          name: "Test User",
        },
      ];

      mockFindMany.mockResolvedValue(mockLogs);
      mockCount.mockResolvedValue(1);
      mockUserFindMany.mockResolvedValue(mockUsers);

      const result = await AuditLogger.getAuditLogs("entity-123");

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { entityId: "entity-123" },
        include: {
          entity: {
            select: { name: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 50,
        skip: 0,
      });

      expect(mockUserFindMany).toHaveBeenCalledWith({
        where: {
          id: { in: ["user-456"] },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      expect(result).toEqual({
        logs: [
          {
            ...mockLogs[0],
            oldValue: "Old Name",
            newValue: "New Name",
            timestamp: "2023-01-01T00:00:00.000Z",
            user: {
              id: "user-456",
              email: "test@example.com",
              name: "Test User",
            },
          },
        ],
        total: 1,
        hasMore: false,
      });
    });

    it("should apply all filters correctly", async () => {
      const mockFindMany = mockPrisma.eventLog.findMany as jest.Mock;
      const mockCount = mockPrisma.eventLog.count as jest.Mock;
      const mockUserFindMany = mockPrisma.user.findMany as jest.Mock;

      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(0);
      mockUserFindMany.mockResolvedValue([]);

      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");

      await AuditLogger.getAuditLogs("entity-123", {
        startDate,
        endDate,
        userId: "user-456",
        tableName: AuditTableName.MEMBER,
        recordId: "member-789",
        action: AuditAction.UPDATE,
        limit: 25,
        offset: 10,
      });

      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          entityId: "entity-123",
          timestamp: { gte: startDate, lte: endDate },
          userId: "user-456",
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          action: AuditAction.UPDATE,
        },
        include: {
          entity: {
            select: { name: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: 25,
        skip: 10,
      });

      expect(mockUserFindMany).toHaveBeenCalledWith({
        where: {
          id: { in: [] },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    });

    it("should calculate hasMore correctly", async () => {
      const mockFindMany = mockPrisma.eventLog.findMany as jest.Mock;
      const mockCount = mockPrisma.eventLog.count as jest.Mock;
      const mockUserFindMany = mockPrisma.user.findMany as jest.Mock;

      mockFindMany.mockResolvedValue([]);
      mockCount.mockResolvedValue(100);
      mockUserFindMany.mockResolvedValue([]);

      const result = await AuditLogger.getAuditLogs("entity-123", {
        limit: 50,
        offset: 25,
      });

      expect(result.hasMore).toBe(true);
    });
  });

  describe("exportAuditLogs", () => {
    it("should export audit logs to CSV format", async () => {
      const mockFindMany = mockPrisma.eventLog.findMany as jest.Mock;
      const mockUserFindMany = mockPrisma.user.findMany as jest.Mock;

      const mockLogs = [
        {
          id: "log-1",
          entityId: "entity-123",
          userId: "user-456",
          action: AuditAction.UPDATE,
          tableName: AuditTableName.MEMBER,
          recordId: "member-789",
          fieldName: "name",
          oldValue: "Old Name",
          newValue: "New Name",
          metadata: { ip: "127.0.0.1" },
          timestamp: new Date("2023-01-01T10:00:00.000Z"),
          entity: { name: "Test Entity" },
        },
      ];

      const mockUsers = [
        {
          id: "user-456",
          email: "test@example.com",
          name: "Test User",
        },
      ];

      mockFindMany.mockResolvedValue(mockLogs);
      mockUserFindMany.mockResolvedValue(mockUsers);

      const result = await AuditLogger.exportAuditLogs("entity-123");

      const expectedCsv = [
        '"Timestamp","Entity","User ID","User Name","User Email","Action","Table","Record ID","Field Name","Old Value","New Value"',
        '"2023-01-01T10:00:00.000Z","Test Entity","user-456","Test User","test@example.com","UPDATE","Member","member-789","name","Old Name","New Name"',
      ].join("\n");

      expect(result).toBe(expectedCsv);
    });

    it("should handle empty logs", async () => {
      const mockFindMany = mockPrisma.eventLog.findMany as jest.Mock;
      const mockUserFindMany = mockPrisma.user.findMany as jest.Mock;

      mockFindMany.mockResolvedValue([]);
      mockUserFindMany.mockResolvedValue([]);

      const result = await AuditLogger.exportAuditLogs("entity-123");

      const expectedCsv =
        '"Timestamp","Entity","User ID","User Name","User Email","Action","Table","Record ID","Field Name","Old Value","New Value"';
      expect(result).toBe(expectedCsv);
    });
  });
});
