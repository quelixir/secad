import { AuditLogger, AuditAction, AuditTableName } from './index';

// Mock Prisma
jest.mock('../db', () => ({
  prisma: {
    eventLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    entity: {
      findUnique: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    count: jest.fn(),
  },
}));

import { prisma } from '../db';

describe('Certificate Audit Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Certificate Generation Logging', () => {
    it('should log certificate generation event with all metadata', async () => {
      const mockCreate = prisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: 'log123' });

      await AuditLogger.logCertificateGenerated(
        'entity123',
        'user123',
        'txn123',
        'template123',
        'PDF',
        'CERT2024000001',
        1024,
        'abc123checksum',
        {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          templateName: 'Standard Certificate',
        }
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: 'entity123',
          userId: 'user123',
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: 'txn123',
          fieldName: 'certificate',
          oldValue: null,
          newValue: expect.stringContaining('template123'),
          metadata: {
            templateId: 'template123',
            format: 'PDF',
            certificateNumber: 'CERT2024000001',
            fileSize: 1024,
            checksum: 'abc123checksum',
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            templateName: 'Standard Certificate',
          },
        },
      });
    });

    it('should handle certificate generation logging errors gracefully', async () => {
      const mockCreate = prisma.eventLog.create as jest.Mock;
      mockCreate.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        AuditLogger.logCertificateGenerated(
          'entity123',
          'user123',
          'txn123',
          'template123',
          'PDF',
          'CERT2024000001',
          1024,
          'abc123checksum'
        )
      ).resolves.toBeUndefined();
    });
  });

  describe('Certificate Download Logging', () => {
    it('should log certificate download event', async () => {
      const mockCreate = prisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: 'log123' });

      await AuditLogger.logCertificateDownloaded(
        'entity123',
        'user123',
        'txn123',
        'CERT2024000001',
        'PDF',
        {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
        }
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: 'entity123',
          userId: 'user123',
          action: AuditAction.CERTIFICATE_DOWNLOADED,
          tableName: AuditTableName.TRANSACTION,
          recordId: 'txn123',
          fieldName: 'certificate',
          oldValue: null,
          newValue: expect.stringContaining('CERT2024000001'),
          metadata: {
            certificateNumber: 'CERT2024000001',
            format: 'PDF',
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
          },
        },
      });
    });
  });

  describe('Certificate Access Logging', () => {
    it('should log certificate access event with different access types', async () => {
      const mockCreate = prisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: 'log123' });

      await AuditLogger.logCertificateAccessed(
        'entity123',
        'user123',
        'txn123',
        'CERT2024000001',
        'PDF',
        'download',
        {
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
        }
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          entityId: 'entity123',
          userId: 'user123',
          action: AuditAction.CERTIFICATE_ACCESSED,
          tableName: AuditTableName.TRANSACTION,
          recordId: 'txn123',
          fieldName: 'certificate',
          oldValue: null,
          newValue: expect.stringContaining('download'),
          metadata: {
            certificateNumber: 'CERT2024000001',
            format: 'PDF',
            accessType: 'download',
            ip: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
          },
        },
      });
    });

    it('should support different access types', async () => {
      const mockCreate = prisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: 'log123' });

      const accessTypes = ['view', 'download', 'generate'] as const;

      for (const accessType of accessTypes) {
        await AuditLogger.logCertificateAccessed(
          'entity123',
          'user123',
          'txn123',
          'CERT2024000001',
          'PDF',
          accessType
        );

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              metadata: expect.objectContaining({
                accessType,
              }),
            }),
          })
        );
      }
    });
  });

  describe('Certificate Audit Query Helpers', () => {
    it('should get certificate-specific audit logs', async () => {
      const mockFindMany = prisma.eventLog.findMany as jest.Mock;
      const mockCount = prisma.eventLog.count as jest.Mock;
      const mockEntityFindUnique = prisma.entity.findUnique as jest.Mock;
      const mockUserFindMany = prisma.user.findMany as jest.Mock;

      mockFindMany.mockResolvedValue([
        {
          id: 'log123',
          entityId: 'entity123',
          userId: 'user123',
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: 'txn123',
          fieldName: 'certificate',
          oldValue: null,
          newValue: '{"templateId":"template123","format":"PDF"}',
          metadata: { templateId: 'template123', format: 'PDF' },
          timestamp: new Date(),
        },
      ]);

      mockCount.mockResolvedValue(1);
      mockEntityFindUnique.mockResolvedValue({ name: 'Test Entity' });
      mockUserFindMany.mockResolvedValue([
        { id: 'user123', email: 'user@test.com', name: 'Test User' },
      ]);

      const result = await AuditLogger.getCertificateAuditLogs('entity123', {
        limit: 10,
        offset: 0,
      });

      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.logs[0].action).toBe(AuditAction.CERTIFICATE_GENERATED);
    });

    it('should get transaction-specific certificate logs', async () => {
      const mockFindMany = prisma.eventLog.findMany as jest.Mock;
      const mockCount = prisma.eventLog.count as jest.Mock;
      const mockEntityFindUnique = prisma.entity.findUnique as jest.Mock;
      const mockUserFindMany = prisma.user.findMany as jest.Mock;

      mockFindMany.mockResolvedValue([
        {
          id: 'log123',
          entityId: 'entity123',
          userId: 'user123',
          action: AuditAction.CERTIFICATE_GENERATED,
          tableName: AuditTableName.TRANSACTION,
          recordId: 'txn123',
          fieldName: 'certificate',
          oldValue: null,
          newValue: '{"templateId":"template123","format":"PDF"}',
          metadata: { templateId: 'template123', format: 'PDF' },
          timestamp: new Date(),
        },
      ]);

      mockCount.mockResolvedValue(1);
      mockEntityFindUnique.mockResolvedValue({ name: 'Test Entity' });
      mockUserFindMany.mockResolvedValue([
        { id: 'user123', email: 'user@test.com', name: 'Test User' },
      ]);

      const result = await AuditLogger.getTransactionCertificateLogs(
        'entity123',
        'txn123',
        { limit: 10, offset: 0 }
      );

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].recordId).toBe('txn123');
    });

    it('should get certificate template logs', async () => {
      const mockFindMany = prisma.eventLog.findMany as jest.Mock;
      const mockCount = prisma.eventLog.count as jest.Mock;
      const mockEntityFindUnique = prisma.entity.findUnique as jest.Mock;
      const mockUserFindMany = prisma.user.findMany as jest.Mock;

      mockFindMany.mockResolvedValue([
        {
          id: 'log123',
          entityId: 'entity123',
          userId: 'user123',
          action: AuditAction.CREATE,
          tableName: AuditTableName.CERTIFICATE_TEMPLATE,
          recordId: 'template123',
          fieldName: 'name',
          oldValue: null,
          newValue: '"Standard Certificate"',
          metadata: { name: 'Standard Certificate' },
          timestamp: new Date(),
        },
      ]);

      mockCount.mockResolvedValue(1);
      mockEntityFindUnique.mockResolvedValue({ name: 'Test Entity' });
      mockUserFindMany.mockResolvedValue([
        { id: 'user123', email: 'user@test.com', name: 'Test User' },
      ]);

      const result = await AuditLogger.getCertificateTemplateLogs(
        'entity123',
        'template123',
        { limit: 10, offset: 0 }
      );

      expect(result.logs).toHaveLength(1);
      expect(result.logs[0].tableName).toBe(
        AuditTableName.CERTIFICATE_TEMPLATE
      );
      expect(result.logs[0].recordId).toBe('template123');
    });
  });

  describe('Certificate Event Metadata', () => {
    it('should include comprehensive metadata in certificate events', async () => {
      const mockCreate = prisma.eventLog.create as jest.Mock;
      mockCreate.mockResolvedValue({ id: 'log123' });

      const metadata = {
        ip: '192.168.1.1',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        templateName: 'Standard Certificate',
        certificateNumber: 'CERT2024000001',
        fileSize: 1024,
        checksum: 'abc123checksum',
        format: 'PDF',
        accessType: 'download',
      };

      await AuditLogger.logCertificateGenerated(
        'entity123',
        'user123',
        'txn123',
        'template123',
        'PDF',
        'CERT2024000001',
        1024,
        'abc123checksum',
        metadata
      );

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            ip: '192.168.1.1',
            userAgent: expect.stringContaining('Mozilla/5.0'),
            templateName: 'Standard Certificate',
            certificateNumber: 'CERT2024000001',
            fileSize: 1024,
            checksum: 'abc123checksum',
            format: 'PDF',
          }),
        }),
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully in all certificate audit methods', async () => {
      const mockCreate = prisma.eventLog.create as jest.Mock;
      mockCreate.mockRejectedValue(new Error('Database connection failed'));

      // Test all certificate audit methods
      const methods = [
        () =>
          AuditLogger.logCertificateGenerated(
            'entity123',
            'user123',
            'txn123',
            'template123',
            'PDF',
            'CERT123',
            1024,
            'checksum'
          ),
        () =>
          AuditLogger.logCertificateDownloaded(
            'entity123',
            'user123',
            'txn123',
            'CERT123',
            'PDF'
          ),
        () =>
          AuditLogger.logCertificateAccessed(
            'entity123',
            'user123',
            'txn123',
            'CERT123',
            'PDF',
            'download'
          ),
      ];

      for (const method of methods) {
        await expect(method()).resolves.toBeUndefined();
      }
    });
  });
});
