import { prisma } from "@/lib/db";

export interface CertificateNumberingConfig {
  entityId: string;
  year: number;
  prefix?: string;
  suffix?: string;
  startNumber?: number;
  format?: string;
}

export interface CertificateNumberData {
  certificateNumber: string;
  year: number;
  sequence: number;
  entityId: string;
  generatedAt: Date;
  generatedBy: string;
}

export interface CertificateNumberingResult {
  success: boolean;
  data?: CertificateNumberData;
  error?: string;
}

export class CertificateNumberingService {
  private cache = new Map<string, { number: string; timestamp: number }>();
  private readonly cacheTimeout = 300000; // 5 minutes in milliseconds
  private readonly logger = console; // Replace with proper logging service

  /**
   * Generate certificate number for entity per year with atomic operations
   */
  async generateCertificateNumber(
    config: CertificateNumberingConfig,
    generatedBy: string = "system",
  ): Promise<CertificateNumberingResult> {
    const {
      entityId,
      year,
      prefix = "CERT",
      suffix = "",
      startNumber = 1,
      format = "{YEAR}-{SEQUENTIAL_NUMBER}",
    } = config;

    try {
      // Check cache first
      const cacheKey = `${entityId}-${year}`;
      const cached = this.getCachedNumber(cacheKey);
      if (cached) {
        return {
          success: true,
          data: {
            certificateNumber: cached,
            year,
            sequence: this.extractSequenceFromNumber(cached, year),
            entityId,
            generatedAt: new Date(),
            generatedBy,
          },
        };
      }

      // Use database transaction for atomic number generation
      const result = await prisma.$transaction(async (tx) => {
        // Get the last certificate number for this entity and year
        const lastTransaction = await tx.transaction.findFirst({
          where: {
            entityId,
            certificateData: {
              not: null as any,
            },
            createdAt: {
              gte: new Date(year, 0, 1),
              lt: new Date(year + 1, 0, 1),
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            certificateData: true,
          },
        });

        let nextSequence = startNumber;

        if (lastTransaction?.certificateData) {
          const lastData = lastTransaction.certificateData as any;
          if (lastData.certificateNumber) {
            const lastSequence = this.extractSequenceFromNumber(
              lastData.certificateNumber,
              year,
            );
            nextSequence = lastSequence + 1;
          }
        }

        // Generate the certificate number
        const certificateNumber = this.formatCertificateNumber(
          format,
          year,
          nextSequence,
          prefix,
          suffix,
        );

        // Validate the generated number
        if (!this.validateCertificateNumber(certificateNumber, format)) {
          throw new Error(
            `Invalid certificate number format: ${certificateNumber}`,
          );
        }

        // Cache the number
        this.cacheNumber(cacheKey, certificateNumber);

        // Log the number generation
        this.logNumberGeneration(
          entityId,
          year,
          nextSequence,
          certificateNumber,
          generatedBy,
        );

        return {
          certificateNumber,
          sequence: nextSequence,
        };
      });

      return {
        success: true,
        data: {
          certificateNumber: result.certificateNumber,
          year,
          sequence: result.sequence,
          entityId,
          generatedAt: new Date(),
          generatedBy,
        },
      };
    } catch (error) {
      this.logger.error("Error generating certificate number:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate certificate number",
      };
    }
  }

  /**
   * Format certificate number according to the specified format
   */
  private formatCertificateNumber(
    format: string,
    year: number,
    sequence: number,
    prefix: string,
    suffix: string,
  ): string {
    let formatted = format
      .replace(/{YEAR}/g, year.toString())
      .replace(/{SEQUENTIAL_NUMBER}/g, sequence.toString().padStart(4, "0"))
      .replace(/{PREFIX}/g, prefix)
      .replace(/{SUFFIX}/g, suffix);

    // Apply prefix and suffix if not already in format
    if (!format.includes("{PREFIX}") && prefix) {
      formatted = `${prefix}-${formatted}`;
    }
    if (!format.includes("{SUFFIX}") && suffix) {
      formatted = `${formatted}-${suffix}`;
    }

    return formatted;
  }

  /**
   * Extract sequence number from certificate number
   */
  private extractSequenceFromNumber(
    certificateNumber: string,
    year: number,
  ): number {
    // Try to extract sequence from common formats
    const patterns = [
      new RegExp(`${year}-(\\d+)`), // 2024-0001
      new RegExp(`CERT-${year}-(\\d+)`), // CERT-2024-0001
      new RegExp(`(\\d+)-${year}`), // 0001-2024
      new RegExp(`(\\d+)`), // Just the number
    ];

    for (const pattern of patterns) {
      const match = certificateNumber.match(pattern);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }

    // Fallback: try to extract any 4-digit number
    const fallbackMatch = certificateNumber.match(/(\d{4})/);
    if (fallbackMatch) {
      return parseInt(fallbackMatch[1], 10);
    }

    return 1; // Default fallback
  }

  /**
   * Validate certificate number format
   */
  private validateCertificateNumber(
    certificateNumber: string,
    format: string,
  ): boolean {
    if (!certificateNumber || certificateNumber.trim().length === 0) {
      return false;
    }

    // Basic validation - ensure it contains year and sequence
    const hasYear = /\d{4}/.test(certificateNumber);
    const hasSequence = /\d+/.test(certificateNumber);

    // More strict validation - ensure it has both year and sequence
    if (!hasYear || !hasSequence) {
      return false;
    }

    // Check that the sequence is not just the year repeated
    const yearMatch = certificateNumber.match(/\d{4}/);
    const sequenceMatch = certificateNumber.match(/\d+/);

    if (
      yearMatch &&
      sequenceMatch &&
      yearMatch[0] === sequenceMatch[0] &&
      certificateNumber.match(/\d{4}/g)?.length === 1
    ) {
      return false; // Year and sequence are the same and there's only one 4-digit number
    }

    return true;
  }

  /**
   * Get cached certificate number
   */
  private getCachedNumber(cacheKey: string): string | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.number;
    }
    this.cache.delete(cacheKey);
    return null;
  }

  /**
   * Cache certificate number
   */
  private cacheNumber(cacheKey: string, number: string): void {
    this.cache.set(cacheKey, {
      number,
      timestamp: Date.now(),
    });
  }

  /**
   * Log number generation for audit purposes
   */
  private logNumberGeneration(
    entityId: string,
    year: number,
    sequence: number,
    certificateNumber: string,
    generatedBy: string,
  ): void {
    this.logger.info("Certificate number generated", {
      entityId,
      year,
      sequence,
      certificateNumber,
      generatedBy,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Resolve conflicts by generating a new number
   */
  async resolveConflict(
    entityId: string,
    year: number,
    conflictingNumber: string,
    generatedBy: string = "system",
  ): Promise<CertificateNumberingResult> {
    this.logger.warn("Certificate number conflict detected", {
      entityId,
      year,
      conflictingNumber,
      generatedBy,
    });

    // Try to generate a new number with a retry mechanism
    for (let attempt = 1; attempt <= 3; attempt++) {
      const result = await this.generateCertificateNumber(
        { entityId, year },
        generatedBy,
      );

      if (
        result.success &&
        result.data?.certificateNumber !== conflictingNumber
      ) {
        return result;
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }

    return {
      success: false,
      error:
        "Failed to resolve certificate number conflict after multiple attempts",
    };
  }

  /**
   * Clear cache for specific entity and year
   */
  clearCache(entityId?: string, year?: number): void {
    if (entityId && year) {
      this.cache.delete(`${entityId}-${year}`);
    } else if (entityId) {
      // Clear all cache entries for this entity
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${entityId}-`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear entire cache
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }

  /**
   * Validate certificate numbering configuration
   */
  validateConfig(config: CertificateNumberingConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!config.entityId) {
      errors.push("Entity ID is required");
    }

    if (!config.year || config.year < 1900 || config.year > 2100) {
      errors.push("Year must be between 1900 and 2100");
    }

    if (config.startNumber && config.startNumber < 1) {
      errors.push("Start number must be greater than 0");
    }

    if (config.format && !config.format.includes("{YEAR}")) {
      errors.push("Format must include {YEAR} placeholder");
    }

    if (config.format && !config.format.includes("{SEQUENTIAL_NUMBER}")) {
      errors.push("Format must include {SEQUENTIAL_NUMBER} placeholder");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const certificateNumberingService = new CertificateNumberingService();
