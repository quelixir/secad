import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { compliancePackRegistration } from '@/lib/compliance';
import { getDefaultCountry } from '@/lib/config';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Basic validation
    if (!body.name || !body.entityTypeId) {
      return new Response(
        JSON.stringify({
          error: 'Name and entity type are required',
        }),
        { status: 400 }
      );
    }

    // Get entity type from compliance registry
    const entityType = compliancePackRegistration.getEntityType(
      body.incorporationCountry || getDefaultCountry(),
      body.entityTypeId
    );

    if (!entityType) {
      return new Response(
        JSON.stringify({
          error: 'Invalid entity type',
        }),
        { status: 400 }
      );
    }

    // Create entity
    const entity = await prisma.entity.create({
      data: {
        ...body,
        status: 'Active',
      },
    });

    return new Response(JSON.stringify(entity));
  } catch (error) {
    console.error('Error creating entity:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create entity',
      }),
      { status: 500 }
    );
  }
}
