import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { certificateGenerator } from "@/lib/services/certificate-generator";
import { certificateNumberingService } from "@/lib/services/certificate-numbering";
import { rateLimit } from "@/lib/utils/rate-limit";
import { AuditLogger } from "@/lib/audit";
import { Readable } from "stream";

// Rate limiter: 5 downloads per minute per user
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export interface DownloadRequest {
  transactionId: string;
  templateId: string;
  format: "PDF" | "DOCX";
  userId: string;
  certificateNumber?: string;
  issueDate?: string;
  includeWatermark?: boolean;
  includeQRCode?: boolean;
  customFields?: Record<string, string>;
}

/**
 * POST /api/certificates/[id]/download
 * Generate and download a certificate on-the-fly with streaming support
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const downloadId = `download_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  let userId: string | undefined;

  try {
    // Rate limiting
    const identifier =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";
    const { success } = await limiter.check(identifier, 5); // 5 downloads per minute
    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    const body: DownloadRequest = await request.json();
    const {
      transactionId,
      templateId,
      format,
      userId: requestUserId,
      certificateNumber,
      issueDate,
      includeWatermark = true,
      includeQRCode = true,
      customFields,
    } = body;

    userId = requestUserId;

    // Validate required fields
    if (!transactionId || !templateId || !format || !userId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: transactionId, templateId, format, userId",
        },
        { status: 400 },
      );
    }

    // Validate format
    if (!["PDF", "DOCX"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Must be PDF or DOCX" },
        { status: 400 },
      );
    }

    // Check if transaction exists
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
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Check if template exists and validate it
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Certificate template not found" },
        { status: 404 },
      );
    }

    // Validate template before generation
    const templateValidation =
      await certificateGenerator.validateTemplate(templateId);
    if (!templateValidation.valid) {
      return NextResponse.json(
        {
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

    // Track download start
    certificateGenerator.trackDownload(downloadId, {
      transactionId,
      certificateNumber: finalCertificateNumber,
      format,
      fileSize: 0, // Will be updated after generation
      downloadStartedAt: new Date(),
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress: identifier,
      success: false,
    });

    // Generate certificate with streaming support
    const result = await certificateGenerator.generatePDFCertificateStream(
      transactionId,
      templateId,
      {
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
      },
      userId,
    );

    if (!result.success || !result.stream || !result.metadata) {
      certificateGenerator.completeDownload(downloadId, false, result.error);
      return NextResponse.json(
        { error: result.error || "Certificate generation failed" },
        { status: 500 },
      );
    }

    // Set content type based on format
    const contentType =
      format === "PDF"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Set comprehensive security headers
    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": result.metadata.fileSize.toString(),
      "Content-Disposition": `attachment; filename="certificate-${
        result.metadata.certificateNumber
      }.${format.toLowerCase()}"`,
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Download-ID": downloadId,
      "X-Certificate-ID": result.metadata.certificateId,
      "X-Generated-At": result.metadata.generatedAt.toISOString(),
    });

    // Log certificate generation event
    await AuditLogger.logCertificateGenerated(
      transaction.entityId,
      userId,
      transactionId,
      templateId,
      format,
      result.metadata.certificateNumber,
      result.metadata.fileSize,
      result.metadata.checksum,
      {
        ip: identifier,
        userAgent: request.headers.get("user-agent"),
        templateName: template.name,
        downloadId,
      },
    );

    // Log certificate download event
    await AuditLogger.logCertificateDownloaded(
      transaction.entityId,
      userId,
      transactionId,
      result.metadata.certificateNumber,
      format,
      {
        ip: identifier,
        userAgent: request.headers.get("user-agent"),
        templateName: template.name,
        downloadId,
      },
    );

    // Update download tracking with file size
    certificateGenerator.trackDownload(downloadId, {
      transactionId,
      certificateNumber: finalCertificateNumber,
      format,
      fileSize: result.metadata.fileSize,
      downloadStartedAt: new Date(startTime),
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress: identifier,
      success: true,
    });

    // Log successful generation with performance metrics
    const generationTime = Date.now() - startTime;
    console.log(
      `Certificate generated and downloaded: ${result.metadata.certificateNumber} by ${identifier} in ${generationTime}ms`,
      {
        downloadId,
        certificateId: result.metadata.certificateId,
        fileSize: result.metadata.fileSize,
        generationTime: `${generationTime}ms`,
        format,
        templateName: template.name,
      },
    );

    // Complete download tracking
    certificateGenerator.completeDownload(downloadId, true);

    // Return streaming response
    return new NextResponse(result.stream as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    const generationTime = Date.now() - startTime;

    console.error("Certificate generation error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      generationTime: `${generationTime}ms`,
      downloadId,
      userId,
    });

    // Complete download tracking with error
    certificateGenerator.completeDownload(
      downloadId,
      false,
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/certificates/[id]/download
 * This endpoint is not supported since certificates are generated on-the-fly
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return NextResponse.json(
    {
      error:
        "Certificates are generated on-demand. Use POST to generate and download.",
    },
    { status: 405 },
  );
}

/**
 * DELETE /api/certificates/[id]/download
 * This endpoint is not supported since certificates are not stored
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return NextResponse.json(
    { error: "Certificates are not stored on the server. No cleanup needed." },
    { status: 405 },
  );
}
