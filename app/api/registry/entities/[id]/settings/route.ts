import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

interface EntitySettingsResponse {
  success: boolean;
  data?: {
    id: string;
    entityId: string;
    certificatesEnabled: boolean;
    certificateSettings?: any;
    createdAt: Date;
    updatedAt: Date;
  };
  error?: string;
}

interface EntitySettingsUpdateRequest {
  certificatesEnabled?: boolean;
  certificateSettings?: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate user authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      const response: EntitySettingsResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const { id: entityId } = await params;

    // Check user has access to entity via UserEntityAccess table
    const userAccess = await prisma.userEntityAccess.findUnique({
      where: {
        userId_entityId: { userId, entityId },
      },
    });

    if (!userAccess) {
      const response: EntitySettingsResponse = {
        success: false,
        error: 'No access to this entity',
      };
      return NextResponse.json(response, { status: 403 });
    }

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      const response: EntitySettingsResponse = {
        success: false,
        error: 'Entity not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Get entity settings or create default if not exists
    let entitySettings = await prisma.entitySettings.findUnique({
      where: { entityId },
    });

    if (!entitySettings) {
      // Create default settings
      entitySettings = await prisma.entitySettings.create({
        data: {
          entityId,
          certificatesEnabled: false,
          certificateSettings: {},
        },
      });
    }

    const response: EntitySettingsResponse = {
      success: true,
      data: entitySettings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching entity settings:', error);
    const response: EntitySettingsResponse = {
      success: false,
      error: 'Failed to fetch entity settings',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate user authentication
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;

    if (!userId) {
      const response: EntitySettingsResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const { id: entityId } = await params;

    // Check user has access to entity via UserEntityAccess table
    const userAccess = await prisma.userEntityAccess.findUnique({
      where: {
        userId_entityId: { userId, entityId },
      },
    });

    if (!userAccess) {
      const response: EntitySettingsResponse = {
        success: false,
        error: 'No access to this entity',
      };
      return NextResponse.json(response, { status: 403 });
    }

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      const response: EntitySettingsResponse = {
        success: false,
        error: 'Entity not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Parse request body
    const updateData: EntitySettingsUpdateRequest = await request.json();

    // Validate update data
    if (
      updateData.certificatesEnabled !== undefined &&
      typeof updateData.certificatesEnabled !== 'boolean'
    ) {
      const response: EntitySettingsResponse = {
        success: false,
        error: 'certificatesEnabled must be a boolean',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Update or create entity settings
    const entitySettings = await prisma.entitySettings.upsert({
      where: { entityId },
      update: {
        certificatesEnabled: updateData.certificatesEnabled,
        certificateSettings: updateData.certificateSettings,
        updatedAt: new Date(),
      },
      create: {
        entityId,
        certificatesEnabled: updateData.certificatesEnabled ?? false,
        certificateSettings: updateData.certificateSettings ?? {},
      },
    });

    const response: EntitySettingsResponse = {
      success: true,
      data: entitySettings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating entity settings:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid JSON')) {
        const response: EntitySettingsResponse = {
          success: false,
          error: 'Invalid JSON in certificateSettings',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const response: EntitySettingsResponse = {
      success: false,
      error: 'Failed to update entity settings',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
