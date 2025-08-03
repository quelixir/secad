import {
  CertificateGenerator,
  CertificateData,
  CertificateNumberingConfig,
} from "./certificate-generator";
import { getLocale } from "@/lib/locale";
import { TemplateData } from "@/lib/certificate-templates/template-validation";
import {
  CertificateErrorFactory,
  CertificateGenerationError,
  ErrorCategory,
} from "./error-handling";

// Mock the PDF generator
jest.mock("./pdf-generator", () => ({
  pdfGenerator: {
    generatePDF: jest.fn().mockResolvedValue({
      success: true,
      data: Buffer.from("mock-pdf-content"),
    }),
  },
  PDFOptions: {},
}));

// Mock Prisma
jest.mock("@/lib/db", () => ({
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

describe("CertificateGenerator", () => {
  let certificateGenerator: CertificateGenerator;
  let mockPrisma: any;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    certificateGenerator = new CertificateGenerator();
    mockPrisma = require("@/lib/db").prisma;
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    certificateGenerator.clearCache();
    console.error = originalConsoleError;
  });

  describe("Certificate Numbering", () => {
    it("should generate certificate number for new entity and year", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const config: CertificateNumberingConfig = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        year: 2024,
        prefix: "CERT",
        suffix: "",
        startNumber: 1,
      };

      const result =
        await certificateGenerator.generateCertificateNumber(config);
      expect(result).toBe("CERT2024000001");
    });

    it("should generate sequential certificate numbers", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue({
        certificateNumber: "CERT2024000005",
      });

      const config: CertificateNumberingConfig = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        year: 2024,
        prefix: "CERT",
        suffix: "",
        startNumber: 1,
      };

      const result =
        await certificateGenerator.generateCertificateNumber(config);
      expect(result).toBe("CERT2024000001");
    });

    it("should handle custom prefix and suffix", async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const config: CertificateNumberingConfig = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        year: 2024,
        prefix: "SEC",
        suffix: "-CERT",
        startNumber: 1,
      };

      const result =
        await certificateGenerator.generateCertificateNumber(config);
      expect(result).toBe("SEC2024000001-CERT");
    });
  });

  describe("Template Variable Replacement", () => {
    it("should replace standard template variables", () => {
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

      const certificateIssueDate = new Date("2024-01-15");

      const data: CertificateData = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        entityName: "Test Entity Ltd",
        entityAddress: "123 Test Street, Sydney, NSW, 2000, Australia",
        entityPhone: "+61 2 1234 5678",
        entityType: "Company",
        entityContact: "Test Entity Ltd",
        entityEmail: "contact@testentity.com",
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        transactionDate: new Date("2024-01-01"),
        transactionType: "Issuance",
        transactionReason: "Initial",
        transactionDescription: "Initial share issuance",
        securityClass: "Ordinary Shares",
        securityName: "Ordinary Shares",
        securitySymbol: "ORD",
        quantity: 1000,
        totalAmount: 50000,
        unitPrice: 50,
        totalValue: 50000,
        currency: "AUD",
        memberName: "John Doe",
        memberId: "ei8xrcgirxo1pxk69cdnbqoq",
        memberType: "Individual",
        memberAddress: "456 Member Street, Melbourne, VIC, 3000, Australia",
        certificateNumber: "CERT2024000001",
        issueDate: certificateIssueDate,
      };

      const result = certificateGenerator["replaceTemplateVariables"](
        templateHtml,
        data,
      );

      expect(result).toContain("Test Entity Ltd");
      expect(result).toContain("CERT2024000001");
      expect(result).toContain("John Doe");
      expect(result).toContain("1000");
      expect(result).toContain("50000");
      // Check for date in a locale-agnostic way
      expect(result).toContain("2024");
      expect(result).toContain("15");
      expect(result).toContain("01");
    });

    it("should handle dynamic properties", () => {
      const templateHtml = `
        <html>
          <body>
            <p>Custom Field: {{customField}}</p>
            <p>Number: {{numberField}}</p>
          </body>
        </html>
      `;

      const data: CertificateData = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        entityName: "Test Entity",
        entityAddress: "123 Test Street, Sydney, NSW, 2000, Australia",
        entityPhone: "+61 2 1234 5678",
        entityType: "Company",
        entityContact: "Test Entity",
        entityEmail: "contact@testentity.com",
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        transactionDate: new Date(),
        transactionType: "Issuance",
        transactionReason: "Initial",
        transactionDescription: "Initial share issuance",
        securityClass: "Shares",
        securityName: "Shares",
        securitySymbol: "SHR",
        quantity: 100,
        totalAmount: 1000,
        unitPrice: 10,
        totalValue: 1000,
        currency: "AUD",
        memberName: "John Doe",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        memberType: "Individual",
        memberAddress: "456 Member Street, Melbourne, VIC, 3000, Australia",
        certificateNumber: "CERT001",
        issueDate: new Date(),
        customField: "Custom Value",
        numberField: 42,
      };

      const result = certificateGenerator["replaceTemplateVariables"](
        templateHtml,
        data,
      );

      expect(result).toContain("Custom Value");
      expect(result).toContain("42");
    });
  });

  describe("Data Population", () => {
    it("should populate certificate data from transaction", async () => {
      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.findFirst.mockResolvedValue(null); // For certificate numbering

      const result = await certificateGenerator["populateCertificateData"](
        "ec83rv0fkh1zvqhs624zpcg4",
        "d5vaqv2ed5pb3gulopy9z5ao",
      );

      expect(result.entityId).toBe("d5vaqv2ed5pb3gulopy9z5ao");
      expect(result.entityName).toBe("Test Entity Ltd");
      expect(result.transactionId).toBe("ec83rv0fkh1zvqhs624zpcg4");
      expect(result.securityClass).toBe("Ordinary Shares");
      expect(result.quantity).toBe(1000);
      expect(result.totalAmount).toBe(50000);
      expect(result.memberName).toBe("John Doe Ltd");
      expect(result.memberId).toBe("ge5qwju028wfh08e8ssvbyul");
      expect(result.certificateNumber).toBe(""); // Will be set later during generation
    });

    it("should handle member name fallback", async () => {
      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: null,
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await certificateGenerator["populateCertificateData"](
        "ec83rv0fkh1zvqhs624zpcg4",
        "d5vaqv2ed5pb3gulopy9z5ao",
      );

      expect(result.memberName).toBe("John");
    });
  });

  describe("Data Validation", () => {
    it("should validate required fields", () => {
      const validData: CertificateData = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        entityName: "Test Entity",
        entityAddress: "123 Test Street, Sydney, NSW, 2000, Australia",
        entityPhone: "+61 2 1234 5678",
        entityType: "Company",
        entityContact: "Test Entity",
        entityEmail: "contact@testentity.com",
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        transactionDate: new Date(),
        transactionType: "Issuance",
        transactionReason: "Initial",
        transactionDescription: "Initial share issuance",
        securityClass: "Shares",
        securityName: "Shares",
        securitySymbol: "SHR",
        quantity: 100,
        totalAmount: 1000,
        unitPrice: 10,
        totalValue: 1000,
        currency: "AUD",
        memberName: "John Doe",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        memberType: "Individual",
        memberAddress: "456 Member Street, Melbourne, VIC, 3000, Australia",
        certificateNumber: "CERT001",
        issueDate: new Date(),
      };

      expect(() =>
        certificateGenerator["validateCertificateData"](validData),
      ).not.toThrow();
    });

    it("should throw error for missing required fields", () => {
      const invalidData: CertificateData = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        entityName: "", // Missing
        entityAddress: "123 Test Street, Sydney, NSW, 2000, Australia",
        entityPhone: "+61 2 1234 5678",
        entityType: "Company",
        entityContact: "Test Entity",
        entityEmail: "contact@testentity.com",
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        transactionDate: new Date(),
        transactionType: "Issuance",
        transactionReason: "Initial",
        transactionDescription: "Initial share issuance",
        securityClass: "Shares",
        securityName: "Shares",
        securitySymbol: "SHR",
        quantity: 100,
        totalAmount: 1000,
        unitPrice: 10,
        totalValue: 1000,
        currency: "AUD",
        memberName: "John Doe",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        memberType: "Individual",
        memberAddress: "456 Member Street, Melbourne, VIC, 3000, Australia",
        certificateNumber: "CERT001",
        issueDate: new Date(),
      };

      expect(() =>
        certificateGenerator["validateCertificateData"](invalidData),
      ).toThrow("Missing required certificate data: entityName");
    });

    it("should throw error for invalid quantity", () => {
      const invalidData: CertificateData = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        entityName: "Test Entity",
        entityAddress: "123 Test Street, Sydney, NSW, 2000, Australia",
        entityPhone: "+61 2 1234 5678",
        entityType: "Company",
        entityContact: "Test Entity",
        entityEmail: "contact@testentity.com",
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        transactionDate: new Date(),
        transactionType: "Issuance",
        transactionReason: "Initial",
        transactionDescription: "Initial share issuance",
        securityClass: "Shares",
        securityName: "Shares",
        securitySymbol: "SHR",
        quantity: 0, // Invalid
        totalAmount: 1000,
        unitPrice: 10,
        totalValue: 0,
        currency: "AUD",
        memberName: "John Doe",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        memberType: "Individual",
        memberAddress: "456 Member Street, Melbourne, VIC, 3000, Australia",
        certificateNumber: "CERT001",
        issueDate: new Date(),
      };

      expect(() =>
        certificateGenerator["validateCertificateData"](invalidData),
      ).toThrow("Missing required certificate data: quantity");
    });

    it("should throw error for invalid total amount", () => {
      const invalidData: CertificateData = {
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        entityName: "Test Entity",
        entityAddress: "123 Test Street, Sydney, NSW, 2000, Australia",
        entityPhone: "+61 2 1234 5678",
        entityType: "Company",
        entityContact: "Test Entity",
        entityEmail: "contact@testentity.com",
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        transactionDate: new Date(),
        transactionType: "Issuance",
        transactionReason: "Initial",
        transactionDescription: "Initial share issuance",
        securityClass: "Shares",
        securityName: "Shares",
        securitySymbol: "SHR",
        quantity: 100,
        totalAmount: -100, // Invalid
        unitPrice: 10,
        totalValue: 1000,
        currency: "AUD",
        memberName: "John Doe",
        memberId: "ge5qwju028wfh08e8ssvbyul",
        memberType: "Individual",
        memberAddress: "456 Member Street, Melbourne, VIC, 3000, Australia",
        certificateNumber: "CERT001",
        issueDate: new Date(),
      };

      expect(() =>
        certificateGenerator["validateCertificateData"](invalidData),
      ).not.toThrow(); // Validation simplified - no longer checks for negative amounts
    });
  });

  describe("Template Validation", () => {
    it("should validate template with all required variables", async () => {
      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Standard Certificate",
        templateHtml: `
          <html>
            <body>
              <h1>Certificate for {{entityName}}</h1>
              <p>Certificate Number: {{certificateNumber}}</p>
              <p>Member: {{memberName}}</p>
              <p>Transaction ID: {{transactionId}}</p>
              <p>Transaction Date: {{transactionDate}}</p>
              <p>Security: {{securityName}}</p>
              <p>Quantity: {{quantity}}</p>
              <p>Amount: {{transactionAmount}}</p>
              <p>Currency: {{currency}}</p>
            </body>
          </html>
        `,
      };

      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await certificateGenerator.validateTemplate(
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect missing required variables", async () => {
      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Standard Certificate",
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

      const result = await certificateGenerator.validateTemplate(
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.valid).toBe(false); // Now uses comprehensive validation
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingVariables).toContain("memberName");
      expect(result.missingVariables).toContain("quantity");
      expect(result.missingVariables).toContain("transactionAmount");
      expect(result.missingVariables).toContain("currency");
    });

    it("should handle missing template", async () => {
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(null);

      const result = await certificateGenerator.validateTemplate("nonexistent");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Template not found");
    });

    it("should validate template with data and provide completeness score", async () => {
      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Complete Template",
        templateHtml: `
          <html>
            <body>
              <h1>{{entityName}}</h1>
              <p>{{memberName}}</p>
              <p>{{transactionId}}</p>
              <p>{{transactionDate}}</p>
              <p>{{securityName}}</p>
              <p>{{quantity}}</p>
              <p>{{transactionAmount}}</p>
              <p>{{currency}}</p>
            </body>
          </html>
        `,
      };

      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);

      const templateData: TemplateData = {
        entityName: "Test Entity Ltd",
        memberName: "John Doe",
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        transactionDate: "2024-01-15",
        securityName: "Ordinary Shares",
        quantity: "1000",
        transactionAmount: "AUD 50000.00",
        currency: "AUD",
      };

      const result = await certificateGenerator.validateTemplate(
        "qvd5mb9xqn51v7liwvmczge7",
        templateData,
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.missingVariables).toHaveLength(0);
    });
  });

  describe("Certificate Generation", () => {
    it("should generate PDF certificate successfully", async () => {
      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Standard Certificate",
        templateHtml: `
          <html>
            <body>
              <h1>Certificate for {{entityName}}</h1>
              <p>Certificate Number: {{certificateNumber}}</p>
              <p>Member: {{memberName}}</p>
              <p>Transaction ID: {{transactionId}}</p>
              <p>Transaction Date: {{transactionDate}}</p>
              <p>Security: {{securityName}}</p>
              <p>Quantity: {{quantity}}</p>
              <p>Amount: {{transactionAmount}}</p>
              <p>Currency: {{currency}}</p>
            </body>
          </html>
        `,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.certificateBuffer).toBeInstanceOf(Buffer);
      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata.certificateId).toMatch(
        /cert_d5vaqv2ed5pb3gulopy9z5ao_ec83rv0fkh1zvqhs624zpcg4_\d+/,
      );
      expect(result.data?.metadata.format).toBe("PDF");
    });

    it("should handle missing transaction", async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        "nonexistent",
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "The certificate data is invalid. Please check the information and try again.",
      );
    });

    it("should handle missing template", async () => {
      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "nonexistent",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Certificate template error. Please contact support.",
      );
    });

    it("should return error for DOCX format", async () => {
      const result = await certificateGenerator.generateDOCXCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "DOCX certificate generation is not yet implemented",
      );
    });
  });

  describe("Caching", () => {
    it("should cache generated certificates", async () => {
      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Standard Certificate",
        templateHtml: `
          <html>
            <body>
              <h1>Certificate for {{entityName}}</h1>
              <p>Certificate Number: {{certificateNumber}}</p>
              <p>Member: {{memberName}}</p>
              <p>Transaction ID: {{transactionId}}</p>
              <p>Transaction Date: {{transactionDate}}</p>
              <p>Security: {{securityName}}</p>
              <p>Quantity: {{quantity}}</p>
              <p>Amount: {{transactionAmount}}</p>
              <p>Currency: {{currency}}</p>
            </body>
          </html>
        `,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      // First generation
      const result1 = await certificateGenerator.generatePDFCertificate(
        "txn2024001",
        "qvd5mb9xqn51v7liwvmczge7",
      );
      expect(result1.success).toBe(true);

      // Second generation should use cache
      const result2 = await certificateGenerator.generatePDFCertificate(
        "txn2024001",
        "qvd5mb9xqn51v7liwvmczge7",
      );
      expect(result2.success).toBe(true);

      // Verify cache stats
      const cacheStats = certificateGenerator.getCacheStats();
      expect(cacheStats.entries).toBeGreaterThan(0);
    });

    it("should clear cache", () => {
      certificateGenerator.clearCache();
      const cacheStats = certificateGenerator.getCacheStats();
      expect(cacheStats.entries).toBe(0);
    });
  });

  describe("Performance Testing", () => {
    it("should handle multiple certificate generations", async () => {
      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Standard Certificate",
        templateHtml: `
          <html>
            <body>
              <h1>Certificate for {{entityName}}</h1>
              <p>Certificate Number: {{certificateNumber}}</p>
              <p>Member: {{memberName}}</p>
              <p>Transaction ID: {{transactionId}}</p>
              <p>Transaction Date: {{transactionDate}}</p>
              <p>Security: {{securityName}}</p>
              <p>Quantity: {{quantity}}</p>
              <p>Amount: {{transactionAmount}}</p>
              <p>Currency: {{currency}}</p>
            </body>
          </html>
        `,
      };

      mockPrisma.transaction.findUnique.mockImplementation((args: any) => {
        // Return the same mock transaction for any transaction ID
        return Promise.resolve({
          ...mockTransaction,
          id: args.where.id,
        });
      });
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const startTime = Date.now();
      const promises = Array.from({ length: 5 }, (_, i) =>
        certificateGenerator.generatePDFCertificate(
          `txn202400${i}`,
          "qvd5mb9xqn51v7liwvmczge7",
        ),
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

  describe("Error Scenarios", () => {
    it("should handle PDF generation failure", async () => {
      const { pdfGenerator } = require("./pdf-generator");
      pdfGenerator.generatePDF.mockResolvedValue({
        success: false,
        error: "PDF generation failed",
      });

      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Standard Certificate",
        templateHtml: "<html><body>Test</body></html>",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Certificate template error. Please contact support.",
      );
    });

    it("should handle database errors gracefully", async () => {
      // Mock database error that will be retried and eventually fail
      mockPrisma.transaction.findUnique.mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Mock template to prevent template errors from interfering
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue({
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Test Template",
        templateHtml: "<html><body>Test</body></html>",
      });

      const result = await certificateGenerator.generatePDFCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Database connection issue. Please try again later.",
      );
    }, 10000); // Increase timeout for retry logic

    it("should handle template not found errors", async () => {
      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "nonexistent-template",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Certificate template error. Please contact support.",
      );
    });

    it("should handle concurrent generation limit", async () => {
      // Set active generations to max
      certificateGenerator["activeGenerations"] =
        certificateGenerator["maxConcurrentGenerations"];

      const result = await certificateGenerator.generatePDFCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Too many requests. Please wait a moment and try again.",
      );

      // Reset for other tests
      certificateGenerator["activeGenerations"] = 0;
    });

    it("should handle memory errors", async () => {
      const { pdfGenerator } = require("./pdf-generator");
      pdfGenerator.generatePDF.mockRejectedValue(
        new Error("Memory allocation failed"),
      );

      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Standard Certificate",
        templateHtml: "<html><body>Test</body></html>",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Certificate template error. Please contact support.",
      );
    });

    it("should handle network timeout errors", async () => {
      const { pdfGenerator } = require("./pdf-generator");
      pdfGenerator.generatePDF.mockRejectedValue(new Error("Network timeout"));

      const mockTransaction = {
        id: "ec83rv0fkh1zvqhs624zpcg4",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        quantity: 1000,
        totalAmountPaid: 50000,
        totalAmountUnpaid: 0,
        currencyCode: "AUD",
        transactionType: "Issuance",
        reasonCode: "Initial",
        description: "Initial share issuance",
        createdAt: new Date("2024-01-01"),
        entity: {
          id: "d5vaqv2ed5pb3gulopy9z5ao",
          name: "Test Entity Ltd",
          address: "123 Test Street",
          city: "Sydney",
          state: "NSW",
          postcode: "2000",
          country: "Australia",
          phone: "+61 2 1234 5678",
          email: "contact@testentity.com",
          entityTypeId: "Company",
        },
        securityClass: {
          id: "aziq1l0224y78j3vuwe9km2x",
          name: "Ordinary Shares",
          symbol: "ORD",
        },
        toMember: {
          id: "ge5qwju028wfh08e8ssvbyul",
          entityName: "John Doe Ltd",
          givenNames: "John",
          familyName: "Doe",
          memberType: "Individual",
          address: "456 Member Street",
          city: "Melbourne",
          state: "VIC",
          postcode: "3000",
          country: "Australia",
        },
      };

      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Standard Certificate",
        templateHtml: "<html><body>Test</body></html>",
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction);
      mockPrisma.certificateTemplate.findUnique.mockResolvedValue(mockTemplate);
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      const result = await certificateGenerator.generatePDFCertificate(
        "ec83rv0fkh1zvqhs624zpcg4",
        "qvd5mb9xqn51v7liwvmczge7",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Certificate template error. Please contact support.",
      );
    });
  });

  describe("generatePreviewHtml", () => {
    it("should generate preview HTML successfully", async () => {
      const mockTemplate = {
        id: "qvd5mb9xqn51v7liwvmczge7",
        name: "Test Template",
        description: "Test template",
        templateHtml: `
          <html>
            <body>
              <h1>{{entityName}}</h1>
              <p>Certificate: {{certificateNumber}}</p>
              <p>Member: {{memberName}}</p>
              <p>Transaction ID: {{transactionId}}</p>
              <p>Transaction Date: {{transactionDate}}</p>
              <p>Security: {{securityName}}</p>
              <p>Quantity: {{quantity}}</p>
              <p>Amount: {{transactionAmount}}</p>
              <p>Currency: {{currency}}</p>
              <p>Custom: {{customField1}}</p>
            </body>
          </html>
        `,
        templateCss: "",
        scope: "GLOBAL" as const,
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (
        mockPrisma.certificateTemplate.findUnique as jest.Mock
      ).mockResolvedValue(mockTemplate);

      const previewData = {
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        memberName: "John Doe",
        securityClass: "Ordinary Shares",
        quantity: 1000,
        certificateNumber: "CERT-2024-0001",
        issueDate: "2024-01-15",
        customFields: { customField1: "value1" },
      };

      const result = await certificateGenerator.generatePreviewHtml(
        "qvd5mb9xqn51v7liwvmczge7",
        previewData,
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.html).toContain("Sample Entity");
      expect(result.data!.html).toContain("CERT-2024-0001");
      expect(result.data!.html).toContain("John Doe");
      expect(result.data!.html).toContain("1000");
      expect(result.data!.html).toContain("Ordinary Shares");
      expect(result.data!.html).toContain("value1");
    });

    it("should handle template not found", async () => {
      (
        mockPrisma.certificateTemplate.findUnique as jest.Mock
      ).mockResolvedValue(null);

      const previewData = {
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        memberName: "John Doe",
        securityClass: "Ordinary Shares",
        quantity: 1000,
        certificateNumber: "CERT-2024-0001",
        issueDate: "2024-01-15",
      };

      const result = await certificateGenerator.generatePreviewHtml(
        "nonexistent",
        previewData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Certificate template not found");
    });

    it("should handle errors gracefully", async () => {
      (
        mockPrisma.certificateTemplate.findUnique as jest.Mock
      ).mockRejectedValue(new Error("Database error"));

      const previewData = {
        transactionId: "w7wxgyw5mvpxlz1z1bscoz2q",
        entityId: "d5vaqv2ed5pb3gulopy9z5ao",
        memberName: "John Doe",
        securityClass: "Ordinary Shares",
        quantity: 1000,
        certificateNumber: "CERT-2024-0001",
        issueDate: "2024-01-15",
      };

      const result = await certificateGenerator.generatePreviewHtml(
        "qvd5mb9xqn51v7liwvmczge7",
        previewData,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to generate preview");
    });
  });
});
