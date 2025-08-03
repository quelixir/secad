import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { certificateGenerator } from "@/lib/services/certificate-generator";
import { certificateNumberingService } from "@/lib/services/certificate-numbering";
import { rateLimit } from "@/lib/utils/rate-limit";
import { AuditLogger } from "@/lib/audit";

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
  };
  error?: string;
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

  try {
    // Rate limiting
    const identifier =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const { success } = await limiter.check(identifier, 5); // 5 generations per minute
    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 },
      );
    }

    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

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
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: templateId, format, userId",
        },
        { status: 400 },
      );
    }

    // Validate format
    if (!["PDF", "DOCX"].includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid format. Must be PDF or DOCX",
        },
        { status: 400 },
      );
    }

    // Validate user ID matches session
    if (requestUserId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID mismatch",
        },
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
      return NextResponse.json(
        {
          success: false,
          error: "Transaction not found",
        },
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
      return NextResponse.json(
        {
          success: false,
          error: "Access denied to transaction entity",
        },
        { status: 403 },
      );
    }

    // Check if template exists and validate it
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: "Certificate template not found",
        },
        { status: 404 },
      );
    }

    // Validate template before generation
    const templateValidation =
      await certificateGenerator.validateTemplate(templateId);
    if (!templateValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Template validation failed",
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
        return NextResponse.json(
          {
            success: false,
            error:
              numberingResult.error || "Failed to generate certificate number",
          },
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
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    const generationTime = Date.now() - startTime;

    console.error("Certificate generation failed", {
      transactionId,
      error: error instanceof Error ? error.message : "Unknown error",
      generationTime: `${generationTime}ms`,
      userId: userId,
    });

    if (
      error instanceof Error &&
      error.message === "Certificate generation timeout"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Certificate generation timed out. Please try again.",
        },
        { status: 408 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
