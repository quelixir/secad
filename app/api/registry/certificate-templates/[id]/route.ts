import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import {
  CertificateTemplateUpdateInput,
  CertificateTemplateResponse,
} from '@/lib/types/interfaces';
import {
  validateTemplateAccess,
  validateTemplateHtml,
  validateDefaultTemplateConstraint,
} from '@/lib/certificate-templates/scope-validation';

// PUT /api/registry/certificate-templates/[templateId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: CertificateTemplateUpdateInput = await request.json();

    // Get the existing template
    const existingTemplate = await prisma.certificateTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Certificate template not found' },
        { status: 404 }
      );
    }

    // Check authorization using helper function
    const accessValidation = await validateTemplateAccess(userId, {
      scope: existingTemplate.scope as 'GLOBAL' | 'USER' | 'ENTITY',
      scopeId: existingTemplate.scopeId,
      createdBy: existingTemplate.createdBy,
    });

    if (!accessValidation.hasAccess) {
      return NextResponse.json(
        { success: false, error: accessValidation.accessError },
        { status: 403 }
      );
    }

    // Validate template HTML if provided using helper function
    if (body.templateHtml) {
      const htmlValidation = validateTemplateHtml(body.templateHtml);
      if (!htmlValidation.isValid) {
        return NextResponse.json(
          { success: false, error: htmlValidation.error },
          { status: 400 }
        );
      }
    }

    // Check for default template constraint if setting as default using helper function
    if (body.isDefault) {
      const defaultValidation = await validateDefaultTemplateConstraint(
        existingTemplate.scope as 'GLOBAL' | 'USER' | 'ENTITY',
        existingTemplate.scopeId,
        id
      );
      if (!defaultValidation.isValid) {
        return NextResponse.json(
          { success: false, error: defaultValidation.error },
          { status: 400 }
        );
      }
    }

    // Update template
    const updatedTemplate = await prisma.certificateTemplate.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.templateHtml && { templateHtml: body.templateHtml }),
        ...(body.templateCss !== undefined && {
          templateCss: body.templateCss,
        }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
      message: 'Certificate template updated successfully',
    });
  } catch (error) {
    console.error('Error updating certificate template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update certificate template' },
      { status: 500 }
    );
  }
}

// DELETE /api/registry/certificate-templates/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the existing template
    const existingTemplate = await prisma.certificateTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: 'Certificate template not found' },
        { status: 404 }
      );
    }

    // Check authorization using helper function
    const accessValidation = await validateTemplateAccess(userId, {
      scope: existingTemplate.scope as 'GLOBAL' | 'USER' | 'ENTITY',
      scopeId: existingTemplate.scopeId,
      createdBy: existingTemplate.createdBy,
    });

    if (!accessValidation.hasAccess) {
      return NextResponse.json(
        { success: false, error: accessValidation.accessError },
        { status: 403 }
      );
    }

    // Prevent deletion of default templates
    if (existingTemplate.isDefault) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete default template. Set another template as default first.',
        },
        { status: 400 }
      );
    }

    // Delete template
    await prisma.certificateTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Certificate template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting certificate template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete certificate template' },
      { status: 500 }
    );
  }
}
