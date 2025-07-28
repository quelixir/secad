import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  EntitySettingsResponse,
  EntitySettingsUpdateRequest,
  EntitySettings,
} from '@/lib/types/interfaces';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entityId } = await params;

    // Simple query like the test route
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { entitySettings: true },
    });

    if (!entity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Entity not found',
        },
        { status: 404 }
      );
    }

    // Return settings or default if none exist
    const settings: EntitySettings = (entity.entitySettings as any) || {
      certificatesEnabled: true,
      certificateSettings: {},
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching entity settings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch entity settings',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entityId } = await params;

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: entityId },
      select: { entitySettings: true },
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

    // Get current settings or use defaults
    const currentSettings: EntitySettings = (entity.entitySettings as any) || {
      certificatesEnabled: true,
      certificateSettings: {},
    };

    // Merge current settings with update data
    const updatedSettings: EntitySettings = {
      certificatesEnabled:
        updateData.certificatesEnabled ?? currentSettings.certificatesEnabled,
      certificateSettings:
        updateData.certificateSettings ?? currentSettings.certificateSettings,
    };

    // Update entity with new settings
    const updatedEntity = await prisma.entity.update({
      where: { id: entityId },
      data: {
        entitySettings: updatedSettings as any,
        updatedAt: new Date(),
      },
      select: { entitySettings: true },
    });

    const response: EntitySettingsResponse = {
      success: true,
      data: updatedEntity.entitySettings as any,
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
