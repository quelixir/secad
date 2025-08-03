import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { certificateGenerator } from "@/lib/services/certificate-generator";
import { certificateNumberingService } from "@/lib/services/certificate-numbering";
import { certificateProgressTracker } from "@/lib/services/certificate-progress-tracker";
import { rateLimit } from "@/lib/utils/rate-limit";
import { AuditLogger } from "@/lib/audit";
import {
  CertificateErrorFactory,
  CertificateErrorLogger,
  CertificateErrorResponse,
  ErrorContext,
  CertificateGenerationError,
} from "@/lib/services/error-handling";

// Rate limiter: 5 generations per minute per user
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export interface GenerateRequest {
  templateId: string;
  format: "PDF" | "DOCX";
  userId: string;
  certificateNumber?: string;
  issueDate?: string;
  includeWatermark?: boolean;
  includeQRCode?: boolean;
  customFields?: Record<string, string>;
}

export interface GenerateResponse {
  success: boolean;
  data?: {
    certificateId: string;
    certificateNumber: string;
    format: string;
    fileSize: number;
    generatedAt: string;
    downloadUrl?: string;
    progressId?: string;
  };
  error?: string;
}

/**
 * Get HTTP status code for certificate generation error
 */
function getHttpStatusForError(error: CertificateGenerationError): number {
  switch (error.category) {
    case "validation":
      return 400;
    case "authentication":
      return 401;
    case "authorization":
      return 403;
    case "rate_limit":
      return 429;
    case "timeout":
      return 408;
    case "system":
    case "database":
    case "memory":
    case "file_system":
    case "pdf_generation":
    case "template":
    case "network":
    case "unknown":
    default:
      return 500;
  }
}

/**
 * POST /api/certificates/[id]/generate
 * Generate a certificate for a transaction and return metadata
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const { id: transactionId } = await params;
  let userId: string | undefined;
  let progressId: string | undefined;
  const identifier =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  try {
    // Rate limiting
    const { success } = await limiter.check(identifier, 5); // 5 generations per minute
    if (!success) {
      const rateLimitError = CertificateErrorFactory.rateLimitError(
        "Rate limit exceeded. Please try again later.",
        {
          transactionId,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(rateLimitError);
      return NextResponse.json(
        CertificateErrorResponse.formatError(rateLimitError),
        { status: 429 },
      );
    }

    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    userId = session?.user?.id;
    if (!userId) {
      const authError = CertificateErrorFactory.authenticationError(
        "Unauthorized - User session not found",
        {
          transactionId,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(authError);
      return NextResponse.json(
        CertificateErrorResponse.formatError(authError),
        { status: 401 },
      );
    }

    // Initialize progress tracking
    progressId = certificateProgressTracker.initializeProgress(
      transactionId,
      userId,
      {
        timeout: 5 * 60 * 1000, // 5 minutes
        enableCancellation: true,
        enablePersistence: false, // Don't persist to database
      },
    );

    const body: GenerateRequest = await request.json();
    const {
      templateId,
      format,
      userId: requestUserId,
      certificateNumber,
      issueDate,
      includeWatermark = true,
      includeQRCode = true,
      customFields,
    } = body;

    // Validate required fields
    if (!templateId || !format || !requestUserId) {
      const validationError = CertificateErrorFactory.validationError(
        "Missing required fields: templateId, format, userId",
        {
          transactionId,
          userId,
          templateId,
          format,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(validationError);
      return NextResponse.json(
        CertificateErrorResponse.formatError(validationError),
        { status: 400 },
      );
    }

    // Validate format
    if (!["PDF", "DOCX"].includes(format)) {
      const validationError = CertificateErrorFactory.validationError(
        "Invalid format. Must be PDF or DOCX",
        {
          transactionId,
          userId,
          templateId,
          format,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(validationError);
      return NextResponse.json(
        CertificateErrorResponse.formatError(validationError),
        { status: 400 },
      );
    }

    // Validate user ID matches session
    if (requestUserId !== userId) {
      const authError = CertificateErrorFactory.authorizationError(
        "User ID mismatch",
        {
          transactionId,
          userId,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(authError);
      return NextResponse.json(
        CertificateErrorResponse.formatError(authError),
        { status: 403 },
      );
    }

    // Check if transaction exists and user has access
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        entity: true,
        securityClass: true,
        toMember: true,
      },
    });

    if (!transaction) {
      const notFoundError = CertificateErrorFactory.validationError(
        "Transaction not found",
        {
          transactionId,
          userId,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(notFoundError);
      return NextResponse.json(
        CertificateErrorResponse.formatError(notFoundError),
        { status: 404 },
      );
    }

    // Check user access to entity
    const userAccess = await prisma.userEntityAccess.findUnique({
      where: {
        userId_entityId: {
          userId,
          entityId: transaction.entityId,
        },
      },
    });

    if (!userAccess) {
      const authError = CertificateErrorFactory.authorizationError(
        "Access denied to transaction entity",
        {
          transactionId,
          userId,
          entityId: transaction.entityId,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(authError);
      return NextResponse.json(
        CertificateErrorResponse.formatError(authError),
        { status: 403 },
      );
    }

    // Check if template exists and validate it
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      const templateError = CertificateErrorFactory.templateError(
        "Certificate template not found",
        {
          transactionId,
          userId,
          templateId,
          entityId: transaction.entityId,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(templateError);
      return NextResponse.json(
        CertificateErrorResponse.formatError(templateError),
        { status: 404 },
      );
    }

    // Validate template before generation
    const templateValidation =
      await certificateGenerator.validateTemplate(templateId);
    if (!templateValidation.valid) {
      const templateError = CertificateErrorFactory.templateError(
        "Template validation failed",
        {
          transactionId,
          userId,
          templateId,
          entityId: transaction.entityId,
          ipAddress: identifier,
          userAgent: request.headers.get("user-agent") || undefined,
        },
      );
      await CertificateErrorLogger.logError(templateError);
      return NextResponse.json(
        {
          ...CertificateErrorResponse.formatError(templateError),
          details: templateValidation.errors,
          warnings: templateValidation.warnings,
          completenessScore: templateValidation.completenessScore,
        },
        { status: 400 },
      );
    }

    // Generate certificate number if not provided
    let finalCertificateNumber = certificateNumber;
    if (!finalCertificateNumber) {
      const numberingResult =
        await certificateNumberingService.generateCertificateNumber(
          {
            entityId: transaction.entityId,
            year: new Date().getFullYear(),
          },
          userId,
        );

      if (!numberingResult.success) {
        const numberingError = CertificateErrorFactory.systemError(
          numberingResult.error || "Failed to generate certificate number",
          {
            transactionId,
            userId,
            entityId: transaction.entityId,
            templateId,
            ipAddress: identifier,
            userAgent: request.headers.get("user-agent") || undefined,
          },
        );
        await CertificateErrorLogger.logError(numberingError);
        return NextResponse.json(
          CertificateErrorResponse.formatError(numberingError),
          { status: 500 },
        );
      }

      finalCertificateNumber = numberingResult.data!.certificateNumber;
    }

    // Prepare certificate data to store in transaction
    const certificateData = {
      certificateNumber: finalCertificateNumber,
      templateId,
      format,
      issueDate: issueDate || new Date().toISOString(),
      includeWatermark,
      includeQRCode,
      customFields,
      generatedBy: userId,
      generatedAt: new Date().toISOString(),
    };

    // Update transaction with certificate data
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        certificateData,
        updatedBy: userId,
      },
    });

    // Generate certificate with timeout handling
    const generationPromise = certificateGenerator.generateCertificate(
      transactionId,
      templateId,
      format,
      undefined,
      userId,
      progressId,
    );

    // Set 30-second timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("Certificate generation timeout"));
      }, 30000); // 30 seconds
    });

    const result = await Promise.race([generationPromise, timeoutPromise]);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Certificate generation failed",
        },
        { status: 500 },
      );
    }

    const generationTime = Date.now() - startTime;

    // Log certificate generation event
    try {
      await AuditLogger.logCertificateGenerated(
        transaction.entityId,
        userId,
        transactionId,
        templateId,
        format,
        finalCertificateNumber,
        result.data.metadata.fileSize,
        result.data.metadata.checksum,
        {
          generationTime: `${generationTime}ms`,
          ip: identifier,
          userAgent: request.headers.get("user-agent"),
          templateName: template.name,
          templateScope: template.scope,
          includeWatermark,
          includeQRCode,
          customFields,
        },
      );
    } catch (auditError) {
      console.error("Failed to log certificate generation event:", auditError);
      // Don't fail the generation if audit logging fails
    }

    // Log generation event
    console.log(`Certificate generated successfully`, {
      transactionId,
      templateId,
      format,
      userId,
      certificateNumber: finalCertificateNumber,
      generationTime: `${generationTime}ms`,
      fileSize: result.data.metadata.fileSize,
      certificateId: result.data.metadata.certificateId,
    });

    // Return generation status and metadata
    const response: GenerateResponse = {
      success: true,
      data: {
        certificateId: result.data.metadata.certificateId,
        certificateNumber: finalCertificateNumber,
        format,
        fileSize: result.data.metadata.fileSize,
        generatedAt: result.data.metadata.generatedAt.toISOString(),
        downloadUrl: `/api/certificates/${transactionId}/download?certificateId=${result.data.metadata.certificateId}`,
        progressId, // Include progress ID for client tracking
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const generationTime = Date.now() - startTime;
    const context: ErrorContext = {
      transactionId,
      userId,
      ipAddress: identifier,
      userAgent: request.headers.get("user-agent") || undefined,
      generationStartTime: startTime,
    };

    // Handle CertificateGenerationError
    if (error instanceof CertificateGenerationError) {
      await CertificateErrorLogger.logError(error, {
        generationTime: `${generationTime}ms`,
        method: "POST /api/certificates/[id]/generate",
      });
      return NextResponse.json(CertificateErrorResponse.formatError(error), {
        status: getHttpStatusForError(error),
      });
    }

    // Handle timeout errors
    if (
      error instanceof Error &&
      error.message === "Certificate generation timeout"
    ) {
      const timeoutError = CertificateErrorFactory.timeoutError(
        "Certificate generation timed out. Please try again.",
        context,
        error,
      );
      await CertificateErrorLogger.logError(timeoutError, {
        generationTime: `${generationTime}ms`,
        method: "POST /api/certificates/[id]/generate",
      });
      return NextResponse.json(
        CertificateErrorResponse.formatError(timeoutError),
        { status: 408 },
      );
    }

    // Handle unknown errors
    const unknownError = CertificateErrorFactory.unknownError(
      error instanceof Error
        ? error.message
        : "Unknown error in certificate generation",
      context,
      error instanceof Error ? error : undefined,
    );
    await CertificateErrorLogger.logError(unknownError, {
      generationTime: `${generationTime}ms`,
      method: "POST /api/certificates/[id]/generate",
    });

    return NextResponse.json(
      CertificateErrorResponse.formatError(unknownError),
      { status: 500 },
    );
  }
}
