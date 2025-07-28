export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ARCHIVE = 'ARCHIVE',
  UNARCHIVE = 'UNARCHIVE',
  CERTIFICATE_GENERATED = 'CERTIFICATE_GENERATED',
}

export enum AuditTableName {
  // Registry module
  MEMBER = 'Member',
  SECURITY_CLASS = 'SecurityClass',
  TRANSACTION = 'Transaction',
  MEMBER_CONTACT = 'MemberContact',

  // Future modules can add their table names here
  // DOCUMENT = 'Document',
  // COMPLIANCE_RECORD = 'ComplianceRecord',
  // etc.
}

export interface EventLog {
  id: string;
  entityId: string;
  userId: string;
  action: AuditAction;
  tableName: AuditTableName;
  recordId: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  timestamp: string;
  entity: {
    name: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
}

export interface EventLogResponse {
  logs: EventLog[];
  total: number;
  hasMore: boolean;
}

export interface AuditLogData {
  entityId: string;
  userId: string;
  action: AuditAction;
  tableName: AuditTableName;
  recordId: string;
  fieldName?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: Record<string, any>;
}

export interface AuditLogOptions {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  tableName?: string;
  recordId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}
