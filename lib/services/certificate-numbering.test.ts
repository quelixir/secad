import {
  CertificateNumberingService,
  CertificateNumberingConfig,
} from "./certificate-numbering";
import { prisma } from "@/lib/db";

// Mock the database
jest.mock("@/lib/db", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

describe("CertificateNumberingService", () => {
  let service: CertificateNumberingService;
  let mockTransaction: any;

  beforeEach(() => {
    service = new CertificateNumberingService();
    mockTransaction = jest.fn();
    (prisma.$transaction as any).mockImplementation(mockTransaction);
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.clearCache();
  });

  describe("generateCertificateNumber", () => {
    it("should generate certificate number with default format", async () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
      };

      mockTransaction.mockResolvedValue({
        certificateNumber: "2024-0001",
        sequence: 1,
      });

      const result = await service.generateCertificateNumber(
        config,
        "user-123",
      );

      expect(result.success).toBe(true);
      expect(result.data?.certificateNumber).toBe("2024-0001");
      expect(result.data?.year).toBe(2024);
      expect(result.data?.sequence).toBe(1);
      expect(result.data?.entityId).toBe("entity-123");
      expect(result.data?.generatedBy).toBe("user-123");
    });

    it("should generate certificate number with custom format", async () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
        format: "CERT-{YEAR}-{SEQUENTIAL_NUMBER}",
        prefix: "CUSTOM",
      };

      mockTransaction.mockResolvedValue({
        certificateNumber: "CUSTOM-CERT-2024-0001",
        sequence: 1,
      });

      const result = await service.generateCertificateNumber(config);

      expect(result.success).toBe(true);
      expect(result.data?.certificateNumber).toBe("CUSTOM-CERT-2024-0001");
    });

    it("should increment sequence number for existing certificates", async () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
      };

      // Mock finding an existing transaction with certificate data
      mockTransaction.mockImplementation(async (callback: any) => {
        const mockTx = {
          transaction: {
            findFirst: jest.fn().mockResolvedValue({
              certificateData: {
                certificateNumber: "2024-0001",
              },
            }),
          },
        };
        return callback(mockTx);
      });

      const result = await service.generateCertificateNumber(config);

      expect(result.success).toBe(true);
      expect(result.data?.sequence).toBe(2);
    });

    it("should handle year rollover correctly", async () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2025,
      };

      mockTransaction.mockResolvedValue({
        certificateNumber: "2025-0001",
        sequence: 1,
      });

      const result = await service.generateCertificateNumber(config);

      expect(result.success).toBe(true);
      expect(result.data?.certificateNumber).toBe("2025-0001");
      expect(result.data?.year).toBe(2025);
      expect(result.data?.sequence).toBe(1);
    });

    it("should return cached number if available", async () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
      };

      // First call to populate cache
      mockTransaction.mockResolvedValue({
        certificateNumber: "2024-0001",
        sequence: 1,
      });

      await service.generateCertificateNumber(config);

      // Second call should use cache
      const result = await service.generateCertificateNumber(config);

      expect(result.success).toBe(true);
      expect(result.data?.certificateNumber).toBe("2024-0001");
      expect(mockTransaction).toHaveBeenCalledTimes(2); // Called twice - once for generation, once for cache check
    });

    it("should handle database errors gracefully", async () => {
      const originalConsoleError = console.error;
      console.error = jest.fn();

      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
      };

      mockTransaction.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result = await service.generateCertificateNumber(config);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");

      // Verify that the error was logged
      expect(console.error).toHaveBeenCalledWith(
        "Error generating certificate number:",
        expect.any(Error),
      );

      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe("validateConfig", () => {
    it("should validate correct configuration", () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
        format: "{YEAR}-{SEQUENTIAL_NUMBER}",
      };

      const result = service.validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject configuration without entity ID", () => {
      const config: CertificateNumberingConfig = {
        entityId: "",
        year: 2024,
      };

      const result = service.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Entity ID is required");
    });

    it("should reject invalid year", () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 1800,
      };

      const result = service.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Year must be between 1900 and 2100");
    });

    it("should reject format without required placeholders", () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
        format: "CERT-{SEQUENTIAL_NUMBER}", // Missing {YEAR}
      };

      const result = service.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Format must include {YEAR} placeholder");
    });
  });

  describe("resolveConflict", () => {
    it("should resolve conflicts by generating new number", async () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
      };

      mockTransaction
        .mockResolvedValueOnce({
          certificateNumber: "2024-0001",
          sequence: 1,
        })
        .mockResolvedValueOnce({
          certificateNumber: "2024-0002",
          sequence: 2,
        });

      const result = await service.resolveConflict(
        "entity-123",
        2024,
        "2024-0001",
        "user-123",
      );

      expect(result.success).toBe(true);
      expect(result.data?.certificateNumber).toBe("2024-0002");
    });

    it("should fail after multiple conflict attempts", async () => {
      const config: CertificateNumberingConfig = {
        entityId: "entity-123",
        year: 2024,
      };

      mockTransaction.mockResolvedValue({
        certificateNumber: "2024-0001", // Always returns the same number
        sequence: 1,
      });

      const result = await service.resolveConflict(
        "entity-123",
        2024,
        "2024-0001",
        "user-123",
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Failed to resolve certificate number conflict after multiple attempts",
      );
    });
  });

  describe("cache management", () => {
    it("should clear specific cache entry", () => {
      // Populate cache
      const cacheKey = "entity-123-2024";
      (service as any).cache.set(cacheKey, {
        number: "2024-0001",
        timestamp: Date.now(),
      });

      service.clearCache("entity-123", 2024);

      expect((service as any).cache.has(cacheKey)).toBe(false);
    });

    it("should clear all cache entries for entity", () => {
      // Populate cache with multiple entries
      (service as any).cache.set("entity-123-2024", {
        number: "2024-0001",
        timestamp: Date.now(),
      });
      (service as any).cache.set("entity-123-2025", {
        number: "2025-0001",
        timestamp: Date.now(),
      });
      (service as any).cache.set("entity-456-2024", {
        number: "2024-0001",
        timestamp: Date.now(),
      });

      service.clearCache("entity-123");

      expect((service as any).cache.has("entity-123-2024")).toBe(false);
      expect((service as any).cache.has("entity-123-2025")).toBe(false);
      expect((service as any).cache.has("entity-456-2024")).toBe(true); // Should remain
    });

    it("should clear entire cache", () => {
      // Populate cache
      (service as any).cache.set("entity-123-2024", {
        number: "2024-0001",
        timestamp: Date.now(),
      });

      service.clearCache();

      expect((service as any).cache.size).toBe(0);
    });

    it("should return cache statistics", () => {
      // Populate cache
      (service as any).cache.set("entity-123-2024", {
        number: "2024-0001",
        timestamp: Date.now(),
      });

      const stats = service.getCacheStats();

      expect(stats.size).toBe(1);
      expect(stats.entries).toBe(1);
    });
  });

  describe("formatCertificateNumber", () => {
    it("should format with default template", () => {
      const result = (service as any).formatCertificateNumber(
        "{YEAR}-{SEQUENTIAL_NUMBER}",
        2024,
        1,
        "CERT",
        "",
      );

      expect(result).toBe("CERT-2024-0001");
    });

    it("should format with custom template", () => {
      const result = (service as any).formatCertificateNumber(
        "CERT-{YEAR}-{SEQUENTIAL_NUMBER}-{PREFIX}",
        2024,
        1,
        "CUSTOM",
        "",
      );

      expect(result).toBe("CERT-2024-0001-CUSTOM");
    });

    it("should handle prefix and suffix", () => {
      const result = (service as any).formatCertificateNumber(
        "{YEAR}-{SEQUENTIAL_NUMBER}",
        2024,
        1,
        "CERT",
        "SUFFIX",
      );

      expect(result).toBe("CERT-2024-0001-SUFFIX");
    });
  });

  describe("extractSequenceFromNumber", () => {
    it("should extract sequence from year-number format", () => {
      const result = (service as any).extractSequenceFromNumber(
        "2024-0001",
        2024,
      );
      expect(result).toBe(1);
    });

    it("should extract sequence from cert-year-number format", () => {
      const result = (service as any).extractSequenceFromNumber(
        "CERT-2024-0001",
        2024,
      );
      expect(result).toBe(1);
    });

    it("should extract sequence from number-year format", () => {
      const result = (service as any).extractSequenceFromNumber(
        "0001-2024",
        2024,
      );
      expect(result).toBe(1);
    });

    it("should fallback to 1 for unrecognized format", () => {
      const result = (service as any).extractSequenceFromNumber(
        "UNKNOWN-FORMAT",
        2024,
      );
      expect(result).toBe(1);
    });
  });

  describe("validateCertificateNumber", () => {
    it("should validate correct certificate number", () => {
      const result = (service as any).validateCertificateNumber(
        "2024-0001",
        "{YEAR}-{SEQUENTIAL_NUMBER}",
      );
      expect(result).toBe(true);
    });

    it("should reject empty certificate number", () => {
      const result = (service as any).validateCertificateNumber(
        "",
        "{YEAR}-{SEQUENTIAL_NUMBER}",
      );
      expect(result).toBe(false);
    });

    it("should reject certificate number without year", () => {
      const result = (service as any).validateCertificateNumber(
        "0001",
        "{YEAR}-{SEQUENTIAL_NUMBER}",
      );
      expect(result).toBe(false); // "0001" doesn't contain a 4-digit year
    });

    it("should reject certificate number without sequence", () => {
      const result = (service as any).validateCertificateNumber(
        "2024",
        "{YEAR}-{SEQUENTIAL_NUMBER}",
      );
      expect(result).toBe(false); // "2024" doesn't contain a separate sequence number
    });
  });
});
