import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EntityInput } from '@/lib/types';
import { compliancePackRegistration } from '@/lib/compliance';

interface EntityIdentifierInput {
  type: string;
  value: string;
  country: string;
}

interface ExtendedEntityInput extends Partial<EntityInput> {
  identifiers?: EntityIdentifierInput[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        identifiers: true,
        members: true,
        securityClasses: true,
        transactions: true,
        associates: true,
        _count: {
          select: {
            members: true,
            securityClasses: true,
            transactions: true,
            associates: true,
          },
        },
      },
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

    return NextResponse.json({
      success: true,
      data: entity,
    });
  } catch (error) {
    console.error('Error fetching entity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch entity',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const entityUpdateData = await request.json();

    // Validate entity type if being updated
    if (entityUpdateData.entityTypeId) {
      const entityType = compliancePackRegistration.getEntityType(
        entityUpdateData.incorporationCountry || 'Australia',
        entityUpdateData.entityTypeId
      );

      if (!entityType) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid entity type',
          },
          { status: 400 }
        );
      }
    }

    // Update entity
    const entity = await prisma.entity.update({
      where: { id: params.id },
      data: entityUpdateData,
      include: {
        identifiers: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: entity,
      message: 'Entity updated successfully',
    });
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update entity',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.entity.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Entity deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting entity:', error);
    if (
      error instanceof Error &&
      error.message.includes('Record to delete does not exist')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Entity not found',
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete entity',
      },
      { status: 500 }
    );
  }
}
