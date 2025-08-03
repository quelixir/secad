import { TemplateValidationService, TemplateData } from "./template-validation";

describe("TemplateValidationService", () => {
  let validationService: TemplateValidationService;

  beforeEach(() => {
    validationService = new TemplateValidationService();
  });

  describe("validateTemplateData", () => {
    it("should validate complete valid data", () => {
      const validData: TemplateData = {
        entityName: "Acme Corporation Ltd",
        memberName: "Jane Doe",
        transactionId: "zxfw8v2vholjwpu7m7rdzmbd",
        transactionDate: "2025-01-15",
        securityName: "Acme Corporation Ordinary Shares",
        quantity: "1000",
        transactionAmount: "AUD 25000.00",
        currency: "AUD",
      };

      const result = validationService.validateTemplateData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.completenessScore).toBeGreaterThan(25); // 8 fields out of 27 total = ~30%
    });

    it("should detect missing required fields", () => {
      const invalidData: TemplateData = {
        entityName: "Acme Corporation Ltd",
        // Missing memberName, transactionId, etc.
      };

      const result = validationService.validateTemplateData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingVariables).toContain("memberName");
      expect(result.missingVariables).toContain("transactionId");
    });

    it("should validate format requirements", () => {
      const invalidData: TemplateData = {
        entityName: "Acme Corporation Ltd",
        memberName: "Jane Doe",
        transactionId: "INVALID-ID", // Invalid format
        transactionDate: "15/01/2025", // Invalid format
        securityName: "Acme Corporation Ordinary Shares",
        quantity: "1000",
        transactionAmount: "25000.00", // Missing currency
        currency: "AUD",
      };

      const result = validationService.validateTemplateData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.invalidFormats).toContain("transactionId");
      expect(result.invalidFormats).toContain("transactionDate");
      expect(result.invalidFormats).toContain("transactionAmount");
    });

    it("should provide fallback values for optional fields", () => {
      const partialData: TemplateData = {
        entityName: "Acme Corporation Ltd",
        memberName: "Jane Doe",
        transactionId: "tcus0nscjo4sq6ay8qkvl07c",
        transactionDate: "2025-01-15",
        securityName: "Acme Corporation Ordinary Shares",
        quantity: "1000",
        transactionAmount: "AUD 25000.00",
        currency: "AUD",
        // Missing optional fields
      };

      const result = validationService.validateTemplateData(partialData);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(Object.keys(result.fallbackValues).length).toBeGreaterThan(0);
      expect(result.fallbackValues.entityType).toBe("Entity");
      expect(result.fallbackValues.entityAddress).toBe("Address not provided");
    });

    it("should validate length constraints", () => {
      const invalidData: TemplateData = {
        entityName: "A", // Too short
        memberName: "Jane Doe",
        transactionId: "sf68xoud2m3za7hddk93l3yl",
        transactionDate: "2025-01-15",
        securityName: "Acme Corporation Ordinary Shares",
        quantity: "1000",
        transactionAmount: "AUD 25000.00",
        currency: "AUD",
      };

      const result = validationService.validateTemplateData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === "MIN_LENGTH_VIOLATION")).toBe(
        true,
      );
    });

    it("should calculate completeness score correctly", () => {
      const partialData: TemplateData = {
        entityName: "Acme Corporation Ltd",
        memberName: "Jane Doe",
        transactionId: "sblc463fqq2gmf9d9buw62bn",
        transactionDate: "2025-01-15",
        securityName: "Acme Corporation Ordinary Shares",
        quantity: "1000",
        transactionAmount: "AUD 25000.00",
        currency: "AUD",
      };

      const result = validationService.validateTemplateData(partialData);

      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.completenessScore).toBeLessThanOrEqual(100);
    });
  });

  describe("validateTemplateHtml", () => {
    it("should validate template with all required variables", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: `
          <!DOCTYPE html>
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
        templateCss: "",
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validationService.validateTemplateHtml(template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.completenessScore).toBe(100);
    });

    it("should detect missing required template variables", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: `
          <!DOCTYPE html>
          <html>
            <body>
              <h1>{{entityName}}</h1>
              <p>{{memberName}}</p>
              <!-- Missing required variables -->
            </body>
          </html>
        `,
        templateCss: "",
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validationService.validateTemplateHtml(template);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.missingVariables.length).toBeGreaterThan(0);
    });

    it("should detect invalid template variables", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: `
          <!DOCTYPE html>
          <html>
            <body>
              <h1>{{entityName}}</h1>
              <p>{{invalidVariable}}</p>
              <p>{{anotherInvalidVar}}</p>
            </body>
          </html>
        `,
        templateCss: "",
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validationService.validateTemplateHtml(template);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.field === "templateHtml")).toBe(
        true,
      );
    });

    it("should validate HTML structure", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: `
          <body>
            <h1>{{entityName}}</h1>
          </body>
        `, // Missing DOCTYPE and HTML tags
        templateCss: "",
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validationService.validateTemplateHtml(template);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.message.includes("DOCTYPE"))).toBe(
        true,
      );
      expect(result.warnings.some((w) => w.message.includes("HTML tags"))).toBe(
        true,
      );
    });

    it("should handle empty template HTML", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: "",
        templateCss: "",
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validationService.validateTemplateHtml(template);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.code === "MISSING_TEMPLATE_HTML"),
      ).toBe(true);
      expect(result.completenessScore).toBe(0);
    });
  });

  describe("validateTemplateCss", () => {
    it("should validate template with CSS", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: "<html><body></body></html>",
        templateCss: `
          @page { size: A4; margin: 20mm; }
          @media print { body { color: black; } }
        `,
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validationService.validateTemplateCss(template);

      expect(result.isValid).toBe(true);
      expect(result.completenessScore).toBe(100);
    });

    it("should warn about missing CSS", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: "<html><body></body></html>",
        templateCss: "",
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validationService.validateTemplateCss(template);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.field === "templateCss")).toBe(true);
      expect(result.completenessScore).toBe(50);
    });

    it("should warn about missing print styles", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: "<html><body></body></html>",
        templateCss: "body { color: black; }", // No print styles
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validationService.validateTemplateCss(template);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.message.includes("@page"))).toBe(
        true,
      );
      expect(
        result.warnings.some((w) => w.message.includes("Print media queries")),
      ).toBe(true);
    });
  });

  describe("validateTemplate (comprehensive)", () => {
    it("should validate complete template with data", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: `
          <!DOCTYPE html>
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
        templateCss: `
          @page { size: A4; margin: 20mm; }
          @media print { body { color: black; } }
        `,
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const data: TemplateData = {
        entityName: "Acme Corporation Ltd",
        memberName: "Jane Doe",
        transactionId: "lx61xf1kiy792340fso1qirc",
        transactionDate: "2025-01-15",
        securityName: "Acme Corporation Ordinary Shares",
        quantity: "1000",
        transactionAmount: "AUD 25000.00",
        currency: "AUD",
      };

      const result = validationService.validateTemplate(template, data);

      expect(result.isValid).toBe(true);
      expect(result.completenessScore).toBeGreaterThan(70); // Combined score from HTML, CSS, and data
    });

    it("should handle invalid template with invalid data", () => {
      const template = {
        id: "test-template",
        name: "Test Template",
        description: "Test template",
        templateHtml: "<body><h1>{{entityName}}</h1></body>", // Missing required variables
        templateCss: "", // Missing CSS
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const data: TemplateData = {
        entityName: "A", // Too short
        // Missing required fields
      };

      const result = validationService.validateTemplate(template, data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe("utility methods", () => {
    it("should get validation rule for field", () => {
      const rule = validationService.getValidationRule("entityName");
      expect(rule).toBeDefined();
      expect(rule?.field).toBe("entityName");
      expect(rule?.required).toBe(true);
    });

    it("should get all validation rules", () => {
      const rules = validationService.getAllValidationRules();
      expect(rules.length).toBeGreaterThan(0);
      expect(rules.some((r) => r.field === "entityName")).toBe(true);
      expect(rules.some((r) => r.field === "entityType")).toBe(true);
    });

    it("should format validation errors", () => {
      const result = {
        isValid: false,
        errors: [
          {
            field: "entityName",
            message: "Entity name is required",
            severity: "error" as const,
            code: "REQUIRED_FIELD_MISSING",
          },
        ],
        warnings: [],
        completenessScore: 50,
        missingVariables: ["entityName"],
        invalidFormats: [],
        fallbackValues: {},
      };

      const formattedErrors = validationService.formatValidationErrors(result);
      expect(formattedErrors).toContain("entityName: Entity name is required");
    });

    it("should format validation warnings", () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: [
          {
            field: "entityType",
            message: "Entity type is missing",
            suggestion: "Consider providing a value",
          },
        ],
        completenessScore: 80,
        missingVariables: [],
        invalidFormats: [],
        fallbackValues: {},
      };

      const formattedWarnings =
        validationService.formatValidationWarnings(result);
      expect(formattedWarnings).toContain("entityType: Entity type is missing");
    });
  });

  describe("performance tests", () => {
    it("should handle large templates efficiently", () => {
      const largeHtml = `
        <!DOCTYPE html>
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
            ${Array(1000)
              .fill(0)
              .map((_, i) => `<p>{{entityName}} - ${i}</p>`)
              .join("")}
          </body>
        </html>
      `;

      const template = {
        id: "test-template",
        name: "Large Template",
        description: "Large template for performance testing",
        templateHtml: largeHtml,
        templateCss: "body { color: black; }",
        scope: "GLOBAL",
        scopeId: null,
        isDefault: false,
        isActive: true,
        createdBy: "test",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const startTime = Date.now();
      const result = validationService.validateTemplateHtml(template);
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it("should handle large datasets efficiently", () => {
      const largeData: TemplateData = {
        entityName: "A".repeat(200), // Max length
        memberName: "B".repeat(200),
        transactionId: "lek5v2nhdr3lwwd1ea2ungiz",
        transactionDate: "2025-01-15",
        securityName: "C".repeat(200),
        quantity: "1000",
        transactionAmount: "AUD 25000.00",
        currency: "AUD",
      };

      const startTime = Date.now();
      const result = validationService.validateTemplateData(largeData);
      const endTime = Date.now();

      expect(result.isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });
  });
});
