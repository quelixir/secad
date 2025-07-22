import { prisma } from './db';

export interface AuditLogData {
  entityId: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'UNARCHIVE';
  tableName: string;
  recordId: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

export class AuditLogger {
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
      console.error('Failed to log audit event:', error);
      // Don't throw - audit logging should not break main functionality
    }
  }

  /**
   * Log multiple field changes for a single record
   */
  static async logRecordChanges(
    entityId: string,
    userId: string,
    action: AuditLogData['action'],
    tableName: string,
    recordId: string,
    changes: Record<string, { oldValue?: any; newValue?: any }>,
    metadata?: Record<string, any>
  ): Promise<void> {
    const promises = Object.entries(changes).map(([fieldName, values]) =>
      this.logFieldChange({
        entityId,
        userId,
        action,
        tableName,
        recordId,
        fieldName,
        oldValue: values.oldValue,
        newValue: values.newValue,
        metadata,
      })
    );

    await Promise.all(promises);
  }

  /**
   * Log a record creation
   */
  static async logCreate(
    entityId: string,
    userId: string,
    tableName: string,
    recordId: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logFieldChange({
      entityId,
      userId,
      action: 'CREATE',
      tableName,
      recordId,
      oldValue: null,
      newValue: data,
      metadata,
    });
  }

  /**
   * Log a record deletion
   */
  static async logDelete(
    entityId: string,
    userId: string,
    tableName: string,
    recordId: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logFieldChange({
      entityId,
      userId,
      action: 'DELETE',
      tableName,
      recordId,
      oldValue: data,
      newValue: null,
      metadata,
    });
  }

  /**
   * Log an archive/unarchive action
   */
  static async logArchive(
    entityId: string,
    userId: string,
    tableName: string,
    recordId: string,
    isArchived: boolean,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.logFieldChange({
      entityId,
      userId,
      action: isArchived ? 'ARCHIVE' : 'UNARCHIVE',
      tableName,
      recordId,
      fieldName: 'isArchived',
      oldValue: !isArchived,
      newValue: isArchived,
      metadata,
    });
  }

  /**
   * Get audit logs for an entity with filtering
   */
  static async getAuditLogs(
    entityId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      tableName?: string;
      recordId?: string;
      action?: string;
      limit?: number;
      offset?: number;
    } = {}
  ) {
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
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.eventLog.count({ where }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        oldValue: log.oldValue ? JSON.parse(log.oldValue) : null,
        newValue: log.newValue ? JSON.parse(log.newValue) : null,
      })),
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Export audit logs to CSV format
   */
  static async exportAuditLogs(
    entityId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      tableName?: string;
      recordId?: string;
      action?: string;
    } = {}
  ): Promise<string> {
    const { logs } = await this.getAuditLogs(entityId, {
      ...options,
      limit: 10000,
    });

    const headers = [
      'Timestamp',
      'User ID',
      'Action',
      'Table',
      'Record ID',
      'Field Name',
      'Old Value',
      'New Value',
      'Metadata',
    ];

    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.userId,
      log.action,
      log.tableName,
      log.recordId,
      log.fieldName || '',
      log.oldValue ? JSON.stringify(log.oldValue) : '',
      log.newValue ? JSON.stringify(log.newValue) : '',
      log.metadata ? JSON.stringify(log.metadata) : '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}
