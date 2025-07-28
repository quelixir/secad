import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse, SecurityInput } from '@/lib/types';
import { AuditLogger } from '@/lib/audit';
import { AuditTableName } from '@/lib/audit';
import { auth } from '@/lib/auth';

// GET /api/securities - List all security classes (optionally filtered by entity)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const includeHoldings = searchParams.get('include')?.includes('holdings');

    const whereClause = entityId ? { entityId } : {};

    const securityClasses = await prisma.securityClass.findMany({
      where: whereClause,
      include: {
        entity: true,
        transactions: includeHoldings
          ? {
              include: {
                fromMember: {
                  select: {
                    id: true,
                    givenNames: true,
                    familyName: true,
                    entityName: true,
                    memberType: true,
                  },
                },
                toMember: {
                  select: {
                    id: true,
                    givenNames: true,
                    familyName: true,
                    entityName: true,
                    memberType: true,
                  },
                },
              },
            }
          : false,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: [{ entity: { name: 'asc' } }, { name: 'asc' }],
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: securityClasses,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching security classes:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch security classes',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/securities - Create a new security class
export async function POST(request: NextRequest) {
  try {
    // Get user session from auth
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const body: SecurityInput = await request.json();

    // Validate required fields
    if (!body.entityId || !body.name) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity ID and name are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: body.entityId },
    });

    if (!entity) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check for duplicate security class name within the entity
    const existingSecurity = await prisma.securityClass.findFirst({
      where: {
        entityId: body.entityId,
        name: body.name,
      },
    });

    if (existingSecurity) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class with this name already exists for this entity',
      };
      return NextResponse.json(response, { status: 409 });
    }

    const securityClass = await prisma.securityClass.create({
      data: {
        entityId: body.entityId,
        name: body.name,
        symbol: body.symbol || null,
        description: body.description || null,
        votingRights: body.votingRights ?? true,
        dividendRights: body.dividendRights ?? true,
      },
      include: {
        entity: true,
      },
    });

    // Log the creation
    await AuditLogger.logCreate(
      body.entityId,
      userId, // Use actual user ID from auth
      AuditTableName.SECURITY_CLASS,
      securityClass.id,
      securityClass
    );

    const response: ApiResponse<any> = {
      success: true,
      data: securityClass,
      message: 'Security class created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating security class:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create security class',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
