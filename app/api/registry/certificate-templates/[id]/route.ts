import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import {
  CertificateTemplateUpdateInput,
  CertificateTemplateResponse,
} from '@/lib/types/interfaces';

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

    // Check authorization based on scope
    if (existingTemplate.scope === 'GLOBAL') {
      // Only allow global template updates by admin users (you might want to add admin check here)
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions to update global template',
        },
        { status: 403 }
      );
    }

    if (
      existingTemplate.scope === 'USER' &&
      existingTemplate.scopeId !== userId
    ) {
      return NextResponse.json(
        { success: false, error: 'Access denied to user template' },
        { status: 403 }
      );
    }

    if (existingTemplate.scope === 'ENTITY') {
      // Check if user has access to the entity
      const userAccess = await prisma.userEntityAccess.findUnique({
        where: {
          userId_entityId: {
            userId,
            entityId: existingTemplate.scopeId!,
          },
        },
      });

      if (!userAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to entity template' },
          { status: 403 }
        );
      }
    }

    // Validate template HTML if provided
    if (
      body.templateHtml &&
      (!body.templateHtml.includes('{{') || !body.templateHtml.includes('}}'))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template HTML must contain template variables ({{variable}})',
        },
        { status: 400 }
      );
    }

    // Check for default template constraint if setting as default
    if (body.isDefault) {
      const existingDefault = await prisma.certificateTemplate.findFirst({
        where: {
          scope: existingTemplate.scope,
          scopeId: existingTemplate.scopeId,
          isDefault: true,
          id: { not: id }, // Exclude current template
        },
      });

      if (existingDefault) {
        return NextResponse.json(
          {
            success: false,
            error: 'Only one default template allowed per scope',
          },
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

    // Check authorization based on scope
    if (existingTemplate.scope === 'GLOBAL') {
      // Only allow global template deletion by admin users
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions to delete global template',
        },
        { status: 403 }
      );
    }

    if (
      existingTemplate.scope === 'USER' &&
      existingTemplate.scopeId !== userId
    ) {
      return NextResponse.json(
        { success: false, error: 'Access denied to user template' },
        { status: 403 }
      );
    }

    if (existingTemplate.scope === 'ENTITY') {
      // Check if user has access to the entity
      const userAccess = await prisma.userEntityAccess.findUnique({
        where: {
          userId_entityId: {
            userId,
            entityId: existingTemplate.scopeId!,
          },
        },
      });

      if (!userAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to entity template' },
          { status: 403 }
        );
      }
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
