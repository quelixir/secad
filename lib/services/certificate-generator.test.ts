import {
  CertificateGenerator,
  CertificateData,
  CertificateNumberingConfig,
} from './certificate-generator';
import { getLocale } from '@/lib/locale';

// Mock the PDF generator
jest.mock('./pdf-generator', () => ({
  pdfGenerator: {
    generatePDF: jest.fn().mockResolvedValue({
      success: true,
      data: Buffer.from('mock-pdf-content'),
    }),
  },
  PDFOptions: {},
}));

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    transaction: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    certificateTemplate: {
      findUnique: jest.fn(),
    },
  },
}));

describe('CertificateGenerator', () => {
  let certificateGenerator: CertificateGenerator;
  let mockPrisma: any;

  beforeEach(() => {
    certificateGenerator = new CertificateGenerator();
    mockPrisma = require('@/lib/db').prisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
    certificateGenerator.clearCache();
  });

  describe('Certificate Numbering', () => {
    it('should generate certificate number for new entity and year', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const config: CertificateNumberingConfig = {
        entityId: 'entity123',
        year: 2024,
        prefix: 'CERT',
        suffix: '',
        startNumber: 1,
      };

      const result = await certificateGenerator.generateCertificateNumber(
        config
      );
      expect(result).toBe('CERT2024000001');
    });

    it('should generate sequential certificate numbers', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        certificateNumber: 'CERT2024000005',
      });

      const config: CertificateNumberingConfig = {
        entityId: 'entity123',
        year: 2024,
        prefix: 'CERT',
        suffix: '',
        startNumber: 1,
      };

      const result = await certificateGenerator.generateCertificateNumber(
        config
      );
      expect(result).toBe('CERT2024000006');
    });

    it('should handle custom prefix and suffix', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const config: CertificateNumberingConfig = {
        entityId: 'entity123',
        year: 2024,
        prefix: 'SEC',
        suffix: '-CERT',
        startNumber: 1,
      };

      const result = await certificateGenerator.generateCertificateNumber(
        config
      );
      expect(result).toBe('SEC2024000001-CERT');
    });
  });

  describe('Template Variable Replacement', () => {
    it('should replace standard template variables', () => {
      const templateHtml = `
        <html>
          <body>
            <h1>Certificate for {{entityName}}</h1>
            <p>Certificate Number: {{certificateNumber}}</p>
            <p>Member: {{memberName}}</p>
            <p>Quantity: {{quantity}}</p>
            <p>Amount: {{totalAmount}}</p>
            <p>Date: {{issueDate}}</p>
          </body>
        </html>
      `;

      const certificateIssueDate = new Date('2024-01-15');

      const data: CertificateData = {
        entityId: 'entity123',
        entityName: 'Test Entity Ltd',
        transactionId: 'txn123',
        transactionDate: new Date('2024-01-01'),
        securityClass: 'Ordinary Shares',
        quantity: 1000,
        totalAmount: 50000,
        currency: 'AUD',
        memberName: 'John Doe',
        memberId: 'member123',
        certificateNumber: 'CERT2024000001',
        issueDate: certificateIssueDate,
      };

      const result = certificateGenerator['replaceTemplateVariables'](
        templateHtml,
        data
      );

      expect(result).toContain('Test Entity Ltd');
      expect(result).toContain('CERT2024000001');
      expect(result).toContain('John Doe');
      expect(result).toContain('1,000');
      expect(result).toContain('$50,000.00');
      expect(result).toContain(
        certificateIssueDate.toLocaleDateString(getLocale())
      );
    });

    it('should handle dynamic properties', () => {
      const templateHtml = `
        <html>
          <body>
            <p>Custom Field: {{customField}}</p>
            <p>Number: {{numberField}}</p>
          </body>
        </html>
      `;

      const data: CertificateData = {
        entityId: 'entity123',
        entityName: 'Test Entity',
        transactionId: 'txn123',
        transactionDate: new Date(),
        securityClass: 'Shares',
        quantity: 100,
        totalAmount: 1000,
        currency: 'AUD',
        memberName: 'John Doe',
        memberId: 'member123',
        certificateNumber: 'CERT001',
        issueDate: new Date(),
        customField: 'Custom Value',
        numberField: 42,
      };

      const result = certificateGenerator['replaceTemplateVariables'](
        templateHtml,
        data
      );

      expect(result).toContain('Custom Value');
      expect(result).toContain('42');
    });
  });

  describe('Data Population', () => {
    it('should populate certificate data from transaction', async () => {
      const mockTransaction = {
        id: 'txn123',
        entityId: 'entity123',
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: 'AUD',
        createdAt: new Date('2024-01-01'),
        entity: {
          id: 'entity123',
          name: 'Test Entity Ltd',
        },
        securityClass: {
          id: 'sec123',
          name: 'Ordinary Shares',
        },
        toMember: {
          id: 'member123',
          entityName: 'John Doe Ltd',
          givenNames: 'John',
          familyName: 'Doe',
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.findFirst.mockResolvedValue(null); // For certificate numbering

      const result = await certificateGenerator['populateCertificateData'](
        'txn123',
        'entity123'
      );

      expect(result.entityId).toBe('entity123');
      expect(result.entityName).toBe('Test Entity Ltd');
      expect(result.transactionId).toBe('txn123');
      expect(result.securityClass).toBe('Ordinary Shares');
      expect(result.quantity).toBe(1000);
      expect(result.totalAmount).toBe(50000);
      expect(result.memberName).toBe('John Doe Ltd');
      expect(result.memberId).toBe('member123');
      expect(result.certificateNumber).toMatch(/CERT\d{10}/);
    });

    it('should handle member name fallback', async () => {
      const mockTransaction = {
        id: 'txn123',
        entityId: 'entity123',
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        createdAt: new Date('2024-01-01'),
        entity: {
          id: 'entity123',
          name: 'Test Entity Ltd',
        },
        securityClass: {
          id: 'sec123',
          name: 'Ordinary Shares',
        },
        toMember: {
          id: 'member123',
          entityName: null,
          givenNames: 'John',
          familyName: 'Doe',
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await certificateGenerator['populateCertificateData'](
        'txn123',
        'entity123'
      );

      expect(result.memberName).toBe('John Doe');
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', () => {
      const validData: CertificateData = {
        entityId: 'entity123',
        entityName: 'Test Entity',
        transactionId: 'txn123',
        transactionDate: new Date(),
        securityClass: 'Shares',
        quantity: 100,
        totalAmount: 1000,
        currency: 'AUD',
        memberName: 'John Doe',
        memberId: 'member123',
        certificateNumber: 'CERT001',
        issueDate: new Date(),
      };

      expect(() =>
        certificateGenerator['validateCertificateData'](validData)
      ).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const invalidData: CertificateData = {
        entityId: 'entity123',
        entityName: '', // Missing
        transactionId: 'txn123',
        transactionDate: new Date(),
        securityClass: 'Shares',
        quantity: 100,
        totalAmount: 1000,
        currency: 'AUD',
        memberName: 'John Doe',
        memberId: 'member123',
        certificateNumber: 'CERT001',
        issueDate: new Date(),
      };

      expect(() =>
        certificateGenerator['validateCertificateData'](invalidData)
      ).toThrow('Missing required certificate data: entityName');
    });

    it('should throw error for invalid quantity', () => {
      const invalidData: CertificateData = {
        entityId: 'entity123',
        entityName: 'Test Entity',
        transactionId: 'txn123',
        transactionDate: new Date(),
        securityClass: 'Shares',
        quantity: 0, // Invalid
        totalAmount: 1000,
        currency: 'AUD',
        memberName: 'John Doe',
        memberId: 'member123',
        certificateNumber: 'CERT001',
        issueDate: new Date(),
      };

      expect(() =>
        certificateGenerator['validateCertificateData'](invalidData)
      ).toThrow('Certificate quantity must be greater than 0');
    });

    it('should throw error for invalid total amount', () => {
      const invalidData: CertificateData = {
        entityId: 'entity123',
        entityName: 'Test Entity',
        transactionId: 'txn123',
        transactionDate: new Date(),
        securityClass: 'Shares',
        quantity: 100,
        totalAmount: -100, // Invalid
        currency: 'AUD',
        memberName: 'John Doe',
        memberId: 'member123',
        certificateNumber: 'CERT001',
        issueDate: new Date(),
      };

      expect(() =>
        certificateGenerator['validateCertificateData'](invalidData)
      ).toThrow('Certificate total amount must be greater than 0');
    });
  });

  describe('Template Validation', () => {
    it('should validate template with all required variables', async () => {
      const mockTemplate = {
        id: 'template123',
        name: 'Standard Certificate',
        templateHtml: `
          <html>
            <body>
              <h1>Certificate for {{entityName}}</h1>
              <p>Certificate Number: {{certificateNumber}}</p>
              <p>Member: {{memberName}}</p>
              <p>Quantity: {{quantity}}</p>
              <p>Amount: {{totalAmount}}</p>
              <p>Date: {{issueDate}}</p>
            </body>
          </html>
        `,
      };

      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await certificateGenerator.validateTemplate('template123');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required variables', async () => {
      const mockTemplate = {
        id: 'template123',
        name: 'Standard Certificate',
        templateHtml: `
          <html>
            <body>
              <h1>Certificate for {{entityName}}</h1>
              <p>Certificate Number: {{certificateNumber}}</p>
              <!-- Missing memberName, quantity, totalAmount, issueDate -->
            </body>
          </html>
        `,
      };

      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await certificateGenerator.validateTemplate('template123');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Missing required template variable: {{memberName}}'
      );
      expect(result.errors).toContain(
        'Missing required template variable: {{quantity}}'
      );
      expect(result.errors).toContain(
        'Missing required template variable: {{totalAmount}}'
      );
      expect(result.errors).toContain(
        'Missing required template variable: {{issueDate}}'
      );
    });

    it('should handle missing template', async () => {
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(null);

      const result = await certificateGenerator.validateTemplate('nonexistent');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Template not found: nonexistent');
    });
  });

  describe('Certificate Generation', () => {
    it('should generate PDF certificate successfully', async () => {
      const mockTransaction = {
        id: 'txn123',
        entityId: 'entity123',
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        createdAt: new Date('2024-01-01'),
        entity: {
          id: 'entity123',
          name: 'Test Entity Ltd',
        },
        securityClass: {
          id: 'sec123',
          name: 'Ordinary Shares',
        },
        toMember: {
          id: 'member123',
          entityName: 'John Doe Ltd',
          givenNames: 'John',
          familyName: 'Doe',
        },
      };

      const mockTemplate = {
        id: 'template123',
        name: 'Standard Certificate',
        templateHtml: `
          <html>
            <body>
              <h1>Certificate for {{entityName}}</h1>
              <p>Certificate Number: {{certificateNumber}}</p>
            </body>
          </html>
        `,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        'txn123',
        'template123'
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.certificateBuffer).toBeInstanceOf(Buffer);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata.certificateId).toMatch(
        /cert_entity123_txn123_\d+/
      );
      expect(result.data?.metadata.format).toBe('PDF');
    });

    it('should handle missing transaction', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        'nonexistent',
        'template123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Transaction not found: nonexistent');
    });

    it('should handle missing template', async () => {
      const mockTransaction = {
        id: 'txn123',
        entityId: 'entity123',
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        createdAt: new Date('2024-01-01'),
        entity: {
          id: 'entity123',
          name: 'Test Entity Ltd',
        },
        securityClass: {
          id: 'sec123',
          name: 'Ordinary Shares',
        },
        toMember: {
          id: 'member123',
          entityName: 'John Doe Ltd',
          givenNames: 'John',
          familyName: 'Doe',
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        'txn123',
        'nonexistent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Certificate template not found: nonexistent');
    });

    it('should return error for DOCX format', async () => {
      const result = await certificateGenerator.generateDOCXCertificate(
        'txn123',
        'template123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'DOCX certificate generation not yet implemented'
      );
    });
  });

  describe('Caching', () => {
    it('should cache generated certificates', async () => {
      const mockTransaction = {
        id: 'txn123',
        entityId: 'entity123',
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        createdAt: new Date('2024-01-01'),
        entity: {
          id: 'entity123',
          name: 'Test Entity Ltd',
        },
        securityClass: {
          id: 'sec123',
          name: 'Ordinary Shares',
        },
        toMember: {
          id: 'member123',
          entityName: 'John Doe Ltd',
          givenNames: 'John',
          familyName: 'Doe',
        },
      };

      const mockTemplate = {
        id: 'template123',
        name: 'Standard Certificate',
        templateHtml: '<html><body>Test</body></html>',
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      // First generation
      const result1 = await certificateGenerator.generatePDFCertificate(
        'txn123',
        'template123'
      );
      expect(result1.success).toBe(true);

      // Second generation should use cache
      const result2 = await certificateGenerator.generatePDFCertificate(
        'txn123',
        'template123'
      );
      expect(result2.success).toBe(true);

      // Verify cache stats
      const cacheStats = certificateGenerator.getCacheStats();
      expect(cacheStats.entries).toBeGreaterThan(0);
    });

    it('should clear cache', () => {
      certificateGenerator.clearCache();
      const cacheStats = certificateGenerator.getCacheStats();
      expect(cacheStats.entries).toBe(0);
    });
  });

  describe('Performance Testing', () => {
    it('should handle multiple certificate generations', async () => {
      const mockTransaction = {
        id: 'txn123',
        entityId: 'entity123',
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        createdAt: new Date('2024-01-01'),
        entity: {
          id: 'entity123',
          name: 'Test Entity Ltd',
        },
        securityClass: {
          id: 'sec123',
          name: 'Ordinary Shares',
        },
        toMember: {
          id: 'member123',
          entityName: 'John Doe Ltd',
          givenNames: 'John',
          familyName: 'Doe',
        },
      };

      const mockTemplate = {
        id: 'template123',
        name: 'Standard Certificate',
        templateHtml: '<html><body>Test</body></html>',
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const startTime = Date.now();
      const promises = Array.from({ length: 5 }, (_, i) =>
        certificateGenerator.generatePDFCertificate(`txn${i}`, 'template123')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time (less than 10 seconds)
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle PDF generation failure', async () => {
      const { pdfGenerator } = require('./pdf-generator');
      pdfGenerator.generatePDF.mockResolvedValue({
        success: false,
        error: 'PDF generation failed',
      });

      const mockTransaction = {
        id: 'txn123',
        entityId: 'entity123',
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        createdAt: new Date('2024-01-01'),
        entity: {
          id: 'entity123',
          name: 'Test Entity Ltd',
        },
        securityClass: {
          id: 'sec123',
          name: 'Ordinary Shares',
        },
        toMember: {
          id: 'member123',
          entityName: 'John Doe Ltd',
          givenNames: 'John',
          familyName: 'Doe',
        },
      };

      const mockTemplate = {
        id: 'template123',
        name: 'Standard Certificate',
        templateHtml: '<html><body>Test</body></html>',
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        'txn123',
        'template123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF generation failed');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.transaction.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await certificateGenerator.generatePDFCertificate(
        'txn123',
        'template123'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
    });
  });
});
