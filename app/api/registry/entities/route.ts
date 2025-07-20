import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { EntityInput } from '@/lib/types';
import { compliancePackRegistration } from '@/lib/compliance';

interface EntityIdentifierInput {
  type: string;
  value: string;
  country: string;
}

interface ExtendedEntityInput extends EntityInput {
  identifiers?: EntityIdentifierInput[];
}

export async function GET() {
  try {
    const entities = await prisma.entity.findMany({
      include: {
        identifiers: true,
        _count: {
          select: {
            members: true,
            securityClasses: true,
            transactions: true,
            associates: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: entities,
    });
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch entities',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.entityTypeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and entity type are required',
        },
        { status: 400 }
      );
    }

    // Get entity type from compliance registry
    const entityType = compliancePackRegistration.getEntityType(
      body.incorporationCountry || 'Australia',
      body.entityTypeId
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

    // Create entity
    const entity = await prisma.entity.create({
      data: {
        ...body,
        status: 'Active',
      },
      include: {
        identifiers: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: entity,
      message: 'Entity created successfully',
    });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create entity',
      },
      { status: 500 }
    );
  }
}
