import { prisma } from "../db";
import {
  AuditAction,
  AuditTableName,
  AuditLogData,
  AuditLogOptions,
  EventLogResponse,
} from "./types";

export class AuditLogger {
  /**
   * Compare old and new values and return only the fields that have actually changed
   */
  static getChangedFields(
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
  ): Record<string, { oldValue: any; newValue: any }> {
    const changes: Record<string, { oldValue: any; newValue: any }> = {};

    for (const [fieldName, newValue] of Object.entries(newValues)) {
      const oldValue = oldValues[fieldName];

      // Handle different data types for comparison
      if (this.hasValueChanged(oldValue, newValue)) {
        changes[fieldName] = { oldValue, newValue };
      }
    }

    return changes;
  }

  /**
   * Compare two values to determine if they have changed
   */
  private static hasValueChanged(oldValue: any, newValue: any): boolean {
    // Handle null/undefined cases
    if (oldValue === null && newValue === null) return false;
    if (oldValue === undefined && newValue === undefined) return false;
    if (oldValue === null && newValue !== null) return true;
    if (oldValue !== null && newValue === null) return true;
    if (oldValue === undefined && newValue !== undefined) return true;
    if (oldValue !== undefined && newValue === undefined) return true;

    // Handle Date objects
    if (oldValue instanceof Date && newValue instanceof Date) {
      return oldValue.getTime() !== newValue.getTime();
    }
    if (oldValue instanceof Date || newValue instanceof Date) {
      return true; // One is Date, other isn't
    }

    // Handle Decimal objects (from Prisma)
    if (
      oldValue &&
      typeof oldValue === "object" &&
      oldValue.toNumber &&
      newValue &&
      typeof newValue === "object" &&
      newValue.toNumber
    ) {
      return oldValue.toNumber() !== newValue.toNumber();
    }

    // Handle arrays and objects
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }
    if (typeof oldValue === "object" && typeof newValue === "object") {
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    }

    // Handle primitives
    return oldValue !== newValue;
  }

  /**
   * Log a single field change
   */
  static async logFieldChange(data: AuditLogData): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          entityId: data.entityId,
          userId: data.userId,
          action: data.action,
          tableName: data.tableName,
          recordId: data.recordId,
          fieldName: data.fieldName,
          oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
          newValue: data.newValue ? JSON.stringify(data.newValue) : null,
          metadata: data.metadata || {},
        },
      });
    } catch (error) {
      console.error("Failed to log field change:", error);
      // Don't throw - audit logging should not break the main application flow
    }
  }

  /**
   * Log multiple field changes for a single record
   */
  static async logRecordChanges(
    entityId: string,
    userId: string,
    action: AuditAction,
    tableName: AuditTableName,
    recordId: string,
    changes: Record<string, { oldValue?: any; newValue?: any }>,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      const logPromises = Object.entries(changes).map(([fieldName, change]) =>
        this.logFieldChange({
          entityId,
          userId,
          action,
          tableName,
          recordId,
          fieldName,
          oldValue: change.oldValue,
          newValue: change.newValue,
          metadata,
        }),
      );

      await Promise.all(logPromises);
    } catch (error) {
      console.error("Failed to log record changes:", error);
      // Don't throw - audit logging should not break the main application flow
    }
  }

  /**
   * Log a record creation
   */
  static async logCreate(
    entityId: string,
    userId: string,
    tableName: AuditTableName,
    recordId: string,
    data: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          entityId,
          userId,
          action: AuditAction.CREATE,
          tableName,
          recordId,
          newValue: JSON.stringify(data),
          metadata: metadata || {},
        },
      });
    } catch (error) {
      console.error("Failed to log record creation:", error);
      // Don't throw - audit logging should not break the main application flow
    }
  }

  /**
   * Log a record deletion
   */
  static async logDelete(
    entityId: string,
    userId: string,
    tableName: AuditTableName,
    recordId: string,
    data: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          entityId,
          userId,
          action: AuditAction.DELETE,
          tableName,
          recordId,
          oldValue: JSON.stringify(data),
          metadata: metadata || {},
        },
      });
    } catch (error) {
      console.error("Failed to log record deletion:", error);
      // Don't throw - audit logging should not break the main application flow
    }
  }

  /**
   * Log a record archive/unarchive action
   */
  static async logArchive(
    entityId: string,
    userId: string,
    tableName: AuditTableName,
    recordId: string,
    isArchived: boolean,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          entityId,
          userId,
          action: isArchived ? AuditAction.ARCHIVE : AuditAction.UNARCHIVE,
          tableName,
          recordId,
          newValue: JSON.stringify({ isArchived }),
          metadata: metadata || {},
        },
      });
    } catch (error) {
      console.error("Failed to log archive action:", error);
      // Don't throw - audit logging should not break the main application flow
    }
  }

  /**
   * Get audit logs for an entity with filtering
   */
  static async getAuditLogs(
    entityId: string,
    options: AuditLogOptions = {},
  ): Promise<EventLogResponse> {
    const {
      startDate,
      endDate,
      userId,
      tableName,
      recordId,
      action,
      limit = 50,
      offset = 0,
    } = options;

    const where: any = { entityId };

    if (startDate) {
      where.timestamp = { ...where.timestamp, gte: startDate };
    }
    if (endDate) {
      where.timestamp = { ...where.timestamp, lte: endDate };
    }
    if (userId) {
      where.userId = userId;
    }
    if (tableName) {
      where.tableName = tableName;
    }
    if (recordId) {
      where.recordId = recordId;
    }
    if (action) {
      where.action = action;
    }

    const [logs, total] = await Promise.all([
      prisma.eventLog.findMany({
        where,
        include: {
          entity: {
            select: { name: true },
          },
        },
        orderBy: { timestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.eventLog.count({ where }),
    ]);

    // Get unique user IDs from the logs
    const userIds = [...new Set(logs.map((log) => log.userId))];

    // Fetch user emails for all unique user IDs
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Create a map of user ID to user info
    const userMap = new Map(users.map((user) => [user.id, user]));

    return {
      logs: logs.map((log) => {
        const user = userMap.get(log.userId);
        return {
          ...log,
          action: log.action as AuditAction,
          tableName: log.tableName as AuditTableName,
          fieldName: log.fieldName || undefined,
          metadata: log.metadata || undefined,
          timestamp: log.timestamp.toISOString(),
          oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
          newValue: log.newValue ? JSON.parse(log.newValue) : null,
          user: user
            ? {
                id: user.id,
                email: user.email,
                name: user.name,
              }
            : null,
        };
      }),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Export audit logs as CSV
   */
  static async exportAuditLogs(
    entityId: string,
    options: AuditLogOptions = {},
  ): Promise<string> {
    const { startDate, endDate, userId, tableName, recordId, action } = options;

    const where: any = { entityId };

    if (startDate) {
      where.timestamp = { ...where.timestamp, gte: startDate };
    }
    if (endDate) {
      where.timestamp = { ...where.timestamp, lte: endDate };
    }
    if (userId) {
      where.userId = userId;
    }
    if (tableName) {
      where.tableName = tableName;
    }
    if (recordId) {
      where.recordId = recordId;
    }
    if (action) {
      where.action = action;
    }

    const logs = await prisma.eventLog.findMany({
      where,
      include: {
        entity: {
          select: { name: true },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Get unique user IDs from the logs
    const userIds = [...new Set(logs.map((log) => log.userId))];

    // Fetch user emails for all unique user IDs
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Create a map of user ID to user info
    const userMap = new Map(users.map((user) => [user.id, user]));

    // Create CSV content
    const csvHeaders = [
      "Timestamp",
      "Entity",
      "User ID",
      "User Name",
      "User Email",
      "Action",
      "Table",
      "Record ID",
      "Field Name",
      "Old Value",
      "New Value",
    ];

    const csvRows = logs.map((log) => {
      const user = userMap.get(log.userId);
      return [
        log.timestamp.toISOString(),
        log.entity.name,
        log.userId,
        user?.name || "",
        user?.email || "",
        log.action,
        log.tableName,
        log.recordId,
        log.fieldName || "",
        log.oldValue || "",
        log.newValue || "",
      ];
    });

    return [csvHeaders, ...csvRows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }

  /**
   * Log certificate generation event
   */
  static async logCertificateGenerated(
    entityId: string,
    userId: string,
    transactionId: string,
    templateId: string,
    format: "PDF" | "DOCX",
    certificateNumber: string,
    fileSize: number,
    checksum: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          entityId,
          userId,
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: transactionId,
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify({
            templateId,
            format,
            certificateNumber,
            fileSize,
            checksum,
            generatedAt: new Date(),
          }),
          metadata: {
            templateId,
            format,
            certificateNumber,
            fileSize,
            checksum,
            ...metadata,
          },
        },
      });
    } catch (error) {
      console.error("Failed to log certificate generation:", error);
      // Don't throw - audit logging should not break the main application flow
    }
  }

  /**
   * Log certificate download event
   */
  static async logCertificateDownloaded(
    entityId: string,
    userId: string,
    transactionId: string,
    certificateNumber: string,
    format: "PDF" | "DOCX",
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          entityId,
          userId,
          action: AuditAction.CERTIFICATE_DOWNLOADED,
          tableName: AuditTableName.TRANSACTION,
          recordId: transactionId,
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify({
            certificateNumber,
            format,
            downloadedAt: new Date(),
          }),
          metadata: {
            certificateNumber,
            format,
            ...metadata,
          },
        },
      });
    } catch (error) {
      console.error("Failed to log certificate download:", error);
      // Don't throw - audit logging should not break the main application flow
    }
  }

  /**
   * Log certificate access event
   */
  static async logCertificateAccessed(
    entityId: string,
    userId: string,
    transactionId: string,
    certificateNumber: string,
    format: "PDF" | "DOCX",
    accessType: "view" | "download" | "generate",
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await prisma.eventLog.create({
        data: {
          entityId,
          userId,
          action: AuditAction.CERTIFICATE_ACCESSED,
          tableName: AuditTableName.TRANSACTION,
          recordId: transactionId,
          fieldName: "certificate",
          oldValue: null,
          newValue: JSON.stringify({
            certificateNumber,
            format,
            accessType,
            accessedAt: new Date(),
          }),
          metadata: {
            certificateNumber,
            format,
            accessType,
            ...metadata,
          },
        },
      });
    } catch (error) {
      console.error("Failed to log certificate access:", error);
      // Don't throw - audit logging should not break the main application flow
    }
  }

  /**
   * Get certificate-specific audit logs
   */
  static async getCertificateAuditLogs(
    entityId: string,
    options: AuditLogOptions = {},
  ): Promise<EventLogResponse> {
    const certificateActions = [
      AuditAction.CERTIFICATE_GENERATED,
      AuditAction.CERTIFICATE_DOWNLOADED,
      AuditAction.CERTIFICATE_ACCESSED,
    ];

    return this.getAuditLogs(entityId, {
      ...options,
      action: certificateActions.join(","),
    });
  }

  /**
   * Get certificate generation logs for a specific transaction
   */
  static async getTransactionCertificateLogs(
    entityId: string,
    transactionId: string,
    options: AuditLogOptions = {},
  ): Promise<EventLogResponse> {
    return this.getAuditLogs(entityId, {
      ...options,
      recordId: transactionId,
      action: [
        AuditAction.CERTIFICATE_GENERATED,
        AuditAction.CERTIFICATE_DOWNLOADED,
        AuditAction.CERTIFICATE_ACCESSED,
      ].join(","),
    });
  }

  /**
   * Get certificate template audit logs
   */
  static async getCertificateTemplateLogs(
    entityId: string,
    templateId: string,
    options: AuditLogOptions = {},
  ): Promise<EventLogResponse> {
    return this.getAuditLogs(entityId, {
      ...options,
      tableName: AuditTableName.CERTIFICATE_TEMPLATE,
      recordId: templateId,
    });
  }

  /**
   * Get certificate generation analytics
   */
  static async getCertificateGenerationAnalytics(
    entityId: string,
    options: AuditLogOptions = {},
  ): Promise<{
    totalGenerations: number;
    totalDownloads: number;
    totalAccesses: number;
    averageFileSize: number;
    mostUsedTemplates: Array<{
      templateId: string;
      templateName: string;
      count: number;
    }>;
    generationTrends: Array<{ date: string; count: number }>;
    formatDistribution: { PDF: number; DOCX: number };
  }> {
    const certificateLogs = await this.getCertificateAuditLogs(
      entityId,
      options,
    );

    const generations = certificateLogs.logs.filter(
      (log) => log.action === AuditAction.CERTIFICATE_GENERATED,
    );
    const downloads = certificateLogs.logs.filter(
      (log) => log.action === AuditAction.CERTIFICATE_DOWNLOADED,
    );
    const accesses = certificateLogs.logs.filter(
      (log) => log.action === AuditAction.CERTIFICATE_ACCESSED,
    );

    // Calculate analytics
    const totalGenerations = generations.length;
    const totalDownloads = downloads.length;
    const totalAccesses = accesses.length;

    // Calculate average file size
    const fileSizes = generations
      .map((log) => log.metadata?.fileSize)
      .filter((size) => typeof size === "number");
    const averageFileSize =
      fileSizes.length > 0
        ? fileSizes.reduce((sum, size) => sum + size, 0) / fileSizes.length
        : 0;

    // Most used templates
    const templateUsage = new Map<
      string,
      { templateId: string; templateName: string; count: number }
    >();
    generations.forEach((log) => {
      const templateId = log.metadata?.templateId;
      const templateName = log.metadata?.templateName || "Unknown";
      if (templateId) {
        const existing = templateUsage.get(templateId);
        templateUsage.set(templateId, {
          templateId,
          templateName,
          count: (existing?.count || 0) + 1,
        });
      }
    });
    const mostUsedTemplates = Array.from(templateUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generation trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentGenerations = generations.filter(
      (log) => new Date(log.timestamp) >= thirtyDaysAgo,
    );

    const trendMap = new Map<string, number>();
    recentGenerations.forEach((log) => {
      const date = new Date(log.timestamp).toISOString().split("T")[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    });

    const generationTrends = Array.from(trendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Format distribution
    const formatCounts: { PDF: number; DOCX: number } = { PDF: 0, DOCX: 0 };
    generations.forEach((log) => {
      const format = log.metadata?.format;
      if (format === "PDF" || format === "DOCX") {
        formatCounts[format as "PDF" | "DOCX"]++;
      }
    });

    return {
      totalGenerations,
      totalDownloads,
      totalAccesses,
      averageFileSize,
      mostUsedTemplates,
      generationTrends,
      formatDistribution: formatCounts,
    };
  }

  /**
   * Get certificate event summary for dashboard
   */
  static async getCertificateEventSummary(
    entityId: string,
    days: number = 30,
  ): Promise<{
    recentGenerations: number;
    recentDownloads: number;
    recentAccesses: number;
    topTemplates: Array<{
      templateId: string;
      templateName: string;
      count: number;
    }>;
    recentActivity: Array<{
      timestamp: string;
      action: string;
      certificateNumber: string;
      templateName: string;
      user: string;
    }>;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const certificateLogs = await this.getCertificateAuditLogs(entityId, {
      startDate,
    });

    const recentGenerations = certificateLogs.logs.filter(
      (log) => log.action === AuditAction.CERTIFICATE_GENERATED,
    ).length;

    const recentDownloads = certificateLogs.logs.filter(
      (log) => log.action === AuditAction.CERTIFICATE_DOWNLOADED,
    ).length;

    const recentAccesses = certificateLogs.logs.filter(
      (log) => log.action === AuditAction.CERTIFICATE_ACCESSED,
    ).length;

    // Top templates in recent period
    const templateUsage = new Map<
      string,
      { templateId: string; templateName: string; count: number }
    >();
    certificateLogs.logs
      .filter((log) => log.action === AuditAction.CERTIFICATE_GENERATED)
      .forEach((log) => {
        const templateId = log.metadata?.templateId;
        const templateName = log.metadata?.templateName || "Unknown";
        if (templateId) {
          const existing = templateUsage.get(templateId);
          templateUsage.set(templateId, {
            templateId,
            templateName,
            count: (existing?.count || 0) + 1,
          });
        }
      });

    const topTemplates = Array.from(templateUsage.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent activity
    const recentActivity = certificateLogs.logs.slice(0, 20).map((log) => ({
      timestamp: log.timestamp,
      action: log.action,
      certificateNumber: log.metadata?.certificateNumber || "Unknown",
      templateName: log.metadata?.templateName || "Unknown",
      user: log.user?.name || log.user?.email || "Unknown",
    }));

    return {
      recentGenerations,
      recentDownloads,
      recentAccesses,
      topTemplates,
      recentActivity,
    };
  }
}
