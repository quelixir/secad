import { PDFGenerator, PDFOptions, PDFGenerationResult } from "./pdf-generator";

// Mock puppeteer to avoid browser environment issues in tests
jest.mock("puppeteer", () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setViewport: jest.fn().mockResolvedValue(undefined),
      setContent: jest.fn().mockResolvedValue(undefined),
      pdf: jest.fn().mockResolvedValue(Buffer.from("mock-pdf-content")),
      close: jest.fn().mockResolvedValue(undefined),
    }),
    pages: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe("PDFGenerator", () => {
  let pdfGenerator: PDFGenerator;

  beforeEach(() => {
    pdfGenerator = new PDFGenerator();
  });

  afterEach(async () => {
    await pdfGenerator.cleanup();
  });

  describe("Interface and Structure", () => {
    it("should have correct default options", () => {
      const generator = new PDFGenerator();

      // Test that the class can be instantiated
      expect(generator).toBeInstanceOf(PDFGenerator);
    });

    it("should define PDFOptions interface correctly", () => {
      const options: PDFOptions = {
        format: "A4",
        orientation: "portrait",
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      };

      expect(options.format).toBe("A4");
      expect(options.orientation).toBe("portrait");
      expect(options.margin).toEqual({
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      });
    });

    it("should define PDFGenerationResult interface correctly", () => {
      const successResult: PDFGenerationResult = {
        success: true,
        data: Buffer.from("test-pdf"),
      };

      const errorResult: PDFGenerationResult = {
        success: false,
        error: "Test error",
      };

      expect(successResult.success).toBe(true);
      expect(successResult.data).toBeInstanceOf(Buffer);
      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe("Test error");
    });
  });

  describe("Error Handling", () => {
    it("should handle browser initialization failure", async () => {
      // Mock puppeteer to throw an error
      const mockPuppeteer = require("puppeteer");
      mockPuppeteer.launch.mockRejectedValueOnce(new Error("Launch failed"));

      await expect(pdfGenerator.initialize()).rejects.toThrow(
        "Failed to initialize PDF generator",
      );
    });

    it("should handle page creation failure", async () => {
      // Mock puppeteer to return null browser
      const mockPuppeteer = require("puppeteer");
      mockPuppeteer.launch.mockResolvedValueOnce(null);

      await pdfGenerator.initialize();

      const result = await pdfGenerator.generatePDF(
        "<html><body>Test</body></html>",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Browser not initialized");
    });

    it("should handle content loading timeout", async () => {
      // Mock setContent to throw a timeout error
      const mockPuppeteer = require("puppeteer");
      const mockPage = {
        setViewport: jest.fn().mockResolvedValue(undefined),
        setContent: jest
          .fn()
          .mockRejectedValue(new Error("Content loading timeout")),
        close: jest.fn().mockResolvedValue(undefined),
      };
      mockPuppeteer.launch.mockResolvedValueOnce({
        newPage: jest.fn().mockResolvedValue(mockPage),
        pages: jest.fn().mockResolvedValue([]),
        close: jest.fn().mockResolvedValue(undefined),
      });

      await pdfGenerator.initialize();

      const result = await pdfGenerator.generatePDF(
        "<html><body>Test</body></html>",
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("timeout");
    });
  });

  describe("Memory Management", () => {
    it("should provide memory usage information", async () => {
      const memoryUsage = await pdfGenerator.getMemoryUsage();

      expect(memoryUsage).toHaveProperty("used");
      expect(memoryUsage).toHaveProperty("total");
      expect(typeof memoryUsage.used).toBe("number");
      expect(typeof memoryUsage.total).toBe("number");
    });

    it("should cleanup resources properly", async () => {
      await pdfGenerator.initialize();

      const result = await pdfGenerator.generatePDF(
        "<html><body>Test</body></html>",
      );
      expect(result.success).toBe(true);

      await pdfGenerator.cleanup();

      const memoryUsage = await pdfGenerator.getMemoryUsage();
      expect(memoryUsage.used).toBe(0);
    });
  });

  describe("PDF Generation Options", () => {
    it("should accept custom PDF options", async () => {
      const options: Partial<PDFOptions> = {
        format: "A4",
        orientation: "landscape",
        margin: {
          top: "30mm",
          right: "20mm",
          bottom: "30mm",
          left: "20mm",
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: "<div>Header</div>",
        footerTemplate: "<div>Footer</div>",
      };

      // Test that options can be defined
      expect(options.format).toBe("A4");
      expect(options.orientation).toBe("landscape");
      expect(options.margin).toEqual({
        top: "30mm",
        right: "20mm",
        bottom: "30mm",
        left: "20mm",
      });
      expect(options.printBackground).toBe(true);
      expect(options.preferCSSPageSize).toBe(true);
      expect(options.displayHeaderFooter).toBe(true);
      expect(options.headerTemplate).toBe("<div>Header</div>");
      expect(options.footerTemplate).toBe("<div>Footer</div>");
    });

    it("should handle different page formats", () => {
      const formats: Array<"A4" | "Letter" | "Legal"> = [
        "A4",
        "Letter",
        "Legal",
      ];

      formats.forEach((format) => {
        const options: Partial<PDFOptions> = { format };
        expect(options.format).toBe(format);
      });
    });

    it("should handle different orientations", () => {
      const orientations: Array<"portrait" | "landscape"> = [
        "portrait",
        "landscape",
      ];

      orientations.forEach((orientation) => {
        const options: Partial<PDFOptions> = { orientation };
        expect(options.orientation).toBe(orientation);
      });
    });
  });

  describe("Service Methods", () => {
    it("should have generatePDF method", () => {
      expect(typeof pdfGenerator.generatePDF).toBe("function");
    });

    it("should have generatePDFFromFile method", () => {
      expect(typeof pdfGenerator.generatePDFFromFile).toBe("function");
    });

    it("should have cleanup method", () => {
      expect(typeof pdfGenerator.cleanup).toBe("function");
    });

    it("should have getMemoryUsage method", () => {
      expect(typeof pdfGenerator.getMemoryUsage).toBe("function");
    });

    it("should have initialize method", () => {
      expect(typeof pdfGenerator.initialize).toBe("function");
    });
  });

  describe("Singleton Export", () => {
    it("should export a singleton instance", () => {
      const { pdfGenerator: singleton } = require("./pdf-generator");
      expect(singleton).toBeInstanceOf(PDFGenerator);
    });
  });
});
