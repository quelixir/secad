import { pdfGenerator, PDFOptions } from "./pdf-generator";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/locale";
import { getDefaultCurrencyCode } from "@/lib/config";

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

export interface CertificateNumberingConfig {
  entityId: string;
  year: number;
  prefix?: string;
  suffix?: string;
  startNumber?: number;
}

export class CertificateGenerator {
  private cache = new Map<
    string,
    { data: Buffer; metadata: CertificateMetadata; timestamp: number }
  >();
  private readonly cacheTimeout = 3600000; // 1 hour in milliseconds
  private readonly logger = console; // Replace with proper logging service

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

    // Replace standard variables
    const variables = {
      "{{entityName}}": data.entityName,
      "{{entityId}}": data.entityId,
      "{{entityAddress}}": data.entityAddress,
      "{{entityPhone}}": data.entityPhone,
      "{{entityType}}": data.entityType,
      "{{entityContact}}": data.entityContact,
      "{{entityEmail}}": data.entityEmail,
      "{{transactionId}}": data.transactionId,
      "{{transactionDate}}":
        data.transactionDate.toLocaleDateString(getLocale()),
      "{{transactionType}}": data.transactionType,
      "{{transactionReason}}": data.transactionReason,
      "{{transactionDescription}}": data.transactionDescription,
      "{{securityClass}}": data.securityClass,
      "{{securityName}}": data.securityName,
      "{{securitySymbol}}": data.securitySymbol,
      "{{quantity}}": data.quantity.toLocaleString(),
      "{{totalAmount}}": data.totalAmount.toLocaleString(getLocale(), {
        style: "currency",
        currency: data.currency,
      }),
      "{{unitPrice}}": data.unitPrice.toLocaleString(getLocale(), {
        style: "currency",
        currency: data.currency,
      }),
      "{{totalValue}}": data.totalValue.toLocaleString(getLocale(), {
        style: "currency",
        currency: data.currency,
      }),
      "{{memberName}}": data.memberName,
      "{{memberId}}": data.memberId,
      "{{memberType}}": data.memberType,
      "{{memberAddress}}": data.memberAddress,
      "{{certificateNumber}}": data.certificateNumber,
      "{{issueDate}}": data.issueDate.toLocaleDateString(getLocale()),
      "{{currentDate}}": new Date().toLocaleDateString(getLocale()),
      "{{currentYear}}": new Date().getFullYear().toString(),
    };

    // Replace all variables
    Object.entries(variables).forEach(([placeholder, value]) => {
      processedHtml = processedHtml.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        value,
      );
    });

    // Replace any additional dynamic properties
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (typeof value === "string" || typeof value === "number") {
        processedHtml = processedHtml.replace(
          new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
          value.toString(),
        );
      }
    });

    return processedHtml;
  }

  /**
   * Populate certificate data from transaction records
   */
  async populateCertificateData(
    transactionId: string,
    entityId: string,
  ): Promise<CertificateData> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        entity: true,
        securityClass: true,
        toMember: true,
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

    // Get certificate number from transaction data or generate new one
    let certificateNumber: string;
    if (transaction.certificateData) {
      const certData = transaction.certificateData as any;
      certificateNumber =
        certData.certificateNumber ||
        (await this.generateCertificateNumber({
          entityId,
          year: new Date().getFullYear(),
        }));
    } else {
      certificateNumber = await this.generateCertificateNumber({
        entityId,
        year: new Date().getFullYear(),
      });
    }

    // Calculate total amount safely
    const totalAmountPaid = transaction.totalAmountPaid
      ? Number(transaction.totalAmountPaid)
      : 0;
    const totalAmountUnpaid = transaction.totalAmountUnpaid
      ? Number(transaction.totalAmountUnpaid)
      : 0;
    const totalAmount = totalAmountPaid + totalAmountUnpaid;

    // Calculate unit price and total value
    const amountPaidPerSecurity = transaction.amountPaidPerSecurity
      ? Number(transaction.amountPaidPerSecurity)
      : 0;
    const amountUnpaidPerSecurity = transaction.amountUnpaidPerSecurity
      ? Number(transaction.amountUnpaidPerSecurity)
      : 0;
    const unitPrice = amountPaidPerSecurity + amountUnpaidPerSecurity;
    const totalValue = unitPrice * transaction.quantity;

    // Build entity address
    const entityAddressParts = [
      transaction.entity.address,
      transaction.entity.city,
      transaction.entity.state,
      transaction.entity.postcode,
      transaction.entity.country,
    ].filter(Boolean);
    const entityAddress = entityAddressParts.join(", ");

    // Build member address
    const memberAddressParts = [
      transaction.toMember.address,
      transaction.toMember.city,
      transaction.toMember.state,
      transaction.toMember.postcode,
      transaction.toMember.country,
    ].filter(Boolean);
    const memberAddress = memberAddressParts.join(", ");

    return {
      entityId: transaction.entity.id,
      entityName: transaction.entity.name,
      entityAddress: entityAddress || "Not specified",
      entityPhone: transaction.entity.phone || "Not specified",
      entityType: transaction.entity.entityTypeId || "Not specified",
      entityContact: transaction.entity.name, // Use entity name as contact
      entityEmail: transaction.entity.email || "Not specified",
      transactionId: transaction.id,
      transactionDate: transaction.createdAt, // Use createdAt as transaction date
      transactionType: transaction.transactionType,
      transactionReason: transaction.reasonCode,
      transactionDescription: transaction.description || "Not specified",
      securityClass: transaction.securityClass.name,
      securityName: transaction.securityClass.name,
      securitySymbol: transaction.securityClass.symbol || "Not specified",
      quantity: transaction.quantity,
      totalAmount,
      unitPrice,
      totalValue,
      currency: transaction.currencyCode || getDefaultCurrencyCode(),
      memberName:
        transaction.toMember.entityName ||
        `${transaction.toMember.givenNames || ""} ${
          transaction.toMember.familyName || ""
        }`.trim(),
      memberId: transaction.toMember.id,
      memberType: transaction.toMember.memberType,
      memberAddress: memberAddress || "Not specified",
      certificateNumber,
      issueDate: transaction.certificateData
        ? new Date((transaction.certificateData as any).issueDate || new Date())
        : new Date(),
    };
  }

  /**
   * Validate certificate data before generation
   */
  private validateCertificateData(data: CertificateData): void {
    const requiredFields = [
      "entityId",
      "entityName",
      "entityAddress",
      "entityPhone",
      "entityType",
      "entityContact",
      "entityEmail",
      "transactionId",
      "transactionDate",
      "transactionType",
      "transactionReason",
      "transactionDescription",
      "securityClass",
      "securityName",
      "securitySymbol",
      "quantity",
      "totalAmount",
      "unitPrice",
      "totalValue",
      "memberName",
      "memberId",
      "memberType",
      "memberAddress",
      "certificateNumber",
      "issueDate",
    ];

    for (const field of requiredFields) {
      if (
        data[field] === null ||
        data[field] === undefined ||
        data[field] === ""
      ) {
        throw new Error(`Missing required certificate data: ${field}`);
      }
    }

    if (data.quantity <= 0) {
      throw new Error("Certificate quantity must be greater than 0");
    }

    if (data.totalAmount <= 0) {
      throw new Error("Certificate total amount must be greater than 0");
    }
  }

  /**
   * Generate certificate metadata
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

    // Convert to Buffer for checksum calculation
    const buffer = Buffer.isBuffer(certificateBuffer)
      ? certificateBuffer
      : Buffer.from(certificateBuffer);

    // Generate simple checksum (in production, use proper cryptographic hash)
    const checksum = Buffer.from(buffer.toString("base64"))
      .toString("hex")
      .substring(0, 32);

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
      fileSize: buffer.length,
      checksum,
    };
  }

  /**
   * Get cached certificate if available and not expired
   */
  private getCachedCertificate(
    cacheKey: string,
  ): { data: Buffer; metadata: CertificateMetadata } | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.logger.log(`Certificate cache hit: ${cacheKey}`);
      return { data: cached.data, metadata: cached.metadata };
    }
    return null;
  }

  /**
   * Cache certificate data
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
   * Generate certificate in PDF format
   */
  async generatePDFCertificate(
    transactionId: string,
    templateId: string,
    options?: Partial<PDFOptions>,
    generatedBy: string = "system",
  ): Promise<CertificateGenerationResult> {
    try {
      this.logger.log(
        `Starting PDF certificate generation for transaction: ${transactionId}`,
      );

      // Get transaction data
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { entity: true },
      });

      if (!transaction) {
        throw new Error(`Transaction not found: ${transactionId}`);
      }

      // Create cache key
      const cacheKey = `pdf_${transactionId}_${templateId}_${JSON.stringify(
        options,
      )}`;

      // Check cache first
      const cached = this.getCachedCertificate(cacheKey);
      if (cached) {
        return {
          success: true,
          data: {
            certificateBuffer: cached.data,
            metadata: cached.metadata,
          },
        };
      }

      // Populate certificate data
      const certificateData = await this.populateCertificateData(
        transactionId,
        transaction.entityId,
      );

      // Validate data
      this.validateCertificateData(certificateData);

      // Get certificate template
      const template = await prisma.certificateTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        throw new Error(`Certificate template not found: ${templateId}`);
      }

      // Replace template variables
      const processedHtml = this.replaceTemplateVariables(
        template.templateHtml,
        certificateData,
      );

      // Generate PDF
      const pdfResult = await pdfGenerator.generatePDF(processedHtml, options);

      if (!pdfResult.success || !pdfResult.data) {
        throw new Error(pdfResult.error || "PDF generation failed");
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
      const buffer = Buffer.isBuffer(pdfResult.data)
        ? pdfResult.data
        : Buffer.from(pdfResult.data);
      this.cacheCertificate(cacheKey, buffer, metadata);

      // Log successful generation
      this.logger.log(
        `PDF certificate generated successfully: ${metadata.certificateId}`,
      );

      return {
        success: true,
        data: {
          certificateBuffer: pdfResult.data,
          metadata,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown certificate generation error";
      this.logger.error(`Certificate generation failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate certificate in DOCX format (placeholder for future implementation)
   */
  async generateDOCXCertificate(
    transactionId: string,
    templateId: string,
    generatedBy: string = "system",
  ): Promise<CertificateGenerationResult> {
    try {
      this.logger.log(
        `Starting DOCX certificate generation for transaction: ${transactionId}`,
      );

      // For now, return error as DOCX generation is not implemented
      // This can be extended with a DOCX generation library like docx or mammoth

      return {
        success: false,
        error: "DOCX certificate generation not yet implemented",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown certificate generation error";
      this.logger.error(`DOCX certificate generation failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
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
    switch (format) {
      case "PDF":
        return this.generatePDFCertificate(
          transactionId,
          templateId,
          options,
          generatedBy,
        );
      case "DOCX":
        return this.generateDOCXCertificate(
          transactionId,
          templateId,
          generatedBy,
        );
      default:
        return {
          success: false,
          error: `Unsupported format: ${format}`,
        };
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
   * Validate certificate template
   */
  async validateTemplate(
    templateId: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const template = await prisma.certificateTemplate.findUnique({
        where: { id: templateId },
      });

      if (!template) {
        errors.push(`Template not found: ${templateId}`);
        return { valid: false, errors };
      }

      if (!template.templateHtml) {
        errors.push("Template HTML is missing");
      }

      if (!template.name) {
        errors.push("Template name is missing");
      }

      // Check for required template variables
      const requiredVariables = [
        "{{entityName}}",
        "{{certificateNumber}}",
        "{{memberName}}",
        "{{quantity}}",
        "{{totalAmount}}",
        "{{issueDate}}",
      ];

      for (const variable of requiredVariables) {
        if (!template.templateHtml.includes(variable)) {
          errors.push(`Missing required template variable: ${variable}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(
        `Template validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
      return { valid: false, errors };
    }
  }
}

// Export a singleton instance
export const certificateGenerator = new CertificateGenerator();
