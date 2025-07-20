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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: ExtendedEntityInput = await request.json();

    // Validate identifiers
    if (body.identifiers) {
      for (const identifier of body.identifiers) {
        const isValid = compliancePackRegistration.validateIdentifier(
          identifier.country,
          identifier.type,
          identifier.value
        );
        if (!isValid) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid ${identifier.type} value: ${identifier.value}`,
            },
            { status: 400 }
          );
        }
      }

      // Check for duplicate identifiers across other entities
      for (const identifier of body.identifiers) {
        const existing = await prisma.entityIdentifier.findFirst({
          where: {
            type: identifier.type,
            value: identifier.value,
            country: identifier.country,
            isActive: true,
            entity: {
              id: { not: id },
            },
          },
        });

        if (existing) {
          return NextResponse.json(
            {
              success: false,
              error: `${identifier.type} ${identifier.value} is already in use`,
            },
            { status: 409 }
          );
        }
      }
    }

    const { identifiers = [], ...updateData } = body;

    // Prepare update data
    const entityUpdateData: any = { ...updateData };
    if (body.incorporationDate !== undefined) {
      entityUpdateData.incorporationDate = body.incorporationDate
        ? new Date(body.incorporationDate)
        : null;
    }

    // Update entity and replace identifiers
    const entity = await prisma.entity.update({
      where: { id },
      data: {
        ...entityUpdateData,
        identifiers: {
          deleteMany: {},
          create: identifiers.map((identifier) => ({
            type: identifier.type,
            value: identifier.value,
            country: identifier.country,
            isActive: true,
          })),
        },
      },
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
    if (
      error instanceof Error &&
      error.message.includes('Record to update not found')
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
