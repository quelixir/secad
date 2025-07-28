import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import {
  CertificateTemplateInput,
  CertificateTemplateListResponse,
  CertificateTemplateResponse,
} from '@/lib/types/interfaces';

// GET /api/registry/certificate-templates
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const scopeId = searchParams.get('scopeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build where clause for scope filtering
    const whereClause: any = {
      isActive: true,
    };

    // Always include GLOBAL templates
    const globalTemplates = await prisma.certificateTemplate.findMany({
      where: {
        scope: 'GLOBAL',
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Include USER templates for the current user
    const userTemplates = await prisma.certificateTemplate.findMany({
      where: {
        scope: 'USER',
        scopeId: userId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Include ENTITY templates if user has access to the entity
    let entityTemplates: any[] = [];
    if (scopeId) {
      // Check if user has access to this entity
      const userAccess = await prisma.userEntityAccess.findUnique({
        where: {
          userId_entityId: {
            userId,
            entityId: scopeId,
          },
        },
      });

      if (userAccess) {
        entityTemplates = await prisma.certificateTemplate.findMany({
          where: {
            scope: 'ENTITY',
            scopeId,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        });
      }
    } else {
      // Get all entity templates for entities the user has access to
      const userEntities = await prisma.userEntityAccess.findMany({
        where: { userId },
        select: { entityId: true },
      });

      if (userEntities.length > 0) {
        const entityIds = userEntities.map((uea) => uea.entityId);
        entityTemplates = await prisma.certificateTemplate.findMany({
          where: {
            scope: 'ENTITY',
            scopeId: { in: entityIds },
            isActive: true,
          },
          orderBy: { name: 'asc' },
        });
      }
    }

    // Combine all templates
    const allTemplates = [
      ...globalTemplates,
      ...userTemplates,
      ...entityTemplates,
    ];

    // Apply pagination
    const total = allTemplates.length;
    const templates = allTemplates.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching certificate templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch certificate templates' },
      { status: 500 }
    );
  }
}

// POST /api/registry/certificate-templates
export async function POST(request: NextRequest) {
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

    const body: CertificateTemplateInput = await request.json();

    // Validate required fields
    if (!body.name || !body.templateHtml || !body.scope) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, template HTML, and scope are required',
        },
        { status: 400 }
      );
    }

    // Validate scope
    if (!['GLOBAL', 'USER', 'ENTITY'].includes(body.scope)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid scope. Must be GLOBAL, USER, or ENTITY',
        },
        { status: 400 }
      );
    }

    // Validate scope-specific requirements
    if (body.scope === 'USER' && body.scopeId && body.scopeId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User can only create templates for themselves',
        },
        { status: 403 }
      );
    }

    if (body.scope === 'ENTITY') {
      if (!body.scopeId) {
        return NextResponse.json(
          { success: false, error: 'Entity ID is required for ENTITY scope' },
          { status: 400 }
        );
      }

      // Check if user has access to the entity
      const userAccess = await prisma.userEntityAccess.findUnique({
        where: {
          userId_entityId: {
            userId,
            entityId: body.scopeId,
          },
        },
      });

      if (!userAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to entity' },
          { status: 403 }
        );
      }
    }

    // Validate template HTML (basic validation)
    if (
      !body.templateHtml.includes('{{') ||
      !body.templateHtml.includes('}}')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template HTML must contain template variables ({{variable}})',
        },
        { status: 400 }
      );
    }

    // Check for default template constraint
    if (body.isDefault) {
      const existingDefault = await prisma.certificateTemplate.findFirst({
        where: {
          scope: body.scope,
          scopeId: body.scopeId || null,
          isDefault: true,
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

    // Create template
    const template = await prisma.certificateTemplate.create({
      data: {
        name: body.name,
        description: body.description || null,
        templateHtml: body.templateHtml,
        templateCss: body.templateCss || null,
        scope: body.scope,
        scopeId: body.scopeId || null,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== false, // Default to true
        createdBy: userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: template,
        message: 'Certificate template created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating certificate template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create certificate template' },
      { status: 500 }
    );
  }
}
