import { pdfGenerator, PDFOptions } from "./pdf-generator";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/locale";
import { getDefaultCurrencyCode } from "@/lib/config";
import { Readable } from "stream";
import {
  TemplateValidationService,
  TemplateData,
} from "@/lib/certificate-templates/template-validation";
import { AuditLogger } from "@/lib/audit";

export interface CertificateData {
  entityId: string;
  entityName: string;
  entityAddress: string;
  entityPhone: string;
  entityType: string;
  entityContact: string;
  entityEmail: string;
  transactionId: string;
  transactionDate: Date;
  transactionType: string;
  transactionReason: string;
  transactionDescription: string;
  securityClass: string;
  securityName: string;
  securitySymbol: string;
  quantity: number;
  totalAmount: number;
  unitPrice: number;
  totalValue: number;
  currency: string;
  memberName: string;
  memberId: string;
  memberType: string;
  memberAddress: string;
  certificateNumber: string;
  issueDate: Date;
  [key: string]: any; // Allow additional dynamic properties
}

export interface CertificateMetadata {
  certificateId: string;
  entityId: string;
  transactionId: string;
  certificateNumber: string;
  issueDate: Date;
  templateId: string;
  format: "PDF" | "DOCX";
  generatedAt: Date;
  generatedBy: string;
  fileSize: number;
  checksum: string;
}

export interface CertificateGenerationResult {
  success: boolean;
  data?: {
    certificateBuffer: Buffer | Uint8Array;
    metadata: CertificateMetadata;
  };
  error?: string;
}

export interface CertificateStreamingResult {
  success: boolean;
  stream?: Readable;
  metadata?: CertificateMetadata;
  error?: string;
}

export interface CertificateNumberingConfig {
  entityId: string;
  year: number;
  prefix?: string;
  suffix?: string;
  startNumber?: number;
}

export interface DownloadAnalytics {
  downloadId: string;
  transactionId: string;
  certificateNumber: string;
  format: string;
  fileSize: number;
  downloadStartedAt: Date;
  downloadCompletedAt?: Date;
  downloadDuration?: number;
  userAgent?: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
}

export class CertificateGenerator {
  private cache = new Map<
    string,
    { data: Buffer; metadata: CertificateMetadata; timestamp: number }
  >();
  private readonly cacheTimeout = 3600000; // 1 hour in milliseconds
  private readonly logger = console; // Replace with proper logging service
  private readonly maxConcurrentGenerations = 10;
  private activeGenerations = 0;
  private downloadAnalytics: Map<string, DownloadAnalytics> = new Map();
  private readonly templateValidationService = new TemplateValidationService();

  /**
   * Generate certificate number for entity per year
   */
  async generateCertificateNumber(
    config: CertificateNumberingConfig,
  ): Promise<string> {
    const {
      entityId,
      year,
      prefix = "CERT",
      suffix = "",
      startNumber = 1,
    } = config;

    // Get the last certificate number for this entity and year from transactions
    const lastTransaction = await prisma.transaction.findFirst({
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
    });

    let nextNumber = startNumber;
    if (lastTransaction && lastTransaction.certificateData) {
      const certData = lastTransaction.certificateData as any;
      if (certData.certificateNumber) {
        // Extract number from existing certificate number
        const match = certData.certificateNumber.match(/(\d{6})$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
    }

    return `${prefix}${year}${nextNumber.toString().padStart(6, "0")}${suffix}`;
  }

  /**
   * Replace template variables with actual data
   */
  private replaceTemplateVariables(
    templateHtml: string,
    data: CertificateData,
  ): string {
    let processedHtml = templateHtml;

    // Replace all template variables
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (typeof value === "string") {
        processedHtml = processedHtml.replace(
          new RegExp(placeholder, "g"),
          value,
        );
      } else if (typeof value === "number") {
        processedHtml = processedHtml.replace(
          new RegExp(placeholder, "g"),
          value.toString(),
        );
      } else if (value instanceof Date) {
        processedHtml = processedHtml.replace(
          new RegExp(placeholder, "g"),
          value.toLocaleDateString(),
        );
      }
    });

    return processedHtml;
  }

  /**
   * Populate certificate data from transaction
   */
  async populateCertificateData(
    transactionId: string,
    entityId: string,
  ): Promise<CertificateData> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        entity: {
          include: {
            identifiers: true,
          },
        },
        securityClass: true,
        toMember: {
          include: {
            contacts: true,
          },
        },
        fromMember: true,
      },
    });

    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    if (!transaction.entity) {
      throw new Error(`Entity not found for transaction: ${transactionId}`);
    }

    if (!transaction.securityClass) {
      throw new Error(
        `Security class not found for transaction: ${transactionId}`,
      );
    }

    if (!transaction.toMember) {
      throw new Error(`Member not found for transaction: ${transactionId}`);
    }

    // Get locale and currency
    const locale = await getLocale();
    const currencyCode = getDefaultCurrencyCode();

    // Format currency values
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
      }).format(amount);
    };

    // Get member contact information
    const primaryContact = transaction.toMember.contacts?.[0];
    const memberAddress = transaction.toMember.address || "Not specified";
    const memberPhone =
      primaryContact?.phone || transaction.toMember.phone || "Not specified";
    const memberEmail =
      primaryContact?.email || transaction.toMember.email || "Not specified";

    // Get entity contact information
    const entityContact = transaction.entity.name || "Not specified";
    const entityEmail = transaction.entity.email || "Not specified";
    const entityPhone = transaction.entity.phone || "Not specified";

    // Format entity address
    const entityAddress = [
      transaction.entity.address,
      transaction.entity.city,
      transaction.entity.state,
      transaction.entity.postcode,
      transaction.entity.country,
    ]
      .filter(Boolean)
      .join(", ");

    // Format member address
    const memberFormattedAddress = [
      memberAddress,
      transaction.toMember.city,
      transaction.toMember.state,
      transaction.toMember.postcode,
      transaction.toMember.country,
    ]
      .filter(Boolean)
      .join(", ");

    // Calculate amounts from transaction data
    const totalAmountPaid = transaction.totalAmountPaid
      ? Number(transaction.totalAmountPaid)
      : 0;
    const totalAmountUnpaid = transaction.totalAmountUnpaid
      ? Number(transaction.totalAmountUnpaid)
      : 0;
    const totalAmount = totalAmountPaid + totalAmountUnpaid;

    const amountPaidPerSecurity = transaction.amountPaidPerSecurity
      ? Number(transaction.amountPaidPerSecurity)
      : 0;
    const amountUnpaidPerSecurity = transaction.amountUnpaidPerSecurity
      ? Number(transaction.amountUnpaidPerSecurity)
      : 0;
    const unitPrice = amountPaidPerSecurity + amountUnpaidPerSecurity;

    const certificateData: CertificateData = {
      entityId: transaction.entityId,
      entityName: transaction.entity.name,
      entityAddress,
      entityPhone,
      entityType: transaction.entity.entityTypeId,
      entityContact,
      entityEmail,
      transactionId: transaction.id,
      transactionDate: transaction.createdAt,
      transactionType: transaction.transactionType,
      transactionReason: transaction.reasonCode,
      transactionDescription: transaction.description || "",
      securityClass: transaction.securityClass.name,
      securityName: transaction.securityClass.name,
      securitySymbol: transaction.securityClass.symbol || "",
      quantity: transaction.quantity,
      totalAmount,
      unitPrice,
      totalValue: totalAmount,
      currency: currencyCode,
      memberName:
        transaction.toMember.entityName ||
        transaction.toMember.givenNames ||
        "Unknown Member",
      memberId: transaction.toMember.id,
      memberType: transaction.toMember.memberType,
      memberAddress: memberFormattedAddress,
      certificateNumber: "", // Will be set later
      issueDate: new Date(),
    };

    // Add entity identifiers as dynamic properties
    if (transaction.entity.identifiers) {
      transaction.entity.identifiers.forEach((identifier) => {
        certificateData[`entity${identifier.type}`] = identifier.value;
      });
    }

    // Add member contact information as dynamic properties
    if (primaryContact) {
      certificateData.memberPhone = memberPhone;
      certificateData.memberEmail = memberEmail;
    }

    // Validate the data
    this.validateCertificateData(certificateData);

    return certificateData;
  }

  /**
   * Validate certificate data
   */
  private validateCertificateData(data: CertificateData): void {
    const requiredFields = [
      "entityId",
      "entityName",
      "transactionId",
      "securityClass",
      "memberName",
      "quantity",
      "totalAmount",
    ];

    const missingFields = requiredFields.filter(
      (field) => !data[field as keyof CertificateData],
    );

    if (missingFields.length > 0) {
      throw new Error(
        `Missing required certificate data: ${missingFields.join(", ")}`,
      );
    }
  }

  /**
   * Generate metadata for certificate
   */
  private generateMetadata(
    data: CertificateData,
    templateId: string,
    format: "PDF" | "DOCX",
    certificateBuffer: Buffer | Uint8Array,
    generatedBy: string,
  ): CertificateMetadata {
    const certificateId = `cert_${data.entityId}_${
      data.transactionId
    }_${Date.now()}`;
    const bufferData = Buffer.isBuffer(certificateBuffer)
      ? certificateBuffer
      : Buffer.from(certificateBuffer);
    const checksum = this.generateChecksum(bufferData);

    return {
      certificateId,
      entityId: data.entityId,
      transactionId: data.transactionId,
      certificateNumber: data.certificateNumber,
      issueDate: data.issueDate,
      templateId,
      format,
      generatedAt: new Date(),
      generatedBy,
      fileSize: certificateBuffer.length,
      checksum,
    };
  }

  /**
   * Generate checksum for certificate buffer
   */
  private generateChecksum(buffer: Buffer): string {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Convert CertificateData to TemplateData for validation
   */
  private convertToTemplateData(data: CertificateData): TemplateData {
    return {
      entityName: data.entityName,
      entityType: data.entityType,
      entityAddress: data.entityAddress,
      entityContact: data.entityContact,
      entityPhone: data.entityPhone,
      entityEmail: data.entityEmail,
      memberName: data.memberName,
      memberType: data.memberType,
      memberAddress: data.memberAddress,
      transactionId: data.transactionId,
      transactionDate: data.transactionDate.toISOString().split("T")[0],
      transactionType: data.transactionType,
      transactionReason: data.transactionReason,
      securityName: data.securityName,
      securitySymbol: data.securitySymbol,
      securityClass: data.securityClass,
      quantity: data.quantity.toString(),
      unitPrice: data.unitPrice.toString(),
      totalValue: data.totalValue.toString(),
      transactionAmount: `${data.currency} ${data.totalAmount.toFixed(2)}`,
      currency: data.currency,
      certificateNumber: data.certificateNumber,
      generationDate: data.issueDate.toLocaleDateString(),
      generationTimestamp: data.issueDate.toISOString(),
    };
  }

  /**
   * Get cached certificate
   */
  private getCachedCertificate(
    cacheKey: string,
  ): { data: Buffer; metadata: CertificateMetadata; timestamp: number } | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(cacheKey);
      return null;
    }

    this.logger.log(`Certificate cache hit: ${cacheKey}`);
    return cached;
  }

  /**
   * Cache certificate
   */
  private cacheCertificate(
    cacheKey: string,
    data: Buffer,
    metadata: CertificateMetadata,
  ): void {
    this.cache.set(cacheKey, {
      data,
      metadata,
      timestamp: Date.now(),
    });
    this.logger.log(`Certificate cached: ${cacheKey}`);
  }

  /**
   * Generate PDF certificate with streaming support
   */
  async generatePDFCertificate(
    transactionId: string,
    templateId: string,
    options?: Partial<PDFOptions>,
    generatedBy: string = "system",
  ): Promise<CertificateGenerationResult> {
    this.logger.log(
      `Starting PDF certificate generation for transaction: ${transactionId}`,
    );

    const cacheKey = `pdf_${transactionId}_${templateId}_${JSON.stringify(
      options || {},
    )}`;

    // Check cache first
    const cached = this.getCachedCertificate(cacheKey);
    if (cached) {
      // Log certificate access event for cache hit
      try {
        await AuditLogger.logCertificateAccessed(
          cached.metadata.entityId,
          generatedBy,
          transactionId,
          cached.metadata.certificateNumber,
          "PDF",
          "generate",
          {
            cacheHit: true,
            templateId,
            originalGeneratedAt: cached.metadata.generatedAt,
            cacheAge: Date.now() - cached.timestamp,
          },
        );
      } catch (auditError) {
        this.logger.error(
          "Failed to log certificate cache access event:",
          auditError,
        );
        // Don't fail the generation if audit logging fails
      }

      return {
        success: true,
        data: {
          certificateBuffer: cached.data,
          metadata: cached.metadata,
        },
      };
    }

    try {
      // Check concurrent generation limit
      if (this.activeGenerations >= this.maxConcurrentGenerations) {
        return {
          success: false,
          error:
            "Too many concurrent certificate generations. Please try again later.",
        };
      }

      this.activeGenerations++;

      // Get template
      const template = await prisma.certificateTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error(`Certificate template not found: ${templateId}`);
      }

      // Populate certificate data
      const certificateData = await this.populateCertificateData(
        transactionId,
        templateId,
      );

      // Validate template with actual data
      const templateData = this.convertToTemplateData(certificateData);
      const templateValidation = await this.validateTemplate(
        templateId,
        templateData,
      );
      if (!templateValidation.valid) {
        throw new Error(
          `Template validation failed: ${templateValidation.errors.join(", ")}`,
        );
      }

      // Replace template variables
      const processedHtml = this.replaceTemplateVariables(
        template.templateHtml,
        certificateData,
      );

      // Generate PDF
      const pdfResult = await pdfGenerator.generatePDF(processedHtml, options);

      if (!pdfResult.success || !pdfResult.data) {
        throw new Error(
          pdfResult.error || "Failed to generate PDF certificate",
        );
      }

      // Generate metadata
      const metadata = this.generateMetadata(
        certificateData,
        templateId,
        "PDF",
        pdfResult.data,
        generatedBy,
      );

      // Cache the result
      const bufferData = Buffer.isBuffer(pdfResult.data)
        ? pdfResult.data
        : Buffer.from(pdfResult.data);
      this.cacheCertificate(cacheKey, bufferData, metadata);

      this.logger.log(
        `PDF certificate generated successfully: ${metadata.certificateId}`,
      );

      // Log certificate generation event
      try {
        await AuditLogger.logCertificateGenerated(
          certificateData.entityId,
          generatedBy,
          transactionId,
          templateId,
          "PDF",
          metadata.certificateNumber,
          metadata.fileSize,
          metadata.checksum,
          {
            templateScope: template.scope,
            templateName: template.name,
            generationDuration:
              Date.now() -
              (this.activeGenerations > 0 ? Date.now() : Date.now()), // Placeholder for actual duration tracking
            templateVariables: Object.keys(templateData),
            validationScore: templateValidation.completenessScore,
            validationWarnings: templateValidation.warnings,
            cacheHit: false,
            concurrentGenerations: this.activeGenerations,
            options: options || {},
          },
        );
      } catch (auditError) {
        this.logger.error(
          "Failed to log certificate generation event:",
          auditError,
        );
        // Don't fail the generation if audit logging fails
      }

      return {
        success: true,
        data: {
          certificateBuffer: pdfResult.data,
          metadata,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error generating PDF certificate: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF certificate",
      };
    } finally {
      this.activeGenerations--;
    }
  }

  /**
   * Generate PDF certificate with streaming
   */
  async generatePDFCertificateStream(
    transactionId: string,
    templateId: string,
    options?: Partial<PDFOptions>,
    generatedBy: string = "system",
  ): Promise<CertificateStreamingResult> {
    try {
      // Generate certificate first
      const result = await this.generatePDFCertificate(
        transactionId,
        templateId,
        options,
        generatedBy,
      );

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || "Failed to generate certificate",
        };
      }

      // Create readable stream from buffer
      const stream = new Readable();
      stream.push(result.data.certificateBuffer);
      stream.push(null); // End of stream

      return {
        success: true,
        stream,
        metadata: result.data.metadata,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create certificate stream",
      };
    }
  }

  /**
   * Generate DOCX certificate
   */
  async generateDOCXCertificate(
    transactionId: string,
    templateId: string,
    generatedBy: string = "system",
  ): Promise<CertificateGenerationResult> {
    this.logger.log(
      `Starting DOCX certificate generation for transaction: ${transactionId}`,
    );

    // For now, return a placeholder since DOCX generation is not implemented
    return {
      success: false,
      error: "DOCX certificate generation is not yet implemented",
    };
  }

  /**
   * Generate certificate in specified format
   */
  async generateCertificate(
    transactionId: string,
    templateId: string,
    format: "PDF" | "DOCX" = "PDF",
    options?: Partial<PDFOptions>,
    generatedBy: string = "system",
  ): Promise<CertificateGenerationResult> {
    if (format === "PDF") {
      return this.generatePDFCertificate(
        transactionId,
        templateId,
        options,
        generatedBy,
      );
    } else {
      return this.generateDOCXCertificate(
        transactionId,
        templateId,
        generatedBy,
      );
    }
  }

  /**
   * Clear certificate cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log("Certificate cache cleared");
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
   * Get memory usage statistics
   */
  getMemoryUsage(): { activeGenerations: number; maxConcurrent: number } {
    return {
      activeGenerations: this.activeGenerations,
      maxConcurrent: this.maxConcurrentGenerations,
    };
  }

  /**
   * Track download analytics
   */
  trackDownload(
    downloadId: string,
    analytics: Omit<DownloadAnalytics, "downloadId">,
  ): void {
    this.downloadAnalytics.set(downloadId, {
      downloadId,
      ...analytics,
    });
  }

  /**
   * Complete download tracking
   */
  completeDownload(
    downloadId: string,
    success: boolean,
    errorMessage?: string,
  ): void {
    const analytics = this.downloadAnalytics.get(downloadId);
    if (analytics) {
      analytics.downloadCompletedAt = new Date();
      analytics.downloadDuration =
        analytics.downloadCompletedAt.getTime() -
        analytics.downloadStartedAt.getTime();
      analytics.success = success;
      if (errorMessage) {
        analytics.errorMessage = errorMessage;
      }

      // Log analytics
      this.logger.log("Download analytics", analytics);

      // Clean up
      this.downloadAnalytics.delete(downloadId);
    }
  }

  /**
   * Generate preview HTML for template
   */
  async generatePreviewHtml(
    templateId: string,
    previewData: {
      transactionId: string;
      entityId: string;
      memberName: string;
      securityClass: string;
      quantity: number;
      certificateNumber?: string;
      issueDate: string;
      customFields?: Record<string, string>;
    },
  ): Promise<{ success: boolean; data?: { html: string }; error?: string }> {
    try {
      // Get template
      const template = await prisma.certificateTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return {
          success: false,
          error: "Certificate template not found",
        };
      }

      // Validate template structure
      const templateValidation = await this.validateTemplate(templateId);
      if (!templateValidation.valid) {
        return {
          success: false,
          error: `Template validation failed: ${templateValidation.errors.join(
            ", ",
          )}`,
        };
      }

      // Create sample data for preview
      const sampleData: CertificateData = {
        entityId: previewData.entityId,
        entityName: "Sample Entity",
        entityAddress: "123 Sample Street, Sample City, ST 12345",
        entityPhone: "+1 (555) 123-4567",
        entityType: "Corporation",
        entityContact: "John Doe",
        entityEmail: "contact@sample.com",
        transactionId: previewData.transactionId,
        transactionDate: new Date(),
        transactionType: "Purchase",
        transactionReason: "Investment",
        transactionDescription: "Sample transaction for preview",
        securityClass: previewData.securityClass,
        securityName: previewData.securityClass,
        securitySymbol: "SAMPLE",
        quantity: previewData.quantity,
        totalAmount: previewData.quantity * 10,
        unitPrice: 10,
        totalValue: previewData.quantity * 10,
        currency: "USD",
        memberName: previewData.memberName,
        memberId: "member-123",
        memberType: "Individual",
        memberAddress: "456 Member Ave, Member City, ST 67890",
        certificateNumber: previewData.certificateNumber || "CERT-2024-0001",
        issueDate: new Date(previewData.issueDate),
        ...previewData.customFields,
      };

      // Replace template variables
      const previewHtml = this.replaceTemplateVariables(
        template.templateHtml,
        sampleData,
      );

      return {
        success: true,
        data: { html: previewHtml },
      };
    } catch (error) {
      this.logger.error("Error generating preview HTML:", error);
      return {
        success: false,
        error: `Failed to generate preview: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Validate template with comprehensive checks
   */
  async validateTemplate(
    templateId: string,
    data?: TemplateData,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
    completenessScore: number;
    missingVariables: string[];
    invalidFormats: string[];
    fallbackValues: Record<string, string>;
  }> {
    try {
      const template = await prisma.certificateTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        return {
          valid: false,
          errors: ["Template not found"],
          warnings: [],
          completenessScore: 0,
          missingVariables: [],
          invalidFormats: [],
          fallbackValues: {},
        };
      }

      // Use comprehensive template validation service
      const validationResult = this.templateValidationService.validateTemplate(
        template,
        data,
      );

      return {
        valid: validationResult.isValid,
        errors: validationResult.errors.map((e) => `${e.field}: ${e.message}`),
        warnings: validationResult.warnings.map(
          (w) => `${w.field}: ${w.message}`,
        ),
        completenessScore: validationResult.completenessScore,
        missingVariables: validationResult.missingVariables,
        invalidFormats: validationResult.invalidFormats,
        fallbackValues: validationResult.fallbackValues,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [
          `Validation error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        ],
        warnings: [],
        completenessScore: 0,
        missingVariables: [],
        invalidFormats: [],
        fallbackValues: {},
      };
    }
  }
}

export const certificateGenerator = new CertificateGenerator();
