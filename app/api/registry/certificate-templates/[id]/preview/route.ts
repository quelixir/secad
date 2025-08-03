import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { certificateGenerator } from "@/lib/services/certificate-generator";

export interface PreviewRequest {
  transactionId: string;
  entityId: string;
  memberName: string;
  securityClass: string;
  quantity: number;
  certificateNumber?: string;
  issueDate: string;
  customFields?: Record<string, string>;
}

/**
 * POST /api/registry/certificate-templates/[id]/preview
 * Generate a preview of a certificate template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: templateId } = await params;
    const body: PreviewRequest = await request.json();

    // Validate required fields
    if (!templateId || !body.transactionId || !body.entityId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: templateId, transactionId, entityId",
        },
        { status: 400 },
      );
    }

    // Check if template exists and validate it
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Certificate template not found" },
        { status: 404 },
      );
    }

    // Validate template structure before preview
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

    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id: body.transactionId },
      include: {
        entity: true,
        securityClass: true,
        toMember: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Generate preview HTML using the certificate generator
    const previewResult = await certificateGenerator.generatePreviewHtml(
      templateId,
      {
        transactionId: body.transactionId,
        entityId: body.entityId,
        memberName: body.memberName,
        securityClass: body.securityClass,
        quantity: body.quantity,
        certificateNumber: body.certificateNumber || "CERT-2024-0001",
        issueDate: body.issueDate,
        customFields: body.customFields || {},
      },
    );

    if (!previewResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: previewResult.error || "Failed to generate preview",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        html: previewResult.data!.html,
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
        },
      },
    });
  } catch (error) {
    console.error("Error generating template preview:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
