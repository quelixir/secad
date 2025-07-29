import { NextRequest, NextResponse } from 'next/server';
import { certificateGenerator } from '@/lib/services/certificate-generator';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/utils/rate-limit';
import { AuditLogger, AuditAction, AuditTableName } from '@/lib/audit';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export interface DownloadRequest {
  transactionId: string;
  templateId: string;
  format: 'PDF' | 'DOCX';
  userId: string;
}

/**
 * POST /api/certificates/[id]/download
 * Generate and download a certificate on-the-fly
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    const { success } = await limiter.check(identifier, 5); // 5 generations per minute
    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body: DownloadRequest = await request.json();
    const { transactionId, templateId, format, userId } = body;

    // Validate required fields
    if (!transactionId || !templateId || !format || !userId) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: transactionId, templateId, format, userId',
        },
        { status: 400 }
      );
    }

    // Validate format
    if (!['PDF', 'DOCX'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be PDF or DOCX' },
        { status: 400 }
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
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if template exists
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Certificate template not found' },
        { status: 404 }
      );
    }

    // Generate certificate on-the-fly
    const result = await certificateGenerator.generateCertificate(
      transactionId,
      templateId,
      format,
      undefined,
      userId
    );

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Certificate generation failed' },
        { status: 500 }
      );
    }

    // Set content type based on format
    const contentType =
      format === 'PDF'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Set security headers
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': result.data.metadata.fileSize.toString(),
      'Content-Disposition': `attachment; filename="certificate-${
        result.data.metadata.certificateNumber
      }.${format.toLowerCase()}"`,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    // Log certificate generation and download through audit system
    await AuditLogger.logFieldChange({
      entityId: transaction.entityId,
      userId,
      action: AuditAction.CERTIFICATE_GENERATED,
      tableName: AuditTableName.TRANSACTION,
      recordId: transactionId,
      fieldName: 'certificate',
      oldValue: null,
      newValue: {
        templateId,
        format,
        certificateNumber: result.data.metadata.certificateNumber,
        fileSize: result.data.metadata.fileSize,
        checksum: result.data.metadata.checksum,
        generatedAt: result.data.metadata.generatedAt,
      },
      metadata: {
        ip: identifier,
        userAgent: request.headers.get('user-agent'),
        format,
        templateName: template.name,
        certificateNumber: result.data.metadata.certificateNumber,
      },
    });

    // Log successful generation
    console.log(
      `Certificate generated and downloaded: ${result.data.metadata.certificateNumber} by ${identifier}`
    );

    return new NextResponse(result.data.certificateBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/certificates/[id]/download
 * This endpoint is not supported since certificates are generated on-the-fly
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error:
        'Certificates are generated on-demand. Use POST to generate and download.',
    },
    { status: 405 }
  );
}

/**
 * DELETE /api/certificates/[id]/download
 * This endpoint is not supported since certificates are not stored
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Certificates are not stored on the server. No cleanup needed.' },
    { status: 405 }
  );
}
